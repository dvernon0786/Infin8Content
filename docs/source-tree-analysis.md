# Source Tree Analysis - Infin8Content

Generated: 2026-02-26  
Project Structure: Monorepo with 3 parts  

## Master Repository Structure

```
Infin8Content/
├── infin8content/        # Primary Web Application (Next.js)
├── tools/                 # Development Utilities (ESLint Plugins)
├── _bmad/                 # BMad Framework (Workflows & Config)
├── supabase/              # Database Schema & Migrations
├── docs/                  # Project Documentation (Scan Results)
├── .agent/                # AI Agent Workflows & Tools
├── _bmad-output/          # Generated BMM Artifacts
└── planning-artifacts/    # Project Planning Docs
```

## Part: infin8content (Web Application)

The core SaaS platform built with Next.js 16.

```
infin8content/
├── app/                   # Next.js App Router
│   ├── api/               # REST API Endpoints
│   ├── (auth)/            # Authentication Protected Routes
│   ├── dashboard/         # User Dashboard
│   └── onboarding/        # Organization Setup Flow
├── components/            # UI Component Library
│   ├── ui/                # Base Radix Primitives
│   ├── dashboard/         # Dashboard-specific Components
│   └── shared/            # Reusable App Components
├── lib/                   # Shared Logic & Services
│   ├── supabase/          # Database Client & Auth
│   ├── inngest/           # Workflow Clients
│   └── services/          # Business Logic (Stripe, OpenRouter, etc.)
├── hooks/                 # Custom React Hooks (Real-time, State)
├── public/                # Static Assets (Images, Icons)
├── styles/                # Global CSS & Tailwind Config
└── __tests__/             # Unit, Integration, and E2E Tests
```

## Part: tools (Utility)

Custom development tools for internal use.

```
tools/
└── eslint-plugin-design-system/
    ├── index.js           # Plugin Entry Point
    └── package.json       # Plugin Configuration
```

## Part: _bmad (Framework)

The orchestration layer for BA/PM/SDE agents.

```
_bmad/
├── core/                  # Core Workflow Engines
├── bmm/                   # Business Management Method Workflows
└── workflows/             # Task-specific Workflow Definitions
```

## Database: supabase

PostgreSQL backend managed via migrations.

```
supabase/
└── migrations/            # SQL Migration Scripts (75+ files)
```
