const express = require('express');
const Joi = require('joi');
const { db } = require('../../config/database');
const { requireRole } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const riskEngine = require('../services/riskEngine');

const router = express.Router();

const createSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  manager_id: Joi.string().uuid(),
  resignation_date: Joi.date().required(),
  last_working_day: Joi.date().required(),
  departure_reason: Joi.string().valid('voluntary', 'involuntary', 'retirement', 'contract_end').required(),
  departure_notes: Joi.string().allow(''),
});

// GET /api/departures — list all departures for the org
router.get('/', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db('departures')
      .where({ 'departures.org_id': req.user.orgId })
      .join('users as employee', 'departures.employee_id', 'employee.id')
      .leftJoin('users as manager', 'departures.manager_id', 'manager.id')
      .leftJoin('users as hr', 'departures.hr_owner_id', 'hr.id')
      .select(
        'departures.*',
        'employee.first_name as employee_first_name',
        'employee.last_name as employee_last_name',
        'employee.title as employee_title',
        'employee.department as employee_department',
        'employee.email as employee_email',
        'manager.first_name as manager_first_name',
        'manager.last_name as manager_last_name',
        'hr.first_name as hr_first_name',
        'hr.last_name as hr_last_name'
      )
      .orderBy('departures.created_at', 'desc');

    if (status) {
      query = query.where({ 'departures.status': status });
    }

    const departures = await query.limit(limit).offset(offset);

    const [{ count }] = await db('departures')
      .where({ org_id: req.user.orgId })
      .count();

    res.json({
      departures,
      pagination: { page: +page, limit: +limit, total: +count },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/departures/:id — single departure with full context
router.get('/:id', async (req, res, next) => {
  try {
    const departure = await db('departures')
      .where({ id: req.params.id, org_id: req.user.orgId })
      .first();

    if (!departure) throw new AppError('Departure not found', 404);

    const [domains, items, plans, riskAssessment] = await Promise.all([
      db('knowledge_domains').where({ departure_id: departure.id }),
      db('knowledge_items').where({ departure_id: departure.id }),
      db('transfer_plans').where({ departure_id: departure.id }),
      db('risk_assessments').where({ departure_id: departure.id }).first(),
    ]);

    const employee = await db('users').where({ id: departure.employee_id }).first();

    res.json({
      departure,
      employee: {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        title: employee.title,
        department: employee.department,
        email: employee.email,
      },
      domains,
      knowledgeItems: items,
      transferPlans: plans,
      riskAssessment,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/departures — initiate a new offboarding
router.post('/', requireRole('admin', 'hr_manager'), async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');

    // Verify the employee belongs to the same org
    const employee = await db('users')
      .where({ id: value.employee_id, org_id: req.user.orgId })
      .first();
    if (!employee) throw new AppError('Employee not found', 404);

    const [departure] = await db('departures').insert({
      org_id: req.user.orgId,
      employee_id: value.employee_id,
      manager_id: value.manager_id || null,
      hr_owner_id: req.user.id,
      resignation_date: value.resignation_date,
      last_working_day: value.last_working_day,
      departure_reason: value.departure_reason,
      departure_notes: value.departure_notes,
      status: 'initiated',
    }).returning('*');

    // Log the action
    await db('audit_log').insert({
      org_id: req.user.orgId,
      user_id: req.user.id,
      departure_id: departure.id,
      action: 'departure_initiated',
      entity_type: 'departure',
      entity_id: departure.id,
      new_values: departure,
    });

    res.status(201).json({ departure });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/departures/:id — update departure
router.patch('/:id', requireRole('admin', 'hr_manager', 'manager'), async (req, res, next) => {
  try {
    const departure = await db('departures')
      .where({ id: req.params.id, org_id: req.user.orgId })
      .first();
    if (!departure) throw new AppError('Departure not found', 404);

    const allowedFields = ['status', 'last_working_day', 'departure_notes', 'manager_id', 'hr_owner_id'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const [updated] = await db('departures')
      .where({ id: req.params.id })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');

    await db('audit_log').insert({
      org_id: req.user.orgId,
      user_id: req.user.id,
      departure_id: departure.id,
      action: 'departure_updated',
      entity_type: 'departure',
      entity_id: departure.id,
      old_values: departure,
      new_values: updated,
    });

    res.json({ departure: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/departures/:id/risk-assessment — compute risk score
router.post('/:id/risk-assessment', async (req, res, next) => {
  try {
    const departure = await db('departures')
      .where({ id: req.params.id, org_id: req.user.orgId })
      .first();
    if (!departure) throw new AppError('Departure not found', 404);

    const assessment = await riskEngine.computeRiskScore(departure.id);
    res.json({ assessment });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
