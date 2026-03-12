# OffboardIQ — Product Vision Document

## The Problem

**Every time an employee leaves, your company gets a little dumber.**

US companies lose an estimated $31 billion annually to knowledge loss from employee turnover (Panopto Workplace Knowledge and Productivity Report). The average employee holds 1,200 hours of accumulated institutional knowledge — undocumented procedures, tribal knowledge, relationship context, and decision history that exists only in their head.

Current solutions fail because they treat offboarding as:
- **An HR checklist** (return laptop, disable accounts, exit interview)
- **A compliance exercise** (data deletion, access revocation)
- **A sentiment survey** (why are you leaving?)

None of these capture the *operational knowledge* that actually keeps the business running.

## The Insight

The 2-4 week post-resignation window is a structured knowledge mining opportunity, not a checklist.

Three types of knowledge exist in every departing employee:

| Type | Description | Ease of Capture | Organizational Impact |
|------|-------------|-----------------|----------------------|
| **Explicit** | Documented, findable, in wikis/repos | Easy | Low — already accessible |
| **Implicit** | Known but undocumented, needs prompting | Medium | Medium — recoverable with effort |
| **Tacit** | "You don't know what you don't know" | Hard | **Critical — often irreplaceable** |

OffboardIQ focuses on the hard part: **extracting tacit knowledge through AI-guided interviews** that use progressive deepening techniques to surface knowledge the departing employee doesn't even realize they hold.

## The Product

OffboardIQ is an AI-powered knowledge capture and transfer platform that transforms employee departures from knowledge-loss events into knowledge-preservation opportunities.

### Core Capabilities

#### 1. AI Knowledge Extraction Engine
Five-phase structured interview methodology:
1. **Role Mapping** — Surface the full scope of responsibilities beyond the job title
2. **Dependency Tracing** — Identify what breaks when this person leaves
3. **Deep Dives** — Extract step-by-step procedures, edge cases, and workarounds
4. **Tribal Knowledge** — Surface unwritten rules, political context, and decision history
5. **Relationship Mapping** — Capture professional network and warm handoff requirements

The AI interviewer adapts its questions based on responses, follows up on vague answers, and extracts structured knowledge items in real-time.

#### 2. Risk Scoring Engine
Five-dimensional risk model:
- **Knowledge Concentration** — How siloed is this person's knowledge?
- **Project Impact** — Which active projects are affected?
- **Relationship Dependency** — Which vendor/client relationships are at risk?
- **Timeline Pressure** — How compressed is the offboarding window?
- **Replacement Difficulty** — How hard is it to hire a replacement?

#### 3. Proactive Knowledge Risk Map (Differentiator)
Unlike any competitor, OffboardIQ doesn't wait for resignations:
- Continuously maps knowledge concentration across the organization
- Identifies "bus factor = 1" employees (single points of failure)
- Generates proactive recommendations for cross-training and documentation
- Detects organizational vulnerability by department before any departure occurs

#### 4. Automated Transfer Plans
AI-generated handoff workflows:
- Shadow sessions between departing employee and successor
- Documentation review tasks with due dates
- Relationship introduction meetings
- Formal handoff meetings for critical domains
- Progress tracking and deadline alerts

#### 5. Organizational Knowledge Base
Captured knowledge becomes a searchable, persistent asset:
- Full-text search across all historical knowledge items
- Filtered by type, category, department, verification status
- Quality scoring and verification workflows
- Cross-departure knowledge aggregation

### Integration Architecture
- **HRIS Webhooks** — Auto-trigger from BambooHR, Workday, Rippling, Gusto
- **Slack** — Notifications, reminders, and interview scheduling
- **Calendar** — Auto-schedule interview and handoff sessions
- **Confluence/Notion** — Export captured knowledge to existing wikis
- **Jira/Linear** — Track transfer tasks alongside project work

## Target Market

