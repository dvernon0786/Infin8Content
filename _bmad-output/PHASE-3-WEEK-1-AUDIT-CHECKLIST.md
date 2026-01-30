# 🔍 BMAD Phase 3 · Week 1 — Engineering AUDIT CHECKLIST

**Project:** Infin8Content  
**Workflow:** Primary Content Workflow (Intent Engine)  
**Date:** 2026-01-30  
**Audience:** PM (Audit Authority)  
**Status:** READY FOR ENGINEERING REVIEW

---

## Overview

This is a **hard, PM-grade Week 1 AUDIT CHECKLIST**. Use this **line-by-line against PRs**. If *any* item fails, the PR does **not** merge.

**Authority:** PM has veto power  
**Rule:** Passing tests ≠ passing BMAD  
**Scope:** Foundation only (no content generation)

---

## 🧱 PR 1 — Database Foundations AUDIT

**Branch:** `feat/bmad-schema-foundation`

### ✅ Schema Correctness

- [ ] `keywords.keyword_level` exists and is **only** `seed | longtail`
- [ ] `keywords.parent_keyword_id` exists
- [ ] `valid_keyword_hierarchy` constraint exists
- [ ] Longtail **cannot** exist without parent seed
- [ ] Seed **cannot** have parent
- [ ] No polymorphic columns (no `seed_keyword_id` etc.)
- [ ] `competitors` table created
- [ ] `blog_inputs` table created
- [ ] `organizations` ICP columns added
- [ ] All indexes created

### ❌ Forbidden (Instant Rejection)

- [ ] No cascading deletes outside hierarchy
- [ ] No updates to existing rows
- [ ] No default data inserted
- [ ] No triggers beyond constraints
- [ ] No logic in migrations

### 🔁 Migration Safety

- [ ] Migration runs clean on empty DB
- [ ] Migration runs clean on production snapshot
- [ ] Rollback removes only new columns/tables
- [ ] Rollback does **not** touch legacy articles
- [ ] Rollback is reversible
- [ ] No data loss on rollback

### Acceptance Criteria

**FAIL IF:**
- Any migration mutates existing data
- Any migration enforces logic beyond structure
- Rollback doesn't work
- Legacy articles are affected

**PASS IF:**
- All constraints enforced
- All tables created
- All indexes created
- Migrations are reversible
- Zero data loss

---

## 🚩 PR 2 — Feature Flags AUDIT

**Branch:** `feat/bmad-feature-flags`

### ✅ Flags Exist (ALL REQUIRED)

- [ ] `enable_icp` (default: false)
- [ ] `enable_competitors` (default: false)
- [ ] `enable_seeds` (default: false)
- [ ] `enable_longtails` (default: false)
- [ ] `enable_filtering` (default: false)
- [ ] `enable_subtopics` (default: false)
- [ ] `enable_approval` (default: false)
- [ ] `enable_primary_workflow` (default: false)
- [ ] `enable_legacy_workflow` (default: **true**)

### ✅ Resolution Order (EXACT)

1. Environment variable override
2. Organization-level override
3. Default value

- [ ] Env override works
- [ ] Org override works
- [ ] Default works
- [ ] Order is correct

### ✅ Implementation

- [ ] Feature flag service exists
- [ ] Middleware exists
- [ ] Flags readable server-side
- [ ] Flags logged on request context
- [ ] Flags documented

### ❌ Forbidden (Instant Rejection)

- [ ] No hardcoded `true` flags
- [ ] No client-side enforcement
- [ ] No flags auto-enabling others
- [ ] No flag interdependencies
- [ ] No silent defaults

### Acceptance Criteria

**FAIL IF:**
- Any downstream flag is enabled implicitly
- Flags don't resolve in correct order
- Env override doesn't work
- Org override doesn't work

**PASS IF:**
- All 9 flags exist
- All defaults correct
- Resolution order correct
- No interdependencies

---

## �� PR 3 — Hard Gates AUDIT (MOST IMPORTANT)

**Branch:** `feat/bmad-hard-gates`

### ✅ Gates Exist (ALL REQUIRED)

| Gate | Must Block | Error Code |
|------|-----------|-----------|
| ICP_REQUIRED | competitors, seeds, longtails, subtopics, articles | ICP_REQUIRED |
| COMPETITORS_REQUIRED | seeds | COMPETITORS_REQUIRED |
| SEEDS_REQUIRED | longtails | SEEDS_REQUIRED |
| LONGTAILS_REQUIRED | subtopics | LONGTAILS_REQUIRED |
| SUBTOPICS_REQUIRED | articles | SUBTOPICS_REQUIRED |

- [ ] ICP gate implemented
- [ ] Competitors gate implemented
- [ ] Seeds gate implemented
- [ ] Longtails gate implemented
- [ ] Subtopics gate implemented

