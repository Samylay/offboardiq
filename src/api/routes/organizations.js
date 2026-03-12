const express = require('express');
const Joi = require('joi');
const { db } = require('../../config/database');
const { requireRole } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// GET /api/organizations/current
router.get('/current', async (req, res, next) => {
  try {
    const org = await db('organizations').where({ id: req.user.orgId }).first();
    if (!org) throw new AppError('Organization not found', 404);

    const [{ count: memberCount }] = await db('users')
      .where({ org_id: org.id, is_active: true })
      .count();

    res.json({
      organization: {
        ...org,
        memberCount: +memberCount,
        settings: org.settings || {},
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/organizations/members
router.get('/members', async (req, res, next) => {
  try {
    const members = await db('users')
      .where({ org_id: req.user.orgId, is_active: true })
      .select('id', 'email', 'first_name', 'last_name', 'role', 'title', 'department', 'last_login_at')
      .orderBy('last_name', 'asc');

    res.json({ members });
  } catch (err) {
    next(err);
  }
});

// POST /api/organizations/members — invite a member
router.post('/members', requireRole('admin', 'hr_manager'), async (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      role: Joi.string().valid('admin', 'hr_manager', 'manager', 'member').default('member'),
      title: Joi.string().allow(''),
      department: Joi.string().allow(''),
    });

    const { error, value } = schema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');

    const existing = await db('users')
      .where({ email: value.email, org_id: req.user.orgId })
      .first();
    if (existing) throw new AppError('Member already exists', 409);

    const [member] = await db('users').insert({
      org_id: req.user.orgId,
      email: value.email,
      first_name: value.firstName,
      last_name: value.lastName,
      role: value.role,
      title: value.title,
      department: value.department,
    }).returning('*');

    // In production: send invitation email

    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/organizations/settings
router.patch('/settings', requireRole('admin'), async (req, res, next) => {
  try {
    const org = await db('organizations').where({ id: req.user.orgId }).first();
    const currentSettings = org.settings || {};
    const newSettings = { ...currentSettings, ...req.body };

    const [updated] = await db('organizations')
      .where({ id: req.user.orgId })
      .update({ settings: JSON.stringify(newSettings), updated_at: new Date() })
      .returning('*');

    res.json({ organization: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
