# Source Tree Analysis - Infin8Content

This document provides a detailed breakdown of the Infin8Content codebase structure, highlighting critical directories and their purposes.

## Repository Overview
The project is a **Monolith** with a primary Next.js application located in the `infin8content/` directory. The root folder contains administrative scripts, historical artifacts, and legacy configuration.

## Critical Directories

### `/infin8content` (Main Application)

| Path | Purpose |
| :--- | :--- |
| `app/` | **Next.js App Router root.** Contains all pages and API routes. |
| `app/api/` | Server-side endpoints (Auth, Workflows, Stripe, Inngest). |
| `app/dashboard/` | Core user interface for content management. |
| `app/intent/` | UI for the FSM-driven content strategy workflow. |
| `components/` | **React Component Library.** Organized by feature. |
| `components/ui/` | Reusable base UI components (Radix/Shadcn). |
| `components/dashboard/` | Dashboard-specific widgets and layouts. |
| `lib/` | **Core Business Logic.** Services, utilities, and integrations. |
| `lib/fsm/` | Finite State Machine logic for intent workflows. |
| `lib/inngest/` | Background job definitions and orchestration. |
| `lib/supabase/` | Database client and server-side utilities. |
| `lib/services/` | Abstracted business services (Stripe, AI, Email). |
| `supabase/` | Database migrations and Supabase configuration. |
| `__tests__/` | Unit and integration tests (Vitest). |
| `tests/` | End-to-end tests (Playwright). |
| `scripts/` | Maintenance and automation scripts. |
| `types/` | Global TypeScript definitions and database types. |

### `/` (Project Root)

| Path | Purpose |
| :--- | :--- |
| `accessible-artifacts/` | History of project deliverables, stories, and validation reports. |
| `_bmad/` | BMad framework configuration and core tasks. |
| `_bmad-output/` | **Documentation and planning artifacts.** (This folder). |
| `docs/` | Original technical documentation and guides. |
| `planning-artifacts/` | BMad project-level planning (PRD, Architecture). |
| `scripts/` | Root-level helper scripts (mostly SQL and JS). |
| `supabase/` | Root-level database utilities (parallel to infin8content/supabase). |

## Entry Points
- **Frontend**: `infin8content/app/layout.tsx` (Global layout) and `infin8content/app/page.tsx` (Marketing home).
- **Backend API**: `infin8content/app/api/.../route.ts` handlers.
- **Background Processes**: `infin8content/lib/inngest/client.ts` and function definitions.
- **Middleware**: `infin8content/middleware.ts` (Auth and organization guarding).

## Patterns & Conventions
- **Component Colocation**: Features are often grouped within `components/` subdirectories.
- **Service Layer**: External integrations are abstracted into `lib/services/`.
- **FSM State Management**: Complex workflows are managed via Inngest + Database State (FSM pattern).
- **Zod Validation**: API inputs and environment variables are strictly validated using Zod schemas.
