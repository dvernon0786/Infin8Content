# Project Overview - Infin8Content

**Generated:** 2026-01-12 (Updated)  
**Project Type:** Web Application (Next.js)  
**Repository Type:** Monolith  
**Architecture Pattern:** Full-stack web application with App Router

## Executive Summary

Infin8Content is a Next.js 16.1.1 web application built with TypeScript, implementing a multi-tenant SaaS platform for AI-powered content generation and research. The application has evolved to include comprehensive article management, keyword research, payment processing with Stripe, team collaboration, and advanced audit logging. The system uses Supabase for database and authentication, with OTP-based email verification via Brevo integration.

## Technology Stack Summary

| Category | Technology | Version | Justification |
|----------|-----------|---------|---------------|
| **Framework** | Next.js | 16.1.1 | React framework with App Router, SSR, and API routes |
| **Language** | TypeScript | ^5 | Type safety and developer experience |
| **UI Library** | React | 19.2.3 | Component-based UI framework |
| **Styling** | Tailwind CSS | ^4 | Utility-first CSS framework |
| **Database** | Supabase (PostgreSQL) | - | Managed PostgreSQL with Row Level Security |
| **Authentication** | Supabase Auth | - | Built-in authentication with OTP verification |
| **Email Service** | Brevo | ^3.0.1 | Transactional email for OTP delivery |
| **Validation** | Zod | ^4.3.4 | Schema validation for API requests |
| **Build Tool** | Next.js Built-in | - | Integrated bundling and optimization |
| **Linting** | ESLint | ^9 | Code quality and consistency |

## Architecture Type Classification

**Pattern:** Component-based architecture with API routes

- **Frontend:** Next.js App Router with React Server Components
- **Backend:** Next.js API Routes (serverless functions)
- **Database:** Supabase PostgreSQL with migrations
- **Authentication:** Supabase Auth with custom OTP flow
- **State Management:** Server Components + React Context (implicit)

## Repository Structure

**Type:** Monolith - Single cohesive codebase

The project follows Next.js App Router conventions:
- `app/` - Application routes and pages
- `app/api/` - API route handlers
- `lib/` - Shared utilities and services
- `supabase/` - Database migrations and configuration
- `public/` - Static assets

## Key Features

1. **User Registration** - Email/password registration with OTP verification
2. **Authentication** - Supabase Auth integration with middleware protection
3. **Multi-tenant Support** - Organizations and users with role-based access
4. **OTP Verification** - 6-digit OTP codes via Brevo email service
5. **Database Migrations** - Versioned schema migrations via Supabase

## Entry Points

- **Application:** `app/page.tsx` - Home page
- **API Routes:** `app/api/auth/*` - Authentication endpoints
- **Middleware:** `app/middleware.ts` - Route protection and session management
- **Database:** `supabase/migrations/` - Schema definitions

## Links to Detailed Documentation

- [Architecture Documentation](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)
- [Development Guide](./development-guide.md)

