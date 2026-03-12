const config = require('../../config/env');
const { db } = require('../../config/database');
const logger = require('../utils/logger');

/**
 * KnowledgeExtractor — The core AI engine of OffboardIQ.
 *
 * This service does what no HR tool does: it treats employee departure as a
 * structured knowledge mining operation, not a checklist.
 *
 * The key insight: departing employees hold 3 types of knowledge:
 * 1. EXPLICIT — documented, findable, transferable (easy)
 * 2. IMPLICIT — known but not documented, needs prompting to surface (medium)
 * 3. TACIT — "you don't know what you don't know" — requires structured
 *    interview techniques to even identify (hard, and this is our moat)
 *
 * The AI interviewer uses a progressive deepening strategy:
 * - Phase 1: Role mapping — what do you do? (broad surface scan)
 * - Phase 2: Dependency tracing — what breaks if you leave? (risk identification)
 * - Phase 3: Deep dives — walk me through how you handle X (procedural capture)
 * - Phase 4: Tribal knowledge — what do you know that nobody else does? (tacit extraction)
 * - Phase 5: Relationship mapping — who do you talk to, and why? (network capture)
 */
class KnowledgeExtractor {
  constructor() {
    this.phases = [
      'role_mapping',
      'dependency_tracing',
      'deep_dive',
      'tribal_knowledge',
      'relationship_mapping',
    ];
  }

  /**
   * Generate the system prompt for a knowledge extraction interview.
   */
  buildInterviewPrompt(departure, domains, phase, previousMessages) {
    const phaseInstructions = {
      role_mapping: `You are conducting Phase 1: Role Mapping.
Your goal is to understand the full scope of this person's role beyond their job title.
Ask about: daily responsibilities, recurring tasks, systems they own, processes they manage,
meetings they run, reports they generate, and anything they do that isn't in their job description.
Be warm but thorough. Follow up on vague answers with specific questions.
Explicitly ask: "What do you do that nobody else knows you do?"`,

      dependency_tracing: `You are conducting Phase 2: Dependency Tracing.
Your goal is to identify what breaks, stalls, or degrades when this person leaves.
Ask about: projects that depend on them, processes only they can execute, systems only they
understand, approvals that flow through them, vendor relationships they own, and institutional
knowledge they hold. Push on "someone else can do it" — probe for whether that's tested or assumed.`,

      deep_dive: `You are conducting Phase 3: Deep Dive.
Focus on the knowledge domains already identified: ${domains.map((d) => d.name).join(', ')}.
For each domain, extract step-by-step procedures, edge cases, gotchas, workarounds,
and context that wouldn't be in any documentation. Ask "what would go wrong if someone
followed only the written documentation?" and "what have you learned the hard way?"`,

      tribal_knowledge: `You are conducting Phase 4: Tribal Knowledge Extraction.
This is the hardest and most valuable phase. You're looking for knowledge this person
doesn't even realize they have. Ask about: unwritten rules, political dynamics,
why decisions were made, historical context behind current systems, "the way we actually do things
vs how the process says to do them," and shortcuts that only work because of relationships.`,

      relationship_mapping: `You are conducting Phase 5: Relationship Mapping.
Map this person's professional network. For each key contact, capture: who they are,
what topics they discuss, how often, what would happen if that relationship disappeared,
and who should take over that relationship. Include internal stakeholders, external vendors,
clients, partners, and community contacts.`,
    };

    return `You are OffboardIQ's AI Knowledge Capture Specialist. You're conducting a structured
knowledge extraction interview with ${departure.employee_name}, who is a ${departure.title}
in the ${departure.department} department. Their last day is ${departure.last_working_day}.

${phaseInstructions[phase]}

INTERVIEW RULES:
- Ask ONE question at a time. Never ask multiple questions in one message.
- Acknowledge and validate each response before asking the next question.
- If an answer seems shallow, probe deeper with follow-up questions.
- Watch for knowledge items and flag them clearly in your response with [KNOWLEDGE_ITEM] tags.
- Format extracted knowledge items as:
  [KNOWLEDGE_ITEM]
  title: <concise title>
  type: <document|procedure|contact|credential|codebase|decision_context|vendor_relationship|unwritten_rule|workaround|escalation_path>
  category: <technical|process|relationship|institutional|tribal>
  criticality: <1-10>
  content: <detailed capture of the knowledge>
  [/KNOWLEDGE_ITEM]
- If the person seems uncomfortable or resistant, acknowledge it and explain why this matters.
- Keep a running count of knowledge items captured and gaps remaining.
- When you've exhausted a topic, explicitly say "I think we've covered X well. Let's move on to Y."
- Be conversational, not interrogative. This should feel like a helpful brain dump, not a deposition.`;
  }

