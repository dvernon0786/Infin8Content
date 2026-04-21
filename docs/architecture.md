# Architecture Documentation

Deep Scan: 2026-04-22
Project: Infin8Content
Framework: Next.js 16.1.1 with TypeScript
Type: Multi-Tenant SaaS Platform

---

## Executive Summary

**Infin8Content** is a multi-tenant AI content SaaS with two distinct processing systems:

1. **Article Generation Pipeline** — Trigger API → Inngest → LLM workers → database. Strictly deterministic, governed by the FSM.
2. **Intent Workflow Engine** — 9-step human-in-the-loop workflow for ICP-driven keyword strategy and article scheduling.

Both systems share Supabase (PostgreSQL + Auth + Realtime) as the single source of truth and use org-scoped RLS for complete tenant isolation.

### Key Architectural Characteristics
- **Zero Drift Protocol**: No UI component may mutate article `status` — only the Trigger API and Inngest workers
- **Event-Driven Background Jobs**: 16 Inngest functions covering generation, scheduling, publishing, cleanup, and metrics
- **Multi-Adapter CMS Publishing**: 7 adapters (WordPress, Ghost, Notion, Shopify, Webflow, Custom, Outstand)
- **Public v1 API**: Key-authenticated REST surface for external integrations
- **Real-time UI**: Supabase Realtime subscriptions propagate DB state directly to dashboard components

---

