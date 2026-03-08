# Dependency Analysis & Deep Scan: Infin8Content

This document catalogs the external dependencies used by Infin8Content, detailing their versions, security implications, and roles in the architecture.

## 1. Core Frameworks

| Dependency | Version | Role |
| :--- | :--- | :--- |
| `next` | `16.1.1` | Application framework (App Router) |
| `react` | `19.2.3` | UI library |
| `typescript` | `^5` | Base language |
| `tailwindcss` | `^4` | Styling engine |

## 2. Infrastructure & Backend

| Dependency | Version | Role |
| :--- | :--- | :--- |
| `@supabase/supabase-js` | `^2.89.0` | Database client & Real-time |
| `@supabase/ssr` | `^0.8.0` | Auth & Session management for Next.js |
| `inngest` | `^3.48.1` | Workflow orchestration |
| `zod` | `^3.23.8` | Schema validation (API & Env) |
| `@sentry/nextjs` | `^10.34.0` | Observability & Error reporting |

## 3. AI & Content Generation

| Dependency | Version | Role |
| :--- | :--- | :--- |
| `ai` | `^6.0.0` | Vercel AI SDK for LLM interactions |
| `@openrouter/ai-sdk-provider`| `^2.1.1`| OpenRouter integration for diverse LLM access |
| `react-markdown` | `^10.1.0` | Markdown rendering for generated content |

## 4. UI/UX & Components

| Dependency | Version | Role |
| :--- | :--- | :--- |
| `@radix-ui/*` | `Various` | Primitives for Select, Dialog, Progress, etc. |
| `lucide-react` | `^0.562.0` | Component-based icon library |
| `recharts` | `^3.7.0` | Visualization for SEO & performance metrics |
| `react-window` | `^2.2.4` | Virtualized lists for high-density dashboards |
| `class-variance-authority` | `^0.7.1` | Type-safe CSS class variance |

## 5. Development & Testing

| Dependency | Version | Role |
| :--- | :--- | :--- |
| `vitest` | `^4.0.16` | Fast unit/integration testing |
| `playwright` | `^1.57.0` | End-to-end testing & Visual regression |
| `storybook` | `^10.1.11` | Component development & documentation |
| `jest` / `ts-jest` | `^30.x` | Legacy/Specific unit testing suite |

## 6. Security Deep Scan Findings

-   **Authentication**: Managed via Supabase Auth (JWT). Session tokens are handled via HTTP-only cookies in `@supabase/ssr`.
-   **Security Definers**: Several database functions use `SECURITY DEFINER`. High-priority hardening has been performed to ensure these functions always set a secure `search_path`.
-   **Input Sanitization**: Client-side inputs are validated using `Zod` before being passed to SQL queries or AI prompts.
-   **Service Role Boundaries**: The system strictly separates code running with the `anon` key from code requiring the `service_role` key (exclusive to Inngest and Edge Functions).

---
_Scan Date: 2026-03-08_
