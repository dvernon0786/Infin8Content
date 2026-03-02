# Workflow Guide: Deterministic Generation Engine

Generated: 2026-02-28
Domain: **Lifecycle & Generation**
Protocol: **Zero Drift Protocol**

## 🏗️ The Single Authority Model

Infin8Content enforces a strict separation between **Trigger** (Authority) and **Processor** (Execution).

### 1. Trigger API (`app/api/articles/generate/route.ts`)
-   **Role**: The ONLY entry point for starting article generation.
-   **Logic**: Validates organization credits, checks current article status, and emits the `article.generate` event to Inngest.
-   **Constraint**: No complex logic—only validation and event emission.

### 2. Inngest Worker (`lib/inngest/functions/generate-article.ts`)
-   **Role**: The pure processor.
-   **Logic**: Ingests the event, executes research, calls LLMs, and updates the database.
-   **Constraint**: Must be idempotent. It does not "decide" if an article should start; it simply executes the command given by the Trigger.

## 🔄 The Article Finite State Machine (FSM)

The system uses a flattened, deterministic status lifecycle:

| Status | Source | Transition Trigger |
| :--- | :--- | :--- |
| `queued` | Trigger API | User initiates generation |
| `researching` | Inngest | Planner begins data ingestion |
| `outlining` | Inngest | Structure generation started |
| `generating` | Inngest | Section-by-section writing in progress |
| `reviewing` | Inngest | Post-processing / Quality check |
| `completed` | Inngest | Content sealed and ready for publish |
| `failed` | Inngest/System | Error caught; retry logic exhausted |

## 🛡️ Zero Drift Protocol Enforcement

To prevent state inconsistency ("drift"), the following rules are strictly enforced:

1.  **No Side Mutations**: UI components (Dashboards, Edit forms) are forbidden from updating `status`. They may only call APIs.
2.  **Deterministic Transitions**: Steps may not be skipped. A `queued` article must go through `researching` before `generating`.
3.  **Database as Ground Truth**: Real-time subscriptions deliver the database state to the UI. The UI does not "guess" progress.
4.  **Service-Side Locks**: Bulk operations use a transaction-wrapped check to ensure no two processes can mutate the same article simultaneously.

## 📦 Core Workflow Files

-   `lib/inngest/functions/article-generate-planner.ts`: Orchestrates the high-level plan (Research -> Outline -> Generate).
-   `lib/inngest/functions/generate-article.ts`: Handles the heavy lifting of LLM calls and content synthesis.
-   `lib/services/bulk-operations.ts`: Manages batch transitions for article management (Archive, Delete, Re-run).

---
*Reference: [Zero Legacy FSM Completion](./zero-legacy-fsm-completion.md)*
