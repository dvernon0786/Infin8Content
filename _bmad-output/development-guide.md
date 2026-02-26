# Development Guide - Infin8Content

This guide provides instructions for setting up and working with the Infin8Content codebase.

## Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Supabase CLI**: Required for local database management
- **Inngest Dev Server**: Required for background job processing

## Setup Instructions

1. **Clone the repository** (if not already done).
2. **Navigate to the app directory**:
   ```bash
   cd infin8content
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Environment Variables**:
   Copy `.env.example` to `.env.local` and fill in the required keys for Supabase, Stripe, and OpenRouter.
5. **Database Setup**:
   ```bash
   supabase start
   supabase db reset
   ```
6. **Inngest Setup**:
   In a separate terminal, start the Inngest dev server:
   ```bash
   npx inngest-cli@latest dev
   ```

## Local Development
Start the Next.js development server:
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

## Available Scripts

### Core Commands
- `npm run dev`: Start development server.
- `npm run build`: Create a production build.
- `npm run start`: Start the production server.
- `npm run lint`: Run ESLint checks.
- `npm run typecheck`: Run TypeScript compiler checks.

### Testing
- `npm run test`: Run unit tests with Vitest.
- `npm run test:integration`: Run integration tests.
- `npm run test:e2e`: Run Playwright end-to-end tests.
- `npm run test:ui`: Launch the Vitest UI.

### UI & Quality
- `npm run storybook`: Start Storybook for component development.
- `npm run build-storybook`: Build Storybook for deployment.

## Common Workflows

### Database Migrations
When changing the database schema:
1. Create a new migration: `supabase migration new your_migration_name`
2. Add your SQL logic.
3. Apply locally: `supabase db reset`
4. Pull types: `npx supabase gen types typescript --local > types/supabase.ts`

### Background Jobs
New Inngest functions should be registered in `app/api/inngest/route.ts` and defined in `lib/inngest/functions/`. Use the Inngest Dev Server UI to trigger and debug events.

### Adding UI Components
We use Radix UI primitives with Tailwind CSS. New base components should be placed in `components/ui/`.

## Architecture Principles
- **Strict Typing**: Use TypeScript interfaces for all data structures.
- **RLS Awareness**: Always include `organization_id` in database queries and filters.
- **Fail-Fast Validation**: Use Zod to validate API inputs and external data.
- **Atomic Components**: Keep components small and focused on a single responsibility.
