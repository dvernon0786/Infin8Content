# API Contracts - Full Route Catalog

Deep Scan: 2026-04-22
Source: `infin8content/app/api/` (115+ route files)
Auth: Session cookie (Supabase JWT) unless marked **API Key**

---

## Article APIs

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/articles` | List / create articles |
| POST | `/api/articles/generate` | **Trigger API** — initiates FSM pipeline; transitions `backlog→queued` |
| POST | `/api/articles/publish` | Publish article to CMS |
| GET | `/api/articles/usage` | Org article usage stats |
| GET | `/api/articles/[id]/publish-history` | CMS publish history |
| POST | `/api/articles/[id]/schedule` | Schedule future publish |

---

## Intent Workflow APIs

Core 9-step ICP/keyword pipeline. All routes are org-scoped.

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/intent/workflows` | List / create intent workflows |
| GET | `/api/intent/workflows/dashboard` | Dashboard summary |
| GET | `/api/intent/workflows/[id]` | Single workflow detail |
| POST | `/api/intent/workflows/[id]/cancel` | Cancel workflow |
| GET | `/api/intent/workflows/[id]/articles/progress` | Article generation progress |
| GET | `/api/intent/workflows/[id]/blocking-conditions` | Gate blockers |
| POST | `/api/intent/workflows/[id]/steps/icp-generate` | Step 1: ICP generation |
| POST | `/api/intent/workflows/[id]/steps/competitor-analyze` | Step 2: Competitor analysis |
| POST | `/api/intent/workflows/[id]/steps/seed-extract` | Step 3: Seed keyword extraction |
| POST | `/api/intent/workflows/[id]/steps/approve-seeds` | Step 4: Human seed approval |
| POST | `/api/intent/workflows/[id]/steps/longtail-expand` | Step 5: Longtail expansion |
| POST | `/api/intent/workflows/[id]/steps/filter-keywords` | Step 6: Keyword filtering |
| POST | `/api/intent/workflows/[id]/steps/cluster-topics` | Step 7: Topic clustering |
| POST | `/api/intent/workflows/[id]/steps/validate-clusters` | Step 8: Cluster validation |
| POST | `/api/intent/workflows/[id]/steps/human-approval` | Step 9: Human approval gate |
| GET | `/api/intent/workflows/[id]/steps/human-approval/summary` | Approval summary |
| POST | `/api/intent/workflows/[id]/steps/link-articles` | Link generated articles |
| POST | `/api/intent/workflows/[id]/steps/queue-articles` | Queue articles for generation |
| GET | `/api/intent/audit/logs` | Workflow audit log |

**Workflow subtopic actions**:
| Method | Route |
|--------|-------|
| POST | `/api/workflows/[id]/approve-subtopics-bulk` |
| POST | `/api/workflows/[id]/complete-step-8` |
| GET | `/api/workflows/[id]/subtopics-for-review` |

---

## Auth APIs

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/register` | New account creation |
| POST | `/api/auth/logout` | Session invalidation |
| POST | `/api/auth/forgot-password` | Password reset email |
| POST | `/api/auth/verify-otp` | OTP verification |
| POST | `/api/auth/resend-otp` | Resend OTP |
| GET | `/auth/callback` | OAuth callback (Supabase redirect) |

---

## Onboarding APIs

7-step onboarding wizard backend:

| Method | Route | Wizard Step |
|--------|-------|-------------|
| POST | `/api/onboarding/business` | Step 1: Business profile |
| POST | `/api/onboarding/competitors` | Step 2: Competitors |
| POST | `/api/onboarding/blog` | Step 3: Blog config |
| POST | `/api/onboarding/keyword-settings` | Step 4: Keyword preferences |
| POST | `/api/onboarding/content-defaults` | Step 5: Content defaults |
| POST | `/api/onboarding/integration` | Step 6: CMS integration |
| POST | `/api/onboarding/persist` | Full persist (all steps) |
| POST | `/api/onboarding/persist-minimal` | Minimal persist |
| GET | `/api/onboarding/observe` | State observation |

---

## SEO APIs

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/seo/score` | Real-time SEO score for content |
| POST | `/api/seo/validate` | SEO validation against rules |
| GET | `/api/seo/recommendations/[articleId]` | Article-specific recommendations |
| GET | `/api/seo/reports/[articleId]` | Full SEO report |
| POST | `/api/seo/performance-test` | Performance benchmarking |

---

## Analytics APIs

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/analytics/metrics` | Core content metrics |
| GET | `/api/analytics/trends` | Trend data |
| GET | `/api/analytics/recommendations` | AI-driven improvement suggestions |
| GET | `/api/analytics/weekly-report` | Weekly digest |
| POST | `/api/analytics/share` | Share analytics snapshot |
| GET | `/api/analytics/export/csv` | CSV data export |
| GET | `/api/analytics/export/pdf` | PDF report export |

---

## Research APIs

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/research/keywords` | Keyword research via DataForSEO (24h cached) |
| GET/POST | `/api/keywords/[keyword_id]/subtopics` | Subtopic generation |
| POST | `/api/keywords/[keyword_id]/approve-subtopics` | Subtopic approval |

