# Architecture - Infin8Content

This document outlines the architectural design, patterns, and principles governing the Infin8Content platform.

## System Architecture

### Frontend Layer (Next.js App Router)
The application uses **Next.js 16.1.1** with the **App Router** pattern.
- **Server Components**: Used by default for fetching data from Supabase to minimize client-side JavaScript.
- **Client Components**: Used for interactive UI elements (forms, dashboard widgets, workflow controls).
- **Layouts**: Nested layouts for consistent navigation across marketing, auth, and dashboard sections.

### Backend & Database (Supabase)
**Supabase** provides the core infrastructure:
- **PostgreSQL**: Relational storage with strict schema enforcement.
- **Row Level Security (RLS)**: Multi-tenancy is enforced at the database level. Every query is scoped to the user's `organization_id`.
- **Auth**: OTP-based authentication with link-to-profile triggers.
- **Real-time**: Postgres Change Data Capture (CDC) for live updates in the dashboard.

### Workflow & Orchestration (Inngest)
Complex, long-running processes (like AI article generation) are managed by **Inngest**:
- **Event-Driven**: Workflows are triggered by events (e.g., `content.workflow.started`).
- **Deterministic Steps**: Each stage of the workflow is a discrete function call with automatic retries and state persistence.
- **Parallelism**: Multiple sections of an article can be researched and generated in parallel via fan-out patterns.

## Design Patterns

### Finite State Machine (FSM)
The "Intent Workflow" is modeled as an FSM.
- **States**: Defined in the database and enforced via check constraints.
- **Transitions**: Controlled by Inngest functions that validate predicates before updating the state.
- **Audit Logging**: Every transition is captured in `intent_audit_logs`.

### Service Layer
Integrations with third-party APIs (Stripe, OpenRouter, Tavily, Brevo) are abstracted into the `lib/services/` directory. This ensures that the application logic is decoupled from specific vendor implementations.

### Repository Pattern (Supabase Client)
Database access is handled through centralized client utilities in `lib/supabase/`. This allows for unified error handling and session management.

## Component Architecture
We follow an **Atomic** and **Feature-Based** component strategy:
- **Base Components (`/ui`)**: Low-level primitives (Buttons, Inputs, Dialogs) powered by Radix UI.
- **Feature Components**: Components complex enough to warrant their own subdirectory (e.g., `/dashboard/ArticleList`).
- **Composition**: Larger pages are composed of these smaller, testable units.

## Security & Reliability
- **Organization Isolation**: Guaranteed by RLS.
- **Validation**: All API boundary data is validated using **Zod**.
- **Error Tracking**: **Sentry** is integrated for both client and server runtime monitoring.
- **Auditability**: Critical business actions are logged to a dedicated audit trail.
