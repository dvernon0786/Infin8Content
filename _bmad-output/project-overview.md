# Project Overview - Infin8Content

Infin8Content is a comprehensive AI-driven content strategy and generation platform designed to automate the lifecycle of professional article production.

## Mission
To empower organizations with deterministic, high-quality content pipelines that combine human review gates with advanced AI orchestration.

## Key Capabilities
- **Deterministic Workflows**: Multi-stage state machine (FSM) that guides users from ICP definition to keyword clustering and final article generation.
- **Human-in-the-Loop**: Strategic approval gates ensuring that AI-generated research and outlines meet organizational quality standards.
- **Real-Time Orchestration**: Background job processing via Inngest for parallel research, competitor analysis, and multi-part content generation.
- **SEO-First Engineering**: Deep integration with Tavily and DataForSEO for data-backed keyword strategy and content optimization.
- **Multi-Tenant Architecture**: Robust organization management with per-user roles, Stripe-powered billing, and secure data isolation via Supabase RLS.

## Core Technology Stack
- **Frontend**: Next.js 16.1.1, React 19.2.3, Tailwind CSS 4.
- **Backend/Infrastructure**: Supabase (Database, Auth, Storage), Node.js Edge Functions.
- **Workflow Engine**: Inngest (Event-driven orchestration).
- **Integrations**: Stripe (Payments), OpenRouter (LLM access), Tavily (Search), Brevo (Email).

## System Architecture
The platform follows a **Layered Component-Based** architecture using the Next.js App Router. Business logic is strictly separated into a service layer (`lib/services/`) and an event-driven workflow layer (`lib/fsm/` and `lib/inngest/`).

## Project Status
The platform is in active development, with core MVP stories (Foundation, Content Generation, Real-time Dashboard) completed and focus currently on Analytics and Performance monitoring.

## Documentation Index
- [Master Index](./index.md)
- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)
- [Development Guide](./development-guide.md)
