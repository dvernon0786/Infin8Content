# Story A-4: Onboarding UI Components

**Status**: done  
**Epic**: A – Onboarding System & Guards  
**Date**: 2026-02-05  
**Created by**: SM Agent (Bob)

---

## Story Classification

* **Type**: Consumer (UI)
* **Tier**: Tier 1 (onboarding experience, consumes A-2 and A-3)
* **Epic**: A – Onboarding System & Guards

---

## Business Intent

Provide a guided onboarding user interface that enables organizations to configure required setup information before accessing core product features.

---

## Story

As a user,
I want a step-by-step onboarding wizard,
so that I can configure my organization before using the product.

---

## Acceptance Criteria

1. **Given** I am authenticated and onboarding is incomplete
   **When** I navigate to `/onboarding/business` 
   **Then** I see the onboarding wizard with a horizontal stepper

2. **And** the stepper displays all 6 steps:

   * Current step highlighted in brand primary color
   * Completed steps show a check indicator
   * Upcoming steps shown in neutral style

3. **And** the stepper is non-clickable (progress indicator only)

4. **And** each step contains:

   * Title and explanatory copy
   * Input form inside a white card container
   * Informational context box explaining purpose of inputs
   * Primary CTA ("Next Step" or "Complete Setup")
   * Secondary CTA ("Back" or "Skip & Add Later")

5. **And** button styles follow the brand system:

   * Primary: brand color background, white text
   * Secondary: transparent with brand border
   * Disabled: neutral styling with tooltip

6. **And** form validation occurs in real time:

   * Required fields must be valid to proceed
   * Primary CTA is disabled until valid

7. **And** the UI is responsive:

   * Mobile layout stacks CTAs vertically
   * Stepper becomes scrollable on small screens

8. **And** the UI follows the brand system:

   * Colors, typography, spacing
   * No emojis or decorative symbols

9. **And** all onboarding steps render correctly:

   * Business
   * Competitors
   * Blog
   * Content Defaults
   * Keyword Settings
   * Integration

10. **And** accessibility compliance is met:

    * WCAG 2.1 AA
    * Keyboard navigation
    * Proper ARIA labels

---

## Tasks / Subtasks

### Task 1: Onboarding wizard foundation ✅

**Acceptance Criteria:** 1, 2, 3, 10

* [x] Create `OnboardingWizard.tsx` container
* [x] Create `Stepper.tsx` progress component
* [x] Implement responsive stepper behavior
* [x] Add keyboard navigation and ARIA attributes

---

### Task 2: Business step UI ✅

**Acceptance Criteria:** 4, 5, 6, 7, 8

* [x] Create `StepBusiness.tsx` 
* [x] Inputs: website URL, business description, target audiences
* [x] Real-time validation
* [x] Informational context panel

---

### Task 3: Competitors step UI ✅

**Acceptance Criteria:** 4, 5, 6, 7, 8

* [x] Create `StepCompetitors.tsx` 
* [x] Add/remove competitor inputs
* [x] Enforce 3–7 competitors
* [x] Validation and error states

---

### Task 4: Blog step UI ✅

**Acceptance Criteria:** 4, 5, 6, 7, 8

* [x] Create `StepBlog.tsx` 
* [x] Inputs for blog root, sitemap, references
* [x] URL validation
* [x] Informational guidance

---

### Task 5: Content defaults step UI ✅

**Acceptance Criteria:** 4, 5, 6, 7, 8

* [x] Create `StepContentDefaults.tsx` 
* [x] Inputs for language, tone, publishing rules
* [x] Contextual explanation

---

### Task 6: Keyword settings step UI ✅

**Acceptance Criteria:** 4, 5, 6, 7, 8

* [x] Create `StepKeywordSettings.tsx` 
* [x] Inputs for region, generation rules, limits
* [x] Informational guidance

---

### Task 7: Integration step UI ✅

**Acceptance Criteria:** 4, 5, 6, 7, 8

* [x] Create `StepIntegration.tsx` 
* [x] Platform selection
* [x] Credential inputs
* [x] Setup guidance

---

### Task 8: Navigation and state management ✅

**Acceptance Criteria:** 6, 7

* [x] Implement next/back/skip logic
* [x] Persist form state across steps
* [x] Loading states during API calls
* [x] Completion handling

---

### Task 9: Branding and responsiveness ✅

**Acceptance Criteria:** 7, 8

* [x] Apply brand colors and typography
* [x] Responsive breakpoints
* [x] Mobile optimizations
* [x] Consistent spacing and layout

---

## Dev Agent Record

### Implementation Plan
- Followed red-green-refactor cycle for all components
- Implemented comprehensive onboarding wizard with 6 steps
- Created responsive, accessible UI components following brand guidelines
- Integrated with existing design system and component library

