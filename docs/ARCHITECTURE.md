# OffboardIQ — Architecture Document

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Web App  │  │ Slack    │  │ Email    │  │ HRIS Webhooks    │    │
│  │ (React)  │  │ Bot      │  │ Client   │  │ (BambooHR, etc.) │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘    │
│       │              │              │                  │              │
└───────┼──────────────┼──────────────┼──────────────────┼──────────────┘
        │              │              │                  │
        ▼              ▼              ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Express.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │ Auth     │  │ Rate     │  │ CORS     │  │ Request          │    │
│  │ (JWT)    │  │ Limiting │  │          │  │ Validation       │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘    │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  API Routes  │  │  Services    │  │  Background  │
│              │  │              │  │  Jobs        │
│ /departures  │  │ Knowledge    │  │              │
│ /knowledge   │  │  Extractor   │  │ Risk Recomp  │
│ /interviews  │  │ Risk Engine  │  │ Reminders    │
│ /transfers   │  │ Flight Risk  │  │ Overdue Chk  │
│ /analytics   │  │ AI Provider  │  │ Weekly Scan  │
│ /search      │  │ Kn. Search   │  │              │
│ /flight-risk │  │ HRIS Handler │  │              │
│ /webhooks    │  │              │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └────────┬────────┘                 │
                ▼                          │
┌─────────────────────────────┐            │
│        DATA LAYER           │            │
│  ┌──────────┐ ┌──────────┐  │            │
│  │PostgreSQL│ │  Redis   │  │◄───────────┘
│  │          │ │ (cache,  │  │
│  │ 12 tables│ │  queues) │  │
│  └──────────┘ └──────────┘  │
└─────────────────────────────┘
                │
                ▼
┌─────────────────────────────┐
│     EXTERNAL SERVICES       │
│  ┌──────┐ ┌──────┐ ┌─────┐ │
│  │Claude│ │SMTP  │ │S3   │ │
│  │ API  │ │      │ │     │ │
│  └──────┘ └──────┘ └─────┘ │
└─────────────────────────────┘
```

## Data Model

### Entity Relationship Summary

```
Organization (tenant)
  ├── Users (members)
  ├── Departures (offboarding cases)
  │     ├── Knowledge Domains (expertise areas)
  │     │     └── Knowledge Items (captured artifacts)
  │     ├── Transfer Plans
  │     │     └── Transfer Tasks
  │     ├── Interviews (AI sessions)
  │     │     └── Interview Messages
  │     └── Risk Assessments
  ├── Notifications
  └── Audit Log
```

### Key Design Decisions

1. **Multi-tenancy via org_id**: Every table includes org_id for tenant isolation. Row-level security enforced at the application layer.

2. **Knowledge categorization**: 10 knowledge types and 5 categories provide granular classification without overwhelming users.

3. **Dual scoring system**: Each departure has both a risk score (how dangerous is this departure?) and a knowledge capture score (how much have we preserved?).

4. **Audit trail**: Full audit log with before/after snapshots for compliance requirements (SOX, GDPR).

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + Vite | Fast dev, large ecosystem, easy hiring |
| Styling | Tailwind CSS | Rapid prototyping, consistent design |
| API | Express.js | Lightweight, mature, streaming support |
| Database | PostgreSQL | ACID, JSON support, full-text search |
| Cache/Queue | Redis + BullMQ | Job scheduling, session cache |
| AI | Anthropic Claude API | Best reasoning for interview extraction |
| Auth | JWT + bcrypt | Stateless, scalable |
| Jobs | node-cron + BullMQ | Scheduled and event-driven processing |

## Security Model

### Authentication
- JWT tokens with 24h expiry
- Refresh tokens with 7d expiry
- bcrypt password hashing (12 rounds)
- Rate limiting on auth endpoints (20 req/15min)

### Authorization
- Role-based access control (RBAC): admin, hr_manager, manager, member
- Org-level tenant isolation on every query
- Webhook signature verification for HRIS integrations

### Data Protection
- HTTPS enforced via Helmet
- CORS restricted to known origins
- Request body size limited to 10MB
- SQL injection prevention via parameterized queries (Knex)
- XSS prevention via content sanitization

## Deployment Architecture (Production)

```
                    ┌─────────────┐
                    │  CloudFlare │
                    │  CDN + WAF  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │   Load      │
                    │  Balancer   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ API Pod  │ │ API Pod  │ │ API Pod  │
        │ (auto-   │ │          │ │          │
        │  scaled) │ │          │ │          │
        └──────────┘ └──────────┘ └──────────┘
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Postgres │ │  Redis   │ │  Worker  │
        │ (RDS)    │ │(Elasti-  │ │  Pod     │
        │          │ │  Cache)  │ │          │
        └──────────┘ └──────────┘ └──────────┘
```

### Recommended Infrastructure
- **Compute**: AWS ECS Fargate or Railway/Render for initial launch
- **Database**: AWS RDS PostgreSQL or Neon
- **Cache**: ElastiCache Redis or Upstash
- **Storage**: S3 for file attachments
- **CDN**: CloudFlare for frontend static assets
- **Monitoring**: Datadog or Grafana Cloud
- **CI/CD**: GitHub Actions

## API Design Principles

1. **RESTful conventions**: Standard HTTP methods, status codes, and resource naming
2. **Consistent error format**: `{ error: { message, code } }` on every failure
3. **Pagination**: `{ data, pagination: { page, limit, total } }` on list endpoints
4. **Audit trail**: Every mutation logs to audit_log
5. **Rate limiting**: Global (200/15min) + endpoint-specific limits
6. **Idempotent webhooks**: Always return 200 to prevent retry storms
