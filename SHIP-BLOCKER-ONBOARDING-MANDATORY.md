# 🚨 SHIP-BLOCKER: Single Dashboard + Mandatory Onboarding (FINAL)

**Status:** ✅ IMPLEMENTED & VERIFIED  
**Date:** 2026-02-09  
**Priority:** CRITICAL - Blocks all dashboard access until onboarding is complete  
**Implementation Date:** 2026-02-07 11:18 UTC+11:00  
**Build Status:** ✅ PASSING  
**WordPress Integration:** ✅ PRODUCTION-READY (Step 6 complete)  
**Input Constraints:** ✅ PRODUCTION-READY (AI-optimized Step 1 complete)  
**Redirect Loop Fix:** ✅ **PERMANENTLY ELIMINATED** (WordPress REST API compliant + regression prevention)

---

## Decision (Non-Negotiable)

* **ONE dashboard** - Intent Engine only
* **ONE process** - Mandatory onboarding flow
* **Intent Engine ONLY** - No legacy dashboard
* **Onboarding is mandatory** - Hard entry point
* **ZERO legacy paths** - Complete removal
* **Anything else = bug** - No exceptions

---

## ✅ Facts (Do Not Debate)

* Onboarding UI **already exists** at `/app/onboarding`
* Onboarding APIs, guards, middleware **already exist**
* Intent Engine dashboard **already exists**
* **Nothing new is to be built**
* Issue is **routing + enforcement only**

---

## ❌ Root Cause

Users never see onboarding because:

1. **Payment success redirects to `/dashboard`** (no onboarding check)
2. **`/dashboard` is not server-guarded** (no layout-level enforcement)
3. **Legacy dashboard still renders** (fallback exists)

---

## ✅ REQUIRED FIXES (DO EXACTLY THIS)

### 1️⃣ Payment Success → HARD ENTRY POINT

**File:** `/home/dghost/Desktop/Infin8Content/infin8content/app/payment/success/page.tsx`

**Critical Refinement #1: Single DB Query (No Double-Fetch)**

Change the organization query (around line 224) from:

```ts
const { data: organization, error: orgError } = await supabase
  .from('organizations')
  .select('id, payment_status, plan')
  .eq('id', sessionOrgId)
  .single()
```

To:

```ts
const { data: organization, error: orgError } = await supabase
  .from('organizations')
  .select('id, payment_status, plan, onboarding_completed')
  .eq('id', sessionOrgId)
  .single()
```

This ensures **one atomic query** with no race conditions.

---

**Critical Refinement #2: Remove Metadata Redirect Injection**

Replace the entire `paymentStatus === 'active'` block (lines 274-286) with:

```ts
if (paymentStatus === 'active') {
  const isReactivation = session.metadata?.suspended === 'true'

  // HARD RULE:
  // - First activation → onboarding (mandatory)
  // - Reactivation → dashboard (user already completed onboarding)
  const redirectTo = (organization as any).onboarding_completed
    ? '/dashboard'
    : '/onboarding'

  return (
    <PaymentSuccessClient
      status="active"
      plan={(organization as any).plan || session.metadata?.plan}
      redirectTo={redirectTo}
      isReactivation={isReactivation}
    />
  )
}
```

**Why this matters:**
- ❌ Remove `validateRedirect(session.metadata?.redirect, '/dashboard')` — allows redirect injection
- ✅ Use `onboarding_completed` field directly — single source of truth
- ✅ No backdoors — first-time users always see onboarding
- ✅ Reactivations bypass onboarding (already completed)

❌ No other redirect allowed
❌ No metadata-based navigation
❌ No client-side overrides

---

### 2️⃣ Guard `/dashboard` at LAYOUT LEVEL (SERVER-SIDE)

**File:** `/home/dghost/Desktop/Infin8Content/infin8content/app/dashboard/layout.tsx`

**Current Issue:** No server-side guard prevents direct URL access to `/dashboard`

**Action:** Add server-side onboarding check at layout entry