---

## CMS Connections APIs

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/cms-connections` | List / create CMS connections |
| GET/PUT/DELETE | `/api/cms-connections/[id]` | Single connection CRUD |
| POST | `/api/cms-connections/[id]/test` | Test connection credentials |

---

## Team Management APIs

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/team/members` | List org members |
| POST | `/api/team/invite` | Send invitation |
| POST | `/api/team/accept-invitation` | Accept invite |
| POST | `/api/team/cancel-invitation` | Cancel pending invite |
| POST | `/api/team/resend-invitation` | Resend invite email |
| POST | `/api/team/remove-member` | Remove member from org |
| POST | `/api/team/update-role` | Change member role |

---

## Payment APIs

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/payment/create-checkout-session` | Stripe checkout |
| POST | `/api/payment/create-portal-session` | Stripe billing portal |
| POST | `/api/webhooks/stripe` | Stripe webhook receiver |

---

## LLM Visibility APIs

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/llm-visibility/projects` | List / create visibility projects |
| GET | `/api/llm-visibility/projects/[id]/runs` | Run history |
| GET | `/api/llm-visibility/projects/[id]/snapshots` | Brand presence snapshots |
| GET | `/api/llm-visibility/projects/[id]/prompts` | Tracked prompts |
| POST | `/api/llm-visibility/projects/[id]/suggest-prompts` | AI prompt suggestions |
| POST | `/api/llm-visibility/projects/[id]/rerun` | Trigger new tracking run |

---

## Webhook Endpoints APIs

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/webhook-endpoints` | Manage outbound webhooks |
| GET/PUT/DELETE | `/api/webhook-endpoints/[id]` | Single webhook CRUD |
| POST | `/api/webhook-endpoints/[id]/test` | Test delivery |
| POST | `/api/webhooks/receive/[webhook_id]` | Inbound webhook handler |
| POST | `/api/webhooks/outstand` | Outstand social platform webhook |

---

## Public v1 API (API Key Auth)

All routes under `/api/v1/` require `Authorization: Bearer <api_key>`.

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/v1/articles` | List / create articles |
| GET/PUT/DELETE | `/api/v1/articles/[id]` | Single article CRUD |
| POST | `/api/v1/articles/generate` | Trigger article generation |
| POST | `/api/v1/articles/[id]/publish` | Publish to CMS |
| POST | `/api/v1/articles/[id]/publish-social` | Publish to social |
| GET | `/api/v1/articles/[id]/caption` | Generate caption |
| GET | `/api/v1/articles/[id]/social-analytics` | Social performance |
| GET | `/api/v1/analytics/articles/[id]` | Article analytics |
| POST | `/api/v1/keywords/research` | Keyword research |
| GET/POST | `/api/v1/api-keys` | Manage API keys |
| DELETE | `/api/v1/api-keys/[id]` | Revoke key |
| GET | `/api/v1/social/accounts` | Social accounts |

---

## Admin APIs (Internal)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/metrics/dashboard` | Admin metrics dashboard |
| POST | `/api/admin/metrics/collect` | Collect metrics snapshot |
| GET | `/api/admin/metrics/efficiency-summary` | Efficiency analysis |
| GET | `/api/admin/performance/metrics` | Performance data |
| GET/POST | `/api/admin/feature-flags` | Feature flag management |
| POST | `/api/admin/reset-sql-usage` | Reset SQL usage counter |
| GET | `/api/admin/ux-metrics/rollups` | UX metrics rollups |
| GET | `/api/admin/debug/analytics` | Debug analytics data |

---

## Misc APIs

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/ai/autocomplete` | AI autocomplete suggestions |
| GET/POST | `/api/announcements` | System announcements |
| POST | `/api/announcements/[id]/read` | Mark announcement read |
| GET | `/api/dashboard/integrations` | Integration status |
| GET/POST | `/api/feature-flags` | Feature flags (user-facing) |
| POST | `/api/feedback` | User feedback submission |
| POST | `/api/inngest` | **Inngest webhook** — all background jobs dispatch here |
| PUT | `/api/organizations/update` | Org settings update |
| GET/POST | `/api/tags` | Article tag management |
| DELETE | `/api/user/delete` | GDPR user deletion |
| GET | `/api/user/export` | GDPR data export |

---

## Standard Response Format

All routes return:
```json
{ "success": true, "data": { ... } }
// or
{ "success": false, "error": "message", "code": "ERROR_CODE" }
```

HTTP status codes: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Rate Limited`, `500 Internal Error`

---

*Auth: Supabase JWT session cookie (set via `lib/supabase/middleware.ts`)*  
*v1 API auth: `lib/api-auth/with-api-auth.ts` + `lib/api-auth/validate-api-key.ts`*