  /**
   * Process an AI response to extract structured knowledge items.
   */
  extractKnowledgeItems(aiResponse) {
    const items = [];
    const regex = /\[KNOWLEDGE_ITEM\]([\s\S]*?)\[\/KNOWLEDGE_ITEM\]/g;
    let match;

    while ((match = regex.exec(aiResponse)) !== null) {
      const block = match[1];
      const item = {};

      for (const field of ['title', 'type', 'category', 'criticality', 'content']) {
        const fieldMatch = block.match(new RegExp(`${field}:\\s*(.+?)(?=\\n\\w+:|$)`, 's'));
        if (fieldMatch) {
          item[field] = fieldMatch[1].trim();
        }
      }

      if (item.title && item.content) {
        item.criticality = parseInt(item.criticality, 10) || 5;
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Compute knowledge coverage analysis for a departure.
   * Returns gaps, risks, and recommendations.
   */
  async computeCoverageAnalysis(departureId) {
    const domains = await db('knowledge_domains')
      .where({ departure_id: departureId });

    const items = await db('knowledge_items')
      .where({ departure_id: departureId });

    const totalCriticality = domains.reduce((sum, d) => sum + d.criticality, 0);
    const capturedCriticality = domains
      .filter((d) => d.status === 'captured' || d.status === 'verified')
      .reduce((sum, d) => sum + (d.criticality * (d.capture_completeness / 100)), 0);

    const coverageScore = totalCriticality > 0
      ? (capturedCriticality / totalCriticality) * 100
      : 0;

    const gaps = domains
      .filter((d) => d.capture_completeness < 50 && d.criticality >= 7)
      .map((d) => ({
        domain: d.name,
        criticality: d.criticality,
        completeness: d.capture_completeness,
        category: d.category,
      }));

    const typeDistribution = {};
    for (const item of items) {
      typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
    }

    // Identify underrepresented knowledge types
    const expectedTypes = [
      'procedure', 'decision_context', 'workaround',
      'unwritten_rule', 'escalation_path', 'contact',
    ];
    const missingTypes = expectedTypes.filter(
      (t) => !typeDistribution[t] || typeDistribution[t] < 2
    );

    return {
      coverageScore: Math.round(coverageScore * 10) / 10,
      totalDomains: domains.length,
      capturedDomains: domains.filter((d) => d.capture_completeness >= 70).length,
      totalItems: items.length,
      verifiedItems: items.filter((i) => i.is_verified).length,
      criticalGaps: gaps,
      missingKnowledgeTypes: missingTypes,
      typeDistribution,
      recommendations: this._generateRecommendations(gaps, missingTypes, coverageScore),
    };
  }

  _generateRecommendations(gaps, missingTypes, coverageScore) {
    const recommendations = [];

    if (coverageScore < 30) {
      recommendations.push({
        priority: 'critical',
        action: 'Schedule additional knowledge extraction sessions immediately',
        reason: 'Overall knowledge capture is below 30% — significant organizational risk',
      });
    }

    for (const gap of gaps) {
      recommendations.push({
        priority: gap.criticality >= 9 ? 'critical' : 'high',
        action: `Deep-dive session needed for "${gap.domain}"`,
        reason: `Criticality ${gap.criticality}/10 but only ${gap.completeness}% captured`,
      });
    }

    if (missingTypes.includes('workaround')) {
      recommendations.push({
        priority: 'high',
        action: 'Conduct a "workarounds and shortcuts" focused session',
        reason: 'No workarounds have been documented — these are often the highest-risk tacit knowledge',
      });
    }

    if (missingTypes.includes('escalation_path')) {
      recommendations.push({
        priority: 'medium',
        action: 'Map escalation paths and emergency procedures',
        reason: 'Escalation paths are critical for operational continuity',
      });
    }

    return recommendations;
  }
}

module.exports = new KnowledgeExtractor();
