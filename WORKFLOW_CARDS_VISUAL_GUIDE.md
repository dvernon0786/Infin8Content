# Workflow Cards - Complete Visual Guide

## Overview

The workflow UI consists of **9 steps** organized across multiple pages, with a shared layout component that provides:
- Progress bar (11% → 100%)
- Step navigation breadcrumbs
- Current step title
- Back/Continue buttons
- Failure state handling

---

## Step Structure

### Page Layout (All Steps)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to dashboard     Workflow Name                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step Title (e.g., "ICP")                                    │
│  Breadcrumb: ICP → Competitors → Seeds → ...                 │
│  Progress bar: [=====>              ] Step 1 of 9            │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │         CARD CONTENT (form, input, etc)              │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  [Exit]                                [Continue →]          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: ICP (Ideal Customer Profile)

**URL:** `/workflows/[id]/steps/1`  
**Type:** Interactive - User Input  
**Progress:** 11%

### Card Content

```
┌─────────────────────────────────────────────────┐
│ Ideal Customer Profile                          │
│ Define your organization's ICP                  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Organization Name                               │
│ [____________________________]                   │
│                                                 │
│ Organization Website                            │
│ [https://yourcompany.com     ]                  │
│                                                 │
│ LinkedIn Company URL                            │
│ [https://linkedin.com/company...]               │
│                                                 │
│ [      Generate ICP      ]                      │
│                                                 │
│ ✓ On success → Step 2                          │
│ ✗ On error → Show error message                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**API Endpoint Called:**
```
POST /api/intent/workflows/{workflow_id}/steps/icp-generate
Body: { organization_name, organization_url, organization_linkedin_url }
```

---

## Step 2: Competitors

**URL:** `/workflows/[id]/steps/2`  
**Type:** Interactive - User Input  
**Progress:** 22%

### Card Content

```
┌─────────────────────────────────────────────────┐
│ Competitors                                     │
│ Enter your main competitors' websites           │
├─────────────────────────────────────────────────┤
│                                                 │
│ Competitor 1                                    │
│ [https://competitor1.com    ]                   │
│                                                 │
│ Competitor 2                                    │
│ [https://competitor2.com    ]                   │
│                                                 │
│ Competitor 3                                    │
│ [https://competitor3.com    ]                   │
│                                                 │
│ [    Analyze Competitors    ]                   │
│                                                 │
│ ✓ On success → Step 3                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

**API Endpoint Called:**
```
POST /api/intent/workflows/{workflow_id}/steps/competitor-analyze
Body: { competitors: string[] }
```

---

## Step 3: Seeds (Keyword Seeds)

**URL:** `/workflows/[id]/steps/3`  
**Type:** Interactive - User Input  
**Progress:** 33%

### Card Content

```
┌─────────────────────────────────────────────────┐
│ Seed Keywords                                   │
│ Enter base keywords (one per line)              │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ seo optimization                          │  │
│ │ content marketing                         │  │
│ │ keyword research                          │  │
│ │                                           │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ [    Extract Keywords     ]                     │
│                                                 │
│ ✓ On success → Step 4 (auto-redirects)        │
│                                                 │
└─────────────────────────────────────────────────┘
```

**API Endpoint Called:**
```
POST /api/intent/workflows/{workflow_id}/steps/seed-extract
Body: { seeds: string }
```

---

## Step 4: Longtails (Longtail Expansion)

**URL:** `/workflows/[id]/steps/4`  
**Type:** Automated - No User Input  
**Progress:** 44%  
**Redirects to:** `/workflows/[id]/progress`

### What Happens (No UI Form)

```
System automatically:
1. Takes seed keywords: ["seo", "marketing"]
2. Expands to longtails:
   - seo → ["seo tips", "seo guide", "best seo"]
   - marketing → ["content marketing", "digital marketing"]
3. Stores results in database
4. Updates workflow state to next step

User sees progress page showing:
┌─────────────────────────────────┐
│ Processing...                   │
│ Longtail Expansion              │
│ [===============>    ] 50%       │
│                                 │
│ Keywords expanded: 150          │
└─────────────────────────────────┘
```

---

## Step 5: Filtering (Keyword Filtering)

**URL:** `/workflows/[id]/steps/5`  
**Type:** Automated - No User Input  
**Progress:** 55%  
**Redirects to:** `/workflows/[id]/progress`

### What Happens (No UI Form)

```
System automatically:
1. Takes expanded keywords
2. Filters by:
   - Search volume (minimum threshold)
   - Competition level (not too competitive)
   - Relevance to ICP
3. Removes low-quality keywords
4. Stores results

User sees progress page showing:
┌─────────────────────────────────┐
│ Processing...                   │
│ Filtering Keywords              │
│ [=================>   ] 60%      │
│                                 │
│ Keywords filtered: 85 of 150   │
└─────────────────────────────────┘
```

---

## Step 6: Clustering (Topic Clustering)

**URL:** `/workflows/[id]/steps/6`  
**Type:** Automated - No User Input  
**Progress:** 66%  
**Redirects to:** `/workflows/[id]/progress`

### What Happens (No UI Form)

```
System automatically:
1. Takes filtered keywords
2. Groups into semantic clusters:
   Cluster 1: ["seo", "search optimization", "seo ranking"]
   Cluster 2: ["content marketing", "blog strategy"]
3. Assigns cluster leaders
4. Prepares for subtopic generation

User sees progress page showing:
┌─────────────────────────────────┐
│ Processing...                   │
│ Clustering Topics               │
│ [====================>  ] 70%    │
│                                 │
│ Clusters created: 8             │
└─────────────────────────────────┘
```

---

## Step 7: Validation (Cluster Validation)

**URL:** `/workflows/[id]/steps/7`  
**Type:** Automated - No User Input  
**Progress:** 77%  
**Redirects to:** `/workflows/[id]/progress`

### What Happens (No UI Form)

```
System automatically:
1. Validates cluster quality
2. Checks cluster coherence
3. Removes outliers
4. Ensures data quality
5. Prepares for subtopic step

User sees progress page showing:
┌─────────────────────────────────┐
│ Processing...                   │
│ Validating Clusters             │
│ [=====================> ] 80%    │
│                                 │
│ Clusters validated: 8           │
└─────────────────────────────────┘
```

---

## Step 8: Subtopics (Generate Subtopics)

**URL:** `/workflows/[id]/steps/8`  
**Type:** Interactive - Review & Approve  
**Progress:** 88%

### Card Content

```
┌─────────────────────────────────────────────────┐
│ Generated Subtopics                             │
│ Review and approve generated subtopics          │
├─────────────────────────────────────────────────┤
│                                                 │
│ ☑ [SEO Basics              ] [Remove]           │
│ ☑ [On-Page Optimization    ] [Remove]           │
│ ☑ [Technical SEO           ] [Remove]           │
│ ☑ [Link Building           ] [Remove]           │
│                                                 │
│ [+ Add Subtopic]                                │
│                                                 │
│ [  Generate Articles  ]                         │
│                                                 │
│ ✓ On success → Step 9                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

**User Actions:**
- Edit subtopic names
- Add/remove subtopics
- Click "Generate Articles" to proceed

**API Endpoint Called:**
```
POST /api/intent/workflows/{workflow_id}/steps/generate-subtopics
Body: { subtopics: string[] }
```

---

## Step 9: Articles (Generate Articles)

**URL:** `/workflows/[id]/steps/9`  
**Type:** Interactive - Select & Generate  
**Progress:** 100%

### Card Content

```
┌─────────────────────────────────────────────────┐
│ Generate Articles                               │
│ Select subtopics to create articles for         │
├─────────────────────────────────────────────────┤
│                                                 │
│ ☑ SEO Basics                                    │
│ ☑ On-Page Optimization                          │
│ ☐ Technical SEO                                 │
│ ☐ Link Building                                 │
│                                                 │
│ [  Generate 2 Articles  ]                       │
│                                                 │
│ ✓ On success:                                  │
│   → Queues articles for generation              │
│   → Articles appear in /dashboard/write         │
│   → Workflow marked as completed                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**User Actions:**
- Check/uncheck subtopics
- Click "Generate X Articles"
- Redirected to /dashboard when complete

**API Endpoint Called:**
```
POST /api/intent/workflows/{workflow_id}/steps/queue-articles
Body: { subtopics: string[] }
```

**After Success:**
```
→ Creates articles in database
→ Queues them for generation
→ Workflow state transitions to 'completed'
→ User sees articles in /dashboard/write
```

---

## Progress Page (Steps 4-7)

**URL:** `/workflows/[id]/progress`  
**Shown During:** Automated pipeline execution

### Display

```
┌─────────────────────────────────────────────────┐
│ Processing...                                   │
│ Current Step: Clustering Topics                 │
│                                                 │
│ [===============>              ] 65%            │
│ Step 6 of 9                                     │
│                                                 │
│ Recent Progress:                                │
│ ✓ ICP Generated                                 │
│ ✓ Competitors Analyzed                          │
│ ✓ Keywords Extracted                            │
│ → Longtail Keywords Expanded                    │
│ → Keywords Filtered                             │
│ → Topics Clustering (current)                   │
│ ⏳ Clusters Validating                           │
│                                                 │
│ Est. Time Remaining: 2 minutes                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Features:**
- Real-time progress updates
- Step status indicators
- Estimated completion time
- Auto-refresh
- Error handling for failures

---

## Navigation & Breadcrumbs

Shown at top of each step page:

```
ICP → Competitors → Seeds → Longtails → Filtering → Clustering → Validation → Subtopics → Articles
  ↑     (current is highlighted and in bold)
  Current Step
```

---

## Progress Bar

Grows from 11% to 100%:

```
Step 1:  [=====>                                    ] 11%
Step 2:  [=========>                                ] 22%
Step 3:  [============>                             ] 33%
Step 4:  [================>                         ] 44%
Step 5:  [====================>                     ] 55%
Step 6:  [=======================>                  ] 66%
Step 7:  [===========================>              ] 77%
Step 8:  [=============================>            ] 88%
Step 9:  [=====================================>    ] 100%
```

---

## State Management

Each step manages:

```typescript
interface StepState {
  workflowId: string          // From URL params
  isRunning: boolean          // During submission
  error: string | null        // Error messages
  formData: Record<string, any> // User inputs
}
```

---

## Error Handling

**Failure State Display:**

```
┌─────────────────────────────────────────────────┐
│ ⚠ This step failed                              │
│ An error occurred while processing this step.   │
│ Please try again or contact support.            │
│                                                 │
│ [Retry]                                         │
└─────────────────────────────────────────────────┘
```

---

## Complete Workflow Timeline

```
User lands on /workflows/[id]
  ↓
Checks workflow state
  ↓
Redirects to current step (/workflows/[id]/steps/N)
  ↓
Step 1: User enters ICP → Submit
  ↓
Step 2: User enters Competitors → Submit
  ↓
Step 3: User enters Seeds → Submit
  ↓
Steps 4-7: Auto-processing (user sees /workflows/[id]/progress)
  ↓
Step 8: User reviews Subtopics → Submit
  ↓
Step 9: User selects Subtopics → Generate Articles → Submit
  ↓
Articles queued for generation
  ↓
Workflow marked as completed
  ↓
User redirected to /dashboard/write
  ↓
Articles begin generating (internal-linking runs at step 18!)
```

---

## File Structure

```
/app/workflows/
├── [id]/
│   ├── page.tsx                    (workflow detail)
│   ├── steps/
│   │   ├── 1/page.tsx             (Step 1 page)
│   │   ├── 2/page.tsx             (Step 2 page)
│   │   ├── 3/page.tsx             (Step 3 page)
│   │   ├── 4/page.tsx             (Step 4 - redirects)
│   │   ├── 5/page.tsx             (Step 5 - redirects)
│   │   ├── 6/page.tsx             (Step 6 - redirects)
│   │   ├── 7/page.tsx             (Step 7 - redirects)
│   │   ├── 8/page.tsx             (Step 8 page)
│   │   └── 9/page.tsx             (Step 9 page)
│   └── progress/                   (auto-step progress)

/components/workflows/
├── WorkflowStepLayoutClient.tsx    (shared layout)
├── steps/
│   ├── Step1ICPForm.tsx
│   ├── Step2CompetitorsForm.tsx
│   ├── Step3SeedsForm.tsx
│   ├── Step8SubtopicsForm.tsx
│   └── Step9ArticlesForm.tsx

/api/intent/workflows/[workflow_id]/steps/
├── icp-generate/route.ts
├── competitor-analyze/route.ts
├── seed-extract/route.ts
├── longtail-expand/route.ts
├── filter-keywords/route.ts
├── cluster-topics/route.ts
├── validate-clusters/route.ts
├── generate-subtopics/route.ts
└── queue-articles/route.ts
```
