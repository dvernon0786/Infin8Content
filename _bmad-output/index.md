# Infin8Content - Project Documentation Index

## Project Overview

**Type:** Monolith Web Application  
**Primary Language:** TypeScript  
**Architecture:** Layered Component-Based  
**Framework:** Next.js 16.1.1

### Quick Reference

- **Tech Stack:** Next.js 16.1.1, React 19.2.3, TypeScript 5, Tailwind CSS 4
- **Database:** Supabase PostgreSQL with RLS
- **Authentication:** Supabase Auth with OTP
- **Payment:** Stripe subscription management
- **AI Services:** OpenRouter API integration
- **Background Jobs:** Inngest for async processing
- **Testing:** Vitest (unit) + Playwright (E2E)

## Generated Documentation

### Core Documentation
- [Project Overview](./project-overview.md) - Executive summary and business context
- [Architecture](./architecture.md) - System architecture and design patterns
- [Source Tree Analysis](./source-tree-analysis.md) - Complete codebase structure
- [Development Guide](./development-guide.md) - Setup and development workflow

### Technical Documentation
- [API Contracts](./api-contracts.md) - Complete API endpoint documentation
- [Data Models](./data-models.md) - Database schema and relationships

### Existing Documentation (Referenced)
- [Main README](../infin8content/README.md) - Project setup and getting started
- [Architecture Docs](../docs/architecture.md) - Original architecture documentation
- [API Documentation](../docs/api-contracts.md) - Original API documentation
- [Development Guide](../docs/development-guide.md) - Original development guide

## Project Structure

```
infin8content/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   ├── api/                      # API routes (71 endpoints)
│   ├── dashboard/               # Main dashboard
│   └── [other pages]/           # Marketing and admin pages
├── components/                   # React components
│   ├── marketing/               # Landing page components
│   ├── dashboard/              # Dashboard components
│   ├── analytics/              # Analytics components
│   └── ui/                     # Base UI components
├── lib/                         # Core business logic
│   ├── article-generation/     # AI content generation
│   ├── services/               # Business services
│   ├── supabase/               # Database layer
│   └── utils/                  # Utility functions
├── __tests__/                   # Unit and integration tests
├── tests/                       # E2E tests
└── public/                      # Static assets
```

## Technology Stack

### Frontend
- **Framework:** Next.js 16.1.1 (App Router)
- **Language:** TypeScript 5 (strict mode)
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS 4 with custom design tokens
- **Components:** Radix UI primitives
- **State Management:** React Context + custom hooks

### Backend
- **Runtime:** Node.js 20
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth with OTP
- **API:** Next.js API Routes with TypeScript
- **Background Jobs:** Inngest
- **File Storage:** Supabase Storage

### External Services
- **Payment:** Stripe (subscriptions, webhooks)
- **Email:** Brevo (transactional emails, OTP)
- **AI:** OpenRouter (content generation)
- **Research:** Tavily AI (keyword research)
- **SEO:** DataForSEO (SERP analysis)
- **Monitoring:** Sentry (error tracking)

### Development Tools
- **Testing:** Vitest (unit/integration) + Playwright (E2E)
- **Linting:** ESLint 9 with Next.js config
- **Component Development:** Storybook
- **CI/CD:** GitHub Actions
- **Deployment:** Vercel

## Key Features

### Core Functionality
- **AI Article Generation:** Multi-stage content creation pipeline
- **SEO Optimization:** Integrated keyword research and optimization
- **Team Collaboration:** Multi-user workspaces with role-based access
- **Publishing Integration:** One-click WordPress publishing
- **Analytics Dashboard:** Comprehensive content performance tracking

### Business Features
- **Multi-Tenant Architecture:** Organization-based data isolation
- **Subscription Management:** Stripe-powered billing system
- **Usage Tracking:** Plan-based limits and monitoring
- **Audit Logging:** Complete activity trail for compliance

## Development Workflow

### Getting Started
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd Infin8Content/infin8content
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Configure environment variables
   ```

4. **Database Setup**
   ```bash
   supabase start  # Local development
   supabase db reset
   npx tsx scripts/generate-types.ts
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

### Development Commands
```bash
# Core commands
npm run dev          # Development server
npm run build        # Production build
npm run test         # Unit tests
npm run test:e2e     # E2E tests
npm run typecheck    # TypeScript checking
npm run lint         # Code linting

# Storybook
npm run storybook    # Component development

# Testing
npm run test:ui      # Test UI
npm run test:contracts  # Contract tests
npm run test:integration  # Integration tests
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/logout` - User logout

### Articles
- `POST /api/articles/generate` - Generate article
- `GET /api/articles/[id]/status` - Get generation status
- `POST /api/articles/[id]/publish` - Publish article
- `GET /api/articles/queue` - Get article queue
- `POST /api/articles/bulk` - Bulk operations

### Organizations
- `GET /api/organizations` - Get user organizations
- `POST /api/organizations` - Create organization
- `PUT /api/organizations/[id]` - Update organization

### Payment
- `POST /api/payment/create-checkout` - Create checkout session
- `POST /api/payment/webhooks` - Handle webhooks

