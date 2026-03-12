const express = require('express');
const { requireRole } = require('../middleware/auth');
const flightRiskEngine = require('../services/flightRiskEngine');

const router = express.Router();

// GET /api/flight-risk/concentration-map
router.get('/concentration-map', requireRole('admin', 'hr_manager'), async (req, res, next) => {
  try {
    const map = await flightRiskEngine.computeKnowledgeConcentrationMap(req.user.orgId);
    res.json({ map });
  } catch (err) {
    next(err);
  }
});

// GET /api/flight-risk/recommendations
router.get('/recommendations', requireRole('admin', 'hr_manager'), async (req, res, next) => {
  try {
    const results = await flightRiskEngine.generateProactiveRecommendations(req.user.orgId);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