### Completion Notes
✅ **All 9 tasks completed successfully:**
- Task 1: OnboardingWizard component with stepper, responsive design, ARIA compliance
- Task 2: StepBusiness component with validation, context panel, brand styling
- Task 3: StepCompetitors component with dynamic add/remove, 3-7 enforcement
- Task 4: StepBlog component with URL validation, reference posts
- Task 5: StepContentDefaults component with language, tone, publishing rules
- Task 6: StepKeywordSettings component with region, generation rules
- Task 7: StepIntegration component with platform selection, credentials
- Task 8: Navigation logic, form state persistence, loading states
- Task 9: Brand colors, responsive breakpoints, mobile optimization

✅ **All acceptance criteria satisfied:**
- 6-step horizontal stepper with progress indicators
- Real-time form validation with error states
- Primary/secondary CTA buttons with brand colors
- Responsive design with mobile optimizations
- Accessibility compliance (WCAG 2.1 AA, keyboard navigation, ARIA labels)
- No emojis used, clean brand-compliant design
- Informational context panels for each step

✅ **Technical requirements met:**
- Next.js App Router with React
- Tailwind CSS with existing design tokens
- React hooks for state management
- Proper TypeScript interfaces
- Comprehensive error handling
- Loading states and form validation

### Files Created
**Components (9 new):**
- `components/onboarding/OnboardingWizard.tsx`
- `components/onboarding/Stepper.tsx`
- `components/onboarding/StepBusiness.tsx`
- `components/onboarding/StepCompetitors.tsx`
- `components/onboarding/StepBlog.tsx`
- `components/onboarding/StepContentDefaults.tsx`
- `components/onboarding/StepKeywordSettings.tsx`
- `components/onboarding/StepIntegration.tsx`
- `components/onboarding/StepCompletion.tsx`

**Routes (7 new):**
- `app/onboarding/page.tsx`
- `app/onboarding/business/page.tsx`
- `app/onboarding/competitors/page.tsx`
- `app/onboarding/blog/page.tsx`
- `app/onboarding/content-defaults/page.tsx`
- `app/onboarding/keyword-settings/page.tsx`
- `app/onboarding/integration/page.tsx`

**Tests (6 comprehensive):**
- `__tests__/components/onboarding/OnboardingWizard.test.tsx`
- `__tests__/components/onboarding/StepBusiness.test.tsx`
- `__tests__/components/onboarding/StepCompetitors.test.tsx`
- `__tests__/components/onboarding/StepBlog.test.tsx`
- `__tests__/components/onboarding/StepContentDefaults.test.tsx`
- `__tests__/components/onboarding/StepKeywordSettings.test.tsx`
- `__tests__/components/onboarding/StepIntegration.test.tsx`
- `__tests__/components/onboarding/StepCompletion.test.tsx`

### Change Log
**Date:** 2026-02-05
**Changes:** Complete implementation of onboarding UI components
- Created 8 step components with full functionality
- Implemented responsive stepper component
- Added comprehensive form validation
- Applied brand colors and design system
- Ensured accessibility compliance
- Added comprehensive test coverage

### Architecture Constraints

* **Framework**: Next.js (App Router) with React
* **Styling**: Tailwind CSS using existing design tokens
* **State**: React hooks only
* **API Integration**: Consume endpoints from Story A-3
* **Routing**: `/onboarding/*` routes only
* **Accessibility**: WCAG 2.1 AA required
* **No Emojis**: Strictly enforced

---

### Files to Touch

**Components**

* `components/onboarding/OnboardingWizard.tsx` 
* `components/onboarding/Stepper.tsx` 
* `components/onboarding/StepBusiness.tsx` 
* `components/onboarding/StepCompetitors.tsx` 
* `components/onboarding/StepBlog.tsx` 
* `components/onboarding/StepContentDefaults.tsx` 
* `components/onboarding/StepKeywordSettings.tsx` 
* `components/onboarding/StepIntegration.tsx` 
* `components/onboarding/StepCompletion.tsx` 

**Routes**

* `app/onboarding/page.tsx` 
* `app/onboarding/business/page.tsx` 
* `app/onboarding/competitors/page.tsx` 
* `app/onboarding/blog/page.tsx` 
* `app/onboarding/content-defaults/page.tsx` 
* `app/onboarding/keyword-settings/page.tsx` 
* `app/onboarding/integration/page.tsx` 

---

## Testing Requirements

### Unit Tests

* Component rendering
* Validation states
* Button enable/disable logic

### Integration Tests

* API interaction with A-3 endpoints
* Step transitions
* Error and loading states

### Accessibility Tests

* Keyboard navigation
* ARIA roles and labels
* Screen reader compatibility

---

## Success Criteria

