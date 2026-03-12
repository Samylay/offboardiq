const crypto = require('crypto');
const { db } = require('../../config/database');
const logger = require('../../api/utils/logger');

/**
 * HRIS Webhook Handler
 *
 * Handles incoming webhooks from HRIS systems to auto-trigger offboarding.
 * Supports: BambooHR, Workday, Rippling, Gusto, and generic webhooks.
 *
 * The key integration flow:
 * 1. HRIS fires "termination" or "resignation" webhook
 * 2. We map the employee ID to our system
 * 3. Auto-create a departure case with populated metadata
 * 4. Notify HR owner and manager
 * 5. Begin knowledge mapping workflow
 */
class HRISWebhookHandler {
  /**
   * Verify webhook signature based on provider.
   */
  verifySignature(provider, payload, signature, secret) {
    switch (provider) {
      case 'bamboohr': {
        const expected = crypto
          .createHmac('sha256', secret)
          .update(payload)
          .digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      }
      case 'rippling': {
        const expected = crypto
          .createHmac('sha256', secret)
          .update(payload)
          .digest('base64');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      }
      default:
        // Generic HMAC-SHA256 verification
        if (!secret || !signature) return true; // No secret configured = skip
        const expected = crypto
          .createHmac('sha256', secret)
          .update(payload)
          .digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    }
  }

  /**
   * Parse the incoming webhook payload based on provider format.
   */
  parseEvent(provider, body) {
    switch (provider) {
      case 'bamboohr':
        return {
          eventType: body.type, // employee.terminated, employee.resigned
          employeeId: body.employee?.id,
          employeeName: body.employee?.displayName,
          employeeEmail: body.employee?.workEmail,
          department: body.employee?.department,
          title: body.employee?.jobTitle,
          managerId: body.employee?.supervisorId,
          terminationDate: body.employee?.terminationDate,
          reason: body.type === 'employee.resigned' ? 'voluntary' : 'involuntary',
        };

      case 'workday':
        return {
          eventType: body.eventName,
          employeeId: body.worker?.workerId,
          employeeName: `${body.worker?.firstName} ${body.worker?.lastName}`,
          employeeEmail: body.worker?.emailAddress,
          department: body.worker?.organizationUnit,
          title: body.worker?.positionTitle,
          terminationDate: body.terminationEvent?.effectiveDate,
          reason: body.terminationEvent?.reason === 'Voluntary' ? 'voluntary' : 'involuntary',
        };

      case 'rippling':
        return {
          eventType: body.event_type,
          employeeId: body.employee?.id,
          employeeName: body.employee?.name,
          employeeEmail: body.employee?.work_email,
          department: body.employee?.department?.name,
          title: body.employee?.title,
          terminationDate: body.employee?.end_date,
          reason: body.event_type === 'employee.resignation' ? 'voluntary' : 'involuntary',
        };

      default:
        // Generic format
        return {
          eventType: body.event || body.type,
          employeeId: body.employee_id || body.employeeId,
          employeeName: body.employee_name || body.employeeName,
          employeeEmail: body.employee_email || body.employeeEmail,
          department: body.department,
          title: body.title || body.jobTitle,
          terminationDate: body.termination_date || body.lastWorkingDay,
          reason: body.reason || 'voluntary',
        };
    }
  }

  /**
   * Process an incoming HRIS webhook event.
   * Returns the created departure, or null if the event wasn't relevant.
   */
  async processEvent(orgId, provider, event) {
    // Only handle departure-related events
    const departureEvents = [
      'employee.terminated', 'employee.resigned', 'employee.resignation',
      'termination', 'resignation', 'offboarding',
    ];

    if (!departureEvents.some((e) => event.eventType?.toLowerCase().includes(e.replace('employee.', '')))) {
      logger.info(`HRIS webhook: Ignoring non-departure event: ${event.eventType}`);
      return null;
    }

    // Find or create the employee in our system
    let employee = await db('users')
      .where({ org_id: orgId, hris_employee_id: event.employeeId })
      .first();

    if (!employee && event.employeeEmail) {
      employee = await db('users')
        .where({ org_id: orgId, email: event.employeeEmail })
        .first();
    }

    if (!employee) {
      // Auto-create employee record
      const nameParts = (event.employeeName || 'Unknown Employee').split(' ');
      [employee] = await db('users').insert({
        org_id: orgId,
        email: event.employeeEmail || `${event.employeeId}@placeholder.offboardiq.com`,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || 'Unknown',
        title: event.title,
        department: event.department,
        hris_employee_id: event.employeeId,
        role: 'member',
      }).returning('*');
    }

    // Check for duplicate departure
    const existingDeparture = await db('departures')
      .where({ org_id: orgId, employee_id: employee.id })
      .whereNotIn('status', ['completed', 'archived'])
      .first();

    if (existingDeparture) {
      logger.info(`HRIS webhook: Departure already exists for ${employee.email}`);
      return existingDeparture;
    }

    // Calculate last working day (default 14 days from termination date or today)
    const resignationDate = new Date();
    const lastWorkingDay = event.terminationDate
      ? new Date(event.terminationDate)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Find the default HR owner (first admin user)
    const hrOwner = await db('users')
      .where({ org_id: orgId, role: 'admin', is_active: true })
      .first();

    // Create the departure
    const [departure] = await db('departures').insert({
      org_id: orgId,
      employee_id: employee.id,
      hr_owner_id: hrOwner?.id,
      status: 'initiated',
      resignation_date: resignationDate,
      last_working_day: lastWorkingDay,
      departure_reason: event.reason,
      departure_notes: `Auto-created from ${provider} webhook event: ${event.eventType}`,
      metadata: JSON.stringify({ hris_provider: provider, hris_event: event }),
    }).returning('*');

    // Audit log
    await db('audit_log').insert({
      org_id: orgId,
      departure_id: departure.id,
      action: 'departure_auto_created',
      entity_type: 'departure',
      entity_id: departure.id,
      new_values: { source: provider, event: event.eventType },
    });

    // Notify HR owner
    if (hrOwner) {
      await db('notifications').insert({
        org_id: orgId,
        user_id: hrOwner.id,
        departure_id: departure.id,
        type: 'risk_alert',
        channel: 'email',
        title: `New departure: ${event.employeeName}`,
        body: `A departure has been automatically created for ${event.employeeName} (${event.department}). The offboarding workflow is ready to begin.`,
        action_url: `/departures/${departure.id}`,
        sent_at: new Date(),
      });
    }

    logger.info(`HRIS webhook: Created departure for ${employee.email} from ${provider}`);
    return departure;
  }
}

module.exports = new HRISWebhookHandler();
