# PM ACTION REQUIRED — Outline Generation Analysis (Pre-Fix)

**Date:** 2026-01-27  
**Status:** PENDING PM INVESTIGATION  
**Purpose:** Establish runtime certainty before any outline generation changes

---

## Critical: Do NOT Proceed Without This Analysis

Before we remove, replace, or modify anything in the article generation pipeline, we need **runtime certainty based on production behavior**, not assumptions.

Please investigate and confirm the following points. Return short written confirmations (yes/no + notes) for each.

---

## 1. Runtime Call Chain (CRITICAL)

**Question:** Confirm **exactly which function is executed** for outline generation in production.

**What we need:**
- Full call path from: API → Inngest → outline generation step
- Confirm whether `outline-generator.ts` is the **only** outline implementation executed at runtime
- Provide code references or execution logs

**Deliverable:**
- [ ] Call chain documented
- [ ] Single implementation confirmed
- [ ] Evidence provided (logs/code refs)

**Notes:**
```
Current assumption: outline-generator.ts is the only implementation
Need to verify: No alternate paths, feature flags, or legacy code executing
```

---

## 2. OpenRouter Usage Attribution

**Question:** Confirm whether **any OpenRouter calls** originate from outline generation.

**What we need:**
- Correlate OpenRouter logs with pipeline steps
- Are all OpenRouter calls tied only to `section-processor`?
- Has outline generation *ever* invoked OpenRouter in prod or staging?
- Check API logs, cost tracking, token usage

**Deliverable:**
- [ ] OpenRouter call attribution confirmed
- [ ] Outline generation OpenRouter usage: YES / NO
- [ ] Evidence: API logs, cost reports, or code inspection

**Notes:**
```
Current assumption: Outline generation uses placeholder, no OpenRouter calls
Need to verify: No hidden OpenRouter integration in outline-generator.ts
```

---

## 3. Multiple Implementations Check

**Question:** Verify whether **more than one outline generator exists**.

**What we need:**
- Search for: feature flags, experiments, legacy code, alternate paths
- Confirm there is **no secondary implementation** bypassing `outline-generator.ts`
- Check: environment-specific code, A/B test branches, fallback implementations

**Deliverable:**
- [ ] Single implementation confirmed
- [ ] No feature flags or experiments found
- [ ] No legacy/alternate paths identified
- [ ] Code search results provided

**Notes:**
```
Current assumption: Single outline-generator.ts implementation
Need to verify: No hidden implementations in:
  - lib/services/article-generation/
  - lib/inngest/functions/
  - Feature flag branches
  - Environment-specific code
```

---

## 4. Downstream Dependencies

**Question:** Identify any downstream steps that **assume the current placeholder structure**.

**What we need:**
- Fixed H3 counts (currently hardcoded subsections)
- Specific subsection names
- Dependencies in: batch research, section processing, publishing
- Check: templates, formatting, validation logic

**Deliverable:**
- [ ] Downstream dependencies identified
- [ ] Hardcoded assumptions listed
- [ ] Impact assessment provided

**Notes:**
```
Current structure: Fixed H3 subsections in placeholder
Need to verify: What breaks if outline structure changes?
  - Does batch research expect specific H3 count?
  - Does section processor validate subsection names?
  - Does publishing depend on outline format?
```

---

## 5. Failure Semantics (Current State)

**Question:** What happens today if outline generation fails?

**What we need:**
- Error handling behavior
- Pipeline abort vs. retry vs. silent continue
- User-facing impact
- Error logs from production

**Deliverable:**
- [ ] Failure behavior documented
- [ ] Pipeline impact confirmed
- [ ] Error logs reviewed

**Notes:**
```
Current assumption: Pipeline continues with placeholder outline
Need to verify:
  - Does error throw and abort pipeline?
  - Does it retry?
  - Does it silently continue?
  - What do users see?
```

---

## 6. Persistence & Reuse

**Question:** Is the outline stored, cached, or regenerated?

**What we need:**
- Is outline stored in database?
- Cached across retries?
- Regenerated on every run?
- Rollback implications

**Deliverable:**
- [ ] Persistence model confirmed
- [ ] Cache behavior documented
- [ ] Rollback impact assessed

**Notes:**
```
Current assumption: Outline generated fresh each run, not persisted
Need to verify:
  - Is outline stored in articles table?
  - Is it cached in Redis or similar?
  - Can we safely change it without data migration?
```

---

## 7. Retry, Cost, and Limits

**Question:** Confirm retry behavior and cost tracking for outline generation.

**What we need:**
- Retry count and backoff strategy
- Timeout duration
- Cost tracking (is it billed toward user quota?)
- Token usage attribution

**Deliverable:**
- [ ] Retry behavior documented
- [ ] Cost tracking confirmed
- [ ] Quota impact assessed

**Notes:**
```
Current assumption: Outline generation is not tracked for cost/quota
Need to verify:
  - Retry count: ?
  - Backoff: ?
  - Timeout: ?
  - Cost tracked: YES / NO
  - Billed toward quota: YES / NO
```

---

## 8. User & Product Impact

**Question:** Is the outline visible to users? Does it affect product features?

**What we need:**
- Is outline visible in UI anywhere?
- Does it affect: analytics, templates, WordPress publishing?
- Identify blast radius if outline behavior changes
- Check: user-facing features, integrations, workflows

**Deliverable:**
- [ ] User visibility confirmed
- [ ] Feature dependencies identified
- [ ] Blast radius assessed

**Notes:**
```
Current assumption: Outline is internal only, not user-visible
Need to verify:
  - Is outline shown in dashboard?
  - Does it affect WordPress publishing?
  - Does it affect analytics or recommendations?
  - What breaks if outline changes?
```

---

## 9. Feature Flag / Rollback Capability

**Question:** Can outline logic be feature-flagged or rolled back?

**What we need:**
- Can it be feature-flagged?
- Can it be environment-scoped?
- Can it be rolled back without redeploy?
- Rollback procedure

**Deliverable:**
- [ ] Feature flag capability confirmed
- [ ] Rollback procedure documented
- [ ] Risk mitigation strategy provided

**Notes:**
```
Current assumption: No feature flag exists
Need to verify:
  - Can we feature-flag outline generation?
  - Can we scope to staging only?
  - Rollback procedure if production issue?
```

---

## Deliverable Template

Please return a document with:

### For Each Question:
```
## [Question Number]. [Question Title]

**Status:** ✅ CONFIRMED / ❌ NOT CONFIRMED / ⚠️ PARTIAL

**Answer:** [Yes/No + brief explanation]

**Evidence:**
- [Log reference / code reference / screenshot]
- [Additional supporting evidence]

**Impact:** [How this affects outline generation changes]

**Notes:** [Any caveats or additional context]
```

---

## Explicit Instruction

⚠️ **Do not propose fixes or changes yet.**

This task is **analysis only** to establish certainty before any removal, replacement, or modification happens.

Once this analysis is complete, we can proceed with:
1. Safe outline generation implementation
2. Feature-flagged rollout
3. Proper rollback procedure
4. Zero-downtime deployment

---

## Timeline

- **Analysis:** [PM to complete by DATE]
- **Review:** [Engineering to review findings]
- **Decision:** [Proceed with fix or adjust approach]
- **Implementation:** [Only after analysis complete]

---

**This checklist prevents blind refactoring and ensures production safety.**
