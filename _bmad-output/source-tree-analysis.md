# Source Tree Analysis

**Project:** Infin8Content  
**Root:** `infin8content/`  
**Generated:** 2026-01-04

## Annotated Directory Tree

```
infin8content/
├── app/                          # Next.js App Router directory
│   ├── (auth)/                   # Route group for authentication pages
│   │   ├── register/
│   │   │   └── page.tsx          # User registration page
│   │   └── verify-email/
│   │       └── page.tsx          # OTP verification page
│   ├── api/                      # API route handlers
│   │   └── auth/
│   │       ├── register/
│   │       │   ├── route.ts      # POST /api/auth/register
│   │       │   └── route.test.ts # Registration endpoint tests
│   │       ├── resend-otp/
│   │       │   └── route.ts      # POST /api/auth/resend-otp
│   │       └── verify-otp/
│   │           └── route.ts      # POST /api/auth/verify-otp
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # Supabase Auth callback handler
│   ├── favicon.ico               # Site favicon
│   ├── globals.css                # Global styles (Tailwind)
│   ├── layout.tsx                 # Root layout component
│   ├── middleware.ts              # Next.js middleware (auth protection)
│   └── page.tsx                   # Home page
│
├── lib/                           # Shared libraries and utilities
│   ├── services/
│   │   ├── brevo.ts               # Brevo email service client
│   │   └── otp.ts                 # OTP generation and validation utilities
│   └── supabase/
│       ├── client.ts              # Browser Supabase client
│       ├── database.types.ts      # Generated TypeScript types from DB schema
│       ├── env.ts                 # Environment variable validation
│       ├── middleware.ts          # Supabase session refresh middleware
│       └── server.ts              # Server-side Supabase client
│
├── public/                        # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── scripts/                       # Utility scripts
│   ├── run-migration.sh           # Migration execution script
│   ├── validate-supabase-connection.js
│   └── validate-supabase.js
│
├── supabase/                      # Supabase configuration and migrations
│   ├── config.toml                # Supabase project configuration
│   └── migrations/                # Database migration files
│       ├── 20260101124156_initial_schema.sql
│       ├── 20260104095303_link_auth_users.sql
│       └── 20260104100500_add_otp_verification.sql
│
├── .env.local                     # Environment variables (gitignored)
├── eslint.config.mjs              # ESLint configuration
├── next.config.ts                  # Next.js configuration
├── next-env.d.ts                   # Next.js TypeScript declarations
├── package.json                    # Node.js dependencies and scripts
├── postcss.config.mjs              # PostCSS configuration (Tailwind)
├── README.md                       # Project documentation
├── SUPABASE_SETUP.md              # Supabase setup instructions
├── MIGRATION_INSTRUCTIONS.md       # Database migration guide
└── tsconfig.json                   # TypeScript configuration
```

## Critical Folders Explained

### `app/` - Application Routes
Next.js App Router directory containing all routes, pages, and API endpoints. Uses file-based routing where:
- `page.tsx` files define routes
- `route.ts` files define API endpoints
- `(auth)` is a route group (doesn't affect URL structure)

### `app/api/auth/` - Authentication API
RESTful API endpoints for user authentication:
- Registration with email validation
- OTP verification
- OTP resend functionality

### `lib/supabase/` - Supabase Integration
Client libraries for Supabase services:
- **client.ts**: Browser client for client-side operations
- **server.ts**: Server client for server-side operations (with cookies)
- **middleware.ts**: Session refresh for middleware
- **env.ts**: Environment variable validation on startup
- **database.types.ts**: Auto-generated TypeScript types from database schema

### `lib/services/` - External Service Integrations
Third-party service clients:
- **brevo.ts**: Email service for OTP delivery
- **otp.ts**: OTP code generation and validation utilities

### `supabase/migrations/` - Database Schema
Versioned database migrations:
- Initial schema (organizations, users tables)
- Auth user linking
- OTP verification system

## Entry Points

1. **Application Entry:** `app/page.tsx` - Home page rendered at `/`
2. **API Entry:** `app/api/auth/*` - REST endpoints for authentication
3. **Middleware Entry:** `app/middleware.ts` - Runs on every request for auth protection
4. **Database Entry:** `supabase/migrations/` - Schema definitions applied in order

## Integration Points

- **Supabase Auth** ↔ **Next.js Middleware**: Session management and route protection
- **API Routes** ↔ **Supabase Client**: Database operations via server client
- **Brevo Service** ↔ **OTP Service**: Email delivery for verification codes
- **Database Types** ↔ **TypeScript**: Type safety from schema to code

## File Patterns

- **Routes:** `app/**/page.tsx` - Page components
- **API:** `app/api/**/route.ts` - API route handlers
- **Services:** `lib/services/*.ts` - External service clients
- **Migrations:** `supabase/migrations/YYYYMMDDHHMMSS_*.sql` - Timestamped migrations
- **Config:** `*.config.ts`, `*.config.mjs` - Configuration files

