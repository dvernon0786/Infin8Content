# Architecture Documentation - Infin8Content Web Application

Generated: 2026-01-23 (Deep Scan Update)  
Framework: Next.js 16.1.1 + React 19.2.3  
Architecture Pattern: Multi-tenant SaaS with component-based design

## Executive Summary

**Infin8Content** is a sophisticated AI-powered content generation SaaS platform built on modern web technologies. The architecture supports multi-tenant operations, real-time collaboration, and scalable content generation workflows with emphasis on mobile-first design and performance optimization.

### Key Architectural Decisions

1. **Multi-tenant by Design**: Row Level Security ensures data isolation between organizations
2. **Component-Based Architecture**: Atomic design with reusable UI components
3. **Real-First Approach**: Mobile-optimized responsive design with touch interactions
4. **API-First Integration**: RESTful APIs with comprehensive external service integrations
5. **Background Processing**: Inngest for reliable workflow orchestration

## Technology Stack

### Frontend Framework
- **Next.js 16.1.1**: App Router with React Server Components
- **React 19.2.3**: Latest React features with concurrent rendering
- **TypeScript 5**: Type-safe development with strict mode
- **Tailwind CSS 4**: Utility-first styling with custom design tokens

### Backend & Database
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Row Level Security**: Multi-tenant data isolation
- **Inngest**: Background job processing and workflow orchestration
- **Next.js API Routes**: Serverless API endpoints

### External Integrations
- **OpenRouter**: AI content generation with multiple model support
- **Tavily**: Research and keyword analysis
- **DataForSEO**: SEO data services and analytics
- **Brevo**: Email notifications and OTP verification
- **Stripe**: Payment processing and subscription management
- **WordPress**: Content publishing (NEW - Story 5-1)

## Architecture Pattern

### Multi-Tenant SaaS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Next.js App Router + React Components + Tailwind CSS      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Marketing   │ │ Dashboard   │ │ Settings    │          │
│  │ Pages       │ │ Application │ │ Pages       │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                │
├─────────────────────────────────────────────────────────────┤
│  Next.js API Routes + Middleware + Authentication          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Auth API    │ │ Content API │ │ Admin API   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  External API Integrations + Business Logic                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ AI Services │ │ Payment     │ │ Email       │          │
│  │ (OpenRouter)│ │ (Stripe)    │ │ (Brevo)     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL + RLS + Real-time Subscriptions         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Users       │ │ Articles    │ │ Analytics   │          │
│  │ Orgs        │ │ Subscriptions│ │ Metrics     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Atomic Design System

```
┌─────────────────────────────────────────────────────────────┐
│                    Design Tokens                            │
├─────────────────────────────────────────────────────────────┤
│  Colors, Typography, Spacing, Shadows, Animations         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Base Components                           │
├─────────────────────────────────────────────────────────────┤
│  Button, Input, Card, Badge, Avatar, Dialog               │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Composite Components                      │
├─────────────────────────────────────────────────────────────┤
│  Navigation, Forms, Tables, Charts, Layouts                │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Feature Components                        │
├─────────────────────────────────────────────────────────────┤
│  Dashboard, Article Editor, Team Management, Analytics     │
└─────────────────────────────────────────────────────────────┘
```

### Component Organization

```
components/
├── ui/                    # Base components (Radix UI + Tailwind)
│   ├── button.tsx        # Primary button with variants
│   ├── input.tsx         # Form input with validation
│   ├── card.tsx          # Container component
│   └── dialog.tsx        # Modal dialogs
├── shared/               # Cross-feature components
│   ├── layout-provider.tsx  # Responsive layout
│   ├── error-boundary.tsx   # Error handling
│   └── loading-skeleton.tsx # Loading states
├── dashboard/            # Dashboard-specific components
│   ├── sidebar-navigation.tsx
│   ├── activity-feed.tsx
│   └── analytics-dashboard.tsx
├── marketing/            # Landing page components
│   ├── hero-section.tsx
│   ├── trust-badges.tsx
│   └── cta-button.tsx
├── articles/             # Article management
│   ├── article-editor.tsx
│   ├── publish-button.tsx
│   └── article-list.tsx
└── mobile/               # Mobile-optimized components
    ├── mobile-card.tsx
    ├── touch-target.tsx
    └── mobile-navigation.tsx
```

## Data Architecture

### Database Schema Design

**Multi-Tenant Data Model:**
```sql
organizations (id, name, plan, white_label_settings)
    │
    ├── users (id, email, org_id, role, full_name)
    │
    ├── articles (id, org_id, author_id, title, content, status)
    │
    ├── subscriptions (org_id, stripe_subscription_id, plan, status)
    │
    └── analytics (org_id, article_id, metrics, recommendations)
```

**Key Design Principles:**
1. **Organization-Centric**: All data scoped to organization
2. **Audit Trail**: Comprehensive activity logging
3. **Soft Deletes**: Data retention with deletion tracking
4. **Temporal Data**: Timestamps for all operations

