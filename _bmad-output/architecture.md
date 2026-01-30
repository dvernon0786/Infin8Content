# Architecture Documentation - Infin8Content

## Executive Summary

Infin8Content is a modern AI-powered content creation platform built on Next.js 16.1.1 with TypeScript, designed as a multi-tenant SaaS application. The architecture follows a layered component-based approach with strong separation of concerns, comprehensive security measures, and scalable design patterns.

**Key Architectural Characteristics:**
- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript 5 with strict mode
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with OTP verification
- **Payment**: Stripe integration with subscription management
- **AI Services**: OpenRouter API for content generation
- **Background Processing**: Inngest for async job processing
- **Testing**: Vitest (unit) + Playwright (E2E)

## Technology Stack

### Frontend Stack
- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4 with custom design tokens
- **Component Library**: Radix UI primitives
- **State Management**: React Context + custom hooks
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Backend Stack
- **Runtime**: Node.js 20
- **API**: Next.js API Routes with TypeScript
- **Database**: Supabase PostgreSQL
- **ORM**: Supabase client (type-safe)
- **Authentication**: Supabase Auth
- **Background Jobs**: Inngest
- **File Storage**: Supabase Storage

### External Services
- **Payment**: Stripe (subscriptions, webhooks)
- **Email**: Brevo (transactional emails, OTP)
- **AI**: OpenRouter (content generation)
- **Research**: Tavily AI (keyword research)
- **SEO**: DataForSEO (SERP analysis)
- **Monitoring**: Sentry (error tracking)

### Development Tools
- **Testing**: Vitest (unit/integration) + Playwright (E2E)
- **Linting**: ESLint 9 with Next.js config
- **Type Checking**: TypeScript 5 strict mode
- **Component Development**: Storybook
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel

## Architecture Patterns

### 1. Multi-Tenant SaaS Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Authentication  │  Authorization  │  Multi-tenancy         │
│  (Supabase Auth) │  (RLS Policies) │  (Organization Scoping)│
├─────────────────────────────────────────────────────────────┤
│                    Business Logic Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Article Generation  │  Payment Processing  │  Team Mgmt    │
│  (AI Pipeline)       │  (Stripe Integration) │  (Roles)      │
├─────────────────────────────────────────────────────────────┤
│                    Data Access Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Database Client  │  Type Safety  │  Connection Pooling    │
│  (Supabase SSR)   │  (TypeScript) │  (Optimized Queries)   │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL)  │  Background Jobs  │  File Storage  │
│  (Supabase)             │  (Inngest)         │  (Supabase)    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Component-Based Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Marketing Pages  │  Dashboard  │  Settings  │  Admin Panel   │
├─────────────────────────────────────────────────────────────┤
│                    Component Library                          │
├─────────────────────────────────────────────────────────────┤
│  UI Components  │  Business Components  │  Layout Components │
├─────────────────────────────────────────────────────────────┤
│                    Custom Hooks                               │
├─────────────────────────────────────────────────────────────┤
│  State Management  │  API Integration  │  Utilities         │
└─────────────────────────────────────────────────────────────┘
```

### 3. Service-Oriented Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                               │
├─────────────────────────────────────────────────────────────┤
│  Authentication  │  Articles  │  Organizations  │  Payments   │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                              │
├─────────────────────────────────────────────────────────────┤
│  Article Service  │  User Service  │  Payment Service       │
├─────────────────────────────────────────────────────────────┤
│                    External Services                          │
├─────────────────────────────────────────────────────────────┤
│  OpenRouter  │  Stripe  │  Brevo  │  Tavily  │  DataForSEO  │
└─────────────────────────────────────────────────────────────┘
```

## Data Architecture

### Database Schema Design
```sql
-- Multi-tenant core structure
users (id, email, profile_data)
└── organization_members (user_id, organization_id, role)
    └── organizations (id, name, plan, settings)
        ├── articles (id, keyword, content, status)
        ├── usage_tracking (id, metric_type, usage_count)
        ├── audit_logs (id, action, details, user_id)
        └── team_invites (id, email, role, token)
```

### Data Flow Patterns
1. **User Request Flow**: API Route → Service Layer → Database → Response
2. **Article Generation Flow**: User Input → Queue → Background Job → AI Service → Database Update
3. **Payment Flow**: Stripe Webhook → Payment Service → Database Update → User Notification

