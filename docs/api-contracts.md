# API Contracts - Exhaustive Catalog

Generated: 2026-02-28
Registry: **infin8content**

## Core Generation APIs

### `POST /api/articles/generate`
- **Purpose**: Initiates the deterministic generation pipeline.
- **Payload**: `{ articleId: string, options?: GenerationOptions }`
- **Security**: Org-check required.
- **Transition**: `backlog` -> `queued`.

### `POST /api/articles/publish`
- **Purpose**: Pure processor for WordPress/CMS export.
- **Payload**: `{ articleId: string, credentialsId: string }`
- **Side Effects**: CMS API calls, status update to `published`.

### `POST /api/articles/bulk` (via `bulk-operations.ts`)
- **Purpose**: High-throughput lifecycle management.
- **Supported Actions**: `archive`, `delete`, `reset_status`.

## Research & SEO APIs

### `POST /api/research/keywords`
- **Purpose**: Fetch keyword data from DataForSEO.
- **Caching**: 24h TTL enforced in lib layer.

### `POST /api/seo/score`
- **Purpose**: Real-time content analysis against E-E-A-T benchmarks.

## Onboarding & Management

### `POST /api/onboarding/business`
- **Purpose**: Initial profile creation for the organization.

### `GET /api/onboarding/status`
- **Purpose**: State check for organization setup completeness.

## Service Integration Layer

| Service | Client | Description |
| :--- | :--- | :--- |
| **LLM** | OpenRouter | Multi-model failover for generation. |
| **Jobs** | Inngest | Async event processing. |
| **Auth/DB** | Supabase | RLS-enforced data access. |
| **Payment**| Stripe | Subscription & Quota enforcement. |

---
*All APIs return standardized JSON with HTTP Status Codes (200 OK, 400 Bad Request, 401 Unauthorized, 500 Internal Error).*
