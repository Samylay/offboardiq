const express = require('express');
const knowledgeSearch = require('../services/knowledgeSearch');

const router = express.Router();

// GET /api/search?q=payment+gateway&type=workaround&category=technical
router.get('/', async (req, res, next) => {
  try {
    const { q, type, category, department, verified, minQuality, sortBy, sortDir, page, limit } = req.query;

    const results = await knowledgeSearch.search(req.user.orgId, q, {
      type,
      category,
      department,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      minQuality: minQuality ? parseInt(minQuality) : undefined,
      sortBy,
      sortDir,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/search/stats — knowledge base stats
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await knowledgeSearch.getOrgKnowledgeStats(req.user.orgId);
    res.json({ stats });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
