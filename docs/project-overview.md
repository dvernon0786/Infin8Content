# Project Overview - Infin8Content

Generated: 2026-03-17
Project State: **Production Hardened**
Authority Model: **Zero Drift Protocol** (Deterministic State Management)

## Purpose

Infin8Content is a high-performance, enterprise-grade AI content generation platform. It handles the entire lifecycle of content creation—from research and SEO analysis to section-by-section generation and automated CMS publishing—managed through a deterministic Finite State Machine (FSM) with 25 states and 30+ events.

## Core Architectural Directives

The platform adheres to the **Zero Drift Protocol**, ensuring absolute data integrity and state consistency:

1.  **Single Authority**: The Article Lifecycle is managed exclusively by the **Trigger API** (Transitions) and **Inngest Workers** (Execution). No other component may mutate article state.
2.  **Deterministic Pipeline**: Generation follows a strict, sequential FSM. State transitions are atomic and irreversible without explicit system intervention.
3.  **Real-time Stability**: A "Real-time First, Polling Fallback" model ensures the dashboard always reflects the ground truth of the database without UI-side calculation of state.
4.  **Audit Hardening**: Every state transition and system action is logged with high-fidelity metadata for compliance and debugging.

## Key Capabilities

-   **Deep Research**: Multi-source research integration (Tavily, DataForSEO) for real-time data ingestion with 24-hour caching.
-   **Parallel Generation**: Optimized LLM orchestration (OpenRouter) with parallel section processing and smart quality retries.
-   **Lifecycle Sealing**: Pure generation engine mode eliminates editorial drift by locking content once generation begins.
-   **Multi-tenant SaaS**: Built-in organization management, RBAC, and Stripe-integrated billing with monthly usage limits ($25 default).
-   **Mobile-First**: 15+ mobile-optimized components for on-the-go content management.

## Technology Stack (Verified from package.json)

-   **Frontend**: Next.js 16.1.1 (App Router), React 19.2.3, Tailwind CSS 4.0
-   **Backend**: Supabase (Auth, PostgreSQL/RLS, Real-time), Inngest 3.48.1 (Workflow Engine)
-   **AI**: OpenRouter 2.1.1 (Gemini 2.0, Claude 3.5 Sonnet, Llama 3), Tavily API
-   **Payments**: Stripe 20.1.0 with usage tracking and cost functions
-   **Email**: Brevo 3.0.1 for transactional emails
-   **Testing**: Vitest 4.0.16, Playwright 1.57.0, Storybook 10.1.11
-   **Monitoring**: Sentry 10.34.0 for error tracking

## Current Scale Metrics

- **Codebase Size**: 7,581+ files across monorepo
- **Components**: 183 React components with design system compliance
- **API Routes**: 50+ endpoints with Zod validation
- **Database**: 15+ tables with comprehensive RLS policies
- **Migrations**: 75+ applied, latest fixing article status constraints
- **FSM Coverage**: 25 workflow states with structural coupling to automation

## Production Readiness

- **State Management**: Unified workflow engine prevents race conditions
- **Error Handling**: Comprehensive retry logic and failure states
- **Security**: Row-level security on all tables with service role bypass
- **Performance**: Real-time subscriptions, query optimization, and caching
- **Compliance**: Audit trails, GDPR considerations, and data isolation

---
*For technical implementation details, see [Architecture Overview](./architecture-infin8content.md) and [Workflow Guide](./workflow-guide.md).*