### Primary: Mid-Market Companies (100-2,000 employees)
- **Why**: Large enough to feel the pain of knowledge loss, small enough that enterprise CLM tools (Workday, SAP SuccessFactors) are overkill
- **Buyer**: VP of People / Head of HR / Chief People Officer
- **Champion**: HR Business Partners, Engineering Managers
- **Budget**: HR tech budget, $5-20k/year

### Secondary: Scaling Startups (50-100 employees)
- **Why**: High turnover in growth-stage companies, every departure is felt acutely
- **Buyer**: Head of People / COO
- **Budget**: $2-5k/year

### Anti-targets
- Companies under 30 employees (too small to need structured tooling)
- Enterprises over 5,000 employees (need enterprise sales, long cycles, heavy customization)

## Competitive Landscape

### Direct Competitors (Offboarding-Focused)
| Competitor | Weakness | Our Advantage |
|-----------|----------|---------------|
| **Enboarder** | Onboarding-first, offboarding is an afterthought | Purpose-built for the post-resignation window |
| **BambooHR** (offboarding module) | Checklist-based, no knowledge capture | AI-powered knowledge extraction |
| **WorkBright** | Compliance-focused, no knowledge transfer | Operational knowledge preservation |
| **Trello/Asana** (manual processes) | Generic project management, no AI, no structure | Domain-specific AI and risk scoring |

### Adjacent Competitors (Knowledge Management)
| Competitor | Weakness | Our Advantage |
|-----------|----------|---------------|
| **Guru** | Wiki for ongoing knowledge, not departure-triggered | Departure-specific extraction methodology |
| **Tettra** | Team wiki, no offboarding workflow | Integrated workflow + AI interviews |
| **Notion** | Generic workspace, no structure for offboarding | Purpose-built interview and transfer system |
| **Confluence** | Documentation tool, not knowledge extraction | AI extracts what documentation misses |

### Why None of These Solve the Problem
1. HR tools focus on compliance checklists, not knowledge
2. Knowledge management tools assume knowledge is already documented
3. No existing tool uses AI to *extract* knowledge from people
4. Nobody does proactive knowledge risk mapping

## Moat

1. **Data network effect** — Every completed offboarding improves the AI's ability to identify knowledge gaps and ask better interview questions
2. **Organizational knowledge graph** — Over time, OffboardIQ builds a map of where knowledge lives in the organization that becomes increasingly valuable
3. **Switching cost** — The captured knowledge base becomes a critical organizational asset that's painful to migrate
4. **Integration depth** — Deep HRIS integration creates workflow lock-in
5. **Interview methodology** — The 5-phase extraction protocol is a proprietary methodology that improves with usage data

## Success Metrics

### Product Metrics
- **Knowledge Capture Score**: Target 70%+ average across all departures
- **Risk Reduction**: Measurable decrease in post-departure incidents
- **Time to First Interview**: < 48 hours from resignation
- **Interview Completion Rate**: > 85% of scheduled sessions completed

### Business Metrics
- **Activation**: First departure case created within 14 days of signup
- **Engagement**: 3+ knowledge domains mapped per departure
- **Retention**: 90%+ annual retention (measured by departure volume)
- **Expansion**: Multi-department adoption within 6 months

## Pricing Philosophy

**Pay for outcomes, not seats.**

Traditional HR tools charge per-seat, which penalizes growth and creates shelfware. OffboardIQ charges per departure case, aligning our revenue with our value delivery. You only pay when someone leaves and you need us.

| Plan | Price | Target |
|------|-------|--------|
| **Starter** | $99/departure | Small teams, < 10 departures/year |
| **Growth** | $199/departure + $299/mo platform fee | Mid-market, 10-50 departures/year |
| **Enterprise** | Custom | 50+ departures/year, SSO, API, compliance |

Annual commitment discounts: 20% off per-departure rates.

The platform fee for Growth covers:
- Proactive knowledge risk mapping (continuous)
- Unlimited knowledge base search
- HRIS integration
- Analytics dashboard
- Slack/email notifications
