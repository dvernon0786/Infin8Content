# Internal Linking Trigger Flow

## When & Where Internal Linking Gets Triggered

### 🎯 HIGH-LEVEL FLOW

```
User Clicks "Generate" Button
        ↓
[1] POST /api/articles/generate
        ↓
[2] Status: draft → processing
        ↓
[3] Inngest Event Emitted: 'article/generate'
        ↓
[4] Inngest Worker Starts (lib/inngest/functions/generate-article.ts)
        ↓
[5] Article Generation Pipeline Runs (20+ steps)
        ↓
[6] Step: 'internal-linking' (STEP 18 in pipeline)
        ↓
[7] runInternalLinking() executes
        ↓
[8] Links injected into article sections
        ↓
[9] Article assembled and marked 'completed'
```

---

## 1️⃣ WHERE: User Triggers Generation

**File:** `/app/dashboard/write/page.tsx` (or similar write UI)  
**Component:** ArticleDetailClient or similar  

```typescript
// User clicks a "Generate" or "Start Writing" button
onClick={() => {
  fetch('/api/articles/generate', {
    method: 'POST',
    body: JSON.stringify({ articleId })
  })
}}
```

**Current Status:** `draft` | `queued` | `failed`

---

## 2️⃣ WHEN: Article Status Transitions

**Endpoint:** `POST /api/articles/generate`  
**File:** `/app/api/articles/generate/route.ts`

### Status Lock (Atomic)
```
Before:  status = 'draft' (or 'queued' / 'failed')
   ↓
After:   status = 'processing'  ← Article is now locked
```

**Why?** Prevents duplicate generation if user clicks twice.

---

## 3️⃣ INNGEST JOB SUBMISSION

**Code in route.ts (line 130-138):**

```typescript
await inngest.send({
  name: 'article/generate',              // ← Event name
  id: `article-gen-${articleId}`,       // ← Unique job ID
  data: {
    articleId,
    workflowId: article.intent_workflow_id,
    organizationId: article.org_id
  }
})
```

**Queue:** Inngest (background job processor)  
**Concurrency:** 1 per articleId (no parallel generation of same article)

---

## 4️⃣ INNGEST WORKER EXECUTION

**File:** `/lib/inngest/functions/generate-article.ts`

The worker executes a 20+ step pipeline:

```
Step 1:    Load Context (article, org, config)
Step 2:    Content Planner (outline structure)
Step 3:    Research (search for information)
Step 4:    Content Writing (write sections)
Step 5:    Section Writing (finalize each section)
...
Step 18:   INTERNAL LINKING ← 🔗 YOU ARE HERE
Step 19:   Article Assembly
Step 20:   Generate Schema Markup
Step 21:   Image Generation
Step 22:   Publish (if auto_publish=true)
```

Each step is **idempotent** (can be retried safely).

---

## 5️⃣ INTERNAL LINKING STEP (LINE 573-597)

**File:** `/lib/inngest/functions/generate-article.ts`

```typescript
await step.run('internal-linking', async () => {
  // Check if internal linking is ENABLED
  if (!generationConfig.internal_links) {
    console.log('[Worker] Internal linking disabled — skipping')
    return { skipped: true, reason: 'disabled_in_config' }
  }

  // CALL THE LINKING SERVICE
  const { runInternalLinking } = await import(
    '@/lib/services/article-generation/internal-linking-service'
  )

  const result = await runInternalLinking({
    articleId,
    orgId: orgId ?? event.data.organizationId,
    currentKeyword: plan.target_keyword,
    maxLinks: generationConfig.num_internal_links ?? 5,  // 👈 Use their config (e.g., 3)
    supabase,
  })

  // Log results
  console.log(
    `[Worker] Internal linking: injected=${result.linksInjected} ` +
    `sections=${result.sectionsUpdated}`
  )

  return result
})
```

