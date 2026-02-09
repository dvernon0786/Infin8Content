---
title: "Stories Registry: Epics A, B, C (Formalized)"
prd_version: "1.0"
status: "READY FOR SPRINT PLANNING"
date: "2026-02-04"
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories"]
totalStories: 15
totalEffort: "72 hours"
---

# 📋 Stories Registry: Epics A, B, C (Formalized)

**Project:** Infin8Content  
**PRD Version:** 1.0 (LOCKED)  
**Status:** Ready for Sprint Planning  
**Date:** 2026-02-04

---

## Executive Summary

This document formally registers all stories from Epics A, B, and C as extracted from the authoritative story breakdown documents. All stories are registered verbatim without modification or re-derivation.

**Total Stories:** 15  
**Total Effort:** 72 hours  
**Epic Breakdown:**
- Epic A: 6 stories (26 hours)
- Epic B: 5 stories (26 hours)
- Epic C: 4 stories (20 hours)

---

## Epic A: Onboarding System & Guards

**Purpose:** Implement a 6-step onboarding wizard with server-side validation and hard route guards that prevent dashboard access until onboarding is complete.

**Total Stories:** 6  
**Total Effort:** 26 hours  
**Dependencies:** None (foundational)

---

### A-1: Data Model Extensions

**Story:** As a system, I need to extend the organizations table to store onboarding configuration so that onboarding state is persistent and authoritative.

**Type:** Infrastructure / Database  
**Complexity:** Low  
**Effort:** 2 hours  
**Dependencies:** None

#### Acceptance Criteria

1. **Given** the organizations table exists  
   **When** I add new columns  
   **Then** the following columns are added:
   - `onboarding_completed` (BOOLEAN, DEFAULT false)
   - `onboarding_version` (TEXT, DEFAULT 'v1')
   - `website_url` (TEXT, nullable)
   - `business_description` (TEXT, nullable)
   - `target_audiences` (TEXT[], nullable)
   - `blog_config` (JSONB, DEFAULT '{}')
   - `content_defaults` (JSONB, DEFAULT '{}')
   - `keyword_settings` (JSONB, DEFAULT '{}')

2. **And** all columns have appropriate indexes for query performance

3. **And** RLS policies are updated to include new columns in organization isolation

4. **And** a migration file is created with rollback capability

---

### A-2: Onboarding Guard Middleware

**Story:** As a system, I need to implement route guards that redirect unauthenticated or non-onboarded users to the onboarding flow so that the dashboard is protected.

**Type:** Backend / Middleware  
**Complexity:** Medium  
**Effort:** 4 hours  
**Dependencies:** A-1

#### Acceptance Criteria

1. **Given** a user is authenticated but onboarding is incomplete  
   **When** they navigate to `/dashboard`  
   **Then** they are redirected to `/onboarding/business`

2. **And** the redirect is silent (no error message)

3. **And** the following routes are protected:
   - `/dashboard`
   - `/articles`
   - `/keywords`
   - `/intent/workflows/*`
   - `/intent/*`

4. **And** the following routes are allowed without onboarding:
   - `/onboarding/*`
   - `/billing`
   - `/settings/profile`
   - `/logout`

5. **And** the guard checks `organizations.onboarding_completed` server-side

6. **And** the guard is applied via middleware (not per-route)

---

### A-3: Onboarding API Endpoints

**Story:** As a developer, I need to implement API endpoints for each onboarding step so that the frontend can persist user input server-side.

**Type:** Backend / API  
**Complexity:** Medium  
**Effort:** 6 hours  
**Dependencies:** A-1, A-2

#### Acceptance Criteria

1. **Given** the onboarding wizard is active  
   **When** a user completes a step  
   **Then** the following endpoints exist and work:
   - `POST /api/onboarding/business` (save business info)
   - `POST /api/onboarding/competitors` (save competitors)
   - `POST /api/onboarding/blog` (save blog config)
   - `POST /api/onboarding/content-defaults` (save article rules)
   - `POST /api/onboarding/keyword-settings` (save keyword settings)
   - `POST /api/onboarding/integration` (save integration config)
   - `POST /api/onboarding/complete` (mark onboarding complete)

