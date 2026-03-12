# OffboardIQ — Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Anthropic API key (for AI features)

## Local Development

```bash
# Clone and install
git clone https://github.com/your-org/offboardiq.git
cd offboardiq
npm install
cd src/frontend && npm install && cd ../..

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and API keys

# Create database
createdb offboardiq_dev

# Run migrations
npm run migrate

# Seed demo data (optional)
npm run seed

# Start development servers
npm run dev
# API runs on http://localhost:3001
# Frontend runs on http://localhost:5173
```

## Environment Variables

See `.env.example` for the full list. Critical variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (prod) | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Must be a random 256-bit string in production |
| `ANTHROPIC_API_KEY` | No | Required for AI interview features |
| `REDIS_URL` | No | Required for background job processing |
| `SLACK_BOT_TOKEN` | No | Required for Slack notifications |

## Production Deployment

### Option 1: Railway / Render (Recommended for launch)

```bash
# Railway
railway init
railway add --plugin postgresql
railway add --plugin redis
railway up

# Render
# Create Web Service, PostgreSQL, and Redis from dashboard
# Set environment variables
# Deploy from GitHub
```

### Option 2: AWS (Recommended for scale)

Infrastructure requirements:
- ECS Fargate cluster (API + Worker services)
- RDS PostgreSQL (db.t3.medium minimum)
- ElastiCache Redis (cache.t3.micro minimum)
- S3 bucket (file storage)
- CloudFront distribution (frontend CDN)
- ACM certificate (SSL)
- Route 53 (DNS)

### Option 3: Docker

```dockerfile
# Dockerfile included in repo
docker build -t offboardiq .
docker run -p 3001:3001 \
  -e DATABASE_URL=postgres://... \
  -e JWT_SECRET=... \
  -e ANTHROPIC_API_KEY=... \
  offboardiq
```

## Database Migrations

```bash
# Run pending migrations
npm run migrate

# Rollback last migration
npx knex migrate:rollback

# Check migration status
npx knex migrate:status
```

## Background Worker

The worker process handles scheduled jobs (risk recomputation, reminders, etc.):

```bash
# Run worker alongside API
npm run worker

# In production, run as a separate process/container
NODE_ENV=production node src/jobs/worker.js
```

## Health Check

```
GET /api/health
Response: { "status": "healthy", "version": "1.0.0", "timestamp": "..." }
```

## Monitoring Recommendations

- **Application**: Datadog APM or New Relic
- **Logs**: CloudWatch, Papertrail, or Datadog Logs
- **Uptime**: Pingdom or Better Uptime
- **Error tracking**: Sentry
- **Database**: PgHero or RDS Performance Insights

## Security Checklist (Pre-Launch)

- [ ] JWT_SECRET is a cryptographically random 256-bit string
- [ ] Database passwords are not defaults
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] CORS origin restricted to production frontend domain
- [ ] Rate limiting configured appropriately
- [ ] Webhook secrets set for all HRIS integrations
- [ ] Audit log retention policy defined
- [ ] Database backups configured (automated daily)
- [ ] SOC 2 Type II assessment initiated (for Enterprise plan)
- [ ] GDPR data deletion workflow implemented
- [ ] Penetration testing completed
