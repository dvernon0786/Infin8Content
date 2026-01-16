# Story 32.1: User Experience Metrics Tracking

Status: done

## Story

As a product manager,
I want track user experience metrics,
so that I can measure platform success and identify improvement areas.

## Acceptance Criteria

1. Given task completion is important
   When tracking user behavior
   Then article creation completion rate is measured (target > 90%)
   And review workflow completion time is tracked (target < 5 minutes)

2. Given collaboration adoption matters
   When monitoring feature usage
   Then team collaboration adoption is measured (target > 80%)
   And data is collected and reported weekly

3. Given user satisfaction is critical
   When gathering feedback
   Then trust in AI output scores are collected (target > 4.0/5.0)
   And perceived value of collaboration features is measured (target > 4.2/5.0)

## Metric Definitions (Must Follow)

### Article creation completion rate (AC #1)

- **Scope**: per organization, weekly
- **Numerator**: count of `article_create_flow` instances that reached `COMPLETED`
- **Denominator**: count of `article_create_flow` instances that reached `STARTED`
- **Completion window**: a flow instance is considered “completed” if `COMPLETED` occurs within **24 hours** of `STARTED`.
- **Formula**: `completion_rate = completed_flows / started_flows`
- **Target**: `completion_rate > 0.90`

**Implementation rule**: The “flow instance” must be keyed (e.g., `flow_instance_id`) so retries/reloads do not double-count.

### Review workflow completion time (AC #1)

- **Scope**: per organization, weekly
- **Start event**: `review_flow.STARTED`
- **End event**: `review_flow.COMPLETED`
- **Metric**: median completion time in minutes across completed review flows
- **Formula**: `duration_minutes = (completed_at - started_at) / 60`
- **Target**: `median_duration_minutes < 5`

### Team collaboration adoption (AC #2)

- **Scope**: per organization, weekly
- **Definition**: “adopted” means the org had **at least one** collaboration interaction during the week.
- **Collaboration interactions** (count any of):
  - comment created on an article
  - mention/tag of a teammate in a comment
  - invitation accepted (team member joined)
- **Numerator**: count of orgs with `collaboration_interaction_count >= 1` during the week
- **Denominator**: count of orgs with `active_org_week = true` during the week
- **Active org week**: org has at least one signed-in session OR created/edited/generated an article in the week
- **Formula**: `adoption_rate = adopted_orgs / active_orgs`
- **Target**: `adoption_rate > 0.80`

### Trust in AI output score (AC #3)

- **Scope**: per organization, weekly
- **Capture mechanism**: lightweight in-product rating prompt after article completion (single question, 1–5)
- **Metric**: weekly average rating
- **Target**: `avg_rating > 4.0`

### Perceived value of collaboration features score (AC #3)

- **Scope**: per organization, weekly
- **Capture mechanism**: lightweight in-product rating prompt after a collaboration interaction (single question, 1–5)
- **Metric**: weekly average rating
- **Target**: `avg_rating > 4.2`

## Reporting (Decision)

- Weekly reporting will be produced by an **Inngest scheduled function** that:
  - aggregates the prior week’s metrics into a rollup table
  - makes rollups accessible via an **admin API endpoint** (read-only)

## Data Model (Proposed)

### Event log (append-only)

- Create `ux_metrics_events` table (organization-scoped) for tracking discrete events.
- Required columns:
  - `id` (uuid)
  - `org_id` (uuid)
  - `user_id` (uuid, nullable)
  - `event_name` (text)
  - `flow_instance_id` (uuid, nullable)
  - `article_id` (uuid, nullable)
  - `payload` (jsonb)
  - `created_at` (timestamptz)

### Weekly rollups

- Create `ux_metrics_weekly_rollups` table (organization-scoped) for week-based aggregates.
- Required columns:
  - `id` (uuid)
  - `org_id` (uuid)
  - `week_start` (date)
  - `metrics` (jsonb)
  - `created_at` (timestamptz)

## Non-goals (Do Not Do In 32.1)

- Do not build the full analytics dashboard UI (that is Story 32.3).
- Do not introduce a new third-party analytics SDK (e.g., PostHog/GA) unless explicitly approved.
- Do not weaken multi-tenant isolation (no cross-org rollups in this story).

## Tasks / Subtasks

