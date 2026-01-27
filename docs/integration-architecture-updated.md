# Integration Architecture - Infin8Content

Generated: 2026-01-23 (Deep Scan Update)  
Repository Type: Monorepo (3 parts)  
Integration Pattern: Service-oriented with shared libraries

## Overview

Infin8Content implements a monorepo architecture with three distinct parts that communicate through well-defined interfaces and shared dependencies. The architecture supports multi-tenant SaaS operations with clear separation of concerns.

## Repository Parts

### Part 1: infin8content/ (Web Application)
- **Type:** Next.js 16.1.1 web platform
- **Responsibility:** User interface, API endpoints, business logic
- **Size:** Primary application (90% of codebase)

### Part 2: tools/ (Development Utilities)  
- **Type:** ESLint plugin development tools
- **Responsibility:** Code quality enforcement, design system compliance
- **Size:** Utility library (5% of codebase)

### Part 3: _bmad/ (Framework)
- **Type:** BMad Method workflow framework
- **Responsibility:** Project management, workflow orchestration
- **Size:** Framework infrastructure (5% of codebase)

## Integration Points

### 1. Design System Integration

**tools/ → infin8content/**
```
tools/eslint-plugin-design-system/
├── index.js                    # ESLint plugin entry point
└── rules/                      # Design system enforcement rules
    ├── design-tokens.js       # CSS variable validation
    ├── component-usage.js     # Component pattern enforcement
    └── brand-compliance.js    # Brand guideline validation
```

**Integration Method:**
- ESLint plugin imported in infin8content/.eslintrc.design-system.js
- Real-time design system validation during development
- Automated compliance checking in CI/CD pipeline

**Data Flow:**
- **Direction:** tools → infin8content
- **Protocol:** ESLint plugin API
- **Frequency:** Development time + CI builds
- **Data Type:** Rule definitions, validation results

### 2. Workflow Management Integration

**_bmad/ → infin8content/**
```
_bmad/bmm/workflows/
├── document-project.md        # Documentation workflows
├── sprint-planning.md         # Sprint management
└── create-stories.md          # Story generation

infin8content/
├── docs/                      # Generated documentation
├── _bmad-output/             # Workflow artifacts
└── accessible-artifacts/     # Project deliverables
```

**Integration Method:**
- Workflow configuration files in _bmad/
- Generated artifacts stored in infin8content/docs/
- Project status tracking via YAML files

**Data Flow:**
- **Direction:** _bmad/ → infin8content
- **Protocol:** File-based workflow execution
- **Frequency:** On-demand workflow runs
- **Data Type:** Markdown documents, YAML status files

### 3. Shared Component Integration

**components/ → infin8content/**
```
components/
└── ui/
    └── optimized-image-simple.tsx  # Shared UI utilities

infin8content/components/
├── ui/                           # Main component library
└── shared/                       # Cross-feature components
```

**Integration Method:**
- Shared utilities imported by main application
- TypeScript interfaces for type safety
- Versioned component releases

**Data Flow:**
- **Direction:** components → infin8content
- **Protocol:** ES6 module imports
- **Frequency:** Build time
- **Data Type:** React components, utility functions

## External Service Integrations

### Primary API Integrations

**AI Services Layer:**
```
infin8content/lib/services/
├── openrouter.ts              # AI content generation
├── tavily.ts                  # Research and keyword analysis
└── dataforseo.ts              # SEO data services
```

**Communication Pattern:**
- **Protocol:** HTTP REST APIs
- **Authentication:** API keys (environment variables)
- **Error Handling:** Retry logic with exponential backoff
- **Rate Limiting:** Request queuing and throttling

**Data Flow:**
- **Request:** Article content, research queries
- **Response:** Generated content, research data, SEO metrics
- **Processing:** Background jobs via Inngest
- **Storage:** Supabase database with audit logging

### Payment Integration

**Stripe Integration:**
```
infin8content/app/api/payment/
├── create-checkout-session/route.ts    # Checkout creation
├── webhook/route.ts                    # Webhook handling
└── lib/stripe.ts                       # Stripe client

Database: subscriptions table
```

**Communication Pattern:**
- **Protocol:** Stripe API + Webhooks
- **Security:** Webhook signature verification
- **Data Flow:** Customer creation → Subscription management → Payment events

### Email Integration

**Brevo Integration:**
```
infin8content/lib/services/brevo.ts
├── sendOTPEmail()              # OTP verification
├── sendNotificationEmail()     # User notifications
└── sendMarketingEmail()        # Marketing campaigns
```

**Communication Pattern:**
- **Protocol:** HTTP REST API
- **Templates:** Dynamic email templates
- **Tracking:** Delivery status and open rates

### WordPress Integration (NEW - Story 5-1)

**WordPress Publishing:**
```
infin8content/lib/services/wordpress-adapter.ts
├── publishArticle()            # Main publishing function
├── validateRequest()          # Input validation
└── handleResponse()           # Response processing

API Endpoint: /api/articles/publish
Database: publish_references table
```

**Communication Pattern:**
- **Protocol:** WordPress REST API
- **Authentication:** Application Passwords
- **Idempotency:** publish_references table tracking
- **Constraints:** 30s timeout, synchronous execution

## Database Integration Architecture

### Supabase Integration

**Database Layer:**
```
infin8content/supabase/
├── migrations/                # Schema migrations (31 files)
├── config.toml               # Supabase configuration
└── functions/                # Database functions

infin8content/lib/supabase/
├── server.ts                 # Server-side client
├── client.ts                 # Client-side client
└── queries/                  # RLS-protected queries
```

**Integration Features:**
- **Multi-tenancy:** org_id-based data isolation
- **Real-time:** Supabase subscriptions for live updates
- **Security:** Row Level Security (RLS) policies
- **Migrations:** Versioned schema management

### Data Flow Patterns

**CRUD Operations:**
- **Create:** Server-side with RLS validation
- **Read:** Client-side with real-time subscriptions
- **Update:** Optimistic updates with server sync
- **Delete:** Soft deletes with audit trails

**Background Processing:**
- **Jobs:** Inngest workflow orchestration
- **Events:** Database triggers + webhooks
- **Queues:** Article generation, email sending
- **Retries:** Smart retry logic with backoff

## Security Integration

### Authentication Flow
```
User → Supabase Auth → Middleware → API Routes → Database
```

**Integration Points:**
- **Supabase Auth:** User authentication and session management
- **Middleware:** Request validation and user context
- **API Routes:** Protected endpoints with RLS
- **Database:** Multi-tenant data isolation

### Data Security
```
Environment Variables → Service Clients → API Calls → RLS Policies
```

**Security Layers:**
- **Environment:** Secure credential management
- **Transport:** HTTPS with certificate validation
- **Application:** Input validation and sanitization
- **Database:** Row Level Security and audit logging

## Performance Integration

### Caching Strategy
```
Client → Browser Cache → CDN → Edge Cache → Application Cache → Database
```

**Cache Layers:**
- **Browser:** Static assets and API responses
- **CDN:** Next.js automatic optimization
- **Application:** React Query for API caching
- **Database:** Connection pooling and query optimization

### Monitoring Integration
```
Application → Sentry → Custom Metrics → Alerting → Dashboards
```

**Monitoring Stack:**
- **Errors:** Sentry error tracking
- **Performance:** Custom metrics collection
- **Logs:** Structured logging with correlation IDs
- **Alerts:** Webhook-based notifications

## Development Workflow Integration

### CI/CD Pipeline
```
Git Push → CI Build → Tests → Security Scan → Build → Deploy
```

**Integration Points:**
- **Code Quality:** ESLint plugin from tools/
- **Testing:** Unit, integration, E2E test suites
- **Security:** Dependency scanning and RLS validation
- **Deployment:** Automated deployment to staging/production

### Development Tools
```
Developer → VS Code → Storybook → Dev Server → Database
```

**Tool Integration:**
- **IDE:** VS Code with TypeScript and ESLint
- **Components:** Storybook for component development
- **Backend:** Supabase local development
- **Testing:** Vitest + Playwright integration

## Future Integration Opportunities

### Potential Enhancements
1. **Microservices:** Split into separate services for scalability
2. **Event Bus:** Implement Kafka/RabbitMQ for async communication
3. **API Gateway:** Centralized API management and routing
4. **Service Mesh:** Advanced service-to-service communication

### Integration Challenges
1. **Complexity:** Managing multiple integration points
2. **Testing:** End-to-end integration test coverage
3. **Monitoring:** Distributed tracing and correlation
4. **Security:** Zero-trust architecture implementation

## Integration Best Practices

### Design Principles
1. **Loose Coupling:** Minimize dependencies between parts
2. **Well-Defined Interfaces:** Clear contracts between services
3. **Error Handling:** Graceful degradation and recovery
4. **Observability:** Comprehensive monitoring and logging

### Implementation Guidelines
1. **Version Management:** Semantic versioning for APIs
2. **Documentation:** Auto-generated API documentation
3. **Testing:** Contract tests for all integrations
4. **Security:** Defense in depth security model

### Operational Excellence
1. **Monitoring:** Real-time integration health checks
2. **Alerting:** Proactive issue detection
3. **Disaster Recovery:** Backup and restore procedures
4. **Performance:** Regular performance optimization