```typescript
import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { checkOnboardingStatus } from "@/lib/guards/onboarding-guard"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get current user
  const currentUser = await getCurrentUser()
  
  if (!currentUser || !currentUser.org_id) {
    redirect('/auth/login')
  }

  // CHECK ONBOARDING STATUS - HARD GATE
  const onboardingCompleted = await checkOnboardingStatus(currentUser.org_id)
  
  if (!onboardingCompleted) {
    redirect('/onboarding')  // ← MANDATORY REDIRECT
  }

  // Only render dashboard if onboarding is complete
  return (
    <div>
      {children}
    </div>
  )
}
```

**This blocks:**
* Manual URL access to `/dashboard`
* Bookmarks to `/dashboard`
* Race conditions
* Middleware misses

---

### 3️⃣ ONBOARDING REDIRECT BUG FIX (COMPLETED)

**Issue:** Users completing Integration step were redirected back to Step 1 instead of accessing dashboard

**Root Cause:** Schema drift - database lacked onboarding columns that application code expected

**Solution Applied:**
```sql
-- Migration: 20260208_add_onboarding_columns.sql
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_version TEXT DEFAULT 'v1';
```

**Files Updated:**
- ✅ `supabase/migrations/20260208_add_onboarding_columns.sql` (NEW)
- ✅ `app/onboarding/integration/page.tsx` (Removed localStorage dependency)
- ✅ `app/api/onboarding/integration/route.ts` (Added database update)
- ✅ `lib/guards/onboarding-guard.ts` (Enhanced logging)
- ✅ `app/middleware.ts` (Enhanced logging)

**Result:** Database authority established, deterministic navigation, no more redirects

**Status:** ✅ RESOLVED - Migration applied, columns exist, fix verified

---

### 4️⃣ REMOVE LEGACY DASHBOARD (MANDATORY)

**File:** `/home/dghost/Desktop/Infin8Content/infin8content/app/dashboard/page.tsx`

**Current Issue:** Contains legacy dashboard UI that should never render

**Action:** Replace with Intent Engine dashboard ONLY

```typescript
import { IntentEngineDashboard } from "@/components/intent-engine/dashboard"

export default async function DashboardPage() {
  // Onboarding is already checked in layout.tsx
  // No need to check again here
  
  return <IntentEngineDashboard />
}
```

**❌ No conditionals**  
**❌ No fallbacks**  
**❌ No "if onboarding then…"**

Onboarding is enforced **before** this page renders.

---

### 4️⃣ Onboarding Completion → SINGLE EXIT

**File:** `/home/dghost/Desktop/Infin8Content/infin8content/app/api/onboarding/complete/route.ts`

**Current Issue:** Completes onboarding but doesn't enforce redirect

**Action:** Ensure completion always redirects to dashboard

```typescript
// After marking onboarding_completed = true:
return NextResponse.json({
  success: true,
  organization: {
    id: organization.id,
    onboarding_completed: organization.onboarding_completed,
    onboarding_completed_at: organization.onboarding_completed_at,
  },
  redirectTo: '/dashboard',  // ← MANDATORY REDIRECT
})
```

**❌ No alternate exits**

---

### 5️⃣ REDIRECT LOOP ELIMINATION (PERMANENTLY ELIMINATED 🔒)

**Issue:** Infinite onboarding redirect loop caused by WordPress REST API capability violations and localStorage vs database mismatch

**Root Cause:** 
- WordPress REST API used `/users/me` endpoint requiring `list_users` capability
- Application Passwords don't grant privileged capabilities → 401 errors
- Two onboarding flows existed - old flow (`/onboarding`) used localStorage, new flow (`/onboarding/integration`) called APIs

**Final Fix Applied:**
- ✅ **WordPress REST API compliance** - Uses safe endpoints (`/posts`, `/wp-json`)
- ✅ **Capability-light authentication** - Works with Application Passwords on all hosts
- ✅ **Eliminated all onboarding localStorage usage** - Database is single source of truth
- ✅ **Wired all onboarding steps to backend APIs** - No more client-side completion
- ✅ **Fixed both onboarding flows** - Old and new flows now call APIs
- ✅ **Added comprehensive logging** - Consistent debugging logs
- ✅ **Hard validation in StepIntegration** - All WordPress fields required
- ✅ **E2E regression prevention** - Complete test suite validates entire flow
- ✅ **Absolute invariant enforcement** - Development assertions prevent regressions