### ✅ Enforcement Rules (CRITICAL)

- [ ] Gate runs **server side** (not UI)
- [ ] Gate runs **before handler logic**
- [ ] Gate returns **403 Forbidden**, not 200 + error
- [ ] Error code matches spec exactly
- [ ] Error message explains what's needed
- [ ] Gate is logged

### ✅ Blocking Verification

- [ ] Cannot call /api/research/competitors without ICP
- [ ] Cannot call /api/research/seeds without competitors
- [ ] Cannot call /api/research/longtails without approved seeds
- [ ] Cannot call /api/research/subtopics without longtails
- [ ] Cannot call /api/articles/generate without approved subtopics

### ❌ Forbidden (Instant Rejection)

- [ ] No UI-only gates
- [ ] No silent fallbacks
- [ ] No "temporary bypass for testing"
- [ ] No auto-creation of missing prerequisites
- [ ] No 200 responses with error messages
- [ ] No "just for now" logic

### Acceptance Criteria

**FAIL IF:**
- Any endpoint can be called out of order with valid token
- Any gate returns 200 instead of 403
- Any gate is missing
- Any gate can be bypassed

**PASS IF:**
- All 5 gates implemented
- All gates return 403
- All gates run server-side
- All gates block correctly

---

## 🔐 PR 4 — RLS & DATA SAFETY AUDIT

**Branch:** `feat/bmad-rls-safety`

### ✅ Isolation (CRITICAL)

- [ ] `competitors` RLS enabled
- [ ] `keywords` RLS enabled
- [ ] `blog_inputs` RLS enabled
- [ ] RLS policies exist for SELECT
- [ ] RLS policies exist for INSERT
- [ ] RLS policies exist for UPDATE

### ✅ Policy Scope

- [ ] SELECT limited to org members only
- [ ] INSERT limited to org members only
- [ ] UPDATE limited to org members only
- [ ] No `USING true` (always-allow policies)
- [ ] Policies reference `team_members` or `organizations`

### ✅ Cross-Org Denial

- [ ] User from Org A cannot read Org B competitors
- [ ] User from Org A cannot read Org B keywords
- [ ] User from Org A cannot read Org B blog_inputs
- [ ] User from Org A cannot update Org B data

### ❌ Forbidden (Instant Rejection)

- [ ] No service role leakage
- [ ] No cross-org joins
- [ ] No admin bypass in app code
- [ ] No `USING true` policies
- [ ] No unscoped queries

### Acceptance Criteria

**FAIL IF:**
- Any user can read another org's data
- Any RLS policy is missing
- Any policy uses `USING true`
- Cross-org access is possible

**PASS IF:**
- All tables have RLS
- All policies scoped correctly
- Cross-org access denied
- All tests pass

---

## 🔤 PR 5 — Status Vocabulary AUDIT

**Branch:** `feat/bmad-status-vocab`

### ✅ Canonical Verbs Only

Allowed statuses (EXACT):

```
generated    - System created the artifact
filtered     - System applied hard filters
approved     - Human explicitly approved
rejected     - Human explicitly rejected
queued       - Waiting in queue
generating   - Currently processing
completed    - Successfully finished
failed       - Error during processing
archived     - Removed from workflow
```

- [ ] All 9 verbs defined
- [ ] Definitions match spec exactly
- [ ] Type definition created
- [ ] Validator function created

### ✅ Enforcement

- [ ] Status validated before DB write
- [ ] Status normalized in API responses
- [ ] No legacy verbs remain (`ranked`, `selected`, `pending`, etc.)
- [ ] Type safety enforced (TypeScript)
- [ ] All API responses use canonical verbs

### ✅ Verification

- [ ] Database queries return canonical verbs
- [ ] API responses return canonical verbs
- [ ] UI receives canonical verbs
- [ ] No verb remapping in code

### ❌ Forbidden (Instant Rejection)

- [ ] No silent remapping
- [ ] No mixed vocabulary between layers
- [ ] No legacy verbs in responses
- [ ] No custom status values

### Acceptance Criteria

**FAIL IF:**
- UI or API returns non-canonical verb
- Legacy verbs still exist
- Status validation missing
- Type safety not enforced

**PASS IF:**
- All 9 verbs defined
- All responses use canonical verbs
- Type safety enforced
- No legacy verbs

---

## ⚙️ Inngest AUDIT (Scaffold Only)

**Branch:** Part of core PRs

### ✅ Allowed

- [ ] Function declarations only
- [ ] Queue definitions only
- [ ] Explicit `throw new Error("Not implemented – Phase 3 Week 5")`
- [ ] No handler logic
- [ ] No state management

### ❌ Forbidden (Instant Rejection)

- [ ] No LLM calls
- [ ] No Planner/Research/Writer code
- [ ] No content writes
- [ ] No retry logic
- [ ] No actual orchestration
- [ ] No database updates

