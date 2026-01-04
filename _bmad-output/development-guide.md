# Development Guide

**Project:** Infin8Content  
**Generated:** 2026-01-04

## Prerequisites

- **Node.js:** v20.19.5 or higher (LTS recommended)
- **npm:** v10+ (comes with Node.js)
- **Supabase Account:** Free account at [supabase.com](https://supabase.com)
- **Brevo Account:** Free account at [brevo.com](https://brevo.com) for email service

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd infin8content
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
   BREVO_API_KEY=your-brevo-api-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   See [SUPABASE_SETUP.md](../infin8content/SUPABASE_SETUP.md) for detailed instructions.

## Local Development

### Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Environment Variable Validation

Environment variables are automatically validated on app startup. If any required variables are missing, the app will fail to start with a clear error message.

**Validation occurs in:**
- `lib/supabase/env.ts` - Supabase environment validation
- `app/middleware.ts` - Middleware startup validation

## Database Setup

### Option 1: Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click **SQL Editor**
3. Copy and paste migration files from `supabase/migrations/` in order
4. Run each migration

See [MIGRATION_INSTRUCTIONS.md](../infin8content/MIGRATION_INSTRUCTIONS.md) for detailed steps.

### Option 2: Supabase CLI

1. **Link your project:**
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

2. **Run migrations:**
   ```bash
   supabase migration up
   ```

3. **Generate TypeScript types:**
   ```bash
   supabase gen types typescript --project-id <your-project-ref> > lib/supabase/database.types.ts
   ```

### Option 3: Direct Database Connection

If you have `psql` installed:

```bash
psql "$DATABASE_URL" -f supabase/migrations/20260101124156_initial_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/20260104095303_link_auth_users.sql
psql "$DATABASE_URL" -f supabase/migrations/20260104100500_add_otp_verification.sql
```

## Build Process

### Development Build

```bash
npm run dev
```

- Hot module replacement enabled
- TypeScript type checking
- Fast refresh for React components

### Production Build

```bash
npm run build
```

- TypeScript compilation
- Next.js optimization
- Static page generation
- Bundle optimization

### Start Production Server

```bash
npm start
```

Runs the production build on port 3000 (default).

## Testing

### Run Tests

```bash
npm test
```

**Test Files:**
- `app/api/auth/register/route.test.ts` - Registration endpoint tests

### Linting

```bash
npm run lint
```

Uses ESLint with Next.js configuration.

## Common Development Tasks

### Adding a New API Route

1. Create file: `app/api/<route-name>/route.ts`
2. Export HTTP method handlers: `GET`, `POST`, `PUT`, `DELETE`, etc.
3. Use Zod for request validation
4. Use Supabase client for database operations

**Example:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = schema.parse(body);
  // ... implementation
  return NextResponse.json({ success: true });
}
```

### Adding a New Page

1. Create file: `app/<route-name>/page.tsx`
2. Export default React component
3. Use Server Components by default
4. Add `'use client'` directive for client-side interactivity

### Database Migrations

1. Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Use idempotent SQL (IF NOT EXISTS, DROP IF EXISTS, etc.)
3. Apply migration via Supabase Dashboard or CLI
4. Regenerate TypeScript types: `supabase gen types typescript ...`

### Environment Variables

1. Add variable to `.env.local` (development)
2. Add variable to Vercel project settings (production)
3. Validate in `lib/supabase/env.ts` if needed
4. Document in README or setup guide

## Project Structure

```
infin8content/
├── app/              # Next.js App Router (routes, pages, API)
├── lib/              # Shared utilities and services
│   ├── services/     # External service clients (Brevo, OTP)
│   └── supabase/     # Supabase client libraries
├── supabase/         # Database migrations and config
├── public/           # Static assets
└── scripts/          # Utility scripts
```

## Troubleshooting

### Environment Variables Not Loading

- Ensure `.env.local` exists in `infin8content/` directory
- Restart development server after adding variables
- Check variable names match exactly (case-sensitive)

### Database Connection Issues

- Verify `DATABASE_URL` uses connection pooler (port 6543) for IPv4 networks
- Check Supabase project is active (not paused)
- Verify database password is correct

### OTP Email Not Sending

- Verify `BREVO_API_KEY` is set correctly
- Check Brevo account has email sending enabled
- Verify `NEXT_PUBLIC_APP_URL` is set for email links

### TypeScript Errors

- Regenerate database types: `supabase gen types typescript ...`
- Clear Next.js cache: `rm -rf .next`
- Restart TypeScript server in IDE

## Related Documentation

- [README.md](../infin8content/README.md) - Project overview
- [SUPABASE_SETUP.md](../infin8content/SUPABASE_SETUP.md) - Supabase configuration
- [MIGRATION_INSTRUCTIONS.md](../infin8content/MIGRATION_INSTRUCTIONS.md) - Database migrations
- [Architecture](./architecture.md) - System architecture
- [API Contracts](./api-contracts.md) - API endpoints

