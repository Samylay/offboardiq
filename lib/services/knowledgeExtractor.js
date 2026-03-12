import { db } from '../db';

/**
 * KnowledgeExtractor — The core AI engine of OffboardIQ.
 *
 * Treats employee departure as a structured knowledge mining operation.
 * 3 types of knowledge: EXPLICIT (documented), IMPLICIT (needs prompting), TACIT (our moat).
 *
 * 5-phase progressive deepening strategy:
 * 1. Role Mapping → 2. Dependency Tracing → 3. Deep Dives →
 * 4. Tribal Knowledge → 5. Relationship Mapping
 */

const phases = [
  'role_mapping',
  'dependency_tracing',
  'deep_dive',
  'tribal_knowledge',
  'relationship_mapping',
];

export function buildInterviewPrompt(departure, domains, phase) {
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
- Be conversational, not interrogative. This should feel like a helpful brain dump, not a deposition.`;
}

export function extractKnowledgeItems(aiResponse) {
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

export async function computeCoverageAnalysis(departureId) {
  const domains = await db('knowledge_domains').where({ departure_id: departureId });
  const items = await db('knowledge_items').where({ departure_id: departureId });

  const totalCriticality = domains.reduce((sum, d) => sum + d.criticality, 0);
  const capturedCriticality = domains
    .filter((d) => d.status === 'captured' || d.status === 'verified')
    .reduce((sum, d) => sum + (d.criticality * (d.capture_completeness / 100)), 0);

  const coverageScore = totalCriticality > 0 ? (capturedCriticality / totalCriticality) * 100 : 0;

  const gaps = domains
    .filter((d) => d.capture_completeness < 50 && d.criticality >= 7)
    .map((d) => ({ domain: d.name, criticality: d.criticality, completeness: d.capture_completeness, category: d.category }));

  const typeDistribution = {};
  for (const item of items) {
    typeDistribution[item.type] = (typeDistribution[item.type] || 0) + 1;
  }

  const expectedTypes = ['procedure', 'decision_context', 'workaround', 'unwritten_rule', 'escalation_path', 'contact'];
  const missingTypes = expectedTypes.filter((t) => !typeDistribution[t] || typeDistribution[t] < 2);

  const recommendations = [];
  if (coverageScore < 30) {
    recommendations.push({ priority: 'critical', action: 'Schedule additional knowledge extraction sessions immediately', reason: 'Overall knowledge capture is below 30%' });
  }
  for (const gap of gaps) {
    recommendations.push({ priority: gap.criticality >= 9 ? 'critical' : 'high', action: `Deep-dive session needed for "${gap.domain}"`, reason: `Criticality ${gap.criticality}/10 but only ${gap.completeness}% captured` });
  }

  return {
    coverageScore: Math.round(coverageScore * 10) / 10,
    totalDomains: domains.length,
    capturedDomains: domains.filter((d) => d.capture_completeness >= 70).length,
    totalItems: items.length,
    verifiedItems: items.filter((i) => i.is_verified).length,
    criticalGaps: gaps,
    missingKnowledgeTypes: missingTypes,
    typeDistribution,
    recommendations,
  };
}

export default { buildInterviewPrompt, extractKnowledgeItems, computeCoverageAnalysis, phases };