## Technology Stack (Verified 2026-04-22)

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| Framework | Next.js (App Router) | 16.1.1 | Full-stack — pages, API routes, middleware |
| UI Runtime | React | 19.2.3 | Component model |
| Styling | Tailwind CSS | 4.x | Utility-first styling |
| Component Primitives | Radix UI | multiple | Accessible headless primitives |
| Icons | Lucide React | 0.562.0 | Icon set |
| Database/Auth/Realtime | Supabase | 2.89.0 | PostgreSQL + JWT auth + WS realtime |
| Background Jobs | Inngest | 3.48.1 | Durable function execution |
| AI SDK | Vercel AI SDK | 6.0.0 | LLM streaming + tool calls |
| LLM Router | OpenRouter | 2.1.1 | Multi-model failover (Gemini, Claude, Llama) |
| Research | Tavily | — | Web research API |
| SEO Data | DataForSEO | — | SERP + keyword data |
| Payments | Stripe | 20.1.0 | Subscriptions + usage billing |
| Email | Brevo | 3.0.1 | Transactional email |
| Charts | Recharts | 3.7.0 | Analytics visualizations |
| Validation | Zod | 3.23.8 | Schema validation at API boundaries |
| Encryption | AES-256 | — | CMS credential encryption (lib/security/encryption.ts) |
| Monitoring | Sentry | 10.34.0 | Error tracking |
| Logging | Winston | 3.11.0 | Structured server logs |
| Testing | Vitest / Playwright / Storybook | 4.0.16 / 1.57.0 / 10.1.11 | Unit / E2E / Component |

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Client Browser                         │
│              (React 19 + Next.js App Router)                 │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTPS / WebSocket
┌────────────────────────────▼─────────────────────────────────┐
│                  Next.js Application (Vercel)                │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │  App Router  │  │   API Routes    │  │  Middleware     │  │
│  │  /dashboard  │  │  /api/articles  │  │  Auth + Org     │  │
│  │  /workflows  │  │  /api/intent    │  │  Onboarding Gate│  │
│  │  /onboarding │  │  /api/v1/*      │  │  Payment Guard  │  │
│  └──────────────┘  └────────┬────────┘  └────────────────┘  │
└───────────────────────────┬─┴────────────────────────────────┘
                            │
        ┌───────────────────┼──────────────────────┐
        │                   │                      │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────────▼────────┐
│   Supabase     │  │   Inngest      │  │  External APIs    │
│  PostgreSQL    │  │  (16 functions)│  │                   │
│  Auth (JWT)    │  │  article gen   │  │  OpenRouter (LLM) │
│  Realtime WS   │  │  intent pipe   │  │  Tavily (research)│
│  RLS policies  │  │  scheduler     │  │  DataForSEO       │
│  75 migrations │  │  social pub    │  │  Stripe (billing) │
└────────────────┘  └───────┬────────┘  │  Brevo (email)    │
                            │           │  Outstand (social)│
                   ┌────────▼────────┐  └───────────────────┘
                   │  CMS Adapters   │
                   │  WordPress      │
                   │  Ghost / Notion │
                   │  Shopify / Webflow│
                   └─────────────────┘
```

---

## Article Generation Pipeline (Zero Drift Protocol)

```
User → POST /api/articles/generate
         │
         ▼ (validate org credits, check status)
    Inngest event: article.generate
         │
         ▼ article-generate-planner.ts
    ┌────┴──────────────────────────────────┐
    │  1. Research Agent (Tavily + cache)   │
    │  2. Content Planner Agent (outline)   │
    │  3. Content Writing Agent (sections)  │
    │  4. Article Assembler                 │
    │  5. SEO Scoring Service               │
    │  6. Metadata Generator                │
    └────┬──────────────────────────────────┘
         │
         ▼ DB update → Supabase Realtime → Dashboard
```

**FSM States**: `backlog` → `queued` → `researching` → `outlining` → `generating` → `reviewing` → `completed` / `failed`

**Enforcement**:
- `lib/fsm/unified-workflow-engine.ts` — canonical state machine
- `lib/fsm/automation-boundary-guard.ts` — prevents UI from bypassing FSM
- `lib/fsm/boundary-transition-wrapper.ts` — wraps all transitions with audit logging

---

## Intent Workflow Engine (9-Step Pipeline)

```
Step 1: ICP Generation    → POST /api/intent/workflows/[id]/steps/icp-generate
Step 2: Competitor Analyze→ POST /api/intent/workflows/[id]/steps/competitor-analyze
Step 3: Seed Extraction   → POST /api/intent/workflows/[id]/steps/seed-extract
Step 4: Approve Seeds     → POST /api/intent/workflows/[id]/steps/approve-seeds  ← Human gate
Step 5: Longtail Expand   → POST /api/intent/workflows/[id]/steps/longtail-expand
Step 6: Filter Keywords   → POST /api/intent/workflows/[id]/steps/filter-keywords
Step 7: Cluster Topics    → POST /api/intent/workflows/[id]/steps/cluster-topics
Step 8: Validate Clusters → POST /api/intent/workflows/[id]/steps/validate-clusters
Step 9: Human Approval    → POST /api/intent/workflows/[id]/steps/human-approval  ← Human gate
         │
         ▼
Step 9+: Queue Articles   → POST /api/intent/workflows/[id]/steps/queue-articles
```

**Key services**: `lib/services/intent-engine/` (20+ files) including ICP generator, keyword clusterer, longtail expander, competitor seed extractor, human approval processor.

---

## Service Layer Architecture

```
lib/
├── agents/                          # AI planning agents
│   ├── planner-agent.ts             # High-level generation coordinator
│   └── planner-compiler.ts          # Prompt compilation
├── fsm/                             # State machine (Zero Drift Protocol)
│   ├── unified-workflow-engine.ts   # Canonical FSM
│   ├── workflow-fsm.ts              # Core transitions
│   ├── automation-boundary-guard.ts # Prevents invalid mutations
│   └── boundary-transition-wrapper.ts
├── inngest/functions/               # 16 background workers
├── services/
│   ├── article-generation/          # Generation pipeline (8 agents)
│   ├── intent-engine/               # Keyword workflow (20+ services)
│   ├── publishing/                  # CMS adapters (7 platforms)
│   ├── dataforseo/                  # SERP analysis
│   ├── llm-visibility/              # Brand presence tracking
│   ├── openrouter/                  # LLM client
│   ├── tavily/                      # Research client
│   ├── webhooks/                    # Outbound webhook dispatcher
│   └── workflow-engine/             # Workflow audit + progression
├── research/                        # Research cache + batch optimizer
├── seo/                             # SEO scoring, validation, recommendations
├── stripe/                          # Payment client + prices + retry
├── supabase/                        # DB client + types + auth wrappers
├── api-auth/                        # v1 API key validation
├── guards/                          # Onboarding + workflow step gates
└── security/                        # AES-256 encryption for CMS credentials
```

---

## Multi-Tenancy Model

**Isolation mechanism**: Supabase Row Level Security (RLS) on all tables.

```sql
-- All tables enforce org-based isolation
-- Policy pattern (verified in migrations):
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON articles
  FOR ALL TO authenticated
  USING (org_id = auth.jwt() ->> 'organization_id');
```

**Organization scoping**:
- `articles.org_id` — all article data
- `activities.organization_id` — audit trail
- `intent_workflows.organization_id` — keyword pipelines
- `organization_competitors.organization_id` — competitor data
- Service Role key (server-side only) bypasses RLS for admin operations

---

## Public v1 API Architecture

Separate key-authenticated surface at `/api/v1/`:

| Route | Auth | Notes |
|-------|------|-------|
| `GET/POST /api/v1/articles` | API key | CRUD articles |
| `GET /api/v1/articles/[id]` | API key | Single article |
| `POST /api/v1/articles/generate` | API key | Trigger generation |
| `POST /api/v1/articles/[id]/publish` | API key | CMS publish |
| `POST /api/v1/articles/[id]/publish-social` | API key | Social publish |
| `GET /api/v1/analytics/articles/[id]` | API key | Article analytics |
| `GET/POST /api/v1/api-keys` | API key | Key management |
| `POST /api/v1/keywords/research` | API key | Keyword data |
| `GET /api/v1/social/accounts` | API key | Social accounts |

Auth middleware: `lib/api-auth/with-api-auth.ts` + `lib/api-auth/validate-api-key.ts`

---

## Security Architecture

| Layer | Implementation |
|-------|---------------|
| Authentication | Supabase JWT + OTP email verification |
| Multi-tenancy isolation | Supabase RLS on all tables |
| API authorization | `lib/api-auth/with-api-auth.ts` for v1 API keys |
| Input validation | Zod schemas at all API boundaries |
| CMS credential storage | AES-256 encryption via `lib/security/encryption.ts` |
| Redirect validation | `lib/utils/validate-redirect.ts` (prevents open redirect) |
| Rate limiting | `lib/services/rate-limiting/persistent-rate-limiter.ts` + `rate_limits` table |
| Session management | `lib/supabase/middleware.ts` — cookie-based SSR sessions |
| Payment guards | `components/guards/payment-guard.tsx` |
| Onboarding gates | `lib/guards/onboarding-gate.ts` + `lib/guards/onboarding-guard.ts` |

---

## CI/CD Architecture

**GitHub Actions** (`.github/workflows/`):

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | Main CI: lint, type-check, unit tests |
| `design-system.yml` | ESLint design system plugin compliance |
| `performance.yml` | Performance benchmarks |
| `sm-validation.yml` | State machine transition validation |
| `ts-001.yml` | TypeScript strict checks |
| `visual-regression.yml` | Storybook visual diffs |

**Build Config** (`next.config.ts`):
- Turbopack enabled (with explicit `root` for CI compatibility)
- `typescript.ignoreBuildErrors: true` (TODO: remove once Supabase types stabilized)
- Image domains: `images.unsplash.com`

---

*See [Data Models](./data-models.md) · [API Contracts](./api-contracts.md) · [Workflow Guide](./workflow-guide.md) · [Component Inventory](./component-inventory.md)*
├─────────────────────────────────────────────────────────────┤
│ Next.js 16.1.1 (App Router)                                │
│ ├── React 19.2.3 (Component Framework)                     │
│ ├── TypeScript 5 (Type Safety)                              │
│ ├── Tailwind CSS 4 (Styling)                               │
│ └── Radix UI (Component Primitives)                        │
└─────────────────────────────────────────────────────────────┘
```

### Backend & Data Layer
```
┌─────────────────────────────────────────────────────────────┐
│                   Backend Architecture                     │
├─────────────────────────────────────────────────────────────┤
│ Supabase (PostgreSQL + Auth + Realtime)                    │
│ ├── Row Level Security (Multi-tenant Isolation)           │
│ ├── Authentication (JWT + OAuth)                           │
│ ├── Realtime Subscriptions (Live Updates)                 │
│ └── Database (PostgreSQL with RLS)                        │
├─────────────────────────────────────────────────────────────┤
│ External Services Integration                              │
│ ├── OpenRouter (AI Content Generation)                    │
│ ├── Tavily (Research API)                                  │
│ ├── DataForSEO (SEO Analytics)                             │
│ ├── Stripe (Payment Processing)                            │
│ ├── Brevo (Email Services)                                 │
│ └── Inngest (Background Workflows)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## System Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │           Client Browser             │
                    │    (React + Next.js Frontend)       │
                    └─────────────┬───────────────────────┘
                                  │ HTTPS/WebSocket
                    ┌─────────────▼───────────────────────┐
                    │        Next.js Application         │
                    │  (App Router + API Routes + Auth)   │
                    └─────────────┬───────────────────────┘
                                  │
                    ┌─────────────▼───────────────────────┐
                    │         Supabase Platform           │
                    │  (PostgreSQL + Auth + Realtime)     │
                    └─────────────┬───────────────────────┘
                                  │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐    ┌─────────▼─────────┐    ┌───────▼────────┐
│  External APIs │    │   Payment System  │    │  Email Service │
│                │    │                  │    │                │
│ • OpenRouter   │    │ • Stripe         │    │ • Brevo        │
│ • Tavily       │    │ • Webhooks       │    │ • Templates    │
│ • DataForSEO   │    │ • Subscriptions  │    │ • Campaigns    │
└────────────────┘    └──────────────────┘    └────────────────┘
```

---

## Application Architecture Patterns

### 1. Multi-Tenant Architecture

#### Data Isolation Strategy
```typescript
// Row Level Security (RLS) Policies Example
CREATE POLICY "Users can view their organization data" 
ON articles FOR ALL 
USING (organization_id = auth.jwt()->->>'organization_id');

// Middleware Enforcement
middleware.ts → Validates user belongs to organization
API Routes → Filter queries by organization_id
Components → Only display organization data
```

#### Organization Context
```typescript
// Organization Context Provider
const OrganizationContext = createContext<{
  organization: Organization;
  userRole: 'admin' | 'member' | 'viewer';
}>();

// Automatic Query Filtering
const articles = await supabase
  .from('articles')
  .select('*')
  .eq('organization_id', organization.id); // Auto-filtered
```

### 2. Event-Driven Architecture

#### Inngest Workflow Integration
```typescript
// Article Generation Workflow
inngest.createFunction(
  { name: 'article-generation' },
  { event: 'article/generate' },
  async ({ event, step }) => {
    // Step 1: Research Phase
    const research = await step.run('research', async () => {
      return await tavilyService.research(event.data.topic);
    });
    
    // Step 2: Content Generation
    const content = await step.run('generate', async () => {
      return await openrouterService.generate({
        topic: event.data.topic,
        research,
        tone: event.data.tone
      });
    });
    
    // Step 3: Save and Notify
    await step.run('save', async () => {
      return await saveArticle(event.data.articleId, content);
    });
  }
);
```

#### Real-Time Updates
```typescript
// Supabase Realtime Subscriptions
const subscription = supabase
  .channel('article-updates')
  .on('postgres_changes', 
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'articles',
      filter: `id=eq.${articleId}`
    }, 
    (payload) => updateArticleProgress(payload.new)
  )
  .subscribe();
```

### 3. Service Layer Architecture

#### External API Services
```typescript
// Service Abstraction Layer
abstract class AIService {
  abstract generateContent(params: GenerationParams): Promise<Content>;
}

class OpenRouterService extends AIService {
  async generateContent(params: GenerationParams): Promise<Content> {
    // OpenRouter API integration
  }
}

class TavilyResearchService {
  async research(topic: string): Promise<ResearchData> {
    // Tavily API integration with caching
  }
}
```

#### Payment Service Architecture
```typescript
// Stripe Service Integration
class StripeService {
  async createCheckoutSession(params: CheckoutParams): Promise<Session> {
    // Stripe checkout creation
  }
  
  async handleWebhook(event: StripeEvent): Promise<void> {
    // Webhook processing for subscription events
  }
}
```

---

## Data Architecture

### Database Schema Design

#### Multi-Tenant Table Structure
```sql
-- Standard Multi-Tenant Pattern
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- RLS Policy
  CONSTRAINT org_isolation CHECK (organization_id IS NOT NULL)
);

-- Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON articles 
  FOR ALL TO authenticated 
  USING (organization_id = auth.jwt()->->>'organization_id');
```

#### Audit Trail Architecture
```sql
-- Comprehensive Audit Logging
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatic Audit Trigger
CREATE TRIGGER audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON articles
  FOR EACH ROW EXECUTE FUNCTION audit_log_function();
```

### Data Flow Architecture

#### Content Generation Pipeline
```
User Request → API Queue → Research Phase → Generation Phase → Storage → Real-time Update

1. Frontend: User submits article generation request
2. API: Queues request with Inngest, returns job ID
3. Research: Tavily API gathers research data (cached)
4. Generation: OpenRouter generates content using research
5. Storage: Article saved to database with progress tracking
6. Real-time: Supabase subscription updates frontend progress
```

#### Payment Processing Flow
```
User Action → Stripe API → Webhook → Database Update → Real-time Sync

1. Frontend: User initiates subscription/checkout
2. API: Creates Stripe checkout session
3. Stripe: Processes payment, sends webhook
4. Webhook: Updates subscription status in database
5. Real-time: Frontend updates via Supabase subscription
6. Suspension: Grace period management if payment fails
```

---

## Security Architecture

### Authentication & Authorization

#### Multi-Layer Security
```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Network Security                                        │
│    ├── HTTPS/TLS Encryption                                │
│    ├── CSP Headers                                         │
│    └── CORS Configuration                                  │
├─────────────────────────────────────────────────────────────┤
│ 2. Authentication                                          │
│    ├── Supabase JWT Tokens                                 │
│    ├── Automatic Token Refresh                             │
│    └── OTP Email Verification                              │
├─────────────────────────────────────────────────────────────┤
│ 3. Authorization                                           │
│    ├── Role-Based Access Control                           │
│    ├── Organization Isolation                              │
│    └── Component-Level Guards                             │
├─────────────────────────────────────────────────────────────┤
│ 4. Data Security                                           │
│    ├── Row Level Security (RLS)                            │
│    ├── Input Validation (Zod)                             │
│    └── Audit Logging                                       │
└─────────────────────────────────────────────────────────────┘
```

#### Implementation Examples
```typescript
// Middleware Security Check
export async function middleware(request: NextRequest) {
  const user = await getUser(request);
  
  // Check suspension status
  if (user?.suspended) {
    return NextResponse.redirect(new URL('/suspended', request.url));
  }
  
  // Validate organization access
  const orgId = request.headers.get('x-organization-id');
  if (!user?.organizations.includes(orgId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
}

// Component-Level Security
const RoleGuard: React.FC<{ children: React.ReactNode; requiredRole: string }> = ({
  children,
  requiredRole
}) => {
  const { userRole } = useOrganization();
  
  if (!hasPermission(userRole, requiredRole)) {
    return <AccessDeniedMessage />;
  }
  
  return <>{children}</>;
};
```

---

## Performance Architecture

### Caching Strategy

#### Multi-Level Caching
```
┌─────────────────────────────────────────────────────────────┐
│                    Caching Layers                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Browser Cache                                            │
│    ├── Static Assets (CSS/JS/Images)                       │
│    ├── API Response Caching                                │
│    └── Service Worker for Offline Support                   │
├─────────────────────────────────────────────────────────────┤
│ 2. Application Cache                                        │
│    ├── React Query (Server State)                          │
│    ├── Component State (Local State)                        │
│    └── Session Storage (User Preferences)                   │
├─────────────────────────────────────────────────────────────┤
│ 3. Database Cache                                           │
│    ├── Query Result Caching                                 │
│    ├── Research API Response Cache                         │
│    └── Connection Pooling                                  │
├─────────────────────────────────────────────────────────────┤
│ 4. CDN Cache                                                │
│    ├── Static Asset Delivery                                │
│    ├── Geographic Distribution                             │
│    └── Edge Computing                                      │
└─────────────────────────────────────────────────────────────┘
```

#### Research Caching Implementation
```typescript
// Research Result Caching
class ResearchCache {
  async getResearch(query: string): Promise<ResearchData | null> {
    const cacheKey = this.hashQuery(query);
    
    // Check cache first
    const cached = await supabase
      .from('tavily_research_cache')
      .select('response_data')
      .eq('query_hash', cacheKey)
      .single();
    
    if (cached && !this.isExpired(cached.expires_at)) {
      await this.incrementHitCount(cacheKey);
      return cached.response_data;
    }
    
    // Fetch from API and cache
    const research = await tavilyAPI.research(query);
    await this.cacheResult(cacheKey, query, research);
    
    return research;
  }
}
```

### Database Performance

#### Query Optimization
```sql
-- Optimized Indexes for Multi-Tenant Queries
CREATE INDEX CONCURRENTLY idx_articles_org_status 
ON articles(organization_id, status, created_at);

CREATE INDEX CONCURRENTLY idx_audit_logs_org_created 
ON audit_logs(organization_id, created_at DESC);

-- Partial Indexes for Common Queries
CREATE INDEX CONCURRENTLY idx_articles_active 
ON articles(organization_id, created_at) 
WHERE status IN ('generating', 'completed');
```

#### Connection Management
```typescript
// Supabase Connection Pooling
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      poolSize: 10, // Connection pool size
      connectionTimeoutMillis: 10000,
    }
  }
);
```

---

## Scalability Architecture

### Horizontal Scaling Strategy

#### Application Layer Scaling
```
┌─────────────────────────────────────────────────────────────┐
│                  Load Balancer Layer                       │
│                  (CDN + Edge Computing)                    │
└─────────────┬───────────────────────┬───────────────────────┘
              │                       │
┌─────────────▼─────────┐   ┌─────────▼─────────┐
│   Application Node 1  │   │   Application Node 2  │
│   (Next.js Instance)  │   │   (Next.js Instance)  │
└─────────────┬─────────┘   └─────────┬─────────┘
              │                       │
              └───────────┬───────────┘
                          │
┌─────────────────────────▼─────────────────────────┐
│              Shared Database Layer               │
│         (Supabase with Read Replicas)            │
└───────────────────────────────────────────────────┘
```

#### Database Scaling Strategy
```typescript
// Read Replica Configuration for Analytics Queries
const analyticsDb = createClient(
  process.env.SUPABASE_READ_REPLICA_URL,
  process.env.SUPABASE_READ_REPLICA_KEY
);

// Route read-heavy queries to replicas
async function getUsageStats(orgId: string) {
  return await analyticsDb
    .from('articles')
    .select('count(*)')
    .eq('organization_id', orgId);
}
```

### Microservice Preparation

#### Service Boundary Definition
```typescript
// Future Microservice Boundaries
interface ServiceBoundaries {
  // Content Generation Service
  contentGeneration: {
    apis: ['/api/articles/generate', '/api/research/*'];
    database: ['articles', 'keyword_research', 'tavily_research_cache'];
    external: ['OpenRouter', 'Tavily', 'DataForSEO'];
  };
  
  // Payment Service
  payment: {
    apis: ['/api/payment/*', '/api/webhooks/stripe'];
    database: ['organizations', 'subscriptions', 'payment_grace_periods'];
    external: ['Stripe'];
  };
  
  // User Management Service
  userManagement: {
    apis: ['/api/auth/*', '/api/user/*', '/api/team/*'];
    database: ['users', 'team_invitations', 'audit_logs'];
    external: ['Brevo'];
  };
}
```

---

## Integration Architecture

### External API Integration

#### AI Service Integration
```typescript
// OpenRouter Integration Architecture
class OpenRouterService {
  private readonly rateLimiter = new RateLimiter({
    requestsPerMinute: 100,
    requestsPerHour: 1000
  });
  
  async generateContent(params: GenerationParams): Promise<Content> {
    await this.rateLimiter.wait();
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-sonnet',
        messages: this.buildMessages(params),
        max_tokens: params.maxTokens
      })
    });
    
    return this.parseResponse(response);
  }
}
```

#### Payment Integration
```typescript
// Stripe Webhook Processing
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const payload = await request.text();
  
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

### Real-Time Architecture

#### Supabase Realtime Integration
```typescript
// Real-time Article Progress Updates
const useArticleProgress = (articleId: string) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('queued');
  
  useEffect(() => {
    const subscription = supabase
      .channel(`article-${articleId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'articles',
          filter: `id=eq.${articleId}`
        }, 
        (payload) => {
          setProgress(payload.new.progress);
          setStatus(payload.new.status);
        }
      )
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [articleId]);
  
  return { progress, status };
};
```

---

## Deployment Architecture

### Production Deployment Strategy

#### Container Architecture
```dockerfile
# Multi-stage Docker Build
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY . .
RUN npm run build

FROM base AS runner
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

#### Environment Configuration
```yaml
# Kubernetes Deployment Example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: infin8content
spec:
  replicas: 3
  selector:
    matchLabels:
      app: infin8content
  template:
    metadata:
      labels:
        app: infin8content
    spec:
      containers:
      - name: app
        image: infin8content:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: supabase-url
```

### Monitoring & Observability

#### Application Monitoring
```typescript
// Performance Monitoring Setup
import { performance } from 'perf_hooks';

// API Request Timing
export function withTiming<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      // Log performance metrics
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      
      resolve(result);
    } catch (error) {
      const duration = performance.now() - start;
      console.log(`❌ ${name}: ${duration.toFixed(2)}ms (failed)`);
      reject(error);
    }
  });
}
```

#### Error Tracking
```typescript
// Global Error Handler
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Error Logging and Alerting
export function handleError(error: Error, context: string) {
  console.error(`🚨 Error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // Send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Sentry, DataDog, etc.
  }
}
```

---

## Development Architecture

### Code Organization Principles

#### Domain-Driven Structure
```
src/
├── app/                    # Next.js App Router (Presentation)
├── components/             # UI Components (Presentation)
├── lib/                    # Business Logic (Domain)
│   ├── services/          # External Integrations (Infrastructure)
│   ├── supabase/          # Database Layer (Infrastructure)
│   └── utils/             # Shared Utilities (Domain)
├── hooks/                 # Custom React Hooks (Application)
├── types/                 # TypeScript Types (Domain)
└── tests/                 # Test Suites (Application)
```

#### Dependency Injection Pattern
```typescript
// Service Container
class ServiceContainer {
  private services = new Map<string, any>();
  
  register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory);
  }
  
  get<T>(name: string): T {
    const factory = this.services.get(name);
    if (!factory) throw new Error(`Service ${name} not found`);
    return factory();
  }
}

// Usage in components
const container = new ServiceContainer();
container.register('openRouter', () => new OpenRouterService());
container.register('tavily', () => new TavilyService());

const openRouter = container.get<OpenRouterService>('openRouter');
```

### Testing Architecture

#### Test Pyramid Implementation
```
                ┌─────────────────┐
                │   E2E Tests     │ ← Few, Slow, High Value
                │  (Playwright)   │
                └─────────────────┘
              ┌─────────────────────┐
              │ Integration Tests   │ ← Medium, Medium Speed
              │ (API + Database)    │
              └─────────────────────┘
            ┌─────────────────────────┐
            │    Unit Tests           │ ← Many, Fast, Foundational
            │ (Components + Utils)    │
            └─────────────────────────┘
```

#### Test Architecture Example
```typescript
// Component Unit Test
describe('ArticleGenerator', () => {
  it('should generate article with valid input', async () => {
    const mockGenerate = vi.fn().mockResolvedValue(mockArticle);
    
    render(<ArticleGenerator onGenerate={mockGenerate} />);
    
    fireEvent.change(screen.getByLabelText('Topic'), {
      target: { value: 'Test Topic' }
    });
    fireEvent.click(screen.getByText('Generate'));
    
    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalledWith({
        topic: 'Test Topic',
        tone: 'professional'
      });
    });
  });
});

// API Integration Test
describe('POST /api/articles/generate', () => {
  it('should queue article generation', async () => {
    const response = await request(app)
      .post('/api/articles/generate')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        topic: 'Test Topic',
        tone: 'professional',
        length: 1000
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.articleId).toBeDefined();
  });
});
```

---

## Future Architecture Considerations

### Scalability Roadmap

#### Phase 1: Optimization (Current)
- Database query optimization
- Caching layer implementation
- Performance monitoring

#### Phase 2: Microservices (6-12 months)
- Extract content generation service
- Separate payment processing service
- Independent user management service

#### Phase 3: Global Scale (12+ months)
- Geographic database distribution
- CDN edge computing
- Multi-region deployment

### Technology Evolution

#### Emerging Technologies
- **AI Model Updates**: Integration with new AI models and providers
- **Real-time Collaboration**: WebSocket-based collaborative editing
- **Advanced Analytics**: Machine learning for content optimization
- **Mobile Applications**: React Native mobile clients

#### Architecture Modernization
- **GraphQL Migration**: API layer modernization
- **Event Sourcing**: Advanced event-driven architecture
- **CQRS Pattern**: Command Query Responsibility Segregation
- **Serverless Functions**: AWS Lambda/Azure Functions integration

---

## Architecture Decision Records

### Key Architectural Decisions

#### 1. Multi-Tenant via RLS (2025-12-01)
**Decision**: Use Supabase Row Level Security for multi-tenancy
**Rationale**: 
- Built-in data isolation
- Automatic security enforcement
- Reduced application complexity
**Alternatives Considered**: Database-per-tenant, application-level filtering

#### 2. Next.js App Router (2025-12-01)
**Decision**: Use Next.js 13+ App Router over Pages Router
**Rationale**:
- Better code organization
- Improved performance
- Future-proof architecture
**Alternatives Considered**: Pages Router, Remix, custom framework

#### 3. Inngest for Workflows (2025-12-05)
**Decision**: Use Inngest for background job processing
**Rationale**:
- TypeScript-first approach
- Excellent developer experience
- Built-in retry and monitoring
**Alternatives Considered**: BullMQ, Celery, custom queue system

#### 4. Supabase as Backend (2025-12-01)
**Decision**: Use Supabase for database and authentication
**Rationale**:
- Rapid development
- Built-in real-time features
- Managed infrastructure
**Alternatives Considered**: Custom PostgreSQL setup, Firebase, AWS Amplify

---

*This documentation was generated as part of the BMad Method document-project workflow on 2026-01-11.*
