const RiskEngine = require('../../src/api/services/riskEngine');

// We test the pure computation methods directly
// Database-dependent methods are tested in integration tests

describe('RiskEngine', () => {
  describe('_computeKnowledgeConcentration', () => {
    it('returns 50 for empty domains (unknown = medium risk)', () => {
      const score = RiskEngine._computeKnowledgeConcentration([], []);
      expect(score).toBe(50);
    });

    it('scores higher when critical domains lack successors', () => {
      const domainsWithSuccessors = [
        { criticality: 9, successor_id: 'user-1', capture_completeness: 50 },
        { criticality: 8, successor_id: 'user-2', capture_completeness: 60 },
      ];

      const domainsWithoutSuccessors = [
        { criticality: 9, successor_id: null, capture_completeness: 50 },
        { criticality: 8, successor_id: null, capture_completeness: 60 },
      ];

      const scoreWith = RiskEngine._computeKnowledgeConcentration(domainsWithSuccessors, []);
      const scoreWithout = RiskEngine._computeKnowledgeConcentration(domainsWithoutSuccessors, []);

      expect(scoreWithout).toBeGreaterThan(scoreWith);
    });

    it('amplifies risk for tacit knowledge items', () => {
      const domains = [
        { criticality: 5, successor_id: 'user-1', capture_completeness: 50 },
      ];

      const noTacitItems = [];
      const tacitItems = [
        { type: 'unwritten_rule' },
        { type: 'workaround' },
        { type: 'decision_context' },
      ];

      const scoreNoTacit = RiskEngine._computeKnowledgeConcentration(domains, noTacitItems);
      const scoreTacit = RiskEngine._computeKnowledgeConcentration(domains, tacitItems);

      expect(scoreTacit).toBeGreaterThan(scoreNoTacit);
    });
  });

  describe('_computeTimelinePressure', () => {
    it('returns 100 when last day has passed', () => {
      const departure = { last_working_day: '2020-01-01' };
      const score = RiskEngine._computeTimelinePressure(departure, []);
      expect(score).toBe(100);
    });

    it('returns lower score for distant deadlines', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const departure = { last_working_day: futureDate.toISOString() };
      const score = RiskEngine._computeTimelinePressure(departure, []);
      expect(score).toBeLessThan(30);
    });

    it('reduces pressure when tasks are completed', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const departure = { last_working_day: nextWeek.toISOString() };
      const incompleteTasks = [{ status: 'pending' }, { status: 'pending' }];
      const completeTasks = [{ status: 'completed' }, { status: 'completed' }];

      const scoreIncomplete = RiskEngine._computeTimelinePressure(departure, incompleteTasks);
      const scoreComplete = RiskEngine._computeTimelinePressure(departure, completeTasks);

      expect(scoreComplete).toBeLessThan(scoreIncomplete);
    });
  });

  describe('_computeProjectImpact', () => {
    it('returns 50 for empty domains', () => {
      expect(RiskEngine._computeProjectImpact([])).toBe(50);
    });

    it('scores higher for high-criticality domains', () => {
      const lowCrit = [{ criticality: 2 }, { criticality: 3 }];
      const highCrit = [{ criticality: 9 }, { criticality: 10 }];

      expect(RiskEngine._computeProjectImpact(highCrit))
        .toBeGreaterThan(RiskEngine._computeProjectImpact(lowCrit));
    });
  });

  describe('_generateRiskRecommendations', () => {
    it('generates critical recommendation for high timeline pressure', () => {
      const scores = {
        timeline_pressure: 85,
        knowledge_concentration: 30,
        relationship_dependency: 30,
        replacement_difficulty: 30,
      };

      const recs = RiskEngine._generateRiskRecommendations(scores, {});
      const critical = recs.find((r) => r.priority === 'critical');
      expect(critical).toBeDefined();
      expect(critical.action).toContain('transition');
    });

    it('generates recommendation for high relationship risk', () => {
      const scores = {
        timeline_pressure: 30,
        knowledge_concentration: 30,
        relationship_dependency: 75,
        replacement_difficulty: 30,
      };

      const recs = RiskEngine._generateRiskRecommendations(scores, {});
      expect(recs.some((r) => r.action.toLowerCase().includes('relationship'))).toBe(true);
    });
  });
});
