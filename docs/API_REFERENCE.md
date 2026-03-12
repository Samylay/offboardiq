# OffboardIQ — API Reference

Base URL: `https://api.offboardiq.com/api`

All endpoints except `/auth/*` and `/webhooks/*` require a Bearer token in the Authorization header.

---

## Authentication

### POST /auth/register
Create a new organization and admin user.

**Body:**
```json
{
  "email": "admin@company.com",
  "password": "securepassword",
  "firstName": "Jordan",
  "lastName": "Lee",
  "orgName": "Acme Corp",
  "industry": "Technology"
}
```

**Response (201):**
```json
{
  "user": { "id": "uuid", "email": "admin@company.com", "firstName": "Jordan", "lastName": "Lee", "role": "admin" },
  "organization": { "id": "uuid", "name": "Acme Corp", "plan": "starter" },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### POST /auth/login
**Body:** `{ "email": "...", "password": "..." }`
**Response (200):** `{ "user": {...}, "accessToken": "...", "refreshToken": "..." }`

### POST /auth/refresh
**Body:** `{ "refreshToken": "..." }`
**Response (200):** `{ "accessToken": "...", "refreshToken": "..." }`

---

## Departures

### GET /departures
List all departures for the organization.

**Query params:** `status`, `page` (default: 1), `limit` (default: 20)

**Response (200):**
```json
{
  "departures": [
    {
      "id": "uuid",
      "employee_first_name": "Sarah",
      "employee_last_name": "Chen",
      "employee_title": "Senior Backend Engineer",
      "employee_department": "Engineering",
      "status": "in_progress",
      "resignation_date": "2026-03-01",
      "last_working_day": "2026-03-28",
      "departure_reason": "voluntary",
      "overall_risk_score": 82,
      "knowledge_capture_score": 35
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 4 }
}
```

### GET /departures/:id
Full departure detail with knowledge domains, items, plans, and risk assessment.

### POST /departures
Create a new offboarding case. **Requires:** `admin` or `hr_manager` role.

**Body:**
```json
{
  "employee_id": "uuid",
  "manager_id": "uuid",
  "resignation_date": "2026-03-01",
  "last_working_day": "2026-03-28",
  "departure_reason": "voluntary",
  "departure_notes": "Moving to competitor"
}
```

### PATCH /departures/:id
Update departure status or details.

### POST /departures/:id/risk-assessment
Trigger risk score computation for a departure.

---

## Knowledge

### GET /knowledge/domains?departure_id=uuid
List knowledge domains for a departure, ordered by criticality.

### POST /knowledge/domains
Create a new knowledge domain.

**Body:**
```json
{
  "departure_id": "uuid",
  "name": "Payment Gateway Integration",
  "description": "Custom Stripe integration and billing logic",
  "category": "technical",
  "criticality": 9,
  "replaceability": 3,
  "successor_id": "uuid"
}
```

### PATCH /knowledge/domains/:id
Update domain status, successor, or capture completeness.

### GET /knowledge/items?departure_id=uuid&domain_id=uuid&type=workaround
List knowledge items with optional filters.

### POST /knowledge/items
Create a knowledge item.

**Body:**
```json
{
  "domain_id": "uuid",
  "departure_id": "uuid",
  "type": "workaround",
  "title": "Billing Webhook Retry Loop Fix",
  "content": "Script at scripts/fix-webhook-loop.sh handles...",
  "source": "interview"
}
```

**Knowledge item types:** `document`, `procedure`, `contact`, `credential`, `codebase`, `decision_context`, `vendor_relationship`, `unwritten_rule`, `workaround`, `escalation_path`

**Knowledge categories:** `technical`, `process`, `relationship`, `institutional`, `tribal`

### POST /knowledge/items/:id/verify
Mark a knowledge item as verified.

### GET /knowledge/coverage/:departureId
Get knowledge coverage analysis with gaps, recommendations, and type distribution.

---

## Interviews

### GET /interviews?departure_id=uuid
List interview sessions for a departure.

### GET /interviews/:id
Get interview with full message history.

### POST /interviews
Create a new AI interview session.

**Body:**
```json
{
  "departure_id": "uuid",
  "domain_id": "uuid",
  "type": "deep_dive",
  "scheduled_at": "2026-03-18T14:00:00Z"
}
```

**Interview types:** `initial_mapping`, `deep_dive`, `verification`, `exit`

### POST /interviews/:id/messages
Send a message in an active interview. Returns extracted knowledge items.

**Body:** `{ "content": "The webhook retry logic..." }`

### POST /interviews/:id/complete
Mark an interview as completed.

---

## Transfer Plans

### GET /transfers/plans?departure_id=uuid
List transfer plans with nested tasks.

### POST /transfers/plans
Create a transfer plan.

### POST /transfers/plans/:id/generate
AI-generate transfer tasks from knowledge domains. Creates shadow sessions, documentation reviews, and handoff meetings based on domain criticality.

### PATCH /transfers/tasks/:id
Update task status, assignee, or due date.

---

## Search

### GET /search?q=webhook+retry&type=workaround&category=technical
Search the organization-wide knowledge base.

**Query params:** `q` (search text), `type`, `category`, `department`, `verified` (true/false), `minQuality` (1-10), `sortBy`, `sortDir`, `page`, `limit`

### GET /search/stats
Knowledge base statistics (totals, type/category/department breakdown).

---

## Flight Risk

### GET /flight-risk/concentration-map
Knowledge concentration analysis across the organization. **Requires:** `admin` or `hr_manager` role.

Returns department vulnerability scores, bus factors, and single-point-of-failure identification.

### GET /flight-risk/recommendations
Proactive knowledge capture recommendations. **Requires:** `admin` or `hr_manager` role.

---

## Analytics

### GET /analytics/dashboard
Organization-wide offboarding metrics summary.

### GET /analytics/departure/:id
Detailed analytics for a specific departure.

---

## Organizations

### GET /organizations/current
Current organization details.

### GET /organizations/members
List organization members.

### POST /organizations/members
Invite a new member. **Requires:** `admin` or `hr_manager` role.

### PATCH /organizations/settings
Update organization settings. **Requires:** `admin` role.

---

## Webhooks (Public — No Auth Required)

### POST /webhooks/hris/:orgSlug/:provider
Receive HRIS webhook events. Provider-specific signature verification.

**Supported providers:** `bamboohr`, `workday`, `rippling`, generic

**Example BambooHR payload:**
```json
{
  "type": "employee.resigned",
  "employee": {
    "id": "12345",
    "displayName": "Sarah Chen",
    "workEmail": "sarah@company.com",
    "department": "Engineering",
    "jobTitle": "Senior Backend Engineer",
    "terminationDate": "2026-03-28"
  }
}
```

---

## Error Format

All errors return:
```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "MACHINE_READABLE_CODE"
  }
}
```

**Common error codes:** `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `DUPLICATE_EMAIL`, `INTERNAL_ERROR`