2. **And** all endpoints require authentication

3. **And** all endpoints validate input server-side

4. **And** all endpoints return 400 with validation errors if input is invalid

5. **And** all endpoints return 200 with saved data on success

6. **And** all endpoints enforce organization isolation (RLS)

7. **And** all endpoints are idempotent (re-running does not duplicate data)

---

### A-4: Onboarding UI Components

**Story:** As a user, I need a 6-step onboarding wizard UI so that I can configure my organization before creating workflows.

**Type:** Frontend / UI  
**Complexity:** High  
**Effort:** 8 hours  
**Dependencies:** A-1, A-2, A-3

#### Acceptance Criteria

1. **Given** I am authenticated and onboarding is incomplete  
   **When** I navigate to `/onboarding/business`  
   **Then** I see the onboarding wizard

2. **And** the wizard has a horizontal stepper at the top showing all 6 steps

3. **And** the stepper shows:
   - Current step (brand blue, bold)
   - Completed steps (brand blue, check icon)
   - Upcoming steps (neutral gray)

4. **And** the stepper is non-clickable (progress indicator only)

5. **And** each step has:
   - Title + explanatory copy
   - Form inputs in a white card
   - Info box explaining why we ask
   - Primary CTA ("Next Step" or "Complete Setup")
   - Secondary CTA ("Back" or "Skip & Add Later")

6. **And** buttons follow locked design:
   - Primary: Brand blue background, white text
   - Secondary: Transparent, brand blue border
   - Disabled: Gray, with tooltip explaining why

7. **And** form validation is real-time (not submit-only)

8. **And** primary button is disabled until all required fields are valid

9. **And** the UI is responsive (mobile: stacked buttons, scrollable stepper)

10. **And** the UI follows brand system (colors, typography, spacing)

---

### A-5: Onboarding Agent (AI Autocomplete)

**Story:** As a user, I want to autocomplete my business information using AI so that onboarding is faster and more accurate.

**Type:** Backend / Integration  
**Complexity:** Medium  
**Effort:** 4 hours  
**Dependencies:** A-3

#### Acceptance Criteria

1. **Given** I enter a website URL on the Business step  
   **When** I click "Auto-fill with AI"  
   **Then** the system calls an AI service to extract business info

2. **And** the following fields are populated:
   - Business Name
   - Business Description
   - Target Audiences (as tags)

3. **And** the fields are populated progressively (skeleton loaders shown)

4. **And** the user can edit all populated fields (no locked fields)

5. **And** the system never auto-advances after AI completes

6. **And** the endpoint is `POST /api/onboarding/autocomplete-business`

7. **And** the endpoint requires authentication

8. **And** the endpoint validates the website URL

9. **And** the endpoint returns 400 if URL is invalid

10. **And** the endpoint returns 200 with populated data on success

---

### A-6: Onboarding Validator

**Story:** As a system, I need to validate that all required onboarding steps are complete before allowing workflow creation so that the Intent Engine has valid configuration.

**Type:** Backend / Validation  
**Complexity:** Low  
**Effort:** 2 hours  
**Dependencies:** A-1, A-3

#### Acceptance Criteria

1. **Given** a user tries to create an Intent workflow  
   **When** I check if onboarding is complete  
   **Then** the system validates:
   - `onboarding_completed = true`
   - `website_url` is not null
   - `business_description` is not null
   - `target_audiences` is not empty
   - `competitors` table has 3-7 entries
   - `content_defaults` is not empty
   - `keyword_settings` is not empty

2. **And** if validation passes, the workflow can be created

3. **And** if validation fails, the system returns 403 with error details

4. **And** the validator is called before any workflow execution

5. **And** the validator is server-side (not frontend-only)

---

## Epic B: Deterministic Article Pipeline

**Purpose:** Implement a deterministic, section-by-section article generation pipeline that processes articles sequentially (Planner → Research → Content → Assembly) with no parallel execution.

**Total Stories:** 5  
**Total Effort:** 26 hours  
**Dependencies:** Epic A (onboarding must be complete)

---

