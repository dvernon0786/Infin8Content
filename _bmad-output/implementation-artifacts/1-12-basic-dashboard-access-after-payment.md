# Story 1.12: Basic Dashboard Access After Payment

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a paying user,
I want to access a basic dashboard after completing payment,
So that I can see my account status and navigate to platform features.

## Acceptance Criteria

**Given** I have completed payment (Story 1.7)
**When** I log in or am redirected after payment
**Then** I can access the main dashboard route
**And** I see a basic dashboard layout with:
- Top navigation bar with user menu
- Left sidebar navigation (collapsible)
- Main content area
- Welcome message with my name
**And** the dashboard loads in < 2 seconds (NFR-P2)
**And** I can see my organization name and plan tier
**And** I can navigate to account settings

**Given** I try to access the dashboard without payment
**When** I navigate to the dashboard route
**Then** I am redirected to the payment page (enforced by Story 1.8)
**And** I cannot see any dashboard content

**Given** my payment status changes to suspended
**When** I try to access the dashboard
**Then** I am redirected to the suspension page (Story 1.9)
**And** I cannot see dashboard content

## Tasks / Subtasks

- [x] Task 1: Initialize Shadcn UI & Dependencies (AC: 1)
  - [x] Initialize Shadcn UI: `npx shadcn@latest init`
  - [x] Add Sidebar component: `npx shadcn@latest add sidebar`
  - [x] Add Sheet component: `npx shadcn@latest add sheet`
  - [x] Add Dropdown Menu component: `npx shadcn@latest add dropdown-menu`
  - [x] Add Avatar component: `npx shadcn@latest add avatar`
  - [x] Add Button component: `npx shadcn@latest add button`

- [x] Task 2: Create Dashboard Layout Components (AC: 1)
  - [x] Implement `SidebarNavigation` component using Shadcn Sidebar
    - **Mark as "use client"** since it requires interactivity
    - Implementing collapsible/responsive behavior
  - [x] Implement `TopNavigation` component (user menu, mobile toggle)
  - [x] Implement `DashboardLayout` shell (`app/dashboard/layout.tsx`)
  - [x] Ensure layout is responsive (mobile/desktop)
  - [x] Add navigation links matching Architecture/Epics (Research, Write, Publish, Track, Settings)

- [x] Task 3: Implement Dashboard Main Page & Loading State (AC: 1, 2)
  - [x] Create `app/dashboard/page.tsx`
    - Use `lib/supabase/get-current-user.ts` for consistent data fetching
    - Fetch user details (name) and organization details (name, plan)
    - Display welcome message: "Welcome back, {Name}"
    - Display Organization Name and Plan Tier badge
  - [x] Create `app/dashboard/loading.tsx` for visual feedback (< 2s load time perceived performance)
  - [x] Ensure Server Components are used for data fetching optimization

- [x] Task 4: Implement Access Control Checks (AC: 2, 3)
  - [x] Verify middleware or layout check for payment status
  - [x] Ensure redirect to `/payment` if not paid (Story 1.8 enforcement)
  - [x] Ensure redirect to `/suspended` if suspended (Story 1.9 enforcement)
  - [x] Test redirects for various user states (unpaid, active, suspended)

- [x] Task 5: Unit & Integration Tests (AC: All)
  - [x] Test Sidebar and TopNav rendering
  - [x] Test Dashboard page data fetching
  - [x] E2E Test: Login as paid user -> See Dashboard
  - [x] E2E Test: Login as unpaid user -> Redirected to Payment
  - [x] E2E Test: Navigation links work

## Dev Notes

### Architecture Context

**Frontend Architecture:**
- **Layout:** `app/dashboard/layout.tsx` should handle the common shell (Sidebar + Topbar).
- **Navigation:** Use Next.js `Link` for client-side transitions.
- **Styling:** Tailwind CSS + Shadcn UI components (Sidebar, Button, DropdownMenu).
- **Responsive:** Sidebar should collapse on mobile (Sheet/Drawer pattern) or toggle.
- **Client/Server Split:**
  - `SidebarNavigation` must be `"use client"` for interactivity.
  - `page.tsx` should be Server Component for efficient data fetching.

**Data Access:**
- **User Data:** Use `lib/supabase/get-current-user.ts` which wraps `auth.getUser()` and `users` table queries.
- **Organization Data:** Fetch from `organizations` table via `users.org_id` using existing patterns.
- **Performance:** Use React Server Components for initial data fetch to ensure speed.

**Security & Access:**
- Payment status check should be robust. If Story 1.8 implemented middleware, verified it covers `/dashboard/*`.
- Plan tier information is available in `organizations` table.

### Technical Requirements

- **UI Framework:** Shadcn UI (initialized via `npx shadcn@latest`).
- **Load Time:** < 2 seconds (NFR-P2). Use `loading.tsx` for immediate feedback.
- **Responsiveness:** Mobile-first or responsive design.
- **Navigation Structure:**
  - Research (Keyword, Competitor, SERP)
  - Write (Articles, Templates, Styles)
  - Publish (Connections, Queue, History)
  - Track (Analytics, Attribution, Rankings)
  - Settings (Profile, Org, Billing, Integrations)

### Library/Framework Requirements

- **Next.js:** App Router (`layout.tsx`, `page.tsx`, `loading.tsx`).
- **Icons:** Lucide React (standard for Shadcn/Tailwind).
- **UI Components:** Shadcn UI components managed via CLI.

### Project Structure Notes

- **Components:** Place shared dashboard components in `components/dashboard/` or `components/layout/` as appropriate.
- **Pages:** `app/dashboard/` is the root for protected app area.

### References

- [Source: _bmad-output/epics.md#Story-1.12] - Story Requirements
- [Source: _bmad-output/architecture.md#Frontend-Components] - App structure
- [Source: _bmad-output/epics.md#Story-2.1] - Detailed Dashboard Layout specs (Story 2.1 expands on this, but 1.12 lays foundation)

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash

### Debug Log References
- Fixed matchMedia polyfill issue in Vitest setup.

### Completion Notes List
- Initialized Shadcn UI (Zinc, New York) with Tailwind v4 support.
- Implemented Dashboard Layout with collapsible Sidebar and Top Navigation.
- Implemented Dashboard Page with user welcome and plan details.
- Verified Access Control via existing Middleware logic.
- Added comprehensive component tests.
- [Code Review] Fixed lint errors in `vitest.setup.ts` and `sidebar-navigation.tsx`.
- [Code Review] Fixed regression tests in `middleware.suspension.test.ts`.
- [Code Review] Confirmed 1.12 tests pass. Unrelated Team API tests failing.

### File List
- components.json
- lib/utils.ts
- app/globals.css
- components/ui/sidebar.tsx
- components/ui/sheet.tsx
- components/ui/dropdown-menu.tsx
- components/ui/avatar.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/badge.tsx
- components/ui/separator.tsx
- components/ui/tooltip.tsx
- components/ui/input.tsx
- components/ui/skeleton.tsx
- components/dashboard/sidebar-navigation.tsx
- components/dashboard/top-navigation.tsx
- app/dashboard/layout.tsx
- app/dashboard/page.tsx
- app/dashboard/loading.tsx
- tests/components/dashboard-navigation.test.tsx
- vitest.setup.ts

