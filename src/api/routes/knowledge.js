const express = require('express');
const Joi = require('joi');
const { db } = require('../../config/database');
const { AppError } = require('../middleware/errorHandler');
const knowledgeExtractor = require('../services/knowledgeExtractor');

const router = express.Router();

const domainSchema = Joi.object({
  departure_id: Joi.string().uuid().required(),
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  category: Joi.string().valid('technical', 'process', 'relationship', 'institutional', 'tribal').required(),
  criticality: Joi.number().integer().min(1).max(10).required(),
  replaceability: Joi.number().integer().min(1).max(10),
  successor_id: Joi.string().uuid().allow(null),
});

const itemSchema = Joi.object({
  domain_id: Joi.string().uuid().required(),
  departure_id: Joi.string().uuid().required(),
  type: Joi.string().valid(
    'document', 'procedure', 'contact', 'credential', 'codebase',
    'decision_context', 'vendor_relationship', 'unwritten_rule',
    'workaround', 'escalation_path'
  ).required(),
  title: Joi.string().required(),
  content: Joi.string().required(),
  source: Joi.string().valid('interview', 'manual', 'import', 'ai_generated').default('manual'),
});

// GET /api/knowledge/domains?departure_id=xxx
router.get('/domains', async (req, res, next) => {
  try {
    const { departure_id } = req.query;
    if (!departure_id) throw new AppError('departure_id required', 400);

    const domains = await db('knowledge_domains')
      .where({ departure_id, org_id: req.user.orgId })
      .leftJoin('users as successor', 'knowledge_domains.successor_id', 'successor.id')
      .select(
        'knowledge_domains.*',
        'successor.first_name as successor_first_name',
        'successor.last_name as successor_last_name'
      )
      .orderBy('criticality', 'desc');

    res.json({ domains });
  } catch (err) {
    next(err);
  }
});

// POST /api/knowledge/domains
router.post('/domains', async (req, res, next) => {
  try {
    const { error, value } = domainSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');

    // Verify departure belongs to user's org
    const departure = await db('departures')
      .where({ id: value.departure_id, org_id: req.user.orgId })
      .first();
    if (!departure) throw new AppError('Departure not found', 404);

    const [domain] = await db('knowledge_domains').insert({
      ...value,
      org_id: req.user.orgId,
    }).returning('*');

    res.status(201).json({ domain });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/knowledge/domains/:id
router.patch('/domains/:id', async (req, res, next) => {
  try {
    const domain = await db('knowledge_domains')
      .where({ id: req.params.id, org_id: req.user.orgId })
      .first();
    if (!domain) throw new AppError('Domain not found', 404);

    const allowedFields = [
      'name', 'description', 'category', 'criticality', 'replaceability',
      'status', 'successor_id', 'capture_completeness',
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const [updated] = await db('knowledge_domains')
      .where({ id: req.params.id })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');

    res.json({ domain: updated });
  } catch (err) {
    next(err);
  }
});

// GET /api/knowledge/items?departure_id=xxx&domain_id=yyy
router.get('/items', async (req, res, next) => {
  try {
    const { departure_id, domain_id, type } = req.query;
    if (!departure_id) throw new AppError('departure_id required', 400);

    let query = db('knowledge_items')
      .where({ departure_id })
      .join('departures', 'knowledge_items.departure_id', 'departures.id')
      .where({ 'departures.org_id': req.user.orgId })
      .select('knowledge_items.*')
      .orderBy('knowledge_items.created_at', 'desc');

    if (domain_id) query = query.where({ 'knowledge_items.domain_id': domain_id });
    if (type) query = query.where({ 'knowledge_items.type': type });

    const items = await query;
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// POST /api/knowledge/items
router.post('/items', async (req, res, next) => {
  try {
    const { error, value } = itemSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');

    const [item] = await db('knowledge_items').insert({
      ...value,
      created_by: req.user.id,
    }).returning('*');

    // Update domain capture completeness
    await _updateDomainCompleteness(value.domain_id);

    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
});

// POST /api/knowledge/items/:id/verify
router.post('/items/:id/verify', async (req, res, next) => {
  try {
    const [item] = await db('knowledge_items')
      .where({ id: req.params.id })
      .update({
        is_verified: true,
        verified_by: req.user.id,
        updated_at: new Date(),
      })
      .returning('*');

    if (!item) throw new AppError('Item not found', 404);

    res.json({ item });
  } catch (err) {
    next(err);
  }
});

// GET /api/knowledge/coverage/:departureId
router.get('/coverage/:departureId', async (req, res, next) => {
  try {
    const departure = await db('departures')
      .where({ id: req.params.departureId, org_id: req.user.orgId })
      .first();
    if (!departure) throw new AppError('Departure not found', 404);

    const analysis = await knowledgeExtractor.computeCoverageAnalysis(departure.id);
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
});

async function _updateDomainCompleteness(domainId) {
  const items = await db('knowledge_items').where({ domain_id: domainId });
  const verifiedCount = items.filter((i) => i.is_verified).length;
  const totalCount = items.length;

  // Simple heuristic: completeness based on item count and verification
  // A domain needs ~5 verified items to be considered "complete"
  const rawCompleteness = Math.min(100, (totalCount * 10) + (verifiedCount * 10));

  await db('knowledge_domains')
    .where({ id: domainId })
    .update({ capture_completeness: rawCompleteness, updated_at: new Date() });
}

module.exports = router;
