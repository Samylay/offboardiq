const express = require('express');
const { db } = require('../../config/database');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/analytics/dashboard — org-wide offboarding analytics
router.get('/dashboard', async (req, res, next) => {
  try {
    const orgId = req.user.orgId;

    const [
      activeDepartures,
      completedDepartures,
      totalKnowledgeItems,
      avgRiskScore,
      avgCaptureScore,
      departuresByStatus,
      departuresByReason,
      recentActivity,
    ] = await Promise.all([
      db('departures').where({ org_id: orgId }).whereNot({ status: 'archived' }).whereNot({ status: 'completed' }).count().first(),
      db('departures').where({ org_id: orgId, status: 'completed' }).count().first(),
      db('knowledge_items').join('departures', 'knowledge_items.departure_id', 'departures.id').where({ 'departures.org_id': orgId }).count().first(),
      db('departures').where({ org_id: orgId }).avg('overall_risk_score as avg').first(),
      db('departures').where({ org_id: orgId }).avg('knowledge_capture_score as avg').first(),
      db('departures').where({ org_id: orgId }).groupBy('status').select('status').count(),
      db('departures').where({ org_id: orgId }).groupBy('departure_reason').select('departure_reason').count(),
      db('audit_log').where({ org_id: orgId }).orderBy('created_at', 'desc').limit(20),
    ]);

    // Knowledge type distribution across the org
    const knowledgeByType = await db('knowledge_items')
      .join('departures', 'knowledge_items.departure_id', 'departures.id')
      .where({ 'departures.org_id': orgId })
      .groupBy('knowledge_items.type')
      .select('knowledge_items.type')
      .count();

    // Upcoming deadlines
    const upcomingDeadlines = await db('departures')
      .where({ org_id: orgId })
      .whereNot({ status: 'completed' })
      .whereNot({ status: 'archived' })
      .where('last_working_day', '>=', new Date())
      .join('users', 'departures.employee_id', 'users.id')
      .select(
        'departures.id',
        'departures.last_working_day',
        'departures.overall_risk_score',
        'departures.knowledge_capture_score',
        'users.first_name',
        'users.last_name',
        'users.department'
      )
      .orderBy('last_working_day', 'asc')
      .limit(10);

    res.json({
      summary: {
        activeDepartures: +activeDepartures.count,
        completedDepartures: +completedDepartures.count,
        totalKnowledgeItems: +totalKnowledgeItems.count,
        avgRiskScore: Math.round((avgRiskScore.avg || 0) * 10) / 10,
        avgCaptureScore: Math.round((avgCaptureScore.avg || 0) * 10) / 10,
      },
      departuresByStatus: Object.fromEntries(departuresByStatus.map((r) => [r.status, +r.count])),
      departuresByReason: Object.fromEntries(departuresByReason.map((r) => [r.departure_reason, +r.count])),
      knowledgeByType: Object.fromEntries(knowledgeByType.map((r) => [r.type, +r.count])),
      upcomingDeadlines,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/departure/:id — detailed departure analytics
router.get('/departure/:id', async (req, res, next) => {
  try {
    const departure = await db('departures')
      .where({ id: req.params.id, org_id: req.user.orgId })
      .first();
    if (!departure) throw new AppError('Departure not found', 404);

    const [domains, items, tasks, interviews, riskHistory] = await Promise.all([
      db('knowledge_domains').where({ departure_id: departure.id }),
      db('knowledge_items').where({ departure_id: departure.id }),
      db('transfer_tasks')
        .join('transfer_plans', 'transfer_tasks.plan_id', 'transfer_plans.id')
        .where({ 'transfer_plans.departure_id': departure.id })
        .select('transfer_tasks.*'),
      db('interviews').where({ departure_id: departure.id }),
      db('risk_assessments').where({ departure_id: departure.id }).orderBy('created_at', 'desc'),
    ]);

    // Timeline metrics
    const lastDay = new Date(departure.last_working_day);
    const today = new Date();
    const daysRemaining = Math.max(0, Math.ceil((lastDay - today) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.ceil((lastDay - new Date(departure.resignation_date)) / (1000 * 60 * 60 * 24));

    // Task completion
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const overdueTasks = tasks.filter((t) => t.status !== 'completed' && new Date(t.due_date) < today).length;

    // Knowledge by category
    const domainsByCategory = {};
    for (const d of domains) {
      domainsByCategory[d.category] = domainsByCategory[d.category] || [];
      domainsByCategory[d.category].push({
        name: d.name,
        criticality: d.criticality,
        completeness: d.capture_completeness,
        hasSuccessor: !!d.successor_id,
      });
    }

    // Interview coverage
    const completedInterviews = interviews.filter((i) => i.status === 'completed').length;
    const totalInterviewMinutes = interviews.reduce((s, i) => s + (i.duration_minutes || 0), 0);

    res.json({
      timeline: { daysRemaining, totalDays, progressPercent: ((totalDays - daysRemaining) / totalDays) * 100 },
      knowledge: {
        totalDomains: domains.length,
        totalItems: items.length,
        verifiedItems: items.filter((i) => i.is_verified).length,
        avgCompleteness: domains.length > 0
          ? Math.round(domains.reduce((s, d) => s + d.capture_completeness, 0) / domains.length)
          : 0,
        domainsByCategory,
      },
      tasks: {
        total: tasks.length,
        completed: completedTasks,
        overdue: overdueTasks,
        completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
      },
      interviews: {
        total: interviews.length,
        completed: completedInterviews,
        totalMinutes: totalInterviewMinutes,
      },
      riskHistory,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