**Files Modified:**
- `/app/onboarding/integration/page.tsx` - API call + logging
- `/app/onboarding/page.tsx` - API call + logging (old flow), dead code removed
- `/app/onboarding/business/page.tsx` - API call
- `/app/onboarding/competitors/page.tsx` - API call
- `/app/onboarding/blog/page.tsx` - API call
- `/app/onboarding/content-defaults/page.tsx` - API call
- `/app/onboarding/keyword-settings/page.tsx` - API call
- `/components/onboarding/StepIntegration.tsx` - Hard validation + logging
- `/lib/services/wordpress/wordpress-integration.ts` - WordPress REST API compliance
- `/lib/services/wordpress/test-connection.ts` - Safe endpoint testing
- `/lib/guards/onboarding-guard.ts` - Hard assertions for regressions
- `/app/dashboard/layout.tsx` - Absolute invariant enforcement
- `/app/api/onboarding/status/route.ts` - E2E test verification endpoint
- `/tests/onboarding.integration.spec.ts` - Complete E2E regression prevention
- `.env.test` - Test environment configuration

**Result:** Onboarding redirect loop **structurally impossible to regress** - WordPress REST API compliant + E2E regression prevention deployed

---

## 🧪 SHIP-GATE TESTS (MUST PASS)

### Test 1: Fresh User Flow
```
Signup → Pay → /onboarding
```
✅ User sees onboarding, NOT dashboard  
❌ If dashboard appears → BLOCK SHIP

### Test 2: Cheat Attempt (Manual URL)
```
User manually opens /dashboard before onboarding
```
✅ Redirects to `/onboarding`  
❌ If dashboard renders → BLOCK SHIP

### Test 3: Completion Flow
```
Finish onboarding → /dashboard
```
✅ Intent Engine dashboard only  
❌ If legacy UI appears → BLOCK SHIP

### Test 4: Refresh/Reload
```
User completes onboarding, then reloads /dashboard
```
✅ Still Intent Engine dashboard  
❌ No redirect loops  
❌ No legacy UI

### Test 5: Logs
```
Check server logs during flow
```
✅ No redirect spam  
✅ No infinite loops  
✅ Clean middleware logs

---

## 🚫 Explicitly Forbidden

* ❌ Dual dashboards
* ❌ Feature flags for dashboard selection
* ❌ Temporary fallbacks ("we'll clean later")
* ❌ Client-only guards (must be server-side)
* ❌ Conditional rendering based on onboarding

---

## 📋 Implementation Checklist

- [x] **Stripe webhook** - NO CHANGES (DB-only, already correct)
- [x] **Payment success page** - Enforce onboarding redirect logic
- [x] **Dashboard layout** - Add server-side onboarding guard + absolute invariant enforcement
- [x] **Dashboard page** - Replace with Intent Engine only
- [x] **Onboarding complete** - Ensure redirect to `/dashboard`
- [x] **Test 1** - Fresh user sees onboarding
- [x] **Test 2** - Manual URL access redirects
- [x] **Test 3** - Completion shows Intent Engine
- [x] **Test 4** - Reload doesn't break flow
- [x] **Test 5** - No redirect loops in logs
- [x] **WordPress REST API compliance** - Safe endpoints only
- [x] **E2E regression prevention** - Complete test suite deployed
- [x] **Code review** - No legacy code paths remain
- [x] **Ship** - Deploy to production

---

## ✅ Outcome

* One dashboard
* One flow
* No bypasses
* Ship-ready
* Future-proof

---

## TL;DR for the team

> **Nothing is missing. The UI exists.**  
> **Fix the doors, delete legacy, enforce onboarding, ship.**

---

## Questions?

If any step is unclear, ask immediately. No assumptions.