### Security Model
- **Row Level Security (RLS)**: All tables scoped to organization_id
- **Authentication**: JWT tokens with Supabase Auth
- **Authorization**: Role-based access control (admin, member, viewer)
- **Audit Trail**: Comprehensive logging of all user actions
- **Input Validation**: Zod schemas for all API inputs

## API Design

### RESTful API Structure
```
/api/auth/           # Authentication endpoints
/api/articles/       # Article management
/api/organizations/  # Organization management
/api/payment/        # Payment processing
/api/team/          # Team collaboration
/api/analytics/     # Analytics and reporting
/api/research/      # Keyword research
/api/seo/          # SEO tools
/api/admin/        # Administrative functions
```

### API Design Principles
- **Consistent Responses**: Standardized success/error formats
- **Type Safety**: Full TypeScript coverage
- **Validation**: Zod schema validation for all inputs
- **Error Handling**: Comprehensive error responses with codes
- **Rate Limiting**: Endpoint-specific rate limits
- **Security**: Authentication middleware on all protected routes

### Response Format Standards
```typescript
// Success Response
{
  success: true;
  data: T;
  message?: string;
}

// Error Response
{
  success: false;
  error: string;
  code: string;
  details?: any;
}
```

## Component Architecture

### Component Hierarchy
```
App Layout
├── Navigation
├── Marketing Pages
│   ├── Hero Section
│   ├── Feature Showcase
│   └── Testimonials
├── Dashboard
│   ├── Sidebar Navigation
│   ├── Article Management
│   ├── Analytics Views
│   └── Settings Panels
└── Authentication Pages
    ├── Login Form
    ├── Register Form
    └── OTP Verification
```

### Component Design Patterns
1. **Atomic Design**: Atoms → Molecules → Organisms → Templates → Pages
2. **Composition over Inheritance**: Prefer component composition
3. **Props Interface Design**: Clear TypeScript interfaces
4. **State Management**: Local state + React Context for global state
5. **Custom Hooks**: Extract complex logic into reusable hooks

### UI Component Library
- **Base Components**: Button, Input, Modal, etc. (Radix UI)
- **Business Components**: ArticleCard, UserAvatar, etc.
- **Layout Components**: Container, Grid, Stack, etc.
- **Form Components**: FormField, Select, DatePicker, etc.

## Development Workflow Architecture

### Code Organization
```
src/
├── app/                 # Next.js App Router
├── components/          # React components
├── lib/                # Core business logic
├── __tests__/          # Unit/integration tests
├── tests/              # E2E tests
└── types/              # TypeScript definitions
```

### Development Patterns
1. **Feature-Based Development**: Organize by feature, not file type
2. **Test-Driven Development**: Write tests before implementation
3. **Type-First Development**: TypeScript interfaces first
4. **Component-Driven Development**: Build reusable components
5. **Service Layer Pattern**: Separate business logic from UI

### Quality Assurance
- **Unit Tests**: 90%+ coverage target
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Critical user journey testing
- **Contract Tests**: External service integration
- **Performance Tests**: Load and response time testing
- **Accessibility Tests**: WCAG AA compliance

## Deployment Architecture