### Data Flow Architecture

```
User Request → Middleware → API Route → Business Logic → Database
     │              │           │             │           │
     │              │           │             │           │
     ▼              ▼           ▼             ▼           ▼
Authentication   Rate Limit   Validation   RLS Check   Transaction
Session Check    Request      Zod Schema    Org Isolation  Commit
                 Throttling
```

### Real-Time Data Architecture

```
Supabase Real-time → WebSocket → React Hooks → UI Updates
        │
        ├── Article Generation Progress
        ├── Dashboard Activity Feed
        ├── Team Collaboration Events
        └── Analytics Updates
```

## API Architecture

### RESTful API Design

**API Route Organization:**
```
/api/
├── auth/              # Authentication & authorization
│   ├── register       # User registration with OTP
│   ├── login          # User login
│   ├── verify-otp     # OTP verification
│   └── logout         # Session termination
├── articles/          # Article management
│   ├── publish        # WordPress publishing (Story 5-1)
│   ├── generate       # AI content generation
│   └── list           # Article listing
├── organizations/     # Organization management
├── payment/          # Stripe integration
├── team/             # Team collaboration
├── analytics/        # Performance metrics
└── admin/            # Administrative functions
```

### API Design Principles

1. **Resource-Oriented**: Clear resource hierarchy
2. **Stateless**: JWT-based authentication
3. **Consistent**: Standardized response formats
4. **Secure**: Input validation and rate limiting
5. **Observable**: Comprehensive logging and metrics

### Error Handling Architecture

```
API Error → Error Boundary → User Notification → Logging
     │
     ├── Validation Errors (400)
     ├── Authentication Errors (401)
     ├── Authorization Errors (403)
     ├── Not Found Errors (404)
     └── Server Errors (500)
```

## Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Security                      │
├─────────────────────────────────────────────────────────────┤
│  Input Validation • XSS Protection • CSRF Protection        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Authentication                            │
├─────────────────────────────────────────────────────────────┤
│  Supabase Auth • OTP Verification • Session Management       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Authorization                             │
├─────────────────────────────────────────────────────────────┤
│  Role-Based Access • Row Level Security • Org Scoping      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Security                             │
├─────────────────────────────────────────────────────────────┤
│  Encryption • Audit Logging • Data Retention • Backup       │
└─────────────────────────────────────────────────────────────┘
```

### Security Implementation

**Authentication Flow:**
1. User registration with email verification
2. OTP verification via Brevo
3. Supabase Auth session creation
4. JWT token for API access
5. Middleware validation on each request

**Authorization Model:**
- **Owner**: Full organization access
- **Admin**: Management capabilities
- **Member**: Basic user access

**Data Protection:**
- **Encryption**: TLS 1.3 for all communications
- **PII Protection**: Personal data anonymization
- **Audit Trail**: Complete activity logging
- **Compliance**: GDPR-ready data handling

## Performance Architecture

### Frontend Performance

```
Code Splitting → Lazy Loading → Component Caching → State Management
       │               │                │               │
       ▼               ▼                ▼               ▼
Route Chunks    Dynamic Imports   React Query     Optimistic Updates
Bundle Size     Component Trees   API Caching     UI Responsiveness
```

**Optimization Strategies:**
1. **Code Splitting**: Route-based and component-based
2. **Image Optimization**: Next.js Image component
3. **Font Optimization**: Tailwind CSS font loading
4. **Bundle Analysis**: Regular size monitoring

### Backend Performance

```
API Request → Rate Limiting → Connection Pool → Query Optimization → Cache
      │            │              │               │              │
      ▼            ▼              ▼               ▼              ▼
Request Queue  Throttling     Supabase Pool   Indexed Queries  Redis Cache
```

**Database Optimizations:**
- **Connection Pooling**: Supabase managed
- **Query Optimization**: Proper indexing
- **RLS Efficiency**: Policy optimization
- **Caching Strategy**: Query result caching

### Mobile Performance

```
Mobile Device → Touch Optimization → Reduced Payload → Battery Efficiency
       │               │                    │                   │
       ▼               ▼                    ▼                   ▼
Touch Targets   Gesture Handling    Bundle Size       Background Sync
44px Minimum   Swipe Actions      Code Splitting   Smart Refresh
```

## Integration Architecture

### External Service Integration

```
Infin8Content → API Gateway → External Services → Response Processing
       │
       ├── OpenRouter (AI Generation)
       ├── Tavily (Research)
       ├── DataForSEO (SEO Analysis)
       ├── Brevo (Email/OTP)
       ├── Stripe (Payments)
       └── WordPress (Publishing)
```

**Integration Patterns:**
1. **Circuit Breaker**: Fault tolerance for external APIs
2. **Retry Logic**: Exponential backoff for failures
3. **Rate Limiting**: Respect external API limits
4. **Fallback Handling**: Graceful degradation

### WordPress Integration (Story 5-1)

```
Article → Publish API → WordPress Adapter → WordPress REST → Published
   │
   ├── Idempotency Check (publish_references table)
   ├── Content Validation
   ├── Application Password Auth
   └── Response Processing
