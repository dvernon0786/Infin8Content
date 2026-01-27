# DEV INSTRUCTION — Dead Code Removal (NO Behavior Change)

**Date:** 2026-01-27  
**Status:** Ready for DEV execution  
**Type:** Cleanup task (prerequisite for outline generation improvements)

---

## Context

We've completed a full runtime analysis of the article generation pipeline. Two files are confirmed **dead code** and are **not executed in production or staging**.

This task is **cleanup only**. Do **not** change outline logic or behavior.

---

## ✅ Files to DELETE

### 1. `lib/article-generation/outline/outline-generator.ts`

- Legacy, class-based `OutlineGenerator` 
- ~460 lines
- Not imported by any active code
- Only referenced by a legacy worker that is also unused

### 2. `lib/article-generation/inngest-worker.ts`

- Legacy Inngest worker (~355 lines)
- Replaced by `lib/inngest/functions/generate-article.ts` 
- Not registered or executed

---

## 🔍 Verified Facts

- ✅ Active runtime uses: `lib/services/article-generation/outline-generator.ts` 
- ✅ Active Inngest function: `lib/inngest/functions/generate-article.ts` 
- ✅ No other files import the two files listed above
- ✅ Tests do not depend on them
- ✅ Removing them causes **zero runtime behavior change**

---

## 🛠️ Task Requirements

- Delete the two files listed above
- Remove any now-unused imports (if any appear)
- Do **not** modify:
  - Active outline generator
  - Inngest logic
  - OpenRouter integration
- Run tests and ensure build passes

---

## ✅ Acceptance Criteria

- [ ] Build passes
- [ ] Tests pass
- [ ] Article generation behaves **identically**
- [ ] No outline logic changes
- [ ] No new functionality added

---

## Evidence & References

**Analysis Document:** `/docs/outline-generation-runtime-analysis.md`

**Key Finding:** Section 3 - Multiple Implementations Check
- Two implementations exist
- Only one is active in production
- Legacy implementation is completely unused

This cleanup is a prerequisite before improving outline generation.