### Acceptance Criteria

**FAIL IF:**
- Any function produces text
- Any function calls external API
- Any function writes to database
- Any function has real logic

**PASS IF:**
- Functions throw "Not implemented"
- Queues defined
- Wiring complete
- No actual execution

---

## 🧪 TESTING AUDIT

### Required Tests (ALL REQUIRED)

- [ ] Gate tests returning correct 403 + code
- [ ] Feature flag resolution test (env, org, default)
- [ ] RLS access test (cross-org denial)
- [ ] Legacy article generation test passes
- [ ] Status validation test
- [ ] Migration forward test
- [ ] Migration rollback test

### Test Quality

- [ ] Tests use real database (not mocks)
- [ ] Tests verify blocking behavior
- [ ] Tests verify error codes
- [ ] Tests verify data isolation

### ❌ Forbidden (Instant Rejection)

- [ ] No mocks bypassing gates
- [ ] No skipping failing tests
- [ ] No `skip()` or `xit()`
- [ ] No commented-out tests

### Acceptance Criteria

**FAIL IF:**
- Any test is skipped
- Any test uses mocks for gates
- Any test fails
- Coverage < 80%

**PASS IF:**
- All tests pass
- All gates tested
- All RLS tested
- All features tested

---

## 🚨 GLOBAL RED FLAGS (Instant Rejection)

Reject the PR immediately if you see:

- [ ] "Just for now"
- [ ] "Temporary"
- [ ] "We'll clean this later"
- [ ] "Hardcoded for testing"
- [ ] "UI will handle this"
- [ ] "This makes it easier"
- [ ] "Skip this for now"
- [ ] "TODO: fix later"
- [ ] Comments like "HACK" or "FIXME"
- [ ] Commented-out code

Those are **BMAD violations**, not engineering shortcuts.

---

## ✅ WEEK 1 SIGN OFF (ALL MUST BE TRUE)

You sign Week 1 complete **only if**:

- [ ] All 5 PRs merged **in order** (PR 1 → PR 2 → PR 3 → PR 4 → PR 5)
- [ ] Gates block every illegal step (all 5 gates tested)
- [ ] Feature flags default correctly (all 9 flags verified)
- [ ] Legacy workflow untouched (legacy articles still generate)
- [ ] No content can be generated (Inngest throws "Not implemented")
- [ ] Engineers ask **zero** "what's next?" questions
- [ ] All tests pass
- [ ] All BMAD principles enforced
- [ ] Zero ambiguity in code

**If even one box fails → Week 1 is not done.**

---

## PM Audit Process

### Before PR Merge

1. **Read the PR description** - Does it match the scope?
2. **Check the code** - Does it follow the checklist?
3. **Run the tests** - Do they all pass?
4. **Ask the question** - "Can this be bypassed?"
5. **Make the decision** - Approve or reject

### If PR Fails

1. **Identify the failure** - Which checklist item?
2. **Communicate clearly** - "PR fails because [item] is missing"
3. **Require fix** - "Please implement [item] and resubmit"
4. **Re-audit** - Check the fix before approving

### If All PRs Pass

1. **Sign off Week 1** - Mark all checkboxes
2. **Communicate to team** - "Week 1 complete, Week 2 can start"
3. **Brief engineering** - "Week 2 scope is ICP + Competitors"
4. **Monitor Week 2** - Use same audit checklist

---

## Escalation

### If Engineering Pushes Back

**They say:** "This is too strict"  
**You say:** "BMAD is not negotiable. Architecture is locked."

**They say:** "We need to skip this for now"  
**You say:** "No. Week 1 is foundation only. If it's not in scope, it's out."

**They say:** "Tests will catch this later"  
**You say:** "Tests don't enforce BMAD. This checklist does."

---

## Success Metrics

**Week 1 is successful when:**

✅ All 5 PRs merged in order  
✅ All gates enforced  
✅ All flags working  
✅ All RLS policies in place  
✅ All status vocabulary standardized  
✅ All tests passing  
✅ Zero content generation possible  
✅ Zero ambiguity in code  
✅ PM sign-off complete  

---

## Next Steps

1. **Engineering submits PR 1** (Database Foundations)
2. **PM audits PR 1** (use this checklist)
3. **PR 1 merges** (or rejected with feedback)
4. **Engineering submits PR 2** (Feature Flags)
5. **PM audits PR 2** (use this checklist)
6. **Continue for PR 3, 4, 5**
7. **All 5 PRs merged** → Week 1 complete

---

**Week 1 Audit Status:** ✅ READY FOR ENGINEERING  
**Authority:** PM has veto power  
**Rule:** Passing tests ≠ passing BMAD  
**Next:** Engineering submits PR 1