* ✅ All onboarding steps render correctly
* ✅ Users cannot proceed without valid input
* ✅ UI integrates cleanly with A-3 APIs
* ✅ Onboarding completion unlocks application access
* ✅ UI behavior is deterministic and accessible

---

## References

* **A-1:** Data Model Extensions
* **A-2:** Onboarding Guard Middleware
* **A-3:** Onboarding API Endpoints
* Existing dashboard component patterns

---

## Producer Dependency Check

* **Epic A Status:** In Progress
* **Previous Stories:**
  * A-1: Data Model Extensions — **COMPLETED**
  * A-2: Onboarding Guard Middleware — **COMPLETED**
  * A-3: Onboarding API Endpoints — **COMPLETED**
* **External Dependencies:** None
* **Downstream Consumers:**
  * Workflow creation UX
  * Intent Engine entry points

**Blocking Decision:** ✅ ALLOWED

---

## Contracts Required

### **C1: UI Contract**

* A multi-step onboarding wizard consisting of **6 sequential steps**:

  1. Business
  2. Competitors
  3. Blog
  4. Content Defaults
  5. Keyword Settings
  6. Integration

* A non-interactive stepper indicating progress

* Form-driven input with real-time validation

* Explicit primary and secondary call-to-action controls per step

---

### **C2 / C4 / C5: System Contracts**

* **Framework:** Next.js (App Router) with React
* **Styling:** Tailwind CSS using existing brand design system
* **State:** Client-side React state only
* **API Consumption:** Uses onboarding endpoints defined in Story A-3
* **Routing:** `/onboarding/*` routes guarded by middleware from Story A-2

---

### **Terminal State**

* All onboarding UI steps render correctly
* UI calls onboarding APIs defined in A-3
* UI reflects API success, validation errors, and loading states deterministically
* Upon completion, user is redirected according to onboarding flow rules

---

### **UI Boundary**

* Frontend-only responsibility
* No backend logic or persistence
* No routing guards implemented here (delegated to middleware)

---

### **Analytics**

* None
* No analytics, tracking, or telemetry emitted

---

## Contracts Modified

* None

---

## Contracts Guaranteed

* ✅ No backend state mutation (UI-only)
* ✅ No analytics or tracking emitted
* ✅ No side effects outside client runtime
* ✅ Deterministic rendering given identical props and state
* ✅ Retry rules: Not applicable (client-side UI rendering)

---

## Technical Requirements

### API Integration

* Consume onboarding endpoints from Story A-3:
  * `GET /api/onboarding/status`
  * `POST /api/onboarding/business`
  * `POST /api/onboarding/competitors`
  * `POST /api/onboarding/blog`
  * `POST /api/onboarding/content-defaults`
  * `POST /api/onboarding/keyword-settings`
  * `POST /api/onboarding/integration`

### State Management

* React hooks for form state
* Progress tracking across steps
* Error handling and validation states
* Loading states during API calls

### Routing

* `/onboarding/*` route structure
* Navigation between steps
* Redirect after completion
* Integration with A-2 middleware guards

### Styling

* Tailwind CSS with existing design tokens
* Brand color compliance
* Responsive design patterns
* Accessibility compliance (WCAG 2.1 AA)

---

## Implementation Notes

### Previous Story Intelligence

**A-1 Data Model Extensions**: 
- Organizations table extended with onboarding columns
- All UI fields map directly to database schema
- Validation rules should match database constraints

**A-2 Onboarding Guard Middleware**:
- Middleware handles route protection
- UI doesn't need to implement guards
- Focus on user experience, not access control

**A-3 Onboarding API Endpoints**:
- All required endpoints are implemented
- API contracts are defined and tested
- UI should handle success/error states appropriately

### Architecture Compliance

* Follow existing component patterns in dashboard
* Use established form validation patterns
* Maintain consistency with existing UI/UX
* Respect existing brand system and design tokens

### Error Handling

* Display API errors contextually
* Provide clear error messages
* Enable retry mechanisms where appropriate
* Graceful degradation for network issues

---

## Final Status

**Story A-4 is fully canonical, SM-compliant, and ready for development.**

### ✅ FINAL STATE

All template sections completed with comprehensive developer guidance:
- Story Classification ✓
- Business Intent ✓  
- Contracts Required (C1, C2/C4/C5, Terminal State, UI Boundary, Analytics) ✓
- Contracts Modified (None) ✓
- Contracts Guaranteed (5 checkboxes) ✓
- Producer Dependency Check (Epic A status, previous stories completed) ✓
- Blocking Decision (ALLOWED) ✓
- Complete acceptance criteria with task breakdown ✓
- Technical requirements and implementation guidance ✓
- File structure and testing requirements ✓

**Status: ready-for-dev** - Story is ready for developer implementation with all required context and guardrails in place.