- [x] Implement event taxonomy and instrumentation points (AC: #1, #2, #3)
  - [x] Emit `article_create_flow.STARTED` / `article_create_flow.COMPLETED` events
  - [x] Emit `review_flow.STARTED` / `review_flow.COMPLETED` events
  - [x] Emit collaboration interaction events (comment created, mention/tag, invite accepted)
  - [x] Emit rating events for trust/value prompts

- [x] Persist events safely (AC: #1, #2, #3)
  - [x] Add `ux_metrics_events` table with RLS enforcing `org_id`
  - [x] Ensure writes are server-side (API route / server action), not client-side direct table writes
  - [x] Ensure flow instance idempotency (no duplicate STARTED/COMPLETED per `flow_instance_id`)

- [x] Implement weekly rollup job (AC: #1, #2, #3)
  - [x] Add `ux_metrics_weekly_rollups` table with RLS enforcing `org_id`
  - [x] Add Inngest scheduled function to compute rollups for the prior week
  - [x] Compute and store:
    - [x] completion rate
    - [x] review flow median duration
    - [x] org adoption rate (active vs adopted)
    - [x] average trust score
    - [x] average collaboration value score

- [x] Add read-only admin API endpoint to fetch rollups (AC: #2)
  - [x] Endpoint returns rollups for `orgId` only (auth + authorization enforced)
  - [x] Verify deterministic weekly report retrieval for an org

- [x] Tests (AC: #1, #2, #3)
  - [x] Unit tests for each metric computation function (completion/adoption/duration/averages)
  - [x] Integration test: events + rollup generation respects org scoping and does not leak data
  - [x] Integration test: idempotency for `flow_instance_id` prevents double-counting

## Dev Notes

- Relevant architecture patterns and constraints
  - Multi-tenant isolation is enforced via Supabase + RLS patterns. All metrics must be scoped by organization and must not leak cross-tenant data.
  - Prefer extending existing “performance metrics” patterns rather than inventing a new parallel telemetry approach.

- Source tree components to touch
  - Existing metrics/performance patterns (reference first):
    - `infin8content/app/api/admin/performance/metrics/route.ts` (pattern for fetching metrics for dashboards)
    - `infin8content/components/dashboard/performance-dashboard/performance-dashboard.tsx` (pattern for presenting metrics)
    - `infin8content/lib/services/article-generation/performance-monitor.ts` (pattern for collecting and persisting generation metrics)
    - `infin8content/lib/mobile/performance-monitor.ts` (pattern for client-side performance/touch metrics)

- Testing standards summary
  - Follow the existing Vitest unit/integration patterns under `infin8content/tests` and `infin8content/__tests__`.
  - Add tests that explicitly validate org scoping (multi-tenant) and correct threshold calculations.

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
  - Business logic belongs under `infin8content/lib/`.
  - API endpoints belong under `infin8content/app/api/`.
  - UI components belong under `infin8content/components/`.

- Detected conflicts or variances (with rationale)
  - None identified yet. Use existing performance dashboard patterns as the baseline.

### References

- Story source: `_bmad-output/epics.md` Epic 32, Story 32.1 “User Experience Metrics Tracking”
- Existing metrics dashboard patterns:
  - `docs/architecture.md` (Technology Stack, Multi-tenant architecture, Testing architecture)
  - `infin8content/app/api/admin/performance/metrics/route.ts`
  - `infin8content/components/dashboard/performance-dashboard/performance-dashboard.tsx`
  - `infin8content/lib/services/article-generation/performance-monitor.ts`
  - `infin8content/lib/mobile/performance-monitor.ts`

## Dev Agent Record

### Agent Model Used

Cascade

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created

### File List

- docs/stories/32-1-user-experience-metrics-tracking.md
- infin8content/lib/services/ux-metrics.ts
- infin8content/lib/services/ux-metrics-rollup.ts
- infin8content/lib/inngest/functions/ux-metrics-rollup.ts
- infin8content/supabase/migrations/20260116000000_add_ux_metrics_tables.sql
- infin8content/app/api/admin/ux-metrics/rollups/route.ts
- infin8content/__tests__/integration/ux-metrics-org-scoping.test.ts
- infin8content/__tests__/integration/ux-metrics-api.test.ts
- infin8content/tests/lib/services/ux-metrics-rollup.test.ts
- infin8content/app/api/articles/generate/route.ts (modified)
- infin8content/app/api/inngest/route.ts (modified)
- infin8content/app/api/team/accept-invitation/route.ts (modified)
- infin8content/lib/inngest/functions/generate-article.ts (modified)
