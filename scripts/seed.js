/**
 * Seed script — populates development database with demo data.
 * Run: npm run seed
 */

const bcrypt = require('bcryptjs');
const { db } = require('../src/config/database');

async function seed() {
  console.log('Seeding OffboardIQ development database...');

  // Clean existing data
  await db.raw('TRUNCATE TABLE audit_log, notifications, risk_assessments, interview_messages, interviews, transfer_tasks, transfer_plans, knowledge_items, knowledge_domains, departures, users, organizations CASCADE');

  // Organization
  const [org] = await db('organizations').insert({
    name: 'Acme Corp',
    slug: 'acme-corp',
    industry: 'Technology',
    employee_count: 200,
    plan: 'growth',
    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    settings: JSON.stringify({
      defaultOffboardWindow: 14,
      knowledgeCaptureTarget: 70,
    }),
  }).returning('*');

  const passwordHash = await bcrypt.hash('password123', 12);

  // Users
  const users = await db('users').insert([
    { org_id: org.id, email: 'admin@acme.com', password_hash: passwordHash, first_name: 'Jordan', last_name: 'Lee', role: 'admin', title: 'VP of People', department: 'HR' },
    { org_id: org.id, email: 'sarah@acme.com', password_hash: passwordHash, first_name: 'Sarah', last_name: 'Chen', role: 'member', title: 'Senior Backend Engineer', department: 'Engineering' },
    { org_id: org.id, email: 'alex@acme.com', password_hash: passwordHash, first_name: 'Alex', last_name: 'Thompson', role: 'manager', title: 'Engineering Manager', department: 'Engineering' },
    { org_id: org.id, email: 'mike@acme.com', password_hash: passwordHash, first_name: 'Mike', last_name: 'Santos', role: 'member', title: 'Backend Engineer', department: 'Engineering' },
    { org_id: org.id, email: 'marcus@acme.com', password_hash: passwordHash, first_name: 'Marcus', last_name: 'Johnson', role: 'member', title: 'Product Manager', department: 'Product' },
    { org_id: org.id, email: 'priya@acme.com', password_hash: passwordHash, first_name: 'Priya', last_name: 'Patel', role: 'member', title: 'Customer Success Lead', department: 'Customer Success' },
  ]).returning('*');

  const [admin, sarah, alex, mike, marcus, priya] = users;

  // Departure for Sarah Chen
  const [departure] = await db('departures').insert({
    org_id: org.id,
    employee_id: sarah.id,
    manager_id: alex.id,
    hr_owner_id: admin.id,
    status: 'in_progress',
    resignation_date: '2026-03-01',
    last_working_day: '2026-03-28',
    departure_reason: 'voluntary',
    departure_notes: 'Accepted position at a competitor',
    overall_risk_score: 82,
    knowledge_capture_score: 35,
  }).returning('*');

  // Knowledge Domains
  const domains = await db('knowledge_domains').insert([
    { departure_id: departure.id, org_id: org.id, name: 'Payment Gateway Integration', category: 'technical', criticality: 9, replaceability: 3, status: 'in_progress', successor_id: mike.id, capture_completeness: 25 },
    { departure_id: departure.id, org_id: org.id, name: 'CI/CD Pipeline Architecture', category: 'technical', criticality: 8, replaceability: 5, status: 'identified', capture_completeness: 10 },
    { departure_id: departure.id, org_id: org.id, name: 'Stripe Vendor Relationship', category: 'relationship', criticality: 7, replaceability: 2, status: 'in_progress', successor_id: mike.id, capture_completeness: 40 },
    { departure_id: departure.id, org_id: org.id, name: 'Legacy Billing System Workarounds', category: 'tribal', criticality: 9, replaceability: 1, status: 'identified', capture_completeness: 5 },
    { departure_id: departure.id, org_id: org.id, name: 'Database Migration Patterns', category: 'technical', criticality: 6, replaceability: 6, status: 'captured', capture_completeness: 75 },
  ]).returning('*');

  // Knowledge Items
  await db('knowledge_items').insert([
    { domain_id: domains[0].id, departure_id: departure.id, created_by: sarah.id, type: 'codebase', title: 'Stripe Custom Integration Architecture', content: 'Custom Stripe payment processing integration built ~2 years ago. Handles retry logic, webhook processing, and subscription lifecycle management. Code in services/payments/stripe-handler.js.', source: 'interview', quality_score: 9, is_verified: true, verified_by: mike.id },
    { domain_id: domains[3].id, departure_id: departure.id, created_by: sarah.id, type: 'workaround', title: 'Billing Webhook Retry Loop Workaround', content: 'When webhook retry counter exceeds 50, exponential backoff overflows and retries every millisecond. Fix script at scripts/fix-webhook-loop.sh. Run manually when error rate spikes. Happens 1-2x/month.', source: 'interview', quality_score: 8, is_verified: true, verified_by: mike.id },
    { domain_id: domains[2].id, departure_id: departure.id, created_by: sarah.id, type: 'contact', title: 'Stripe Account Manager', content: 'Jamie Torres (jamie.t@stripe.com). Has given us preferential pricing on card-present transactions. Mention contract #STR-2024-1847 for context.', source: 'interview', quality_score: 7 },
    { domain_id: domains[4].id, departure_id: departure.id, created_by: sarah.id, type: 'procedure', title: 'Zero-Downtime Database Migration Process', content: 'Step 1: Create migration script. Step 2: Test on staging (shadow traffic). Step 3: Create read replica. Step 4: Apply migration to replica. Step 5: Promote replica. Step 6: Clean up old primary. See runbook in ops/db-migrations/README.md.', source: 'manual', quality_score: 8, is_verified: true },
  ]);

  // Transfer Plan
  const [plan] = await db('transfer_plans').insert({
    departure_id: departure.id,
    created_by: admin.id,
    title: 'Sarah Chen Knowledge Transfer Plan',
    description: 'Comprehensive handoff plan for all critical knowledge domains',
    status: 'active',
    target_completion_date: '2026-03-27',
    progress: 25,
  }).returning('*');

  // Transfer Tasks
  await db('transfer_tasks').insert([
    { plan_id: plan.id, domain_id: domains[0].id, assignee_id: mike.id, departing_employee_id: sarah.id, title: 'Document Payment Gateway Integration', type: 'document_review', status: 'in_progress', priority: 'critical', due_date: '2026-03-20', estimated_minutes: 120 },
    { plan_id: plan.id, domain_id: domains[1].id, assignee_id: null, departing_employee_id: sarah.id, title: 'Shadow session: CI/CD Pipeline', type: 'shadow_session', status: 'pending', priority: 'high', due_date: '2026-03-18', estimated_minutes: 180 },
    { plan_id: plan.id, domain_id: domains[2].id, assignee_id: mike.id, departing_employee_id: sarah.id, title: 'Stripe relationship introduction', type: 'walkthrough', status: 'pending', priority: 'high', due_date: '2026-03-22', estimated_minutes: 60 },
    { plan_id: plan.id, domain_id: domains[4].id, assignee_id: mike.id, departing_employee_id: sarah.id, title: 'Document Database Migration Patterns', type: 'document_review', status: 'completed', priority: 'medium', due_date: '2026-03-12', estimated_minutes: 90, completed_at: new Date() },
  ]);

  console.log('Seed complete!');
  console.log(`  Organization: ${org.name} (${org.slug})`);
  console.log(`  Admin login: admin@acme.com / password123`);
  console.log(`  Departure: Sarah Chen (${departure.id})`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
