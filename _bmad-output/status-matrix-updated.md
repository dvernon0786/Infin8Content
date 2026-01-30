# Status Matrix - Primary Content Workflow (UPDATED)

**Project:** Infin8Content  
**Workflow:** BMAD Primary Content Workflow (Intent Engine)  
**Status:** Architecture LOCKED (BMAD-CLEAN)

## Overview

The Status Matrix provides comprehensive visibility into the workflow state at every layer using standardized vocabulary. Each layer tracks status independently and blocks dependent actions.

---

## Status Vocabulary (STANDARDIZED)

| Phase | Status Verb | Meaning |
|-------|-------------|---------|
| System produced | `generated` | System created the artifact |
| System filtered | `filtered` | System applied hard filters |
| System completed | `completed` | System finished processing |
| Human decision | `approved` | Human explicitly approved |
| Human decision | `rejected` | Human explicitly rejected |
| Execution queued | `queued` | Waiting in queue |
| Execution running | `generating` | Currently processing |
| Execution finished | `completed` | Successfully finished |
| Execution failed | `failed` | Error during processing |
| Archived | `archived` | Removed from workflow |

---

## Layer 1: Competitor Status

### Status Flow
`generated` → `generating` → `completed` → `failed` → `archived`

### Status Tracking

```
Competitor URL: https://competitor1.com
├─ Status: completed
├─ Domain: competitor1.com
├─ Added: 2026-01-30T12:00:00Z
├─ Completed: 2026-01-30T12:05:00Z
├─ Analysis Data:
│  ├─ Domain Authority: 45
│  ├─ Backlinks: 1,250
│  ├─ Organic Traffic: 50,000
│  ├─ Top Keywords: 342
│  └─ Content Pages: 1,245
└─ Seeds Generated: 3

Competitor URL: https://competitor2.com
├─ Status: generating
├─ Domain: competitor2.com
├─ Added: 2026-01-30T12:10:00Z
├─ Started: 2026-01-30T12:15:00Z
├─ Progress: 65%
└─ Estimated Completion: 2026-01-30T12:20:00Z

Competitor URL: https://competitor3.com
├─ Status: generated
├─ Domain: competitor3.com
├─ Added: 2026-01-30T12:20:00Z
└─ Awaiting Analysis
```

### Blocking Rules
- Cannot generate seeds until competitor is `completed`
- Cannot proceed to Step 3 until ALL competitors are `completed` or `archived`

---

## Layer 2: Seed Keyword Status

### Status Flow
`generated` → `approved` / `rejected` → `archived`

### Status Tracking

```
Seed Keyword: "Content Marketing"
├─ Source Competitor: competitor1.com
├─ Status: approved
├─ Generated: 2026-01-30T12:05:00Z
├─ Approved: 2026-01-30T12:25:00Z
├─ keyword_level: seed
├─ parent_keyword_id: NULL
├─ Metrics:
│  ├─ Volume: 50,000
│  ├─ Difficulty: 45
│  ├─ ICP Relevance: 0.92
│  └─ Hub-Spoke Potential: 0.95
├─ Longtails Generated: 12
└─ Longtails Approved: 9

Seed Keyword: "SEO Strategy"
├─ Source Competitor: competitor1.com
├─ Status: approved
├─ Generated: 2026-01-30T12:05:00Z
├─ Approved: 2026-01-30T12:25:00Z
├─ keyword_level: seed
├─ parent_keyword_id: NULL
├─ Metrics:
│  ├─ Volume: 35,000
│  ├─ Difficulty: 52
│  ├─ ICP Relevance: 0.88
│  └─ Hub-Spoke Potential: 0.87
├─ Longtails Generated: 12
└─ Longtails Approved: 8

Seed Keyword: "Digital Marketing"
├─ Source Competitor: competitor1.com
├─ Status: rejected
├─ Generated: 2026-01-30T12:05:00Z
├─ Rejected: 2026-01-30T12:26:00Z
└─ Reason: Low ICP relevance (0.65)
```

### Blocking Rules
- Cannot generate longtails until seeds are `approved`
- Must have at least 1 approved seed to proceed
- Max 3 seeds per competitor

---

## Layer 3: Longtail Keyword Status

### Status Flow
`generated` → `filtered` → `completed` → `approved` / `rejected` → `archived`

