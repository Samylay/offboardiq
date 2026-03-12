/**
 * OffboardIQ Initial Schema
 *
 * Core entities:
 * - organizations: multi-tenant root
 * - users: org members (HR admins, managers, departing employees)
 * - departures: the central offboarding case
 * - knowledge_domains: areas of expertise mapped to a departing employee
 * - knowledge_items: individual knowledge artifacts captured
 * - transfer_plans: structured handoff plans
 * - transfer_tasks: individual tasks within a plan
 * - interviews: AI-guided knowledge extraction sessions
 * - interview_transcripts: raw + processed interview data
 * - risk_scores: computed flight-risk and knowledge-loss metrics
 * - notifications: system notifications
 * - audit_log: compliance trail
 */

exports.up = function (knex) {
  return knex.schema

    // --- Organizations (tenants) ---
    .createTable('organizations', (t) => {
      t.uuid('id').primary().defaultTo(knex.fn.uuid());
      t.string('name').notNullable();
      t.string('slug').unique().notNullable();
      t.string('industry');
      t.integer('employee_count');
      t.string('plan').defaultTo('starter'); // starter | growth | enterprise
      t.string('billing_email');
      t.string('stripe_customer_id');
      t.jsonb('settings').defaultTo('{}');
      t.timestamp('trial_ends_at');
      t.timestamps(true, true);
    })

    // --- Users ---
    .createTable('users', (t) => {
      t.uuid('id').primary().defaultTo(knex.fn.uuid());
      t.uuid('org_id').references('id').inTable('organizations').onDelete('CASCADE');
      t.string('email').notNullable();
      t.string('password_hash');
      t.string('first_name');
      t.string('last_name');
      t.string('role').notNullable().defaultTo('member'); // admin | hr_manager | manager | member
      t.string('title');
      t.string('department');
      t.string('avatar_url');
      t.string('hris_employee_id'); // link to external HRIS
      t.boolean('is_active').defaultTo(true);
      t.timestamp('last_login_at');
      t.timestamps(true, true);
      t.unique(['org_id', 'email']);
    })

    // --- Departures (core offboarding case) ---
    .createTable('departures', (t) => {
      t.uuid('id').primary().defaultTo(knex.fn.uuid());
      t.uuid('org_id').references('id').inTable('organizations').onDelete('CASCADE');
      t.uuid('employee_id').references('id').inTable('users');
      t.uuid('manager_id').references('id').inTable('users');
      t.uuid('hr_owner_id').references('id').inTable('users');
      t.string('status').defaultTo('initiated');
      // initiated | knowledge_mapping | in_progress | review | completed | archived
      t.date('resignation_date');
      t.date('last_working_day');
      t.string('departure_reason'); // voluntary | involuntary | retirement | contract_end
      t.text('departure_notes');
      t.float('overall_risk_score').defaultTo(0); // 0-100
      t.float('knowledge_capture_score').defaultTo(0); // 0-100, how much was captured
      t.jsonb('metadata').defaultTo('{}');
      t.timestamps(true, true);
      t.index(['org_id', 'status']);
    })

    // --- Knowledge Domains ---
    .createTable('knowledge_domains', (t) => {
      t.uuid('id').primary().defaultTo(knex.fn.uuid());
      t.uuid('departure_id').references('id').inTable('departures').onDelete('CASCADE');
      t.uuid('org_id').references('id').inTable('organizations').onDelete('CASCADE');
      t.string('name').notNullable();
      t.text('description');
      t.string('category'); // technical | process | relationship | institutional | tribal
      t.integer('criticality').defaultTo(5); // 1-10
      t.integer('replaceability').defaultTo(5); // 1-10, how easy to find elsewhere
      t.string('status').defaultTo('identified'); // identified | in_progress | captured | verified
      t.uuid('successor_id').references('id').inTable('users'); // who receives this knowledge
      t.float('capture_completeness').defaultTo(0); // 0-100
      t.timestamps(true, true);
    })

    // --- Knowledge Items (individual artifacts) ---
    .createTable('knowledge_items', (t) => {
      t.uuid('id').primary().defaultTo(knex.fn.uuid());
      t.uuid('domain_id').references('id').inTable('knowledge_domains').onDelete('CASCADE');
      t.uuid('departure_id').references('id').inTable('departures').onDelete('CASCADE');
      t.uuid('created_by').references('id').inTable('users');
      t.string('type').notNullable();
      // document | procedure | contact | credential | codebase | decision_context
      // vendor_relationship | unwritten_rule | workaround | escalation_path
      t.string('title').notNullable();
      t.text('content'); // markdown content
      t.text('ai_summary'); // AI-generated summary
      t.jsonb('ai_tags').defaultTo('[]'); // AI-extracted tags
      t.string('source'); // interview | manual | import | ai_generated
      t.string('file_url'); // attached files
      t.string('file_type');
      t.integer('quality_score'); // AI-assessed quality 1-10
      t.boolean('is_verified').defaultTo(false);
      t.uuid('verified_by').references('id').inTable('users');
      t.jsonb('metadata').defaultTo('{}');
      t.timestamps(true, true);
      t.index(['departure_id', 'type']);
    })

    // --- Transfer Plans ---
    .createTable('transfer_plans', (t) => {
      t.uuid('id').primary().defaultTo(knex.fn.uuid());
      t.uuid('departure_id').references('id').inTable('departures').onDelete('CASCADE');
      t.uuid('created_by').references('id').inTable('users');
      t.string('title').notNullable();
      t.text('description');
      t.string('status').defaultTo('draft'); // draft | active | completed
      t.date('target_completion_date');
      t.float('progress').defaultTo(0); // 0-100
      t.timestamps(true, true);
    })

    // --- Transfer Tasks ---
    .createTable('transfer_tasks', (t) => {
      t.uuid('id').primary().defaultTo(knex.fn.uuid());
      t.uuid('plan_id').references('id').inTable('transfer_plans').onDelete('CASCADE');
      t.uuid('domain_id').references('id').inTable('knowledge_domains');
      t.uuid('assignee_id').references('id').inTable('users');
      t.uuid('departing_employee_id').references('id').inTable('users');
      t.string('title').notNullable();
      t.text('description');
      t.string('type'); // shadow_session | document_review | walkthrough | handoff_meeting | pair_work
      t.string('status').defaultTo('pending'); // pending | in_progress | completed | skipped
      t.string('priority').defaultTo('medium'); // low | medium | high | critical
      t.date('due_date');
      t.timestamp('completed_at');
      t.text('completion_notes');
      t.integer('estimated_minutes');
      t.integer('actual_minutes');
      t.timestamps(true, true);
    })

    // --- AI Interview Sessions ---
    .createTable('interviews', (t) => {
      t.uuid('id').primary().defaultTo(knex.fn.uuid());
      t.uuid('departure_id').references('id').inTable('departures').onDelete('CASCADE');
      t.uuid('interviewee_id').references('id').inTable('users');
      t.uuid('domain_id').references('id').inTable('knowledge_domains');
      t.string('status').defaultTo('scheduled'); // scheduled | in_progress | completed | cancelled
      t.string('type'); // initial_mapping | deep_dive | verification | exit
      t.timestamp('scheduled_at');
      t.timestamp('started_at');
      t.timestamp('completed_at');
      t.integer('duration_minutes');
      t.float('coverage_score').defaultTo(0);
      t.jsonb('ai_config').defaultTo('{}'); // model, temperature, etc.
      t.timestamps(true, true);
    })

    // --- Interview Messages ---
    .createTable('interview_messages', (t) => {
      t.uuid('id').primary().defaultTo(knex.fn.uuid());
      t.uuid('interview_id').references('id').inTable('interviews').onDelete('CASCADE');
      t.string('role').notNullable(); // system | assistant | user
      t.text('content').notNullable();
      t.jsonb('extracted_items').defaultTo('[]'); // knowledge items extracted from this message
      t.integer('sequence').notNullable();
      t.timestamps(true, true);
      t.index(['interview_id', 'sequence']);
    })

    // --- Risk Assessments ---
    .createTable('risk_assessments', (t) => {
      t.uuid('id').primary().defaultTo(knex.fn.uuid());
      t.uuid('departure_id').references('id').inTable('departures').onDelete('CASCADE');
      t.float('knowledge_concentration_risk'); // how siloed is this person's knowledge
      t.float('project_impact_risk'); // active projects affected
      t.float('relationship_risk'); // key vendor/client relationships
      t.float('timeline_risk'); // how compressed is the offboarding window
      t.float('replacement_difficulty'); // how hard to hire replacement
      t.float('overall_score');
      t.jsonb('factors').defaultTo('{}'); // detailed breakdown
      t.jsonb('recommendations').defaultTo('[]'); // AI-generated recommendations
      t.string('computed_by'); // ai | manual
      t.timestamps(true, true);
    })

    // --- Notifications ---
    .createTable('notifications', (t) => {
      t.uuid('id').primary().defaultTo(knex.fn.uuid());
      t.uuid('org_id').references('id').inTable('organizations').onDelete('CASCADE');
      t.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.uuid('departure_id').references('id').inTable('departures');
      t.string('type').notNullable();
      // task_due | interview_reminder | risk_alert | knowledge_gap | completion_milestone
      t.string('channel').defaultTo('in_app'); // in_app | email | slack
      t.string('title').notNullable();
      t.text('body');
      t.string('action_url');
      t.boolean('is_read').defaultTo(false);
      t.timestamp('sent_at');
      t.timestamps(true, true);
      t.index(['user_id', 'is_read']);
    })

    // --- Audit Log ---
    .createTable('audit_log', (t) => {
      t.uuid('id').primary().defaultTo(knex.fn.uuid());
      t.uuid('org_id').references('id').inTable('organizations').onDelete('CASCADE');
      t.uuid('user_id').references('id').inTable('users');
      t.uuid('departure_id').references('id').inTable('departures');
      t.string('action').notNullable();
      t.string('entity_type');
      t.uuid('entity_id');
      t.jsonb('old_values');
      t.jsonb('new_values');
      t.string('ip_address');
      t.timestamps(true, true);
      t.index(['org_id', 'created_at']);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('audit_log')
    .dropTableIfExists('notifications')
    .dropTableIfExists('risk_assessments')
    .dropTableIfExists('interview_messages')
    .dropTableIfExists('interviews')
    .dropTableIfExists('transfer_tasks')
    .dropTableIfExists('transfer_plans')
    .dropTableIfExists('knowledge_items')
    .dropTableIfExists('knowledge_domains')
    .dropTableIfExists('departures')
    .dropTableIfExists('users')
    .dropTableIfExists('organizations');
};
