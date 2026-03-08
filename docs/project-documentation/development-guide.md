# Development Guide: Infin8Content

This guide explains how to set up, develop, and test the Infin8Content platform locally.

## 🛠️ Prerequisites

- **Environment**: Node.js 20+, npm 10+
- **Database**: Supabase account (or local Supabase CLI)
- **Workflows**: Inngest CLI installed (`npm install -g inngest-cli`)
- **APIs**: Keys for OpenRouter, Tavily, Stripe, and DataForSEO

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone <repository-url>
cd infin8content
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local` and populate the following critical variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `TAVILY_API_KEY`
- `STRIPE_SECRET_KEY`

### 3. Run Locally
Start the Next.js dev server and the Inngest dev server simultaneously:
```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Inngest Dev Server
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

## 🧪 Testing

The project uses a multi-tier testing strategy:

| Command | Purpose |
| :--- | :--- |
| `npm run test` | Run Vitest unit & integration tests. |
| `npm run test:e2e` | Run Playwright end-to-end tests. |
| `npm run test:ui` | Open Vitest interactive UI. |
| `npm run test:fsm` | Validate the Finite State Machine transitions. |
| `npm run storybook` | Develop UI components in isolation. |

## 🏗️ Commands & Scripts

- `npm run build`: Compile the Next.js production bundle.
- `npm run lint`: Run ESLint to ensure code quality.
- `npm run typecheck`: Validate TypeScript types without emitting code.
- `node scripts/test-linear-workflow.js`: Simulates a full article creation flow.

## 📦 Project Conventions

- **Branching**: Use feature branches (`feature/xxx`) and merge into `main` via PR.
- **Styling**: Vanilla CSS with Tailwind CSS 4 utility classes. No inline styles unless bypassing CSS specificity issues.
- **Agents**: New AI logic should be added to `lib/services/article-generation/` and registered in the appropriate Inngest function.

---
_Last Updated: 2026-03-08_
