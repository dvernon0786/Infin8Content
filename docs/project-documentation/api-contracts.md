# API Contracts: Infin8Content

This document catalogs the primary internal API endpoints used by the Infin8Content platform.

## 🔑 Authentication Endpoints
*Managed by Supabase Auth, but complemented by internal routes.*

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/auth/callback` | GET | Handles OAuth redirect and session establishment. |
| `/api/debug/auth-test`| GET | Validates the current user session and RLS context. |

## 📝 Content Generation & Onboarding

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/onboarding/persist`| POST | Triggers the Inngest generation workflow. |
| `/api/onboarding/status` | GET | Checks the progress of the current creation session. |
| `/api/onboarding/blog` | POST | Persists blog-specific configuration (Brand voice, URL). |
| `/api/onboarding/competitors`| POST | Analyzes and stores competitor data. |
| `/api/onboarding/integration`| POST | Validates CMS (e.g., WordPress) credentials. |

## 🔍 Research & SEO

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/research/keywords` | POST | Interfaces with DataForSEO/Tavily for keyword metrics. |
| `/api/seo/score` | POST | Calculates quality and SEO score for a section. |
| `/api/seo/recommendations/[id]`| GET | Returns AI-generated fixes for an article. |
| `/api/seo/validate` | POST | Real-time validation of content structure. |

## 📊 User & Workspace Management

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/user/export` | GET | Generates a CSV/JSON export of all user-owned data. |
| `/api/user/delete` | DELETE | Executes the multi-table deletion of all user records. |
| `/api/organizations` | POST | Creates a new organization workspace. |

## 🛠️ Internal & Debugging

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/debug/payment-status`| GET | Triggers a sync of Stripe subscription state. |
| `/api/debug/inngest-env` | GET | Validates Inngest environment variables. |
| `/api/internal/test-create-workflow`| POST | Simulates a complex generation workflow for testing. |

---
**Protocol Note**: All endpoints return standard JSON responses. Success is denoted by `200 OK` or `201 Created`. Error responses follow the `{ error: string }` pattern with appropriate HTTP status codes.