### B-1: Article Sections Data Model

**Story:** As a system, I need to persist article sections with their research and content so that I can track progress and enable retries per section.

**Type:** Infrastructure / Database  
**Complexity:** Low  
**Effort:** 2 hours  
**Dependencies:** None

#### Acceptance Criteria

1. **Given** articles need section-level tracking  
   **When** I create the article_sections table  
   **Then** the following columns exist:
   - `id` (UUID, primary key)
   - `article_id` (UUID, foreign key to articles)
   - `section_order` (INTEGER, 1-based)
   - `section_header` (TEXT, e.g., "Introduction")
   - `section_type` (TEXT, e.g., "body", "conclusion")
   - `planner_payload` (JSONB, structure from Planner Agent)
   - `research_payload` (JSONB, research results from Perplexity)
   - `content_markdown` (TEXT, generated markdown)
   - `content_html` (TEXT, rendered HTML)
   - `status` (TEXT, enum: pending, researching, researched, writing, completed, failed)
   - `error_details` (JSONB, error info if failed)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

2. **And** a unique constraint on (article_id, section_order)

3. **And** RLS policies enforce organization isolation via articles table

4. **And** a migration file is created with rollback capability

---

### B-2: Research Agent Service

**Story:** As a system, I need to call Perplexity Sonar to research each section so that content is grounded in current information.

**Type:** Backend / Integration  
**Complexity:** High  
**Effort:** 6 hours  
**Dependencies:** B-1

#### Acceptance Criteria

1. **Given** a section needs research  
   **When** I call the Research Agent  
   **Then** the system calls Perplexity Sonar with:
   - Fixed prompt (locked, no variation)
   - Section header + context
   - Prior sections (for context)
   - Max 10 searches per section

2. **And** the system persists research results to article_sections.research_payload

3. **And** the system updates section status: pending → researching → researched

4. **And** the system includes full answers + citations in research_payload

5. **And** the system handles errors gracefully (retry logic, error logging)

6. **And** the system never modifies the fixed prompt

7. **And** research completes within 30 seconds per section

---

### B-3: Content Writing Agent Service

**Story:** As a system, I need to call an LLM to write each section based on research so that content is high-quality and coherent.

**Type:** Backend / Integration  
**Complexity:** High  
**Effort:** 6 hours  
**Dependencies:** B-2

#### Acceptance Criteria

1. **Given** a section has been researched  
   **When** I call the Content Writing Agent  
   **Then** the system calls an LLM with:
   - Fixed prompt (locked, no variation)
   - Section header + type
   - Research results
   - Prior sections (for context)
   - Organization content defaults

2. **And** the system generates markdown content for the section

3. **And** the system persists content to article_sections.content_markdown

4. **And** the system converts markdown to HTML and persists to content_html

5. **And** the system updates section status: researched → writing → completed

6. **And** the system includes prior sections in context (for coherence)

7. **And** the system never modifies the fixed prompt

8. **And** content generation completes within 60 seconds per section

---

### B-4: Sequential Orchestration (Inngest)

**Story:** As a system, I need to orchestrate the pipeline sequentially so that sections are processed one at a time in order.

**Type:** Backend / Orchestration  
**Complexity:** High  
**Effort:** 8 hours  
**Dependencies:** B-1, B-2, B-3

#### Acceptance Criteria

1. **Given** an article is queued for generation  
   **When** the pipeline starts  
   **Then** sections are processed sequentially:
   - Section 1: Research → Write → Persist
   - Section 2: Research → Write → Persist
   - Section 3: Research → Write → Persist
   - (etc.)

2. **And** no sections are processed in parallel

3. **And** each section receives prior sections as context

4. **And** if a section fails, the pipeline stops and logs error

5. **And** the article status is updated after each section completes

6. **And** the pipeline is orchestrated via Inngest

7. **And** the pipeline has a maximum timeout of 10 minutes per article

8. **And** retry logic is applied per section (3 attempts, exponential backoff)

---

### B-5: Article Status Tracking

**Story:** As a user, I need to see real-time progress of article generation so that I know when articles will be ready.

