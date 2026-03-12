const express = require('express');
const Joi = require('joi');
const { db } = require('../../config/database');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/transfers/plans?departure_id=xxx
router.get('/plans', async (req, res, next) => {
  try {
    const { departure_id } = req.query;
    if (!departure_id) throw new AppError('departure_id required', 400);

    const plans = await db('transfer_plans')
      .where({ departure_id })
      .join('departures', 'transfer_plans.departure_id', 'departures.id')
      .where({ 'departures.org_id': req.user.orgId })
      .select('transfer_plans.*')
      .orderBy('transfer_plans.created_at', 'desc');

    // Get tasks for each plan
    for (const plan of plans) {
      plan.tasks = await db('transfer_tasks')
        .where({ plan_id: plan.id })
        .orderBy('due_date', 'asc');
    }

    res.json({ plans });
  } catch (err) {
    next(err);
  }
});

// POST /api/transfers/plans — create transfer plan
router.post('/plans', async (req, res, next) => {
  try {
    const schema = Joi.object({
      departure_id: Joi.string().uuid().required(),
      title: Joi.string().required(),
      description: Joi.string().allow(''),
      target_completion_date: Joi.date(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');

    const departure = await db('departures')
      .where({ id: value.departure_id, org_id: req.user.orgId })
      .first();
    if (!departure) throw new AppError('Departure not found', 404);

    const [plan] = await db('transfer_plans').insert({
      ...value,
      created_by: req.user.id,
    }).returning('*');

    res.status(201).json({ plan });
  } catch (err) {
    next(err);
  }
});

// POST /api/transfers/plans/:id/generate — AI-generate tasks from knowledge domains
router.post('/plans/:id/generate', async (req, res, next) => {
  try {
    const plan = await db('transfer_plans').where({ id: req.params.id }).first();
    if (!plan) throw new AppError('Plan not found', 404);

    const departure = await db('departures')
      .where({ id: plan.departure_id, org_id: req.user.orgId })
      .first();
    if (!departure) throw new AppError('Access denied', 403);

    const domains = await db('knowledge_domains')
      .where({ departure_id: departure.id })
      .orderBy('criticality', 'desc');

    const lastDay = new Date(departure.last_working_day);
    const today = new Date();
    const daysRemaining = Math.ceil((lastDay - today) / (1000 * 60 * 60 * 24));

    // Generate tasks based on domains and time available
    const tasks = [];
    for (const domain of domains) {
      const baseTasks = _generateDomainTasks(domain, departure, daysRemaining);
      tasks.push(...baseTasks);
    }

    // Batch insert
    if (tasks.length > 0) {
      const taskRecords = tasks.map((t) => ({
        plan_id: plan.id,
        domain_id: t.domain_id,
        assignee_id: t.assignee_id,
        departing_employee_id: departure.employee_id,
        title: t.title,
        description: t.description,
        type: t.type,
        priority: t.priority,
        due_date: t.due_date,
        estimated_minutes: t.estimated_minutes,
      }));

      await db('transfer_tasks').insert(taskRecords);
    }

    const allTasks = await db('transfer_tasks')
      .where({ plan_id: plan.id })
      .orderBy('due_date', 'asc');

    res.json({ plan, tasks: allTasks, generated: tasks.length });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/transfers/tasks/:id — update task status
router.patch('/tasks/:id', async (req, res, next) => {
  try {
    const allowedFields = ['status', 'completion_notes', 'actual_minutes', 'assignee_id', 'due_date'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (updates.status === 'completed') {
      updates.completed_at = new Date();
    }

    const [task] = await db('transfer_tasks')
      .where({ id: req.params.id })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');

    if (!task) throw new AppError('Task not found', 404);

    // Update plan progress
    const allTasks = await db('transfer_tasks').where({ plan_id: task.plan_id });
    const completedCount = allTasks.filter((t) => t.status === 'completed').length;
    const progress = (completedCount / allTasks.length) * 100;

    await db('transfer_plans')
      .where({ id: task.plan_id })
      .update({ progress, updated_at: new Date() });

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

function _generateDomainTasks(domain, departure, daysRemaining) {
  const tasks = [];
  const successorId = domain.successor_id;

  // Every domain gets a documentation task
  tasks.push({
    domain_id: domain.id,
    assignee_id: successorId,
    title: `Document ${domain.name}`,
    description: `Create or update documentation covering all aspects of ${domain.name}. Include step-by-step procedures, key contacts, access requirements, and edge cases.`,
    type: 'document_review',
    priority: domain.criticality >= 8 ? 'critical' : domain.criticality >= 5 ? 'high' : 'medium',
    due_date: _calculateDueDate(daysRemaining, 0.5),
    estimated_minutes: 120,
  });

  // High-criticality domains get shadow sessions
  if (domain.criticality >= 7) {
    tasks.push({
      domain_id: domain.id,
      assignee_id: successorId,
      title: `Shadow session: ${domain.name}`,
      description: `${successorId ? 'Successor shadows' : 'Team member shadows'} the departing employee performing ${domain.name}-related work. Take notes on decisions, shortcuts, and undocumented processes.`,
      type: 'shadow_session',
      priority: 'high',
      due_date: _calculateDueDate(daysRemaining, 0.3),
      estimated_minutes: 180,
    });
  }

  // Critical domains get a formal handoff meeting
  if (domain.criticality >= 8) {
    tasks.push({
      domain_id: domain.id,
      assignee_id: successorId,
      title: `Formal handoff: ${domain.name}`,
      description: `Structured handoff meeting for ${domain.name}. Review documentation, walk through real scenarios, identify remaining gaps, and establish emergency contact arrangements.`,
      type: 'handoff_meeting',
      priority: 'critical',
      due_date: _calculateDueDate(daysRemaining, 0.8),
      estimated_minutes: 90,
    });
  }

  // Relationship domains need intro meetings
  if (domain.category === 'relationship') {
    tasks.push({
      domain_id: domain.id,
      assignee_id: successorId,
      title: `Relationship introductions: ${domain.name}`,
      description: `Schedule and conduct warm introductions to key contacts related to ${domain.name}. Ensure the successor is introduced in context, not cold.`,
      type: 'walkthrough',
      priority: 'high',
      due_date: _calculateDueDate(daysRemaining, 0.6),
      estimated_minutes: 60,
    });
  }

  return tasks;
}

function _calculateDueDate(daysRemaining, fraction) {
  const daysFromNow = Math.max(1, Math.floor(daysRemaining * fraction));
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

module.exports = router;