### Production Environment
```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Platform                           │
├─────────────────────────────────────────────────────────────┤
│  Next.js Application  │  Edge Functions  │  Static Assets   │
├─────────────────────────────────────────────────────────────┤
│                    Supabase Platform                         │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database  │  Authentication  │  File Storage    │
├─────────────────────────────────────────────────────────────┤
│                    External Services                         │
├─────────────────────────────────────────────────────────────┤
│  Stripe  │  OpenRouter  │  Brevo  │  Inngest  │  Sentry     │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline
```yaml
# GitHub Actions Workflow
1. Code Checkout
2. Node.js Setup (v20)
3. Dependency Installation
4. Type Checking (tsc --noEmit)
5. Linting (ESLint)
6. Unit Tests (Vitest)
7. Integration Tests
8. Build Application
9. Deploy to Vercel
```

### Environment Management
- **Development**: Local development with Supabase local
- **Staging**: Vercel preview deployments
- **Production**: Vercel production with Supabase prod

## Performance Architecture

### Frontend Performance
- **Code Splitting**: Dynamic imports for large components
- **Image Optimization**: Next.js Image component
- **Bundle Optimization**: Tree shaking and minification
- **Caching Strategy**: HTTP caching headers
- **CDN Integration**: Vercel Edge Network

### Backend Performance
- **Database Optimization**: Indexed queries, connection pooling
- **API Caching**: Response caching where appropriate
- **Background Processing**: Async job processing with Inngest
- **Rate Limiting**: Prevent abuse and ensure stability
- **Monitoring**: Performance metrics and alerting

### Scalability Considerations
- **Horizontal Scaling**: Vercel auto-scaling
- **Database Scaling**: Supabase connection pooling
- **File Storage**: Supabase Storage with CDN
- **Job Processing**: Inngest distributed processing
- **Monitoring**: Real-time performance tracking

## Security Architecture

### Authentication & Authorization
```
User Login → Supabase Auth → JWT Token → API Middleware → Route Access
```

### Security Layers
1. **Network Security**: HTTPS only, secure headers
2. **Authentication**: Supabase Auth with OTP
3. **Authorization**: Role-based access control
4. **Data Security**: RLS policies, encryption at rest
5. **API Security**: Input validation, rate limiting
6. **Audit Security**: Comprehensive logging

### Compliance Features
- **GDPR Compliance**: Data portability, right to deletion
- **Data Encryption**: At rest and in transit
- **Privacy Controls**: User consent management
- **Audit Trail**: Complete action logging

## Monitoring & Observability

### Error Tracking
- **Sentry Integration**: Error capture and reporting
- **Performance Monitoring**: Response time tracking
- **User Session Tracking**: User journey analysis
- **Custom Metrics**: Business-specific KPIs

### Health Monitoring
- **Database Health**: Connection status, query performance
- **API Health**: Endpoint response times, error rates
- **Background Job Health**: Queue status, processing times
- **External Service Health**: Third-party service availability

### Analytics & Business Intelligence
- **User Analytics**: User behavior and engagement
- **Performance Analytics**: System performance metrics
- **Business Analytics**: Revenue, usage, growth metrics
- **Custom Dashboards**: Role-specific analytics views

## Integration Architecture

### External Service Integration
```
Application → Service Layer → External APIs → Response Processing
```

### Integration Patterns
1. **Payment Integration**: Stripe webhooks for real-time updates
2. **AI Integration**: OpenRouter API with fallback mechanisms
3. **Email Integration**: Brevo for transactional emails
4. **Research Integration**: Tavily AI for keyword research
5. **SEO Integration**: DataForSEO for SERP analysis

### Integration Best Practices
- **Circuit Breakers**: Prevent cascade failures
- **Retry Logic**: Handle temporary failures
- **Rate Limiting**: Respect external service limits
- **Error Handling**: Graceful degradation
- **Monitoring**: Track integration health

## Future Architecture Considerations

### Scalability Roadmap
1. **Microservices Migration**: Consider service decomposition
2. **Event-Driven Architecture**: Enhanced async processing
3. **Multi-Region Deployment**: Global performance optimization
4. **Advanced Caching**: Redis implementation
5. **Real-time Features**: WebSocket implementation

### Technology Evolution
1. **AI Integration**: Enhanced AI capabilities
2. **Mobile Application**: React Native development
3. **Advanced Analytics**: Custom analytics platform
4. **API Platform**: Public API development
5. **Enterprise Features**: Advanced security and compliance

## Architecture Decision Records

### Key Decisions
1. **Next.js App Router**: Chosen for performance and developer experience
2. **Supabase**: Selected for integrated database and auth solution
3. **TypeScript**: Strict typing for code quality and maintainability
4. **Tailwind CSS**: Utility-first CSS for rapid development
5. **Vitest**: Modern testing framework with TypeScript support

### Rationale
- **Developer Experience**: Tools chosen for productivity
- **Performance**: Architecture optimized for speed
- **Scalability**: Design supports future growth
- **Security**: Multi-layered security approach
- **Maintainability**: Clean code principles and patterns

This architecture documentation provides a comprehensive overview of the Infin8Content platform's design, from high-level system architecture to detailed implementation patterns. The architecture is designed to be scalable, maintainable, and secure while providing excellent developer experience and user performance.