**Type:** Backend / API  
**Complexity:** Medium  
**Effort:** 4 hours  
**Dependencies:** B-1, B-4

#### Acceptance Criteria

1. **Given** an article is being generated  
   **When** I query the article status  
   **Then** the system returns:
   - Article status (queued, generating, completed, failed)
   - Progress percentage (based on completed sections)
   - Sections completed / total sections
   - Current section being processed
   - Estimated completion time
   - Error details (if failed)

2. **And** the endpoint is `GET /api/articles/{article_id}/progress`

3. **And** the endpoint requires authentication

4. **And** the endpoint enforces organization isolation

5. **And** the endpoint returns 200 with progress data

6. **And** the endpoint returns 404 if article not found

---

## Epic C: Assembly, Status & Publishing

**Purpose:** Implement article assembly (markdown + HTML), status tracking, and idempotent WordPress publishing.

**Total Stories:** 4  
**Total Effort:** 20 hours  
**Dependencies:** Epic B (pipeline must complete)

---

### C-1: Article Assembly Service

**Story:** As a system, I need to assemble all completed sections into a final article so that the article is ready for publishing.

**Type:** Backend / Service  
**Complexity:** Medium  
**Effort:** 4 hours  
**Dependencies:** B-1

#### Acceptance Criteria

1. **Given** all sections of an article are completed  
   **When** I call the assembly service  
   **Then** the system:
   - Loads all sections in order
   - Combines markdown content
   - Combines HTML content
   - Generates table of contents (from section headers)
   - Adds metadata (word count, reading time, etc.)

2. **And** the system persists final markdown to articles.content_markdown

3. **And** the system persists final HTML to articles.content_html

4. **And** the system updates articles.status = 'completed'

5. **And** the system calculates word count and reading time

6. **And** the system handles missing sections gracefully (error logging)

7. **And** assembly completes within 5 seconds

---

### C-2: Publish References Table

**Story:** As a system, I need to track which articles have been published where so that I can prevent duplicate publishing.

**Type:** Infrastructure / Database  
**Complexity:** Low  
**Effort:** 2 hours  
**Dependencies:** None

#### Acceptance Criteria

1. **Given** articles need to be published idempotently  
   **When** I create the publish_references table  
   **Then** the following columns exist:
   - `id` (UUID, primary key)
   - `article_id` (UUID, foreign key to articles)
   - `platform` (TEXT, e.g., "wordpress")
   - `platform_post_id` (TEXT, external ID from platform)
   - `platform_url` (TEXT, published URL)
   - `published_at` (TIMESTAMPTZ)
   - `created_at` (TIMESTAMPTZ)

2. **And** a unique constraint on (article_id, platform)

3. **And** RLS policies enforce organization isolation via articles table

4. **And** a migration file is created with rollback capability

---

### C-3: WordPress Publishing Service

**Story:** As a system, I need to publish articles to WordPress idempotently so that users can publish with confidence.

**Type:** Backend / Integration  
**Complexity:** High  
**Effort:** 6 hours  
**Dependencies:** C-1, C-2

#### Acceptance Criteria

1. **Given** an article is ready to publish  
   **When** I call the WordPress publishing service  
   **Then** the system:
   - Checks if article already published (via publish_references)
   - If published, returns existing reference (idempotent)
   - If not published, calls WordPress API
   - Sends only: title, content (HTML), status=publish
   - Receives: post_id, link, status
   - Creates publish_reference record
   - Returns published URL

2. **And** the system uses HTTP Basic Auth (Application Passwords)

3. **And** the system enforces HTTPS only

4. **And** the system has a 30-second timeout

5. **And** the system does NOT send: categories, tags, author, featured_media, meta, excerpt

6. **And** the system handles errors gracefully (no auto-retry, user retry via button)

7. **And** the system logs all publishing attempts

---

### C-4: Publishing API Endpoint

**Story:** As a user, I need an API endpoint to publish articles to WordPress so that I can trigger publishing from the UI.

**Type:** Backend / API  
**Complexity:** Medium  
**Effort:** 4 hours  
**Dependencies:** C-3

#### Acceptance Criteria

