import { db } from '../db';

const weights = {
  knowledge_concentration: 0.30,
  project_impact: 0.20,
  relationship_dependency: 0.15,
  timeline_pressure: 0.20,
  replacement_difficulty: 0.15,
};

export function computeKnowledgeConcentration(domains, items) {
  if (domains.length === 0) return 50;
  const criticalWithoutSuccessor = domains.filter((d) => d.criticality >= 7 && !d.successor_id).length;
  const poorlyCaptured = domains.filter((d) => d.capture_completeness < 30).length;
  const successorGapRatio = criticalWithoutSuccessor / Math.max(domains.length, 1);
  const captureGapRatio = poorlyCaptured / Math.max(domains.length, 1);
  const tacitItems = items.filter((i) => ['unwritten_rule', 'workaround', 'decision_context'].includes(i.type)).length;
  const tacitBonus = Math.min(tacitItems * 3, 20);
  return Math.min(100, (successorGapRatio * 40) + (captureGapRatio * 40) + tacitBonus);
}

export function computeProjectImpact(domains) {
  if (domains.length === 0) return 50;
  const avgCriticality = domains.reduce((s, d) => s + d.criticality, 0) / domains.length;
  const maxCriticality = Math.max(...domains.map((d) => d.criticality));
  return Math.min(100, (avgCriticality * 5) + (maxCriticality * 5));
}

export function computeRelationshipRisk(items) {
  const relationshipItems = items.filter((i) => ['contact', 'vendor_relationship', 'escalation_path'].includes(i.type));
  if (relationshipItems.length === 0) return 60;
  const avgCriticality = relationshipItems.reduce((s, i) => s + (i.quality_score || 5), 0) / relationshipItems.length;
  const volumeReduction = Math.min(relationshipItems.length * 5, 30);
  return Math.max(0, 70 - volumeReduction + (avgCriticality * 2));
}

export function computeTimelinePressure(departure, tasks) {
  const lastDay = new Date(departure.last_working_day);
  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((lastDay - today) / (1000 * 60 * 60 * 24)));
  const incompleteTasks = tasks.filter((t) => t.status !== 'completed').length;
  const totalTasks = tasks.length || 1;
  const completionRatio = 1 - (incompleteTasks / totalTasks);

  let timePressure;
  if (daysRemaining <= 0) timePressure = 100;
  else if (daysRemaining <= 3) timePressure = 90;
  else if (daysRemaining <= 7) timePressure = 70;
  else if (daysRemaining <= 14) timePressure = 40;
  else timePressure = 20;

  return Math.max(0, timePressure - (completionRatio * 30));
}

export function computeReplacementDifficulty(domains) {
  if (domains.length === 0) return 50;
  const avgReplaceability = domains.reduce((s, d) => s + d.replaceability, 0) / domains.length;
  return Math.min(100, (10 - avgReplaceability) * 10);
}

export function generateRiskRecommendations(scores, departure) {
  const recs = [];
  if (scores.timeline_pressure >= 70) {
    recs.push({ priority: 'critical', action: 'Negotiate extended transition or consulting arrangement', detail: 'The offboarding timeline is critically short' });
  }
  if (scores.knowledge_concentration >= 70) {
    recs.push({ priority: 'critical', action: 'Immediately assign successors to all critical knowledge domains', detail: 'Knowledge is heavily concentrated with no backup' });
  }
  if (scores.relationship_dependency >= 60) {
    recs.push({ priority: 'high', action: 'Schedule relationship introduction meetings before departure', detail: 'Key vendor/client relationships need warm handoffs' });
  }
  if (scores.replacement_difficulty >= 60) {
    recs.push({ priority: 'high', action: 'Begin recruitment process immediately', detail: 'The skill set is difficult to replace' });
  }
  return recs;
}

export async function computeRiskScore(departureId) {
  const departure = await db('departures').where({ id: departureId }).first();
  if (!departure) throw new Error('Departure not found');

  const domains = await db('knowledge_domains').where({ departure_id: departureId });
  const items = await db('knowledge_items').where({ departure_id: departureId });
  const tasks = await db('transfer_tasks')
    .join('transfer_plans', 'transfer_tasks.plan_id', 'transfer_plans.id')
    .where('transfer_plans.departure_id', departureId);

  const scores = {
    knowledge_concentration: computeKnowledgeConcentration(domains, items),
    project_impact: computeProjectImpact(domains),
    relationship_dependency: computeRelationshipRisk(items),
    timeline_pressure: computeTimelinePressure(departure, tasks),
    replacement_difficulty: computeReplacementDifficulty(domains),
  };

  const overall = Object.entries(scores).reduce((sum, [key, score]) => sum + score * weights[key], 0);
  const recommendations = generateRiskRecommendations(scores, departure);

  const assessment = {
    departure_id: departureId,
    knowledge_concentration_risk: scores.knowledge_concentration,
    project_impact_risk: scores.project_impact,
    relationship_risk: scores.relationship_dependency,
    timeline_risk: scores.timeline_pressure,
    replacement_difficulty: scores.replacement_difficulty,
    overall_score: Math.round(overall * 10) / 10,
    factors: scores,
    recommendations,
    computed_by: 'ai',
  };

  const existing = await db('risk_assessments').where({ departure_id: departureId }).first();
  if (existing) {
    await db('risk_assessments').where({ id: existing.id }).update({ ...assessment, updated_at: new Date() });
    assessment.id = existing.id;
  } else {
    const [result] = await db('risk_assessments').insert(assessment).returning('id');
    assessment.id = result.id;
  }

  await db('departures').where({ id: departureId }).update({ overall_risk_score: assessment.overall_score });

  return assessment;
}
