# Project Documentation Index

**Project:** Infin8Content  
**Type:** Monolith - Web Application (Next.js)  
**Primary Language:** TypeScript  
**Architecture:** Component-based with API Routes  
**Generated:** 2026-01-12 (Updated)

## Quick Reference

### Tech Stack
- **Framework:** Next.js 16.1.1 (App Router)
- **Language:** TypeScript 5
- **UI Library:** React 19.2.3
- **Styling:** Tailwind CSS 4
- **Database:** Supabase PostgreSQL (17 migrations)
- **Authentication:** Supabase Auth with OTP
- **Email Service:** Brevo
- **Payment Processing:** Stripe
- **Background Jobs:** Inngest
- **Testing:** Vitest + Playwright

### Entry Points
- **Application:** `app/page.tsx` - Home page
- **API Routes:** `app/api/` - 10 API modules (auth, articles, organizations, payment, team, user, admin, research, webhooks, inngest)
- **Middleware:** `app/middleware.ts` - Route protection
- **Database:** `supabase/migrations/` - 17 migration files

### Architecture Pattern
Component-based architecture with Next.js API Routes (serverless functions)

## Generated Documentation

### Core Documentation

- [Project Overview](./project-overview.md) - Executive summary, tech stack, and key features
- [Architecture](./architecture.md) - Complete system architecture documentation
- [Source Tree Analysis](./source-tree-analysis.md) - Annotated directory structure with explanations
- [API Contracts](./api-contracts.md) - RESTful API endpoints and contracts
- [Data Models](./data-models.md) - Database schema, tables, and relationships
- [Development Guide](./development-guide.md) - Setup, build, and development instructions

## Existing Documentation

The following documentation files were found in the project:

- [README.md](../infin8content/README.md) - Project overview and getting started guide
- [SUPABASE_SETUP.md](../infin8content/SUPABASE_SETUP.md) - Supabase configuration instructions
- [MIGRATION_INSTRUCTIONS.md](../infin8content/MIGRATION_INSTRUCTIONS.md) - Database migration guide

## Getting Started

### For New Developers

1. **Read:** [Project Overview](./project-overview.md) - Understand the project structure
2. **Setup:** [Development Guide](./development-guide.md) - Install dependencies and configure environment
3. **Database:** [MIGRATION_INSTRUCTIONS.md](../infin8content/MIGRATION_INSTRUCTIONS.md) - Set up database schema
4. **Architecture:** [Architecture](./architecture.md) - Understand system design

### For AI-Assisted Development

When working on features, reference:

- **UI Features:** [Architecture](./architecture.md) + [Source Tree Analysis](./source-tree-analysis.md)
- **API Features:** [API Contracts](./api-contracts.md) + [Data Models](./data-models.md)
- **Database Changes:** [Data Models](./data-models.md) + [Development Guide](./development-guide.md)
- **Full-Stack Features:** [Architecture](./architecture.md) + [API Contracts](./api-contracts.md) + [Data Models](./data-models.md)

## Project Structure Summary

```
infin8content/
├── app/                    # Next.js App Router (routes, pages, API)
│   ├── (auth)/            # Authentication pages
│   ├── api/               # API route handlers
│   └── middleware.ts      # Route protection
├── lib/                    # Shared utilities and services
│   ├── services/         # External service clients
│   └── supabase/        # Supabase client libraries
├── supabase/              # Database migrations and config
└── public/                # Static assets
```

## Key Features

1. **User Registration** - Email/password with OTP verification
2. **Multi-tenant Support** - Organizations and users with RBAC
3. **Article Management** - Content creation, outlines, progress tracking
4. **Keyword Research** - Tavily integration for research caching
5. **Payment Processing** - Stripe integration with multiple plans
6. **Team Collaboration** - Invitations, role management
7. **Audit Logging** - Comprehensive activity tracking
8. **Background Processing** - Inngest for async operations

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/resend-otp` - Resend OTP code

See [API Contracts](./api-contracts.md) for detailed documentation.

## Database Schema

**Tables:**
- `organizations` - Multi-tenant organization data
- `users` - User accounts with RBAC roles
- `otp_codes` - Temporary OTP storage

See [Data Models](./data-models.md) for complete schema documentation.

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
npm test         # Run tests
```

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `BREVO_API_KEY` - Brevo email service API key
- `NEXT_PUBLIC_APP_URL` - Application base URL
- `DATABASE_URL` - PostgreSQL connection string

See [SUPABASE_SETUP.md](../infin8content/SUPABASE_SETUP.md) for setup instructions.

## Next Steps

1. Review the [Architecture](./architecture.md) to understand system design
2. Check [Development Guide](./development-guide.md) for setup instructions
3. Explore [API Contracts](./api-contracts.md) for endpoint documentation
4. Review [Data Models](./data-models.md) for database schema

---

**Note:** This documentation was generated using the document-project workflow (Quick Scan mode). For deeper analysis, consider running the workflow with Deep or Exhaustive scan levels.