```

**Integration Constraints:**
- **Timeout**: 30 seconds maximum
- **Idempotency**: Reference table tracking
- **Authentication**: Application Passwords only
- **Scope**: POST /wp-json/wp/v2/posts only

## Testing Architecture

### Multi-Layer Testing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    E2E Testing                              │
├─────────────────────────────────────────────────────────────┤
│  Playwright • User Journeys • Cross-browser • Mobile        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Integration Testing                       │
├─────────────────────────────────────────────────────────────┤
│  API Tests • Database Tests • External API Contracts       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Unit Testing                              │
├─────────────────────────────────────────────────────────────┤
│  Vitest • Component Tests • Utility Functions • Hooks      │
└─────────────────────────────────────────────────────────────┘
```

### Testing Implementation

**Unit Tests:**
- Component testing with React Testing Library
- Utility function testing
- Hook testing with custom render functions
- Mock implementations for external services

**Integration Tests:**
- API endpoint testing with Supabase
- Database operation testing
- External API contract testing
- Workflow testing with Inngest

**E2E Tests:**
- Critical user journeys
- Mobile responsiveness testing
- Accessibility testing
- Visual regression testing

## Deployment Architecture

### Production Deployment

```
Git Repository → CI/CD Pipeline → Build → Test → Deploy → Monitor
        │              │           │       │       │
        ▼              ▼           ▼       ▼       ▼
Code Changes   Automated Build  Bundle   Production  Observability
Branch Merge   Type Check      Optimize  Release    Monitoring
               Lint Check      Minify   Rollout     Alerting
               Test Suite      Analyze  Health Check Dashboards
```

**Deployment Strategy:**
1. **Continuous Integration**: Automated testing on PR
2. **Automated Deployment**: Staging → Production pipeline
3. **Blue-Green Deployment**: Zero-downtime releases
4. **Rollback Capability**: Instant rollback on issues

### Infrastructure Architecture

```
Edge Network (Vercel) → Application Layer → Database Layer → Monitoring
        │                    │               │            │
        ▼                    ▼               ▼            ▼
CDN + Edge Functions   Next.js App      Supabase DB   Sentry + Metrics
Static Assets         Serverless       PostgreSQL   Error Tracking
API Routes            API Routes       Real-time     Performance
```

## Monitoring & Observability

### Observability Stack

```
Application → Sentry → Custom Metrics → Alerting → Dashboards
     │
     ├── Error Tracking
     ├── Performance Monitoring
     ├── User Behavior Analytics
     └── Business Metrics
```

**Monitoring Implementation:**
- **Errors**: Sentry error tracking and alerting
- **Performance**: Custom metrics collection
- **User Analytics**: Business KPI tracking
- **Infrastructure**: Database and API performance

### Logging Architecture

```
Application → Structured Logs → Log Aggregation → Analysis → Alerting
     │
     ├── Request Logs
     ├── Error Logs
     ├── Audit Logs
     └── Performance Logs
```

## Future Architecture Considerations

### Scalability Planning

**Horizontal Scaling:**
- **Application Layer**: Serverless auto-scaling
- **Database Layer**: Read replicas + connection pooling
- **Cache Layer**: Distributed caching strategy
- **CDN**: Global edge distribution

**Microservices Evolution:**
- **Service Extraction**: Gradual service separation
- **API Gateway**: Centralized routing and management
- **Event Bus**: Asynchronous service communication
- **Service Mesh**: Advanced service-to-service communication

### Technology Evolution

**Frontend Evolution:**
- **React Server Components**: Increased server-side rendering
- **Edge Computing**: More edge-side processing
- **Progressive Web App**: Enhanced mobile experience
- **WebAssembly**: Performance-critical computations

**Backend Evolution:**
- **GraphQL**: More efficient data fetching
- **Event Sourcing**: Audit trail and replay capability
- **CQRS**: Read/write model separation
- **Distributed Tracing**: End-to-end request tracking

## Architecture Governance

### Design Principles

1. **Simplicity**: Favor simple solutions over complex ones
2. **Consistency**: Standardized patterns and conventions
3. **Scalability**: Design for growth from day one
4. **Security**: Security-first approach to all decisions
5. **Performance**: Optimize for user experience

### Code Quality Standards

- **TypeScript**: Strict mode with comprehensive type coverage
- **ESLint**: Custom rules for design system compliance
- **Testing**: Minimum 80% coverage for critical paths
- **Documentation**: Auto-generated API documentation
- **Reviews**: Peer review for all architectural changes

### Decision Framework

**Architecture Decision Records (ADRs):**
- Document all significant architectural decisions
- Include rationale, alternatives, and consequences
- Regular review and update process
- Team consensus on major changes

This architecture provides a solid foundation for scaling the Infin8Content platform while maintaining security, performance, and developer productivity.