### Team Management
- `GET /api/team/members` - Get team members
- `POST /api/team/invite` - Invite team member
- `PUT /api/team/members/[id]/role` - Update member role

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/usage` - Usage statistics

### Research
- `POST /api/research/keyword` - Keyword research
- `GET /api/research/suggestions` - Keyword suggestions

### SEO
- `GET /api/seo/metrics` - SEO metrics
- `POST /api/seo/optimize` - SEO optimization

### Admin
- `GET /api/admin/system` - System health
- `POST /api/admin/maintenance` - Maintenance operations

## Database Schema

### Core Tables
- **users** - User accounts and authentication
- **organizations** - Multi-tenant organization data
- **organization_members** - User-organization relationships
- **articles** - Article content and metadata
- **publish_references** - External CMS publishing tracking
- **usage_tracking** - Usage metrics and billing data
- **audit_logs** - Comprehensive audit trail
- **team_invites** - Team member invitations

### Supporting Tables
- **keyword_research** - Keyword research data
- **seo_metrics** - SEO performance tracking
- **analytics_recommendations** - Analytics recommendations

## Security Features

### Authentication & Authorization
- **Multi-Factor Authentication:** OTP-based verification
- **Role-Based Access Control:** Admin, Member, Viewer roles
- **Session Management:** Secure JWT token handling
- **Password Security:** Bcrypt hashing with salt

### Data Protection
- **Row Level Security:** Organization-based data isolation
- **Encryption:** AES-256 at rest and in transit
- **Input Validation:** Zod schema validation
- **SQL Injection Prevention:** Parameterized queries

### Compliance
- **GDPR Compliance:** Data portability and deletion rights
- **Audit Trail:** Complete user action logging
- **Privacy Controls:** User consent management
- **Data Minimization:** Collect only necessary data

## Performance Optimization

### Frontend Optimization
- **Code Splitting:** Dynamic imports for large components
- **Image Optimization:** Next.js Image component
- **Bundle Optimization:** Tree shaking and minification
- **Caching Strategy:** HTTP caching headers
- **CDN Integration:** Vercel Edge Network

### Backend Optimization
- **Database Optimization:** Indexed queries, connection pooling
- **API Caching:** Response caching where appropriate
- **Background Processing:** Async job processing with Inngest
- **Rate Limiting:** Prevent abuse and ensure stability

### Monitoring
- **Error Tracking:** Sentry integration
- **Performance Monitoring:** Response time tracking
- **Health Checks:** System health monitoring
- **Custom Metrics:** Business-specific KPIs

## Testing Strategy

### Test Coverage
- **Unit Tests:** 90%+ coverage target (Vitest)
- **Integration Tests:** API endpoint testing
- **E2E Tests:** Critical user journey testing (Playwright)
- **Contract Tests:** External service integration
- **Performance Tests:** Load and response time testing
- **Accessibility Tests:** WCAG AA compliance

### Test Categories
- **API Testing:** All endpoints covered
- **Component Testing:** React components tested
- **Service Testing:** Business logic tested
- **Database Testing:** Schema and migrations tested
- **Integration Testing:** End-to-end workflows tested

## Deployment

### Production Environment
- **Platform:** Vercel (Next.js optimized)
- **Database:** Supabase (PostgreSQL)
- **CDN:** Vercel Edge Network
- **Monitoring:** Sentry error tracking
- **Analytics:** Custom metrics dashboard

### CI/CD Pipeline
```yaml
1. Code Checkout
2. Node.js Setup (v20)
3. Dependency Installation
4. Type Checking
5. Linting
6. Unit Tests
7. Integration Tests
8. Build Application
9. Deploy to Vercel
```

### Environment Management
- **Development:** Local development with Supabase local
- **Staging:** Vercel preview deployments
- **Production:** Vercel production with Supabase prod

## Support & Resources

### Documentation
- **API Documentation:** Complete endpoint reference
- **Component Library:** Storybook for UI components
- **Database Schema:** Complete table documentation
- **Development Guide:** Setup and workflow instructions

### Tools & Resources
- **Next.js Documentation:** [https://nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Documentation:** [https://supabase.com/docs](https://supabase.com/docs)
- **Tailwind CSS:** [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Radix UI:** [https://www.radix-ui.com/](https://www.radix-ui.com/)

### Community & Support
- **GitHub Repository:** Issue tracking and discussions
- **Development Team:** Direct contact for technical issues
- **Documentation:** Comprehensive guides and examples
- **Status Page:** System health and uptime monitoring

## Getting Help

### Common Issues
1. **Environment Variables:** Check .env.local configuration
2. **Database Connection:** Verify Supabase connection
3. **Type Errors:** Run npm run typecheck
4. **Test Failures:** Check test setup and mocks

### Support Channels
- **Documentation:** Check existing docs first
- **GitHub Issues:** Report bugs and feature requests
- **Development Team:** Technical support and guidance
- **Community Forums:** User discussions and help

---

*This documentation index provides a comprehensive overview of the Infin8Content platform. For detailed technical information, refer to the specific documentation files linked above.*

**Last Updated:** January 27, 2026  
**Documentation Version:** 1.0.0  
**Project Version:** v0.1.0
