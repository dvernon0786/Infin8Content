# Story 1.12: Basic Dashboard Access After Payment

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a paying user,
I want to access a basic dashboard after completing payment,
so that I can see my account status and navigate to platform features.

## Acceptance Criteria

### 1. Payment-Gated Access
- **Given** I have completed payment (Story 1.7)
- **When** I log in or am redirected after payment
- **Then** I can access the main dashboard route `/dashboard`
- **And** I am NOT redirected to `/payment`

- **Given** I have registered but NOT paid
- **When** I attempt to access `/dashboard` or any sub-route
- **Then** I am redirected to `/payment`
- **And** I see a toast or message "Payment required for access"

- **Given** my account is suspended (Story 1.9 logic)
- **When** I attempt to access `/dashboard`
- **Then** I am redirected to `/suspended`

### 2. Dashboard Layout Foundation
- **Given** I am on the dashboard
- **Then** I see the standard application shell:
  - **Left Sidebar**: Collapsible, containing navigation links (Research, Write, Publish, Track, Settings)
  - **Top Navigation**: Containing user menu (Avatar) and mobile toggle
  - **Main Content Area**: Displaying the active page content
- **And** the layout is responsive (sidebar collapses to icon-only or hidden on mobile)

### 3. Dashboard Home Content (MVP)
- **Given** I access `/dashboard`
- **Then** I see a "Welcome back, {User First Name}" message
- **And** I see my Organization Name and current Plan Tier (e.g., "Starter Plan")
- **And** the page loads in < 2 seconds (NFR-P2)
- **And** a skeleton loader is shown while fetching data

### 4. Navigation Functionality
- **Given** I click a navigation link (e.g., "Settings")
- **Then** the URL updates
- **And** the active link visual state updates
- **And** the content area updates

## Tasks / Subtasks

- [x] Task 1: Dashboard Routing & Middleware Validation (AC: 1)
  - [x] Verify `middleware.ts` enforces `payment_status: 'active'` (or equivalent) for `/dashboard/*` routes
  - [x] **Audit**: Explicitly check `middleware.ts` to ensure it integrates correctly with logic from Story 1.8/1.9 (grace period, suspension).
  - [x] Ensure distinct redirects for `unpaid` vs `suspended` status
  - [x] Add explicit integration tests for these redirects (if not fully covered in 1.8/1.9)
  - [x] Create `app/dashboard/layout.tsx` (Server Component)

- [x] Task 2: Implement App Shell Components (AC: 2, 4)
  - [x] Initialize/Verify Shadcn UI components: `sidebar`, `sheet`, `avatar`, `dropdown-menu`, `button`
  - [x] Create `components/layout/sidebar-navigation.tsx` (Client Component)
    - [x] Implement collapsible state
    - [x] Map navigation items: Research, Write, Publish, Track, Settings
    - [x] Handle "active" state styling
  - [x] Create `components/layout/top-navigation.tsx`
    - [x] User menu dropdown (Profile, Billing, Logout)
    - [x] Mobile sidebar toggle
  - [x] Integrate into `app/dashboard/layout.tsx`

- [x] Task 3: Implement Dashboard Home Page (AC: 3)
  - [x] Create `app/dashboard/page.tsx` (Server Component)
  - [x] Fetch User & Organization data
    - **Guardrail**: Use `lib/supabase/server.ts` to ensure RLS compliance
    - **Optimization**: Run fetches in parallel using `Promise.all`
  - [x] Create `app/dashboard/loading.tsx` with Skeleton UI
  - [x] Display Welcome message, Org Name, and Plan Badge

- [x] Task 4: Integration Testing (AC: All)
  - [x] Test: Unpaid user -> Redirect to Payment
  - [x] Test: Paid user -> 200 OK on Dashboard
  - [x] Test: Dashboard renders Sidebar and User Info
  - [x] Test: Mobile layout toggle works

## Dev Notes

### Architecture & Security Patterns
- **RLS Compliance**: Since Story 1.11 (RLS) is DONE, all database queries MUST rely on `supabase-js` auth context.
  - Do NOT use `supabase-admin` (service role) for dashboard data; use the authenticated client (`createClient` from `@/lib/supabase/server`).
  - This ensures users only see their own Org Name and Plan.
- **Server Components**: `page.tsx` and `layout.tsx` must be Server Components.
  - Fetch data on the server.
  - Pass data to Client Components (like Sidebar) if needed, or keeping Sidebar static/client-side navigation.
- **Middleware**: This story relies heavily on the Middleware (Story 1.8) functioning correctly. Verify it before building UI. 
  - If middleware is missing the logic, implementing it here is critical blocking work.

### Component Architecture (Shadcn UI)
- **Sidebar**: Use the `Sidebar` pattern from Shadcn (or standard Tailwind + motion).
  - Use `lucide-react` for icons.
- **State Management**: Sidebar collapse state can be local state or `nuqs` (URL state) if persistence is needed, but local storage or simple state is fine for MVP.
- **User Data**: Pass user data from `layout.tsx` down to components or fetch in `page.tsx`. `layout.tsx` is better for Sidebar user context if needed, but beware of unnecessary blocking.

### Project Structure Alignment
- **Routes**: `app/dashboard/` (Protected root)
- **Components**: `components/dashboard/` (Specific dashboard widgets), `components/layout/` (Global app shell components)
- **Lib**: `lib/supabase/` (Auth & DB clients)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

- Verified `middleware.ts` matches logic for payment redirects.
- Fixed `TopNavigation` component test to target accessible name "TU" instead of alt text.

### Completion Notes List

- Implemented Dashboard Access Control via `middleware.ts` verification.
- Validated App Shell Components (`SidebarNavigation`, `TopNavigation`) using Shadcn UI.
- Validated Dashboard Home Page (`page.tsx`) with RLS-compliant data fetching.
- Added comprehensive integration tests in `tests/integration/dashboard-access.test.ts`.
- Added unit tests for dashboard components in `tests/components/dashboard-layout.test.tsx`.
- All tests passing.

### File List

- app/dashboard/layout.tsx
- app/dashboard/page.tsx
- app/dashboard/loading.tsx
- components/dashboard/sidebar-navigation.tsx
- components/dashboard/top-navigation.tsx
- tests/integration/dashboard-access.test.ts
- tests/components/dashboard-layout.test.tsx
- lib/supabase/get-current-user.ts
- app/api/team/accept-invitation/route.test.ts