### Status Tracking

```
HUB: "Content Marketing" (Seed)
├─ Longtail: "Content Marketing Strategy"
│  ├─ Status: approved
│  ├─ Generated: 2026-01-30T12:30:00Z
│  ├─ keyword_level: longtail
│  ├─ parent_keyword_id: <seed_id>
│  ├─ Metrics:
│  │  ├─ Volume: 8,200
│  │  ├─ Difficulty: 38
│  │  ├─ Commercial Intent: 0.78
│  │  ├─ ICP Relevance: 0.85
│  │  └─ Hub-Spoke Potential: 0.92
│  ├─ Source Method: related_keywords
│  ├─ Subtopics Generated: 3
│  └─ Subtopics Approved: 3
│
├─ Longtail: "Content Marketing Tools"
│  ├─ Status: approved
│  ├─ Generated: 2026-01-30T12:30:00Z
│  ├─ keyword_level: longtail
│  ├─ parent_keyword_id: <seed_id>
│  ├─ Metrics:
│  │  ├─ Volume: 5,100
│  │  ├─ Difficulty: 42
│  │  ├─ Commercial Intent: 0.85
│  │  ├─ ICP Relevance: 0.82
│  │  └─ Hub-Spoke Potential: 0.88
│  ├─ Source Method: keyword_ideas
│  ├─ Subtopics Generated: 3
│  └─ Subtopics Approved: 2
│
└─ Longtail: "Content Marketing Plan"
   ├─ Status: approved
   ├─ Generated: 2026-01-30T12:30:00Z
   ├─ keyword_level: longtail
   ├─ parent_keyword_id: <seed_id>
   ├─ Metrics:
   │  ├─ Volume: 3,800
   │  ├─ Difficulty: 35
   │  ├─ Commercial Intent: 0.72
   │  ├─ ICP Relevance: 0.88
   │  └─ Hub-Spoke Potential: 0.90
   ├─ Source Method: suggestions
   ├─ Subtopics Generated: 3
   └─ Subtopics Approved: 3

HUB: "SEO Strategy" (Seed)
├─ Longtail: "SEO Strategy for Beginners"
│  ├─ Status: approved
│  ├─ keyword_level: longtail
│  ├─ parent_keyword_id: <seed_id>
│  └─ Subtopics Approved: 3
│
├─ Longtail: "Local SEO Strategy"
│  ├─ Status: approved
│  ├─ keyword_level: longtail
│  ├─ parent_keyword_id: <seed_id>
│  └─ Subtopics Approved: 3
│
└─ Longtail: "SEO Strategy 2024"
   ├─ Status: rejected
   ├─ keyword_level: longtail
   ├─ parent_keyword_id: <seed_id>
   ├─ Reason: Difficulty too high (68 > 60 threshold)
   └─ Rejected: 2026-01-30T12:35:00Z
```

### Filtering Rules (Hard Filters)
- Difficulty < 60
- Volume > 1,000
- Region match (US, UK, CA, AU)
- Language match (English)
- ICP semantic relevance > 0.70

### Ranking Rules (Soft Ranking)
- Commercial intent score
- Service relevance to ICP
- Hub-and-spoke potential
- Content gap opportunity

### Blocking Rules
- Cannot generate subtopics until longtails are `completed`
- Must have at least 1 completed longtail to proceed
- Max 12 longtails per seed

---

## Layer 4: Subtopic Status

### Status Flow
`generated` → `pending_approval` → `approved` (IMMUTABLE) → `archived`

### Immutability Rule (LOCKED)
**Once a subtopic is `approved`, it is IMMUTABLE.**
- Cannot be modified
- Cannot be deleted
- Regeneration creates new subtopic with new ID
- Original remains in audit trail
- Enables A/B testing and traceability

### Status Tracking

