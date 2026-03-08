# Complete Codebase Analysis: Infin8Content

This document provides a holistic technical analysis of the Infin8Content codebase, detailing the interactions between the frontend, the Inngest workflow engine, and the agentic services.

## 1. Directory Structure & Modularity

The project follows a standard Next.js App Router structure with a consolidated application core in `/infin8content`.

-   `app/`: Contains the routing layer, API endpoints, and page components.
    -   `api/`: REST endpoints for research, user management, and SEO auditing.
    -   `dashboard/`: The primary operational interface.
    -   `onboarding/`: The data-gathering pipeline for new users/projects.
-   `components/`: Reusable UI elements, organized by feature (Mobile, SEO, Onboarding, Research).
-   `lib/`: The core business logic layer.
    -   `services/`: The "Brain" of the application (AI Agents, Research Engine).
    -   `inngest/`: Workflow definitions and event-driven orchestration.
    -   `supabase/`: Database client and edge function utilities.
-   `supabase/migrations/`: 60+ SQL files defining the evolving schema, RLS policies, and triggers.

## 2. The Content Generation Pipeline

The generation process is the most complex part of the system, orchestrated by Inngest.

### Lifecycle Flow:
1.  **Trigger**: User initiates generation (`api/onboarding/persist`).
2.  **Planning**: `article-generate-planner.ts` (Inngest) uses the `Content Planner Agent` to architect the outline.
3.  **Research**: The `Research Agent` performs batch research for all sections using Tavily, caching results to avoid redundant API costs.
4.  **Generation**: `generate-article.ts` (Inngest) spawns parallel tasks (where supported) or sequential calls to the `Content Writing Agent`.
5.  **Assembly**: The `Article Assembler` merges sections, styles citations, and injects SEO markers.
6.  **Finalization**: The article status is updated to `completed`, triggering dashboard notifications.

### Key Logic Centers:
-   **Parallel Section Processing**: The engine can process multiple article sections simultaneously, significantly reducing generation time.
-   **Smart Context Management**: The `Content Writing Agent` dynamically adjusts context windows to maintain coherence without exceeding LLM token limits.

## 3. State Machine & Lifecycle Management

Infin8Content uses a "Sealed Lifecycle" pattern.
-   **Source of Truth**: The `article_status` in the database.
-   **Transitions**: Strictly governed by server-side logic (Inngest). The UI can "request" a change but the engine "enforces" the valid transitions (e.g., `draft` -> `queued` -> `processing` -> `completed`).
-   **Resilience**: The `cleanup-stuck-articles.ts` Inngest function periodically identifies and resets articles stuck in `processing` states due to unexpected failures.

## 4. Database Architecture & RLS

The database is built on Supabase/PostgreSQL with a focus on multitenancy.
-   **Organization Isolation**: Every record (Article, Keyword, Competitor) is linked to an `organization_id`.
-   **RLS Policies**: Standardized policies ensure that even with a leaked API key, a user can only access their own organization's data.
-   **Activity Logging**: Triggers automatically populate the `activities` table whenever critical records are modified.

## 5. Performance Optimizations

-   **Dashboard Rendering**: Uses GPU layer promotion (`will-change-transform`) for smooth scrolling in the high-density article list.
-   **Research Caching**: Prevents triple-billing for the same research query across different articles in the same organization.
-   **Prompt Engineering**: Shifted from large, monolithic prompts to small, focused "Section Archetypes" to improve quality and reduce input tokens.

---
_Analysis Date: 2026-03-08 | Scope: Deep Scan_
