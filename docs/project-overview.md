# Project Overview - Infin8Content

Generated: 2026-02-28
Project State: **Production Hardened**
Authority Model: **Zero Drift Protocol** (Deterministic State Management)

## Purpose

Infin8Content is a high-performance, enterprise-grade AI content generation platform. It handles the entire lifecycle of content creation—from research and SEO analysis to section-by-section generation and automated CMS publishing—managed through a deterministic Finite State Machine (FSM).

## Core Architectural Directives

The platform adheres to the **Zero Drift Protocol**, ensuring absolute data integrity and state consistency:

1.  **Single Authority**: The Article Lifecycle is managed exclusively by the **Trigger API** (Transitions) and **Inngest Workers** (Execution). No other component may mutate article state.
2.  **Deterministic Pipeline**: Generation follows a strict, sequential FSM. State transitions are atomic and irreversible without explicit system intervention.
3.  **Real-time Stability**: A "Real-time First, Polling Fallback" model ensures the dashboard always reflects the ground truth of the database without UI-side calculation of state.
4.  **Audit Hardening**: Every state transition and system action is logged with high-fidelity metadata for compliance and debugging.

## Key Capabilities

-   **Deep Research**: Multi-source research integration (Tavily, DataForSEO) for real-time data ingestion.
-   **Parallel Generation**: Optimized LLM orchestration (OpenRouter) with parallel section processing and smart quality retries.
-   **Lifecycle Sealing**: Pure generation engine mode eliminates editorial drift by locking content once generation begins.
-   **Multi-tenant SaaS**: Built-in organization management, RBAC, and Stripe-integrated billing.

## Technology Stack

-   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4.
-   **Backend**: Supabase (Auth, PostgreSQL/RLS, Real-time), Inngest (Workflow Engine).
-   **AI**: OpenRouter (Gemini 2, Claude 3.5, Llama 3), Tavily API.
-   **Infrastructure**: Stripe, Brevo, WordPress API.

---
*For technical implementation details, see [Architecture Overview](./architecture-infin8content.md) and [Workflow Guide](./workflow-guide.md).*
