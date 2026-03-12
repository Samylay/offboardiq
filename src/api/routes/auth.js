const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { db } = require('../../config/database');
const config = require('../../config/env');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  orgName: Joi.string().required(),
  industry: Joi.string(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

function generateTokens(userId, orgId) {
  const accessToken = jwt.sign({ userId, orgId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  const refreshToken = jwt.sign({ userId, orgId, type: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');

    const existing = await db('users').where({ email: value.email }).first();
    if (existing) throw new AppError('Email already registered', 409, 'DUPLICATE_EMAIL');

    const passwordHash = await bcrypt.hash(value.password, 12);
    const slug = value.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const [org] = await db('organizations').insert({
      name: value.orgName,
      slug: slug + '-' + Date.now().toString(36),
      industry: value.industry,
      plan: 'starter',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    }).returning('*');

    const [user] = await db('users').insert({
      org_id: org.id,
      email: value.email,
      password_hash: passwordHash,
      first_name: value.firstName,
      last_name: value.lastName,
      role: 'admin',
    }).returning('*');

    const tokens = generateTokens(user.id, org.id);

    res.status(201).json({
      user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
      organization: { id: org.id, name: org.name, plan: org.plan },
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');

    const user = await db('users').where({ email: value.email, is_active: true }).first();
    if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(value.password, user.password_hash);
    if (!valid) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

    await db('users').where({ id: user.id }).update({ last_login_at: new Date() });

    const tokens = generateTokens(user.id, user.org_id);

    res.json({
      user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token required', 400);

    const payload = jwt.verify(refreshToken, config.jwt.secret);
    if (payload.type !== 'refresh') throw new AppError('Invalid token type', 401);

    const tokens = generateTokens(payload.userId, payload.orgId);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
