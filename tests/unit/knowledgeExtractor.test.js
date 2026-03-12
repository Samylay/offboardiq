const knowledgeExtractor = require('../../src/api/services/knowledgeExtractor');

describe('KnowledgeExtractor', () => {
  describe('extractKnowledgeItems', () => {
    it('extracts knowledge items from AI response with tags', () => {
      const response = `That's really helpful context. Let me capture that:

[KNOWLEDGE_ITEM]
title: Payment Gateway Retry Logic
type: workaround
category: tribal
criticality: 8
content: When the webhook retry counter exceeds 50, the exponential backoff overflows and starts retrying every millisecond. Fix script at scripts/fix-webhook-loop.sh.
[/KNOWLEDGE_ITEM]

[KNOWLEDGE_ITEM]
title: Stripe API Custom Integration
type: codebase
category: technical
criticality: 9
content: Custom Stripe integration built 2 years ago. Handles subscription lifecycle, payment processing, and webhook management. No documentation exists.
[/KNOWLEDGE_ITEM]

Great, can you tell me more about the retry script?`;

      const items = knowledgeExtractor.extractKnowledgeItems(response);

      expect(items).toHaveLength(2);
      expect(items[0].title).toBe('Payment Gateway Retry Logic');
      expect(items[0].type).toBe('workaround');
      expect(items[0].category).toBe('tribal');
      expect(items[0].criticality).toBe(8);
      expect(items[0].content).toContain('webhook retry counter');

      expect(items[1].title).toBe('Stripe API Custom Integration');
      expect(items[1].type).toBe('codebase');
      expect(items[1].criticality).toBe(9);
    });

    it('returns empty array when no knowledge items found', () => {
      const response = 'Can you tell me more about your daily responsibilities?';
      const items = knowledgeExtractor.extractKnowledgeItems(response);
      expect(items).toHaveLength(0);
    });

    it('handles malformed knowledge items gracefully', () => {
      const response = `[KNOWLEDGE_ITEM]
title: Incomplete Item
[/KNOWLEDGE_ITEM]`;

      const items = knowledgeExtractor.extractKnowledgeItems(response);
      // Missing content field — should be skipped
      expect(items).toHaveLength(0);
    });

    it('defaults criticality to 5 when not parseable', () => {
      const response = `[KNOWLEDGE_ITEM]
title: Some Knowledge
type: document
category: technical
criticality: not-a-number
content: Some important content here.
[/KNOWLEDGE_ITEM]`;

      const items = knowledgeExtractor.extractKnowledgeItems(response);
      expect(items).toHaveLength(1);
      expect(items[0].criticality).toBe(5);
    });
  });

  describe('buildInterviewPrompt', () => {
    it('generates phase-specific prompts', () => {
      const departure = {
        employee_name: 'Sarah Chen',
        title: 'Senior Engineer',
        department: 'Engineering',
        last_working_day: '2026-03-28',
      };
      const domains = [{ name: 'Payments' }, { name: 'CI/CD' }];

      const prompt = knowledgeExtractor.buildInterviewPrompt(
        departure, domains, 'role_mapping', []
      );

      expect(prompt).toContain('Sarah Chen');
      expect(prompt).toContain('Phase 1: Role Mapping');
      expect(prompt).toContain('KNOWLEDGE_ITEM');
    });

    it('includes domain names in deep dive prompt', () => {
      const departure = {
        employee_name: 'Test User',
        title: 'Engineer',
        department: 'Eng',
        last_working_day: '2026-04-01',
      };
      const domains = [{ name: 'Payment Gateway' }, { name: 'CI/CD Pipeline' }];

      const prompt = knowledgeExtractor.buildInterviewPrompt(
        departure, domains, 'deep_dive', []
      );

      expect(prompt).toContain('Payment Gateway');
      expect(prompt).toContain('CI/CD Pipeline');
    });
  });
});
