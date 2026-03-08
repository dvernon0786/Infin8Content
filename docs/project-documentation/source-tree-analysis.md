# Source Tree Analysis: Infin8Content

This document provides an annotated map of the Infin8Content repository, highlighting critical directories and their roles in the system.

## 📁 Repository Map

```text
infin8content/
├── app/                        # Next.js App Router (Routing & Pages)
│   ├── (auth)/                 # Authentication routes (login, register)
│   ├── api/                    # Backend REST API endpoints
│   ├── dashboard/              # The main operational UI
│   ├── onboarding/             # Multi-step project setup flow
│   ├── payment/                # Stripe checkout and success handlers
│   └── layout.tsx              # Root application layout
├── components/                 # Reusable React UI Components
│   ├── custom/                 # Business-specific components (Article status badges)
│   ├── mobile/                 # Touch-optimized dashboard components
│   ├── onboarding/             # Components for the 9-step wizard
│   ├── research/               # Forms and tables for keyword analysis
│   ├── seo/                    # Performance and quality scoring UI
│   ├── ui/                     # Generic shadcn/radix primitives (Button, Input)
│   └── workflows/              # Step-based workflow visualizations
├── hooks/                      # Custom React hooks (useAuth, useArticles, etc.)
├── lib/                        # Core Logic & Utilities
│   ├── inngest/                # Workflow automation & job definitions
│   │   └── functions/          # The actual background tasks
│   ├── services/               # The "Agents" and heavy computation
│   │   ├── article-generation/ # Content Planner, Researcher, Writer agents
│   │   └── research/           # Keyword and competitor research logic
│   ├── supabase/               # Database client and SSR configuration
│   └── utils/                  # Utility functions (formatting, validation)
├── public/                     # Static assets (images, icons)
├── scripts/                    # Maintenance and testing scripts
├── styles/                     # Global CSS and Tailwind directives
├── supabase/                   # Supabase local environment & migrations
│   └── migrations/             # SQL schema definitions (Evolutionary)
├── types/                      # Shared TypeScript interfaces & types
├── __tests__/                  # Unit and Integration test suite
└── tests/                      # Playwright E2E and visual tests
```

## 🎯 Critical Logic Entry Points

| Feature | Key Entry Point |
| :--- | :--- |
| **User Sign-up** | `app/(auth)/register/page.tsx` |
| **Generation Trigger** | `app/api/onboarding/persist/route.ts` |
| **Workflow Root** | `lib/inngest/functions/generate-article.ts` |
| **Content Logic** | `lib/services/article-generation/content-writing-agent.ts` |
| **Database Schema** | `supabase/migrations/20260101124156_initial_schema.sql` |
| **Dashboard UI** | `app/dashboard/articles/page.tsx` |

## 📦 Optimization Flags

-   **Parallel Scanning**: The `lib/services/article-generation` directory is scanned exhaustively during deep scans to ensure agent logic is captured.
-   **Exclusion Rules**: `node_modules`, `.next`, and `dist` are excluded from code analysis to maintain clarity.

---
_Analysis Date: 2026-03-08_
