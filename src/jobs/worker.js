/**
 * OffboardIQ Background Job Worker
 *
 * Handles async operations:
 * - Post-interview knowledge extraction and scoring
 * - Risk score recomputation
 * - Notification dispatch (email, Slack)
 * - Scheduled interview reminders
 * - Proactive knowledge concentration scans
 * - Report generation
 */

const cron = require('node-cron');
const { db } = require('../config/database');
const config = require('../config/env');
const riskEngine = require('../api/services/riskEngine');
const flightRiskEngine = require('../api/services/flightRiskEngine');
const knowledgeExtractor = require('../api/services/knowledgeExtractor');
const logger = require('../api/utils/logger');

// Job: Recompute risk scores for all active departures
async function recomputeRiskScores() {
  logger.info('Job: Recomputing risk scores for active departures');
  try {
    const activeDepartures = await db('departures')
      .whereNotIn('status', ['completed', 'archived'])
      .select('id');

    for (const dep of activeDepartures) {
      try {
        await riskEngine.computeRiskScore(dep.id);
        logger.info(`Risk score updated for departure ${dep.id}`);
      } catch (err) {
        logger.error(`Failed to compute risk for departure ${dep.id}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error(`Job failed (recomputeRiskScores): ${err.message}`);
  }
}

// Job: Send reminders for upcoming interview sessions
async function sendInterviewReminders() {
  logger.info('Job: Checking for upcoming interview reminders');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingInterviews = await db('interviews')
      .where({ status: 'scheduled' })
      .where('scheduled_at', '<=', tomorrow)
      .where('scheduled_at', '>', new Date())
      .join('users', 'interviews.interviewee_id', 'users.id')
      .join('departures', 'interviews.departure_id', 'departures.id')
      .select(
        'interviews.*',
        'users.email',
        'users.first_name',
        'departures.org_id'
      );

    for (const interview of upcomingInterviews) {
      await db('notifications').insert({
        org_id: interview.org_id,
        user_id: interview.interviewee_id,
        departure_id: interview.departure_id,
        type: 'interview_reminder',
        channel: 'email',
        title: 'Knowledge interview tomorrow',
        body: `Hi ${interview.first_name}, you have a knowledge capture interview scheduled for tomorrow. This is an important part of ensuring your expertise is preserved for the team.`,
        action_url: `/interviews/${interview.id}`,
        sent_at: new Date(),
      });
    }
  } catch (err) {
    logger.error(`Job failed (sendInterviewReminders): ${err.message}`);
  }
}

// Job: Check for overdue transfer tasks
async function checkOverdueTasks() {
  logger.info('Job: Checking for overdue transfer tasks');
  try {
    const overdueTasks = await db('transfer_tasks')
      .where('status', '!=', 'completed')
      .where('status', '!=', 'skipped')
      .where('due_date', '<', new Date())
      .join('transfer_plans', 'transfer_tasks.plan_id', 'transfer_plans.id')
      .join('departures', 'transfer_plans.departure_id', 'departures.id')
      .select('transfer_tasks.*', 'departures.org_id', 'departures.hr_owner_id');

    for (const task of overdueTasks) {
      // Notify the task assignee and HR owner
      const notifyUsers = [task.assignee_id, task.hr_owner_id].filter(Boolean);

      for (const userId of notifyUsers) {
        const existing = await db('notifications')
          .where({ user_id: userId, type: 'task_due' })
          .where('created_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
          .first();

        if (!existing) {
          await db('notifications').insert({
            org_id: task.org_id,
            user_id: userId,
            type: 'task_due',
            channel: 'in_app',
            title: `Overdue: ${task.title}`,
            body: `Transfer task "${task.title}" is past its due date. Please complete it as soon as possible to ensure knowledge continuity.`,
            sent_at: new Date(),
          });
        }
      }
    }
  } catch (err) {
    logger.error(`Job failed (checkOverdueTasks): ${err.message}`);
  }
}

// Job: Weekly proactive knowledge concentration scan
async function weeklyConcentrationScan() {
  logger.info('Job: Running weekly knowledge concentration scan');
  try {
    const orgs = await db('organizations').select('id', 'name');

    for (const org of orgs) {
      try {
        const results = await flightRiskEngine.generateProactiveRecommendations(org.id);

        // Notify admins about critical findings
        const criticalRecs = results.recommendations.filter((r) => r.priority === 'critical');
        if (criticalRecs.length > 0) {
          const admins = await db('users')
            .where({ org_id: org.id, role: 'admin', is_active: true })
            .select('id');

          for (const admin of admins) {
            await db('notifications').insert({
              org_id: org.id,
              user_id: admin.id,
              type: 'risk_alert',
              channel: 'email',
              title: `${criticalRecs.length} critical knowledge risk${criticalRecs.length > 1 ? 's' : ''} detected`,
              body: `OffboardIQ's weekly scan found ${criticalRecs.length} critical knowledge concentration risks in your organization. Review the Knowledge Risk dashboard for details.`,
              action_url: '/analytics',
              sent_at: new Date(),
            });
          }
        }
      } catch (err) {
        logger.error(`Concentration scan failed for org ${org.id}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error(`Job failed (weeklyConcentrationScan): ${err.message}`);
  }
}

// Schedule jobs
function startScheduler() {
  // Every 6 hours: recompute risk scores
  cron.schedule('0 */6 * * *', recomputeRiskScores);

  // Every morning at 8am: send interview reminders
  cron.schedule('0 8 * * *', sendInterviewReminders);

  // Every 4 hours: check overdue tasks
  cron.schedule('0 */4 * * *', checkOverdueTasks);

  // Every Monday at 9am: weekly concentration scan
  cron.schedule('0 9 * * 1', weeklyConcentrationScan);

  logger.info('OffboardIQ job scheduler started');
}

// Run standalone or as module
if (require.main === module) {
  startScheduler();
  logger.info('Worker process running. Press Ctrl+C to stop.');
} else {
  module.exports = { startScheduler, recomputeRiskScores, sendInterviewReminders, checkOverdueTasks, weeklyConcentrationScan };
}
