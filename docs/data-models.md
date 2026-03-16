# Data Models - Schema Deep Scan

Generated: 2026-03-17
Database: **Supabase / PostgreSQL**

## Core Entities

### `articles` (Primary Table)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID (PK)` | Unique identifier. |
| `org_id` | `UUID (FK)` | Organization ownership (RLS root). |
| `status` | `enum` | Lifecycle state (FSM Authority). |
| `keyword` | `TEXT` | Primary SEO target. |
| `content` | `TEXT` | Generated Markdown body. |
| `intent_workflow_id`| `UUID` | Linked Inngest workflow session. |
| `metadata` | `JSONB` | Extensible SEO & system data. |

### `article_sections`
- **Purpose**: Sharded content storage for parallel generation.
- **Keys**: `article_id (FK)`, `section_order`, `status`.

### `organizations`
- **Purpose**: Multi-tenant isolation.
- **Fields**: `name`, `billing_id`, `settings`.

### `audit_logs`
- **Purpose**: Implements the **Deterministic Audit Directive**.
- **Fields**: `user_id`, `org_id`, `action`, `details`, `timestamp`.

## Security Layer (RLS)

- **Isolation**: Every query is filtered by `org_id`.
- **Policy**: `org_id = current_setting('app.current_org_id')::uuid`.
- **Authority**: Only Service Role keys or authenticated org-members can bypass/view.

## Indexes & Performance

- **GIN Index**: `metadata` column for fast JSON queries.
- **B-Tree**: `org_id` and `status` for dashboard filtering.

---
*Migration Source: `supabase/migrations/20260226090000_normalize_article_schema.sql`*
