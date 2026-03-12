import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function GET(request) {
  return withAuth(request, async (req, user) => {
    const [
      totalDepartures, activeDepartures, completedDepartures,
      avgRiskScore, totalKnowledgeItems, verifiedItems,
      departuresByMonth, departuresByReason, riskDistribution,
    ] = await Promise.all([
      db('departures').where({ org_id: user.orgId }).count().first(),
      db('departures').where({ org_id: user.orgId }).whereNotIn('status', ['completed', 'archived']).count().first(),
      db('departures').where({ org_id: user.orgId, status: 'completed' }).count().first(),
      db('departures').where({ org_id: user.orgId }).whereNotNull('overall_risk_score').avg('overall_risk_score').first(),
      db('knowledge_items').join('departures', 'knowledge_items.departure_id', 'departures.id').where({ 'departures.org_id': user.orgId }).count().first(),
      db('knowledge_items').join('departures', 'knowledge_items.departure_id', 'departures.id').where({ 'departures.org_id': user.orgId, 'knowledge_items.is_verified': true }).count().first(),
      db('departures').where({ org_id: user.orgId }).select(db.raw("to_char(resignation_date, 'YYYY-MM') as month")).count().groupBy('month').orderBy('month', 'desc').limit(12),
      db('departures').where({ org_id: user.orgId }).select('departure_reason').count().groupBy('departure_reason'),
      db('departures').where({ org_id: user.orgId }).whereNotNull('overall_risk_score').select(db.raw(`case
        when overall_risk_score < 30 then 'low'
        when overall_risk_score < 60 then 'medium'
        when overall_risk_score < 80 then 'high'
        else 'critical' end as risk_level`)).count().groupBy('risk_level'),
    ]);

    return NextResponse.json({
      overview: {
        totalDepartures: +totalDepartures.count,
        activeDepartures: +activeDepartures.count,
        completedDepartures: +completedDepartures.count,
        avgRiskScore: Math.round((parseFloat(avgRiskScore.avg) || 0) * 10) / 10,
        totalKnowledgeItems: +totalKnowledgeItems.count,
        verifiedItems: +verifiedItems.count,
        verificationRate: totalKnowledgeItems.count > 0 ? Math.round((verifiedItems.count / totalKnowledgeItems.count) * 100) : 0,
      },
      charts: {
        departuresByMonth: departuresByMonth.map((r) => ({ month: r.month, count: +r.count })),
        departuresByReason: Object.fromEntries(departuresByReason.map((r) => [r.departure_reason, +r.count])),
        riskDistribution: Object.fromEntries(riskDistribution.map((r) => [r.risk_level, +r.count])),
      },
    });
  });
}
