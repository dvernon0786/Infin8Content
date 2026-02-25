# Development Guide - infin8content

Generated: 2026-02-26  

## Prerequisites

- **Node.js**: 18+ (latest LTS recommended)
- **npm**: 9+
- **Supabase CLI**: Required for local database development

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Infin8Content/infin8content
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Copy `.env.example` to `.env.local` and fill in the required keys for Supabase, Stripe, and OpenRouter.

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Start Inngest Dev Server**:
   ```bash
   npx inngest-cli@latest dev
   ```

## Development Workflows

- **Linting**: `npm run lint`
- **Type Checking**: `npm run typecheck`
- **Testing**:
  - Unit/Integration: `npm run test`
  - E2E (Playwright): `npm run test:e2e`
  - Visual Regression: `npm run test:visual`
- **Storybook**: `npm run storybook`

## Code Standards

- **TypeScript**: Strict mode is enabled. Use defined types for all services and components.
- **Design System**: Follow Tailwind 4 patterns. Use Radix UI primitives for new UI components.
- **API Patterns**: All new API routes must use Zod for request validation.
- **Audit Logging**: Use `logActionAsync` for all user-initiated state changes.
