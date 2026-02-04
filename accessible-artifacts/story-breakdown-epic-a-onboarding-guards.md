---
title: "Story Breakdown: Epic A - Onboarding System & Guards"
epic: "A"
prd_version: "1.0"
status: "READY FOR ARCHITECT"
date: "2026-02-04"
---

# 📖 Story Breakdown: Epic A – Onboarding System & Guards

**Epic:** A (Onboarding System & Guards)  
**PRD Version:** 1.0 (LOCKED)  
**Status:** Ready for Architect  
**Total Stories:** 6  
**Dependencies:** None (foundational)

---

## Epic A Overview

**Purpose:** Implement a 6-step onboarding wizard with server-side validation and hard route guards that prevent dashboard access until onboarding is complete.

**Scope:**
- 6-step wizard UI (Business → Competitors → Blog → Articles → Keywords → Integration)
- Server-side validator (authoritative)
- Route guards (hard gates)
- API guards (403 ONBOARDING_INCOMPLETE)
- Data model extensions (organizations table)

**Out of Scope:**
- Intent Engine execution (Epic B)
- Keyword generation (Epic 35)
- Article generation (Epic 38)
- Perplexity integration (Epic B)

---

## A-1: Data Model Extensions

**Story:** As a system, I need to extend the organizations table to store onboarding configuration so that onboarding state is persistent and authoritative.

**Type:** Infrastructure / Database  
**Complexity:** Low  
**Effort:** 2 hours  
**Dependencies:** None

### Acceptance Criteria

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

### Technical Specifications

**Migration File:** `supabase/migrations/[timestamp]_add_onboarding_columns_to_organizations.sql`

```sql
ALTER TABLE organizations
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_version TEXT DEFAULT 'v1',
ADD COLUMN website_url TEXT,
ADD COLUMN business_description TEXT,
ADD COLUMN target_audiences TEXT[],
ADD COLUMN blog_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN content_defaults JSONB DEFAULT '{}'::jsonb,
ADD COLUMN keyword_settings JSONB DEFAULT '{}'::jsonb;

CREATE INDEX idx_organizations_onboarding_completed 
ON organizations(onboarding_completed);
```

**Type Definitions:** `types/organization.ts`
- Add `OnboardingConfig` interface
- Add `BlogConfig` interface
- Add `ContentDefaults` interface
- Add `KeywordSettings` interface

### Testing

- [ ] Migration applies cleanly
- [ ] Migration rolls back cleanly
- [ ] New columns are queryable
- [ ] RLS policies still enforce organization isolation
- [ ] Existing organizations have correct defaults

---

## A-2: Onboarding Guard Middleware

**Story:** As a system, I need to implement route guards that redirect unauthenticated or non-onboarded users to the onboarding flow so that the dashboard is protected.

**Type:** Backend / Middleware  
**Complexity:** Medium  
**Effort:** 4 hours  
**Dependencies:** A-1

### Acceptance Criteria

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

### Technical Specifications

**Middleware File:** `app/middleware.ts` (extend existing)

```typescript
export function middleware(request: NextRequest) {
  // Check if user is authenticated
  // Check if organization.onboarding_completed
  // If not, redirect to /onboarding/business
  // If yes, allow request
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/articles/:path*',
    '/keywords/:path*',
    '/intent/:path*',
  ],
};
```

**Guard Function:** `lib/guards/onboarding-guard.ts`

```typescript
export async function checkOnboardingComplete(
  organizationId: string
): Promise<boolean> {
  // Query organizations table
  // Return onboarding_completed value
}
```

### Testing

- [ ] Unauthenticated users cannot access protected routes
- [ ] Authenticated users with incomplete onboarding are redirected
- [ ] Authenticated users with complete onboarding can access routes
- [ ] Redirect is silent (no error toast)
- [ ] Allowed routes work without onboarding
- [ ] Middleware does not break existing functionality

---

## A-3: Onboarding API Endpoints

**Story:** As a developer, I need to implement API endpoints for each onboarding step so that the frontend can persist user input server-side.

**Type:** Backend / API  
**Complexity:** Medium  
**Effort:** 6 hours  
**Dependencies:** A-1, A-2

### Acceptance Criteria

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

### Technical Specifications

**Endpoint Contracts:**

```typescript
// POST /api/onboarding/business
Request: {
  website_url: string (required, valid URL)
  business_description: string (required, min 10 chars)
  target_audiences?: string[] (optional)
}
Response: {
  success: true
  data: { website_url, business_description, target_audiences }
}

// POST /api/onboarding/competitors
Request: {
  competitors: string[] (required, 3-7 URLs)
}
Response: {
  success: true
  data: { competitors: [{ url, domain }] }
}

// POST /api/onboarding/blog
Request: {
  blog_root?: string (optional, valid URL)
  sitemap_url?: string (optional, valid URL)
  reference_articles?: string[] (optional, valid URLs)
}
Response: {
  success: true
  data: { blog_config }
}

// POST /api/onboarding/content-defaults
Request: {
  language: string (required)
  tone: string (required)
  internal_links: boolean (required)
  auto_publish: boolean (required)
  global_instructions?: string (optional)
}
Response: {
  success: true
  data: { content_defaults }
}

// POST /api/onboarding/keyword-settings
Request: {
  region: string (required)
  auto_generate: boolean (required)
  keyword_limits?: number (optional)
}
Response: {
  success: true
  data: { keyword_settings }
}

// POST /api/onboarding/integration
Request: {
  platform?: string (optional: wordpress, webflow, custom, none)
  credentials?: object (optional, platform-specific)
}
Response: {
  success: true
  data: { integration_config }
}

// POST /api/onboarding/complete
Request: {} (no body)
Response: {
  success: true
  data: { onboarding_completed: true }
}
```