```
SPOKE: "Content Marketing Strategy" (Longtail)
├─ Subtopic: "How to Create a Content Strategy"
│  ├─ Status: approved (IMMUTABLE)
│  ├─ Angle: how-to
│  ├─ Generated: 2026-01-30T12:40:00Z
│  ├─ Approved: 2026-01-30T12:45:00Z
│  ├─ Estimated Word Count: 2,500
│  ├─ Difficulty: 38
│  ├─ regenerated_from_id: NULL
│  └─ Article Status: queued
│
├─ Subtopic: "Content Strategy Best Practices"
│  ├─ Status: approved (IMMUTABLE)
│  ├─ Angle: guide
│  ├─ Generated: 2026-01-30T12:40:00Z
│  ├─ Approved: 2026-01-30T12:45:00Z
│  ├─ Estimated Word Count: 3,000
│  ├─ Difficulty: 42
│  ├─ regenerated_from_id: NULL
│  └─ Article Status: queued
│
└─ Subtopic: "Content Strategy Tools"
   ├─ Status: rejected
   ├─ Angle: comparison
   ├─ Generated: 2026-01-30T12:40:00Z
   ├─ Rejected: 2026-01-30T12:46:00Z
   └─ Reason: Too similar to "Content Marketing Tools" spoke

SPOKE: "Content Marketing Tools" (Longtail)
├─ Subtopic: "Best Content Marketing Tools 2024"
│  ├─ Status: approved (IMMUTABLE)
│  ├─ Angle: list
│  ├─ Generated: 2026-01-30T12:40:00Z
│  ├─ Approved: 2026-01-30T12:45:00Z
│  ├─ Estimated Word Count: 2,800
│  ├─ regenerated_from_id: NULL
│  └─ Article Status: queued
│
├─ Subtopic: "Content Marketing Tool Comparison"
│  ├─ Status: pending_approval
│  ├─ Angle: vs
│  ├─ Generated: 2026-01-30T12:40:00Z
│  └─ Awaiting User Review
│
└─ Subtopic: "Free Content Marketing Tools"
   ├─ Status: pending_approval
   ├─ Angle: budget
   ├─ Generated: 2026-01-30T12:40:00Z
   └─ Awaiting User Review
```

### Blocking Rules
- Cannot generate articles until subtopics are `approved`
- User must explicitly approve each subtopic
- No automatic article generation

---

## Layer 5: Article Status

### Status Flow
`queued` → `generating` → `completed` → `failed` → `published` → `archived`

### Status Tracking

```
Article: "How to Create a Content Strategy"
├─ Source Subtopic: "How to Create a Content Strategy"
├─ Source Longtail: "Content Marketing Strategy"
├─ Source Seed: "Content Marketing"
├─ Source Competitor: competitor1.com
├─ Status: generating
├─ Queued: 2026-01-30T12:50:00Z
├─ Started: 2026-01-30T12:51:00Z
├─ Progress: 45%
├─ Estimated Completion: 2026-01-30T13:05:00Z
├─ Target Word Count: 2,500
├─ Current Word Count: 1,125
└─ Workflow Mode: primary

Article: "Content Strategy Best Practices"
├─ Source Subtopic: "Content Strategy Best Practices"
├─ Source Longtail: "Content Marketing Strategy"
├─ Source Seed: "Content Marketing"
├─ Source Competitor: competitor1.com
├─ Status: queued
├─ Queued: 2026-01-30T12:50:00Z
├─ Position in Queue: 2
├─ Target Word Count: 3,000
└─ Workflow Mode: primary

Article: "Best Content Marketing Tools 2024"
├─ Source Subtopic: "Best Content Marketing Tools 2024"
├─ Source Longtail: "Content Marketing Tools"
├─ Source Seed: "Content Marketing"
├─ Source Competitor: competitor1.com
├─ Status: completed
├─ Queued: 2026-01-30T12:50:00Z
├─ Completed: 2026-01-30T13:02:00Z
├─ Generation Time: 12 minutes
├─ Final Word Count: 2,847
├─ Quality Score: 0.92
├─ SEO Score: 0.88
└─ Workflow Mode: primary
```

---

## Workflow Progress Dashboard

### Overall Status