### Key Decision Point
```
Is internal_links = true?
├─ YES → Execute runInternalLinking()
│        ├─ Load link map (manual + crawled + DB articles)
│        ├─ Process each article section
│        ├─ Inject up to num_internal_links (e.g., 3)
│        └─ Update DB with linked content
│
└─ NO → Skip linking (do nothing)
```

---

## 6️⃣ CONFIGURATION USED

For damien@flowtic.cloud, these settings from the database will be used:

```javascript
{
  internal_links: true,           // ✅ Feature ENABLED
  num_internal_links: 3,          // ✅ Max 3 links per article
  
  // Other settings (for context):
  language: 'english',
  tone: 'professional',
  style: 'informative',
  target_word_count: 1500,
  auto_publish: false,
  brand_color: '#000000',
  image_style: 'brand_text_realism',
  add_cta: true,
  add_youtube_video: false,
  add_infographics: false,
  add_emojis: false
}
```

These come from `organizations.content_defaults` table.

---

## 7️⃣ WHAT HAPPENS IN runInternalLinking()

**File:** `/lib/services/article-generation/internal-linking-service.ts`

### Step-by-Step

```
1. BUILD LINK MAP
   └─ Fetch from 3 sources (priority order):
      ├─ Manual links (from org settings)
      ├─ Crawled links (from website sitemap crawl)
      └─ DB articles (from completed articles in org)

2. LOAD ARTICLE SECTIONS
   └─ Get all sections with status='completed'

3. CALCULATE LINK BUDGET
   └─ total_words ÷ 300 = link_budget
   └─ Capped at maxLinks (= 3 for this user)

4. INJECT LINKS
   └─ For each section (skip intro & conclusion):
      ├─ Try to match link anchor text in content
      ├─ Check if already linked (prevent duplicates)
      ├─ Create [text](url) in markdown
      ├─ Create <a href="url">text</a> in HTML
      └─ Until link_budget exhausted

5. UPDATE DATABASE
   └─ Save linked markdown and HTML back to DB
   └─ Update article_sections table
```

---

## 8️⃣ AFTER INTERNAL LINKING

**Flow Continues:**

```
Internal Linking Complete ✅
        ↓
Article Assembly (combines sections into final article)
        ↓
Schema Markup Generation (for SEO)
        ↓
Image Generation
        ↓
Auto-Publish? (if enabled in config)
│
├─ YES → Publish to CMS via integration
│
└─ NO → Save as 'completed', user publishes manually
```

---

## TIMELINE: When Does This Happen?

### For damien@flowtic.cloud:

| When | Action | Status |
|------|--------|--------|
| User clicks "Generate" | API receives request | `draft` → `processing` |
| Immediately | Inngest job queued | Job ID created |
| Seconds later | Worker starts (if Inngest has capacity) | Steps 1-17 run |
| ~30-120 seconds | Internal linking step runs | Links injected |
| ~1-3 minutes total | Full article generation done | `processing` → `completed` |
| After that | User sees finished article in dashboard | Read-only or editable |

---

## CONFIG CHECK: Will It Trigger?

For this user:

```javascript
internal_links === true  ?  ✅ YES, WILL TRIGGER
num_internal_links === 3 ?  ✅ Will attempt 3 links max
```

✅ **Internal linking WILL run** when they generate their first article.

---

## Logs You'll See

In Inngest dashboard or server logs:

```
[Worker] Internal linking: injected=2 sections=3 skipped=false
```

This means:
- ✅ 2 internal links were successfully injected
- ✅ 3 article sections were updated with links
- ✅ Feature was not skipped

Or if disabled:

```
[Worker] Internal linking disabled in generation config — skipping
```

---

## Quick Reference

| Component | File | When |
|-----------|------|------|
| **Trigger** | `/api/articles/generate/route.ts` | User clicks button |
| **Worker** | `/lib/inngest/functions/generate-article.ts` | Inngest picks up job |
| **Linking Logic** | `/lib/services/article-generation/internal-linking-service.ts` | Step 18 of pipeline |
| **Config Read** | `organizations.content_defaults` | During article generation |
| **Links Stored** | `article_sections` table | After linking completes |