**Validation Schema:** `lib/validation/onboarding-schema.ts`
- Use Zod for all input validation
- Separate schema per endpoint
- Clear error messages

### Testing

- [ ] All endpoints require authentication (401 if not)
- [ ] All endpoints validate input (400 if invalid)
- [ ] All endpoints save data correctly
- [ ] All endpoints enforce organization isolation
- [ ] All endpoints are idempotent
- [ ] Competitors endpoint enforces 3-7 limit
- [ ] Complete endpoint marks onboarding_completed = true
- [ ] Complete endpoint returns 403 if required steps incomplete

---

## A-4: Onboarding UI Components

**Story:** As a user, I need a 6-step onboarding wizard UI so that I can configure my organization before creating workflows.

**Type:** Frontend / UI  
**Complexity:** High  
**Effort:** 8 hours  
**Dependencies:** A-1, A-2, A-3

### Acceptance Criteria

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

### Technical Specifications

**Component Structure:**
- `components/onboarding/OnboardingWizard.tsx` (main container)
- `components/onboarding/Stepper.tsx` (progress indicator)
- `components/onboarding/StepBusiness.tsx`
- `components/onboarding/StepCompetitors.tsx`
- `components/onboarding/StepBlog.tsx`
- `components/onboarding/StepContentDefaults.tsx`
- `components/onboarding/StepKeywordSettings.tsx`
- `components/onboarding/StepIntegration.tsx`
- `components/onboarding/StepCompletion.tsx`

**State Management:**
- Use React hooks (useState, useReducer)
- Track current step
- Track form state per step
- Track validation state
- Track loading state

**Styling:**
- Use Tailwind CSS
- Use brand colors from design system
- Use spacing tokens (16px, 24px, 32px)
- Use shadow system (subtle shadow on cards)

### Testing

- [ ] All 6 steps render correctly
- [ ] Stepper shows correct state for each step
- [ ] Form validation works (real-time)
- [ ] Buttons are disabled/enabled correctly
- [ ] Navigation works (next, back, skip)
- [ ] Mobile responsive (buttons stacked, stepper scrollable)
- [ ] Brand colors used consistently
- [ ] No emojis in onboarding
- [ ] Accessibility compliant (WCAG 2.1 AA)

---

## A-5: Onboarding Agent (AI Autocomplete)

**Story:** As a user, I want to autocomplete my business information using AI so that onboarding is faster and more accurate.

**Type:** Backend / Integration  
**Complexity:** Medium  
**Effort:** 4 hours  
**Dependencies:** A-3

### Acceptance Criteria

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

### Technical Specifications

**Endpoint Contract:**

```typescript
POST /api/onboarding/autocomplete-business
Request: {
  website_url: string (required, valid URL)
  linkedin_url?: string (optional)
}
Response: {
  success: true
  data: {
    business_name: string
    description: string
    target_audiences: string[]
    pain_points: string[]
    goals: string[]
  }
}
```

**AI Service:** Use Perplexity Sonar or Firecrawl
- Extract business info from website
- Generate structured summary
- Return as JSON

**Frontend Behavior:**
- Show skeleton loaders while loading
- Populate fields progressively
- Allow user to edit all fields
- Never auto-advance
- Show error if extraction fails

### Testing

- [ ] Endpoint requires authentication
- [ ] Endpoint validates URL
- [ ] Endpoint extracts business info correctly
- [ ] Frontend shows skeleton loaders
- [ ] Frontend populates fields progressively
- [ ] User can edit all fields
- [ ] No auto-advance after completion
- [ ] Error handling if extraction fails

---

## A-6: Onboarding Validator

**Story:** As a system, I need to validate that all required onboarding steps are complete before allowing workflow creation so that the Intent Engine has valid configuration.

**Type:** Backend / Validation  
**Complexity:** Low  
**Effort:** 2 hours  
**Dependencies:** A-1, A-3

### Acceptance Criteria

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

### Technical Specifications

**Validator Function:** `lib/validators/onboarding-validator.ts`

```typescript
export async function validateOnboardingComplete(
  organizationId: string
): Promise<{ valid: boolean; errors?: string[] }> {
  // Query organizations table
  // Check all required fields
  // Return validation result
}
```

**Error Response:**

```typescript
{
  error: "ONBOARDING_INCOMPLETE",
  status: 403,
  details: [
    "website_url is required",
    "business_description is required",
    "competitors: minimum 3 required"
  ]
}
```

### Testing

- [ ] Validator checks all required fields
- [ ] Validator returns true if all fields valid
- [ ] Validator returns false with error list if any field invalid
- [ ] Validator is called before workflow creation
- [ ] Workflow creation fails with 403 if validation fails
- [ ] Workflow creation succeeds if validation passes

---

## Epic A Summary

**Total Stories:** 6  
**Total Effort:** 26 hours  
**Dependencies:** None (foundational)

**Story Order (Sequential):**
1. A-1: Data Model Extensions (2 hours)
2. A-2: Onboarding Guard Middleware (4 hours)
3. A-3: Onboarding API Endpoints (6 hours)
4. A-4: Onboarding UI Components (8 hours)
5. A-5: Onboarding Agent (AI Autocomplete) (4 hours)
6. A-6: Onboarding Validator (2 hours)

**Deliverables:**
- ✅ Extended organizations table
- ✅ Route guards (hard gates)
- ✅ API endpoints (all 7)
- ✅ UI wizard (6 steps + completion)
- ✅ AI autocomplete service
- ✅ Onboarding validator

**Success Criteria:**
- 100% of users complete onboarding without confusion
- 100% of workflows created have valid onboarding config
- No bypass paths to dashboard
- No frontend-only validation

---

**Epic A Status: READY FOR ARCHITECT**
