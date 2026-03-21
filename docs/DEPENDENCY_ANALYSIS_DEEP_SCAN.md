# DEPENDENCY ANALYSIS: Deep Scan

Generated: 2026-02-28
Domain: **Generation Pipeline**

## 🗺️ Core Dependency Path

The generation pipeline follows a unidirectional dependency flow:

1.  **UI (`app/dashboard`)** 
    - *Depends on*: `app/api/articles/generate` (via fetch)
    - *Depends on*: `hooks/use-dashboard-data` (Supabase Real-time)
    - *Constraint*: Cannot access `lib/inngest` logic directly.

2.  **Trigger (`app/api/articles/generate`)**
    - *Depends on*: `lib/inngest/client` (Event Emission)
    - *Depends on*: `lib/supabase/server` (User Validation)
    - *Constraint*: Cannot call `lib/services/content-generation` directly.

3.  **Engine (`lib/inngest/functions/generate-article`)**
    - *Depends on*: `lib/services/article-planner`
    - *Depends on*: `lib/services/openrouter`
    - *Depends on*: `lib/services/tavily`
    - *Constraint*: Must be decoupled from the Next.js `request` object.

## 🔗 Internal Module Integration

### Authority Flow
`app/api` (Command) -> `Inngest Event Bus` -> `lib/inngest/functions` (Execution) -> `supabase` (Persistence)

### State Flow
`supabase.articles.status` -> `Real-time Subscription` -> `app/dashboard` (Observation)

## 📦 Third Party Dependencies

-   **OpenRouter SDK**: Used in `lib/services/openrouter.ts` for LLM failover.
-   **Inngest SDK**: Used in `lib/inngest/client.ts` for event registry.
-   **Stripe SDK**: Used in `lib/services/stripe.ts` for quota consumption check.
-   **Tavily SDK**: Used in `lib/services/research-service.ts` for SEO data gathering.

## 🪢 Circular Dependency Check

-   **Result**: 0 cycles detected.
-   **Structure**: Clean separation between `lib/services` (stateless logic) and `lib/inngest` (stateful workflows).

---
*Generated via Source Graph Traversal.*
