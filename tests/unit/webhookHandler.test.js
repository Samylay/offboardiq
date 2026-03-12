const hrisHandler = require('../../src/integrations/hris/webhookHandler');

describe('HRISWebhookHandler', () => {
  describe('parseEvent', () => {
    it('parses BambooHR webhook payload', () => {
      const body = {
        type: 'employee.resigned',
        employee: {
          id: '12345',
          displayName: 'Sarah Chen',
          workEmail: 'sarah@company.com',
          department: 'Engineering',
          jobTitle: 'Senior Engineer',
          supervisorId: '67890',
          terminationDate: '2026-03-28',
        },
      };

      const event = hrisHandler.parseEvent('bamboohr', body);

      expect(event.eventType).toBe('employee.resigned');
      expect(event.employeeId).toBe('12345');
      expect(event.employeeName).toBe('Sarah Chen');
      expect(event.employeeEmail).toBe('sarah@company.com');
      expect(event.department).toBe('Engineering');
      expect(event.reason).toBe('voluntary');
    });

    it('parses Workday webhook payload', () => {
      const body = {
        eventName: 'employee.terminated',
        worker: {
          workerId: 'W-001',
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@company.com',
          organizationUnit: 'Finance',
          positionTitle: 'Analyst',
        },
        terminationEvent: {
          effectiveDate: '2026-04-15',
          reason: 'Voluntary',
        },
      };

      const event = hrisHandler.parseEvent('workday', body);

      expect(event.eventType).toBe('employee.terminated');
      expect(event.employeeId).toBe('W-001');
      expect(event.employeeName).toBe('John Doe');
      expect(event.reason).toBe('voluntary');
      expect(event.terminationDate).toBe('2026-04-15');
    });

    it('parses Rippling webhook payload', () => {
      const body = {
        event_type: 'employee.resignation',
        employee: {
          id: 'R-001',
          name: 'Jane Smith',
          work_email: 'jane@company.com',
          department: { name: 'Product' },
          title: 'PM',
          end_date: '2026-05-01',
        },
      };

      const event = hrisHandler.parseEvent('rippling', body);

      expect(event.eventType).toBe('employee.resignation');
      expect(event.employeeName).toBe('Jane Smith');
      expect(event.department).toBe('Product');
      expect(event.reason).toBe('voluntary');
    });

    it('handles generic webhook format', () => {
      const body = {
        event: 'termination',
        employee_id: 'EMP-001',
        employee_name: 'Bob Builder',
        employee_email: 'bob@company.com',
        department: 'Construction',
        termination_date: '2026-06-01',
        reason: 'contract_end',
      };

      const event = hrisHandler.parseEvent('generic', body);

      expect(event.eventType).toBe('termination');
      expect(event.employeeName).toBe('Bob Builder');
      expect(event.reason).toBe('contract_end');
    });
  });

  describe('verifySignature', () => {
    it('verifies BambooHR HMAC-SHA256 signature', () => {
      const crypto = require('crypto');
      const secret = 'test-secret';
      const payload = '{"type":"employee.resigned"}';
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      expect(hrisHandler.verifySignature('bamboohr', payload, signature, secret)).toBe(true);
    });

    it('rejects invalid signature', () => {
      const secret = 'test-secret';
      const payload = '{"type":"employee.resigned"}';
      const badSignature = 'aaaa'.repeat(16);

      expect(hrisHandler.verifySignature('bamboohr', payload, badSignature, secret)).toBe(false);
    });

    it('skips verification when no secret configured', () => {
      expect(hrisHandler.verifySignature('generic', '{}', '', null)).toBe(true);
    });
  });
});
