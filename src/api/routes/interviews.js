const express = require('express');
const Joi = require('joi');
const { db } = require('../../config/database');
const { AppError } = require('../middleware/errorHandler');
const knowledgeExtractor = require('../services/knowledgeExtractor');

const router = express.Router();

// GET /api/interviews?departure_id=xxx
router.get('/', async (req, res, next) => {
  try {
    const { departure_id } = req.query;
    if (!departure_id) throw new AppError('departure_id required', 400);

    const interviews = await db('interviews')
      .where({ departure_id })
      .join('departures', 'interviews.departure_id', 'departures.id')
      .where({ 'departures.org_id': req.user.orgId })
      .select('interviews.*')
      .orderBy('interviews.created_at', 'desc');

    res.json({ interviews });
  } catch (err) {
    next(err);
  }
});

// GET /api/interviews/:id — get interview with messages
router.get('/:id', async (req, res, next) => {
  try {
    const interview = await db('interviews')
      .where({ 'interviews.id': req.params.id })
      .join('departures', 'interviews.departure_id', 'departures.id')
      .where({ 'departures.org_id': req.user.orgId })
      .select('interviews.*')
      .first();

    if (!interview) throw new AppError('Interview not found', 404);

    const messages = await db('interview_messages')
      .where({ interview_id: interview.id })
      .orderBy('sequence', 'asc');

    res.json({ interview, messages });
  } catch (err) {
    next(err);
  }
});

// POST /api/interviews — create a new AI interview session
router.post('/', async (req, res, next) => {
  try {
    const schema = Joi.object({
      departure_id: Joi.string().uuid().required(),
      domain_id: Joi.string().uuid(),
      type: Joi.string().valid('initial_mapping', 'deep_dive', 'verification', 'exit').required(),
      scheduled_at: Joi.date(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');

    const departure = await db('departures')
      .where({ id: value.departure_id, org_id: req.user.orgId })
      .first();
    if (!departure) throw new AppError('Departure not found', 404);

    const [interview] = await db('interviews').insert({
      departure_id: value.departure_id,
      interviewee_id: departure.employee_id,
      domain_id: value.domain_id || null,
      type: value.type,
      status: value.scheduled_at ? 'scheduled' : 'in_progress',
      scheduled_at: value.scheduled_at || null,
      started_at: value.scheduled_at ? null : new Date(),
    }).returning('*');

    // If starting immediately, generate the opening message
    if (!value.scheduled_at) {
      const employee = await db('users').where({ id: departure.employee_id }).first();
      const domains = await db('knowledge_domains').where({ departure_id: departure.id });

      const phase = value.type === 'initial_mapping' ? 'role_mapping'
        : value.type === 'deep_dive' ? 'deep_dive'
        : value.type === 'verification' ? 'tribal_knowledge'
        : 'relationship_mapping';

      const systemPrompt = knowledgeExtractor.buildInterviewPrompt(
        {
          employee_name: `${employee.first_name} ${employee.last_name}`,
          title: employee.title,
          department: employee.department,
          last_working_day: departure.last_working_day,
        },
        domains,
        phase,
        []
      );

      // Store system prompt as first message
      await db('interview_messages').insert({
        interview_id: interview.id,
        role: 'system',
        content: systemPrompt,
        sequence: 0,
      });

      // Generate opening question (in production, this calls the AI API)
      const openingMessage = _getOpeningMessage(phase, employee);
      await db('interview_messages').insert({
        interview_id: interview.id,
        role: 'assistant',
        content: openingMessage,
        sequence: 1,
      });
    }

    res.status(201).json({ interview });
  } catch (err) {
    next(err);
  }
});

// POST /api/interviews/:id/messages — send a message in an interview
router.post('/:id/messages', async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) throw new AppError('Message content required', 400);

    const interview = await db('interviews')
      .where({ 'interviews.id': req.params.id })
      .join('departures', 'interviews.departure_id', 'departures.id')
      .where({ 'departures.org_id': req.user.orgId })
      .select('interviews.*')
      .first();

    if (!interview) throw new AppError('Interview not found', 404);
    if (interview.status === 'completed') throw new AppError('Interview already completed', 400);

    // Get current message count for sequence
    const [{ count }] = await db('interview_messages')
      .where({ interview_id: interview.id })
      .count();

    // Store user message
    const [userMsg] = await db('interview_messages').insert({
      interview_id: interview.id,
      role: 'user',
      content,
      sequence: +count,
    }).returning('*');

    // In production, this would call the AI API with full message history
    // For now, acknowledge and return
    // The AI response would be generated asynchronously and include knowledge extraction

    // Extract any knowledge items from the user's response directly
    const extractedItems = knowledgeExtractor.extractKnowledgeItems(content);

    if (extractedItems.length > 0) {
      // Store extracted items
      for (const item of extractedItems) {
        await db('knowledge_items').insert({
          domain_id: interview.domain_id,
          departure_id: interview.departure_id,
          created_by: req.user.id,
          type: item.type || 'document',
          title: item.title,
          content: item.content,
          source: 'interview',
          quality_score: item.criticality,
        });
      }
    }

    res.status(201).json({
      message: userMsg,
      extractedItems: extractedItems.length,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/interviews/:id/complete — mark interview complete
router.post('/:id/complete', async (req, res, next) => {
  try {
    const [interview] = await db('interviews')
      .where({ id: req.params.id })
      .update({
        status: 'completed',
        completed_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    if (!interview) throw new AppError('Interview not found', 404);

    res.json({ interview });
  } catch (err) {
    next(err);
  }
});

function _getOpeningMessage(phase, employee) {
  const openers = {
    role_mapping: `Hi ${employee.first_name}! Thanks for taking the time to do this. I know transitions can be hectic, and I want to make sure the knowledge you've built here doesn't walk out the door with you — it's valuable and your team will benefit from capturing it.\n\nLet's start broad: Can you walk me through what a typical week looks like for you? I'm interested in everything — the obvious stuff and especially the things that might not show up on any org chart or job description.`,
    deep_dive: `Welcome back, ${employee.first_name}. In our previous conversations, we identified some key areas where your knowledge is critical. Today I'd like to go deeper on each one.\n\nLet's start with the first area. Can you walk me through the exact process, step by step, including any shortcuts or workarounds you've developed?`,
    tribal_knowledge: `${employee.first_name}, today I want to explore something trickier — the things you know that you might not even realize you know. The institutional memory, the "why we do things this way" context.\n\nLet me start with this: What's something about how things really work here that would surprise a new hire?`,
    relationship_mapping: `${employee.first_name}, today let's map out your professional network — both internal and external. These relationships often carry critical context that's hard to replace.\n\nWho are the first five people you'd contact if something went seriously wrong in your area of responsibility?`,
  };

  return openers[phase] || openers.role_mapping;
}

module.exports = router;
