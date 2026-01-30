# Status Matrix - Primary Content Workflow

**Project:** Infin8Content  
**Workflow:** BMAD Primary Content Workflow (Intent Engine)  
**Status:** Architecture LOCKED

## Overview

The Status Matrix provides comprehensive visibility into the workflow state at every layer. Each layer tracks status independently and blocks dependent actions.

---

## Layer 1: Competitor Status

### Status Values
- `pending` - URL added, awaiting analysis
- `analyzing` - DataForSEO analysis in progress
- `analyzed` - Analysis complete, ready for seed generation
- `failed` - Analysis failed, requires retry or removal
- `archived` - Competitor removed from workflow

### Status Tracking

```
Competitor URL: https://competitor1.com
├─ Status: analyzed
├─ Domain: competitor1.com
├─ Added: 2026-01-30T12:00:00Z
├─ Analyzed: 2026-01-30T12:05:00Z
├─ Analysis Data:
│  ├─ Domain Authority: 45
│  ├─ Backlinks: 1,250
│  ├─ Organic Traffic: 50,000
│  ├─ Top Keywords: 342
│  └─ Content Pages: 1,245
└─ Seeds Generated: 3

Competitor URL: https://competitor2.com
├─ Status: analyzing
├─ Domain: competitor2.com
├─ Added: 2026-01-30T12:10:00Z
├─ Analyzing Since: 2026-01-30T12:15:00Z
├─ Progress: 65%
└─ Estimated Completion: 2026-01-30T12:20:00Z

Competitor URL: https://competitor3.com
├─ Status: pending
├─ Domain: competitor3.com
├─ Added: 2026-01-30T12:20:00Z
└─ Awaiting Analysis
```

### Blocking Rules
- Cannot generate seeds until competitor is `analyzed`
- Cannot proceed to Step 3 until ALL competitors are `analyzed` or `archived`

---

## Layer 2: Seed Keyword Status

### Status Values
- `generated` - Seed keyword generated from competitor
- `selected` - User selected for longtail expansion
- `rejected` - User rejected, excluded from workflow
- `archived` - Removed from workflow

### Status Tracking

```
Seed Keyword: "Content Marketing"
├─ Source Competitor: competitor1.com
├─ Status: selected
├─ Generated: 2026-01-30T12:05:00Z
├─ Selected: 2026-01-30T12:25:00Z
├─ Metrics:
│  ├─ Volume: 50,000
│  ├─ Difficulty: 45
│  ├─ ICP Relevance: 0.92
│  └─ Hub-Spoke Potential: 0.95
├─ Longtails Generated: 12
└─ Longtails Approved: 9

Seed Keyword: "SEO Strategy"
├─ Source Competitor: competitor1.com
├─ Status: selected
├─ Generated: 2026-01-30T12:05:00Z
├─ Selected: 2026-01-30T12:25:00Z
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
- Cannot generate longtails until seeds are `selected`
- Must have at least 1 selected seed to proceed
- Max 3 seeds per competitor

---

## Layer 3: Longtail Keyword Status

### Status Values
- `generated` - Longtail generated from seed
- `filtered_out` - Failed hard filters
- `ranked` - Passed filters, ranked by soft criteria
- `selected` - User selected for subtopic generation
- `rejected` - User rejected
- `archived` - Removed from workflow

### Status Tracking

```
HUB: "Content Marketing" (Seed)
├─ Longtail: "Content Marketing Strategy"
│  ├─ Status: selected
│  ├─ Generated: 2026-01-30T12:30:00Z
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
│  ├─ Status: selected
│  ├─ Generated: 2026-01-30T12:30:00Z
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
   ├─ Status: selected
   ├─ Generated: 2026-01-30T12:30:00Z
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
│  ├─ Status: selected
│  ├─ Metrics: [...]
│  └─ Subtopics Approved: 3
│
├─ Longtail: "Local SEO Strategy"
│  ├─ Status: selected
│  ├─ Metrics: [...]
│  └─ Subtopics Approved: 3
│
└─ Longtail: "SEO Strategy 2024"
   ├─ Status: rejected
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
- Cannot generate subtopics until longtails are `ranked`
- Must have at least 1 ranked longtail to proceed
- Max 12 longtails per seed

---

## Layer 4: Subtopic Status

### Status Values
- `generated` - Subtopic generated from longtail
- `pending_approval` - Awaiting human review
- `approved` - User approved for article generation
- `rejected` - User rejected
- `archived` - Removed from workflow

### Status Tracking

```
SPOKE: "Content Marketing Strategy" (Longtail)
├─ Subtopic: "How to Create a Content Strategy"
│  ├─ Status: approved
│  ├─ Angle: how-to
│  ├─ Generated: 2026-01-30T12:40:00Z
│  ├─ Approved: 2026-01-30T12:45:00Z
│  ├─ Estimated Word Count: 2,500
│  ├─ Difficulty: 38
│  └─ Article Status: queued
│
├─ Subtopic: "Content Strategy Best Practices"
│  ├─ Status: approved
│  ├─ Angle: guide
│  ├─ Generated: 2026-01-30T12:40:00Z
│  ├─ Approved: 2026-01-30T12:45:00Z
│  ├─ Estimated Word Count: 3,000
│  ├─ Difficulty: 42
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
│  ├─ Status: approved
│  ├─ Angle: list
│  ├─ Generated: 2026-01-30T12:40:00Z
│  ├─ Approved: 2026-01-30T12:45:00Z
│  ├─ Estimated Word Count: 2,800
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

### Status Values
- `queued` - Awaiting generation
- `generating` - Generation in progress
- `completed` - Article generated successfully
- `failed` - Generation failed
- `published` - Published to external CMS
- `archived` - Removed from workflow

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

| Layer | Total | Completed | In Progress | Pending | Failed | Blocked |
|-------|-------|-----------|-------------|---------|--------|---------|
| Competitors | 3 | 1 | 1 | 1 | 0 | 0 |
| Seeds | 3 | 3 | 0 | 0 | 0 | 0 |
| Longtails | 9 | 8 | 0 | 0 | 1 | 0 |
| Subtopics | 27 | 24 | 0 | 2 | 0 | 0 |
| Articles | 8 | 1 | 1 | 6 | 0 | 0 |

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
├─ Prerequisites: Competitors analyzed
└─ Blocks: Step 4

Step 4: Longtail Keywords
├─ Prerequisites: Seeds selected
└─ Blocks: Step 5

Step 5: Filtering & Ranking
├─ Prerequisites: Longtails generated
└─ Blocks: Step 6

Step 6: Topic Clustering
├─ Prerequisites: Longtails ranked
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
Event: competitor_analyzed
├─ Trigger: Competitor status → analyzed
├─ Action: Unlock seed generation
└─ Notification: "Competitor analysis complete"

Event: seeds_selected
├─ Trigger: All seeds selected
├─ Action: Unlock longtail generation
└─ Notification: "Ready to generate longtails"

Event: longtails_ranked
├─ Trigger: All longtails ranked
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

**Status:** Complete  
**Next:** PM Summary Document
