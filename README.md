# OffboardIQ

**AI-powered employee offboarding and knowledge capture platform.**

Stop losing your company's brain every time someone leaves.

---

## What is OffboardIQ?

OffboardIQ transforms the post-resignation window from a knowledge-loss crisis into a knowledge-preservation opportunity. Using structured AI interviews, it extracts, organizes, and transfers the tacit knowledge that departing employees carry in their heads — before it walks out the door forever.

### The Problem

US companies lose an estimated **$31 billion annually** to knowledge loss from employee turnover. Current offboarding tools focus on compliance checklists (return laptop, revoke access) but ignore the operational knowledge that keeps the business running.

- The undocumented procedures
- The vendor contacts only one person has
- The workarounds that aren't in any wiki
- The "why we do it this way" decision context
- The escalation paths that only exist in someone's head

### How OffboardIQ Solves It

1. **AI Knowledge Extraction** — 5-phase structured interviews that progressively surface explicit, implicit, and tacit knowledge
2. **Risk Scoring** — Quantify the real cost of each departure across 5 risk dimensions
3. **Proactive Risk Mapping** — Identify single points of failure *before* anyone resigns
4. **Transfer Plans** — AI-generated handoff workflows with shadow sessions, documentation tasks, and relationship introductions
5. **Knowledge Base** — Captured knowledge becomes a searchable organizational asset

## Architecture

```
Frontend (React + Vite + Tailwind)
    ↕
API Server (Express.js)
    ↕
┌──────────┬──────────┬──────────┐
│PostgreSQL│  Redis   │  Claude  │
│          │          │   API    │
└──────────┴──────────┴──────────┘
    ↕
Background Worker (node-cron)
    ↕
HRIS Webhooks (BambooHR, Workday, Rippling)
```

## Quick Start

```bash
# Install dependencies
npm install
cd src/frontend && npm install && cd ../..

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Set up database
createdb offboardiq_dev
npm run migrate

# Start development
npm run dev
```

The API runs on `http://localhost:3001` and the frontend on `http://localhost:5173`.

## Project Structure

```
offboardiq/
├── docs/                           # Product & technical documentation
│   ├── PRODUCT_VISION.md           # Product strategy & positioning
│   ├── ARCHITECTURE.md             # System architecture & data model
│   ├── API_REFERENCE.md            # Complete API documentation
│   ├── GO_TO_MARKET.md             # GTM strategy & pricing
│   └── DEPLOYMENT.md               # Deployment & operations guide
├── migrations/                     # Database migrations
├── src/
│   ├── api/                        # Backend API
│   │   ├── middleware/             # Auth, error handling
│   │   ├── routes/                 # REST endpoints
│   │   ├── services/              # Business logic
│   │   │   ├── aiProvider.js      # Claude API integration
│   │   │   ├── knowledgeExtractor.js  # AI interview engine
│   │   │   ├── knowledgeSearch.js # Org-wide knowledge search
│   │   │   ├── riskEngine.js      # Departure risk scoring
│   │   │   └── flightRiskEngine.js # Proactive risk mapping
│   │   └── utils/                 # Logger, helpers
│   ├── config/                    # Database & environment config
│   ├── frontend/                  # React application
│   │   └── src/
│   │       ├── components/        # Reusable UI components
│   │       ├── pages/             # Route pages
│   │       ├── hooks/             # React hooks (auth, etc.)
│   │       └── utils/             # API client, helpers
│   ├── integrations/              # Third-party integrations
│   │   └── hris/                  # HRIS webhook handlers
│   └── jobs/                      # Background job worker
├── tests/                         # Test suites
├── .env.example                   # Environment template
└── package.json
```

## Key Features

### AI Knowledge Extraction
The 5-phase interview methodology:

| Phase | Focus | What It Captures |
|-------|-------|-----------------|
| Role Mapping | Full scope of responsibilities | Job duties beyond the title |
| Dependency Tracing | What breaks when they leave | System, process, and project risks |
| Deep Dive | Step-by-step procedures | Procedures, edge cases, workarounds |
| Tribal Knowledge | "Things you don't know you know" | Unwritten rules, decision context |
| Relationship Mapping | Professional network | Vendor, client, and internal contacts |

### Risk Scoring
Five dimensions scored 0-100:
- **Knowledge Concentration** — How siloed is their knowledge?
- **Project Impact** — Which projects are affected?
- **Relationship Dependency** — Which relationships are at risk?
- **Timeline Pressure** — How compressed is the window?
- **Replacement Difficulty** — How hard to hire replacement?

### Proactive Risk Map
The feature that makes OffboardIQ unique — it doesn't wait for resignations:
- Identifies "bus factor = 1" employees
- Maps knowledge concentration by department
- Generates proactive documentation recommendations
- Weekly automated organization-wide risk scans

### HRIS Integration
Auto-trigger offboarding from resignation events:
- BambooHR webhooks
- Workday events
- Rippling integration
- Generic webhook format for custom HRIS

## API Reference

See [docs/API_REFERENCE.md](docs/API_REFERENCE.md) for the complete API documentation.

Key endpoints:
- `POST /api/departures` — Initiate an offboarding case
- `POST /api/interviews` — Start an AI knowledge interview
- `GET /api/search?q=...` — Search the knowledge base
- `GET /api/flight-risk/concentration-map` — Proactive risk analysis
- `POST /api/webhooks/hris/:orgSlug/:provider` — HRIS webhook receiver

## Documentation

| Document | Description |
|----------|-------------|
| [Product Vision](docs/PRODUCT_VISION.md) | Problem statement, target market, competitive analysis, moat |
| [Architecture](docs/ARCHITECTURE.md) | System design, data model, tech stack, security |
| [API Reference](docs/API_REFERENCE.md) | Complete REST API documentation |
| [Go-to-Market](docs/GO_TO_MARKET.md) | GTM strategy, pricing, sales playbook |
| [Deployment](docs/DEPLOYMENT.md) | Setup, deployment, and operations guide |

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Knex.js) |
| Cache/Queue | Redis, BullMQ |
| AI | Anthropic Claude API |
| Auth | JWT, bcrypt |
| Jobs | node-cron |

## License

Proprietary. All rights reserved.
