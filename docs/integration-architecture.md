# Integration Architecture

**Generated**: 2026-01-21  
**Project**: Infin8Content  
**Type**: Multi-part Monorepo Integration

---

## Overview

Infin8Content is organized as a monorepo with three distinct parts that work together to form a complete AI-powered content generation platform.

## Repository Structure

```
/home/dghost/Infin8Content/
├── infin8content/          # Main Web Application (Part: infin8content)
│   ├── app/               # Next.js 16 App Router
│   ├── components/       # React 19 UI Components
│   ├── lib/              # Core Business Logic
│   └── services/         # External API Integrations
├── tools/                 # Development Utilities (Part: tools)
│   ├── compliance-dashboard/
│   ├── compliance-validator/
│   └── eslint-plugin-design-system/
└── _bmad/                # BMad Framework (Part: _bmad)
    ├── bmb/              # BMad Builder
    ├── bmm/              # BMad Manager
    └── core/             # Core Framework
```

## Part Descriptions

### 1. infin8content (Web Application)
- **Type**: Next.js 16.1.1 + React 19.2.3 Web Application
- **Purpose**: Main SaaS platform for AI content generation
- **Technology**: TypeScript, Tailwind CSS 4, Supabase, Stripe
- **Testing**: Vitest + Playwright

### 2. tools (Development Utilities)
- **Type**: JavaScript/TypeScript Utility Library
- **Purpose**: Development tools and compliance checking
- **Components**:
  - Compliance Dashboard (React)
  - Compliance Validator (Node.js)
  - ESLint Design System Plugin

### 3. _bmad (BMad Framework)
- **Type**: Workflow Framework
- **Purpose**: AI-assisted development methodology
- **Components**: Builder, Manager, Core workflows

## Integration Points

### Internal Communication Patterns

#### 1. Component Imports (infin8content)
The main application uses standard React import patterns:

```typescript
// Cross-component imports
import { OptimizedImage } from '../../ui/optimized-image'
import { useMobilePerformance } from '../../../hooks/use-mobile-performance'

// Service layer imports
import { articleService } from '../article-service'
import { researchCache } from '@/lib/research/research-cache'
```

#### 2. Service Layer Architecture
- **Research Services**: Batch optimization, caching, real-time research
- **Article Generation**: Outline generation, section processing
- **SEO Services**: Performance testing, validation, scoring
- **Dashboard Services**: Real-time updates, bulk operations

#### 3. External API Integrations
- **Supabase**: Database and authentication (server-side)
- **Stripe**: Payment processing (client + server)
- **OpenRouter**: AI content generation
- **Tavily**: Research and keyword analysis
- **DataForSEO**: SEO data services
- **Brevo**: Email notifications

### Data Flow Architecture

#### 1. Content Generation Pipeline
```
User Request → Research Service → Article Service → Generation Queue → Real-time Updates → Dashboard
```

#### 2. Real-time Communication
- **Supabase Real-time Subscriptions**: Dashboard updates
- **React Context**: State management
- **Server-sent Events**: Progress tracking

#### 3. Payment Workflow
```
Stripe Checkout → Webhook → Supabase → Access Control → Feature Unlock
```

## Inter-part Dependencies

### tools → infin8content
- **ESLint Plugin**: Enforces design system patterns
- **Compliance Tools**: Validate code quality and standards

### _bmad → infin8content
- **Workflow Management**: Story tracking and development guidance
- **Documentation Templates**: Standardized project documentation
- **AI Agent Coordination**: Development workflow automation

### infin8content → External Services
- **Database**: Supabase for all data persistence
- **Authentication**: Supabase Auth + Stripe customer linking
- **File Storage**: Supabase Storage for generated content
- **Background Jobs**: Inngest for async processing

## Shared Infrastructure

### 1. Development Environment
- **Node.js 20**: Runtime environment
- **TypeScript 5**: Type safety across all parts
- **ESLint + Prettier**: Code formatting and standards

### 2. CI/CD Pipeline
- **GitHub Actions**: Automated testing and builds
- **Branch Strategy**: `test-main-all`, `sm-*` for sprint work
- **Build Process**: Type checking → Build → CI Gate

### 3. Environment Configuration
- **Supabase**: Database, auth, storage, real-time
- **Stripe**: Payment processing and webhooks
- **Monitoring**: Sentry for error tracking
- **Logging**: Winston with structured logging

## Security Architecture

### 1. Authentication Flow
```
Supabase Auth → Session Management → Row Level Security → API Access Control
```

### 2. Payment Security
```
Stripe Checkout → Webhook Verification → Service Role Key → Database Update
```

### 3. Data Protection
- **Row Level Security (RLS)**: Database-level access control
- **Service Role Keys**: Server-side API access
- **Environment Variables**: Sensitive configuration protection

## Performance Architecture

### 1. Frontend Optimization
- **React 19**: Latest performance features
- **Code Splitting**: Route-based component loading
- **Image Optimization**: Next.js Image component + custom optimization
- **Mobile Performance**: Touch optimization and network throttling

### 2. Backend Performance
- **Supabase**: Optimized queries and connection pooling
- **Caching**: Research cache and API response caching
- **Batch Processing**: Research optimization and bulk operations
- **Real-time Updates**: Efficient subscription management

### 3. Monitoring and Observability
- **Sentry**: Error tracking and performance monitoring
- **Custom Metrics**: Business KPI tracking
- **Performance Testing**: Automated performance regression testing

## Deployment Architecture

### 1. Application Deployment
- **Vercel**: Primary hosting platform (recommended)
- **Next.js Build**: Optimized production builds
- **Environment Management**: Separate staging and production configs

### 2. Database Deployment
- **Supabase Hosted**: Managed PostgreSQL service
- **Migrations**: Version-controlled schema changes
- **Backups**: Automated backup and point-in-time recovery

### 3. External Service Dependencies
- **Stripe**: Payment infrastructure (high availability)
- **OpenRouter**: AI model routing and load balancing
- **Tavily/DataForSEO**: Research API services with fallbacks

## Integration Testing Strategy

### 1. Unit Testing
- **Vitest**: Fast unit tests for business logic
- **Component Testing**: React component behavior
- **Service Testing**: API integration mocking

### 2. Integration Testing
- **Playwright**: End-to-end user workflows
- **API Testing**: External service integration
- **Database Testing**: Schema and RLS validation

### 3. Performance Testing
- **Mobile Performance**: Touch and network optimization
- **Load Testing**: Concurrent user simulation
- **Visual Regression**: UI consistency validation

## Future Integration Points

### 1. Microservices Evolution
- **Article Generation Service**: Dedicated processing service
- **Research Service**: Standalone research optimization
- **Analytics Service**: Separate metrics and reporting

### 2. External Integrations
- **Project Management**: Jira, Asana, Trello integrations
- **Content Management**: WordPress, Webflow, CMS connectors
- **Analytics**: Google Analytics, Mixpanel, custom dashboards

### 3. Enterprise Features
- **SSO Integration**: SAML, OAuth providers
- **Advanced Security**: 2FA, audit logging, compliance reporting
- **Multi-region Deployment**: Global content generation and caching

---

**Integration Health**: ✅ All parts properly integrated  
**Communication Patterns**: Standard React/Node.js patterns  
**Data Flow**: Unidirectional with real-time updates  
**Security**: Multi-layered with RLS and service role separation  
**Performance**: Optimized with caching and batch processing
