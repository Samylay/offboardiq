const express = require('express');
const { db } = require('../../config/database');
const { AppError } = require('../middleware/errorHandler');
const hrisHandler = require('../../integrations/hris/webhookHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * HRIS Webhook endpoints.
 * These are NOT authenticated via JWT — they use webhook secrets.
 * Each org has a unique webhook URL with their org ID.
 */

// POST /api/webhooks/hris/:orgSlug/:provider
router.post('/hris/:orgSlug/:provider', express.raw({ type: '*/*' }), async (req, res, next) => {
  try {
    const { orgSlug, provider } = req.params;

    // Look up the org
    const org = await db('organizations').where({ slug: orgSlug }).first();
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Verify webhook signature
    const webhookSecret = org.settings?.webhookSecrets?.[provider];
    const signature = req.headers['x-webhook-signature']
      || req.headers['x-bamboohr-signature']
      || req.headers['x-rippling-signature']
      || '';

    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    if (webhookSecret && !hrisHandler.verifySignature(provider, rawBody, signature, webhookSecret)) {
      logger.warn(`Webhook signature verification failed for ${orgSlug}/${provider}`);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse the event
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const event = hrisHandler.parseEvent(provider, body);

    // Process the event
    const departure = await hrisHandler.processEvent(org.id, provider, event);

    res.json({
      received: true,
      departure_id: departure?.id || null,
      message: departure ? 'Departure case created' : 'Event processed (no action needed)',
    });
  } catch (err) {
    logger.error(`Webhook processing error: ${err.message}`);
    // Always return 200 to webhooks to prevent retries
    res.json({ received: true, error: err.message });
  }
});

module.exports = router;
