# Story 1.12: Basic Dashboard Access After Payment - Context

**Status:** ready-for-dev
**Priority:** P0 (MVP - Foundation)
**Epic:** Epic 1 - Foundation & Authentication

---

## Quick Summary

**User Story:**
As a paying user, I want to access a basic dashboard after completing payment, so that I can see my account status and navigate to platform features.

**Core Functionality:**
- Secured dashboard route (protected by middleware for auth & payment status)
- Basic layout shell (Sidebar + Top Navigation)
- Welcome message with user name
- Organization details (Name + Plan Tier)
- Navigation structure for future modules
- Fast loading state (< 2s)

---

## Acceptance Criteria (Condensed)

1. **Access Control:**
   - Unpaid users → Redirect to `/payment` (Middleware enforced)
   - Suspended users → Redirect to `/suspended` (Middleware enforced)
   - Authenticated & Paid users → Access `/dashboard`

2. **Dashboard Layout:**
   - Sidebar Navigation (Collapsible/Responsive)
   - Top Navigation (User menu, Mobile toggle)
   - Main content area

3. **Dashboard Content:**
   - Welcome message: "Welcome back, {Name}"
   - Organization Name & Plan Tier badge
   - Correct Navigation Links (Research, Write, Publish, Track, Settings)

4. **Performance:**
   - Load time < 2 seconds (Use `loading.tsx` and Server Components)

---

## Critical Technical Requirements

### Data Access

**`lib/supabase/get-current-user.ts`**
- Use `getCurrentUser()` in Server Components (`page.tsx`, `layout.tsx`)
- Returns `CurrentUser` with `organizations` data (plan, name) needed for the UI.

### Middleware Logic (Existing)
- **File:** `app/middleware.ts`
- **Logic:** Already implements payment status checks.
  - Checks if `user.org_id` exists.
  - Fetches organization.
  - Redirects if `payment_status` is `pending_payment` or `suspended`.
- **Requirement:** Ensure `/dashboard` routes are **NOT** in the `publicRoutes` array. (Logic matches all except specific excludes, so it should be protected by default).

### UI Components (Shadcn UI)

**Initialize components if not present:**
```bash
npx shadcn@latest add sidebar sheet dropdown-menu avatar button skeleton card badge
```

**Layout Structure:**
```tsx
// app/dashboard/layout.tsx
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  // Double-check redirects/auth if needed, mostly handled by middleware
  
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumbs /> {/* Optional */}
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

---

## Key Patterns to Follow

### Data Fetching Pattern (Server Components)
```typescript
// app/dashboard/page.tsx
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user || !user.organizations) {
    // Should be handled by middleware, but safe fallback
    redirect('/login')
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Welcome back, {user.email}</h1>
      <OrganizationBadge org={user.organizations} />
    </div>
  )
}
```

### Loading State Pattern
```typescript
// app/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-10 w-[250px]" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Skeleton className="h-[125px] rounded-xl" />
         {/* ... */}
      </div>
    </div>
  )
}
```

---

## Existing Infrastructure to Reuse

- **`lib/supabase/get-current-user.ts`**: Ready to use.
- **`app/middleware.ts`**: Payment enforcement logic is already in place.
- **`components/ui/*`**: Reuse existing Shadcn components if available.
- **`lib/utils.ts`**: Standard `cn` utility.

---

## File Structure

**New/Modified Files:**
```
app/dashboard/layout.tsx          # Dashboard shell (Sidebar + Header)
app/dashboard/page.tsx            # Main dashboard view (Welcome + Org Info)
app/dashboard/loading.tsx         # Suspense loading state
components/dashboard/app-sidebar.tsx # Sidebar navigation component
components/dashboard/nav-user.tsx    # User menu in sidebar/header
components/dashboard/nav-main.tsx    # Main navigation links
```

**Navigation Items:**
- **Research** (Keywords, Competitors)
- **Write** (Articles, Templates)
- **Publish** (Connections, History)
- **Track** (Analytics, Rankings)
- **Settings** (Account, Billing)

---

## Quick Reference

**Plan Tiers (from Story 1.7):** 'starter', 'pro', 'agency'
**Roles:** 'owner', 'editor', 'viewer'

*This context file provides essential information for implementing Story 1.12.*