```
┌─────────────────────────────────────────────────────────────┐
│                 WORKFLOW PROGRESS MATRIX                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Step 1: ICP Generation                        ✓ COMPLETED   │
│ Step 2: Competitor Analysis                   ⏳ IN PROGRESS │
│ Step 3: Seed Keywords                         ✓ COMPLETED   │
│ Step 4: Longtail Keywords                     ✓ COMPLETED   │
│ Step 5: Filtering & Ranking                   ✓ COMPLETED   │
│ Step 6: Topic Clustering                      ✓ COMPLETED   │
│ Step 7: Subtopic Generation                   ✓ COMPLETED   │
│ Step 8: Human Approval                        ⏳ IN PROGRESS │
│                                                               │
│ Overall Progress: ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                   Step 2 of 8 (25%)                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Layer Summary

| Layer | Total | Generated | Completed | Approved | Rejected | Failed | Archived |
|-------|-------|-----------|-----------|----------|----------|--------|----------|
| Competitors | 3 | 1 | 1 | - | - | 0 | 0 |
| Seeds | 3 | 3 | - | 2 | 1 | 0 | 0 |
| Longtails | 9 | 9 | 8 | 8 | 1 | 0 | 0 |
| Subtopics | 27 | 27 | - | 24 | 2 | 0 | 1 |
| Articles | 8 | - | 1 | - | - | 0 | 0 |

---

## Blocking Conditions

### Prerequisites by Step

```
Step 1: ICP Generation
├─ Prerequisites: None
└─ Blocks: Step 2

Step 2: Competitor Analysis
├─ Prerequisites: ICP generated
└─ Blocks: Step 3

Step 3: Seed Keywords
├─ Prerequisites: Competitors completed
└─ Blocks: Step 4

Step 4: Longtail Keywords
├─ Prerequisites: Seeds approved
└─ Blocks: Step 5

Step 5: Filtering & Ranking
├─ Prerequisites: Longtails generated
└─ Blocks: Step 6

Step 6: Topic Clustering
├─ Prerequisites: Longtails completed
└─ Blocks: Step 7

Step 7: Subtopic Generation
├─ Prerequisites: Clusters organized
└─ Blocks: Step 8

Step 8: Human Approval
├─ Prerequisites: Subtopics generated
└─ Blocks: Article Generation

Article Generation
├─ Prerequisites: Subtopics approved
└─ Blocks: None
```

---

## Status Change Notifications

### Events Triggered

```
Event: competitor_completed
├─ Trigger: Competitor status → completed
├─ Action: Unlock seed generation
└─ Notification: "Competitor analysis complete"

Event: seeds_approved
├─ Trigger: All seeds approved
├─ Action: Unlock longtail generation
└─ Notification: "Ready to generate longtails"

Event: longtails_completed
├─ Trigger: All longtails completed
├─ Action: Unlock clustering
└─ Notification: "Keywords ready for clustering"

Event: subtopics_generated
├─ Trigger: All subtopics generated
├─ Action: Unlock approval workflow
└─ Notification: "Subtopics ready for approval"

Event: subtopics_approved
├─ Trigger: All subtopics approved
├─ Action: Unlock article generation
└─ Notification: "Ready to generate articles"

Event: article_completed
├─ Trigger: Article status → completed
├─ Action: Update progress
└─ Notification: "Article generated successfully"

Event: subtopic_regenerated
├─ Trigger: New subtopic created from approved subtopic
├─ Action: Track lineage via regenerated_from_id
└─ Notification: "New subtopic created (original immutable)"
```

---

## Metrics & Analytics

### Workflow Metrics

```
Total Time: 1 hour 5 minutes
├─ ICP Generation: 5 minutes
├─ Competitor Analysis: 15 minutes
├─ Seed Generation: 2 minutes
├─ Longtail Generation: 8 minutes
├─ Filtering & Ranking: 3 minutes
├─ Clustering: 2 minutes
├─ Subtopic Generation: 12 minutes
├─ Human Approval: 10 minutes
└─ Article Generation: 12 minutes (in progress)

Cost Breakdown:
├─ Perplexity Sonar (ICP): $0.02
├─ DataForSEO (Competitors): $0.15
├─ DataForSEO (Keywords): $0.45
├─ DataForSEO (Subtopics): $0.30
├─ OpenRouter (Articles): $0.08
└─ Total Cost: $1.00

Quality Metrics:
├─ ICP Relevance: 0.92 (average)
├─ Keyword Relevance: 0.85 (average)
├─ Article Quality: 0.92 (completed)
└─ SEO Score: 0.88 (completed)
```

---

**Status:** BMAD-CLEAN AND EXECUTION-SAFE  
**Immutability:** LOCKED  
**Ready for Engineering:** YES