1. **Given** an article is ready to publish  
   **When** I call `POST /api/articles/{article_id}/publish`  
   **Then** the system:
   - Validates article exists and is completed
   - Validates organization has WordPress integration configured
   - Calls WordPress publishing service
   - Returns published URL
   - Returns 200 on success

2. **And** the endpoint requires authentication

3. **And** the endpoint enforces organization isolation

4. **And** the endpoint validates article status = 'completed'

5. **And** the endpoint returns 400 if article not completed

6. **And** the endpoint returns 403 if no WordPress integration

7. **And** the endpoint returns 500 if publishing fails

8. **And** the endpoint is idempotent (re-publish returns same URL)

---

## Story Dependency Graph

```
EPIC A (Onboarding)
├─ A-1: Data Model Extensions
├─ A-2: Onboarding Guard Middleware (depends: A-1)
├─ A-3: Onboarding API Endpoints (depends: A-1, A-2)
├─ A-4: Onboarding UI Components (depends: A-1, A-2, A-3)
├─ A-5: Onboarding Agent (depends: A-3)
└─ A-6: Onboarding Validator (depends: A-1, A-3)
   ↓
EPIC B (Article Pipeline)
├─ B-1: Article Sections Data Model
├─ B-2: Research Agent Service (depends: B-1)
├─ B-3: Content Writing Agent Service (depends: B-2)
├─ B-4: Sequential Orchestration (depends: B-1, B-2, B-3)
└─ B-5: Article Status Tracking (depends: B-1, B-4)
   ↓
EPIC C (Assembly & Publishing)
├─ C-1: Article Assembly Service (depends: B-1)
├─ C-2: Publish References Table
├─ C-3: WordPress Publishing Service (depends: C-1, C-2)
└─ C-4: Publishing API Endpoint (depends: C-3)
```

---

## Story Sequencing (Recommended Implementation Order)

### Phase 1: Epic A (Onboarding) – 26 hours
1. A-1: Data Model Extensions (2h)
2. A-2: Onboarding Guard Middleware (4h)
3. A-3: Onboarding API Endpoints (6h)
4. A-4: Onboarding UI Components (8h)
5. A-5: Onboarding Agent (4h)
6. A-6: Onboarding Validator (2h)

### Phase 2: Epic B (Article Pipeline) – 26 hours
1. B-1: Article Sections Data Model (2h)
2. B-2: Research Agent Service (6h)
3. B-3: Content Writing Agent Service (6h)
4. B-4: Sequential Orchestration (8h)
5. B-5: Article Status Tracking (4h)

### Phase 3: Epic C (Assembly & Publishing) – 20 hours
1. C-1: Article Assembly Service (4h)
2. C-2: Publish References Table (2h)
3. C-3: WordPress Publishing Service (6h)
4. C-4: Publishing API Endpoint (4h)

---

## Quality Gates

### Epic A Completion
- ✅ All 6 stories implemented
- ✅ 100% of users complete onboarding without confusion
- ✅ 100% of workflows created have valid onboarding config
- ✅ No bypass paths to dashboard
- ✅ No frontend-only validation

### Epic B Completion
- ✅ All 5 stories implemented
- ✅ 100% sections processed sequentially (no parallel execution)
- ✅ 100% prior sections passed as context
- ✅ 100% fixed prompts never modified
- ✅ 100% articles complete without narrative drift
- ✅ 100% retry logic works (3 attempts per section)
- ✅ 100% progress tracking accurate

### Epic C Completion
- ✅ All 4 stories implemented
- ✅ 100% articles assembled correctly
- ✅ 100% publishing is idempotent (no duplicates on retry)
- ✅ 100% users can publish with confidence
- ✅ 100% published URLs tracked
- ✅ 100% error handling graceful

---

## Status

**Registry Status:** READY FOR SPRINT PLANNING  
**All Stories:** Formally registered and verified  
**No Modifications:** All stories extracted verbatim from authoritative source documents  
**Ready for:** Engineering handoff, Jira/Linear/GitHub Projects import, Sprint planning

---

**Next Step:** Proceed to Step 4 (Final Validation) to verify completeness and consistency.
