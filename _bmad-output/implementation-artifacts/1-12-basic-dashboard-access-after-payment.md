# Story 1.12: Basic Dashboard Access After Payment

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a paying user,
I want to access a basic dashboard after completing payment,
So that I can see my account status and navigate to platform features.

## Acceptance Criteria

### 1. Dashboard Access Control
- **Given** I am a user who has completed payment (status: 'active')
- **When** I log in or complete the payment flow
- **Then** I can successfully access the main dashboard route (`/dashboard`)
- **And** I am NOT redirected to the payment page

- **Given** I am a user who has NOT completed payment (status: 'unpaid' or 'pending_payment')
- **When** I attempt to access `/dashboard` or any sub-route
- **Then** I am redirected to the payment page (`/payment` or `/subscribe`)
- **And** I see a message indicating payment is required

- **Given** I am a user whose account is suspended
- **When** I attempt to access `/dashboard`
- **Then** I am redirected to the suspension page (`/suspended`)
- **And** I cannot access dashboard features

### 2. Dashboard Layout Foundation
- **Given** I am on the dashboard
- **Then** I see the standard application shell layout
- **And** the layout includes a collapsible Left Sidebar Navigation (width ~240px expanded)
- **And** the layout includes a Top Navigation Bar (height ~64px)
- **And** the Main Content Area fills the remaining space
- **And** the layout is responsive (sidebar collapses on mobile screens < 640px)

### 3. Sidebar Navigation
- **Given** I view the sidebar
- **Then** I see the following navigation items:
  - Research (Keywords, Competitors)
  - Write (Articles, Templates)
  - Publish (Connections, History)
  - Track (Analytics, Rankings)
  - Settings (Profile, Organization, Billing)
- **And** the active page is visually highlighted in the sidebar
- **And** clicking an item navigates to the corresponding route without full page reload

### 4. Top Navigation
- **Given** I view the top navigation bar
- **Then** I see the Application Logo (link to dashboard root)
- **And** I see a User Menu (Avatar/Profile) on the right side
- **And** on mobile, I see a "Menu" toggle button to open the sidebar

### 5. Dashboard Home Content (MVP)
- **Given** I access the dashboard root (`/dashboard`)
- **Then** I see a personalized "Welcome back, {First Name}" message
- **And** I see my Organization Name displayed
- **And** I see my current Plan Tier (e.g., "Starter", "Pro") displayed as a badge
- **And** the page content loads in < 2 seconds (NFR-P2)

## Tasks / Subtasks

- [ ] 1. Implement Dashboard Layout Components
  - [ ] Initialize Shadcn UI `sidebar`, `sheet`, `avatar`, `dropdown-menu`
  - [ ] Create `components/layout/SidebarNavigation.tsx` (Client Component, collapsible)
  - [ ] Create `components/layout/TopNavigation.tsx` (User menu, mobile toggle)
  - [ ] Create `app/dashboard/layout.tsx` (Server Component) using the layout components

- [ ] 2. Implement Dashboard Access Middleware/Guard
  - [ ] Verify `middleware.ts` correctly handles `payment_status` checks for `/dashboard` scope
  - [ ] Ensure redirects for `unpaid` -> `/payment` and `suspended` -> `/suspended` are working
  - [ ] Add integration tests to verify access control logic

- [ ] 3. Implement Dashboard Home Page (MVP)
  - [ ] Create `app/dashboard/page.tsx`
  - [ ] Fetch current user and organization data server-side (using `get-current-user` helper)
  - [ ] Display Welcome Message, Organization Name, and Plan Badge
  - [ ] Implement `app/dashboard/loading.tsx` with Skeleton fallbacks

- [ ] 4. Security & RLS Verification
  - [ ] Ensure all data fetching uses `supabase-js` auth context (no Service Role)
  - [ ] Verify users can only see their own Organization data

## Technical Notes

- **Architecture**: Use Next.js App Router Layouts (`dashboard/layout.tsx`) to persist the shell across pages.
- **Authentication**: Rely on Supabase Auth and existing `get-current-user` utility.
- **Styling**: strictly use Tailwind CSS and Shadcn UI components.
- **Performance**: Fetch data in parallel where possible. Use React Server Components for the main page to reduce client bundle size.
- **Guardrails**: Do not expose any administrative or cross-organization data. strictly enforce RLS concepts even in code logic.
