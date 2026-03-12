import crypto from 'crypto';
import { db } from '../db';

export function verifySignature(provider, payload, signature, secret) {
  if (!secret || !signature) return true;
  const algo = provider === 'rippling' ? 'base64' : 'hex';
  const expected = crypto.createHmac('sha256', secret).update(payload).digest(algo);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function parseEvent(provider, body) {
  switch (provider) {
    case 'bamboohr':
      return {
        eventType: body.type, employeeId: body.employee?.id, employeeName: body.employee?.displayName,
        employeeEmail: body.employee?.workEmail, department: body.employee?.department,
        title: body.employee?.jobTitle, terminationDate: body.employee?.terminationDate,
        reason: body.type === 'employee.resigned' ? 'voluntary' : 'involuntary',
      };
    case 'workday':
      return {
        eventType: body.eventName, employeeId: body.worker?.workerId,
        employeeName: `${body.worker?.firstName} ${body.worker?.lastName}`,
        employeeEmail: body.worker?.emailAddress, department: body.worker?.organizationUnit,
        title: body.worker?.positionTitle, terminationDate: body.terminationEvent?.effectiveDate,
        reason: body.terminationEvent?.reason === 'Voluntary' ? 'voluntary' : 'involuntary',
      };
    case 'rippling':
      return {
        eventType: body.event_type, employeeId: body.employee?.id, employeeName: body.employee?.name,
        employeeEmail: body.employee?.work_email, department: body.employee?.department?.name,
        title: body.employee?.title, terminationDate: body.employee?.end_date,
        reason: body.event_type === 'employee.resignation' ? 'voluntary' : 'involuntary',
      };
    default:
      return {
        eventType: body.event || body.type, employeeId: body.employee_id || body.employeeId,
        employeeName: body.employee_name || body.employeeName, employeeEmail: body.employee_email || body.employeeEmail,
        department: body.department, title: body.title || body.jobTitle,
        terminationDate: body.termination_date || body.lastWorkingDay, reason: body.reason || 'voluntary',
      };
  }
}

export async function processEvent(orgId, provider, event) {
  const departureEvents = ['terminated', 'resigned', 'resignation', 'termination', 'offboarding'];
  if (!departureEvents.some((e) => event.eventType?.toLowerCase().includes(e))) return null;

  let employee = await db('users').where({ org_id: orgId, hris_employee_id: event.employeeId }).first();
  if (!employee && event.employeeEmail) {
    employee = await db('users').where({ org_id: orgId, email: event.employeeEmail }).first();
  }

  if (!employee) {
    const nameParts = (event.employeeName || 'Unknown Employee').split(' ');
    [employee] = await db('users').insert({
      org_id: orgId, email: event.employeeEmail || `${event.employeeId}@placeholder.offboardiq.com`,
      first_name: nameParts[0], last_name: nameParts.slice(1).join(' ') || 'Unknown',
      title: event.title, department: event.department, hris_employee_id: event.employeeId, role: 'member',
    }).returning('*');
  }

  const existing = await db('departures').where({ org_id: orgId, employee_id: employee.id }).whereNotIn('status', ['completed', 'archived']).first();
  if (existing) return existing;

  const lastWorkingDay = event.terminationDate ? new Date(event.terminationDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const hrOwner = await db('users').where({ org_id: orgId, role: 'admin', is_active: true }).first();

  const [departure] = await db('departures').insert({
    org_id: orgId, employee_id: employee.id, hr_owner_id: hrOwner?.id, status: 'initiated',
    resignation_date: new Date(), last_working_day: lastWorkingDay, departure_reason: event.reason,
    departure_notes: `Auto-created from ${provider} webhook: ${event.eventType}`,
    metadata: JSON.stringify({ hris_provider: provider, hris_event: event }),
  }).returning('*');

  await db('audit_log').insert({
    org_id: orgId, departure_id: departure.id, action: 'departure_auto_created',
    entity_type: 'departure', entity_id: departure.id, new_values: { source: provider },
  });

  return departure;
}
