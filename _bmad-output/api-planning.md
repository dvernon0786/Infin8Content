# API Planning - Primary Content Workflow

**Project:** Infin8Content  
**Workflow:** BMAD Primary Content Workflow (Intent Engine)  
**Status:** Architecture LOCKED

## API Endpoints Overview

### Authentication & Context
All endpoints require:
- `Authorization: Bearer <jwt_token>`
- `X-Organization-ID: <org_id>` (derived from auth context)

### Response Format (Standard)
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed",
  "timestamp": "2026-01-30T12:51:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## 1. ICP Generation Endpoint

### POST /api/icp/generate

**Purpose:** Generate Ideal Customer Profile from company website

**Request:**
```json
{
  "company_website_url": "https://example.com",
  "manual_description": "Optional company description",
  "override_existing": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "icp_id": "uuid",
    "description": "Generated ICP description",
    "target_industries": ["SaaS", "B2B", "Enterprise"],
    "buyer_roles": ["VP Marketing", "CMO", "Content Manager"],
    "pain_points": ["Content creation at scale", "SEO optimization"],
    "value_proposition": "AI-powered content generation",
    "excluded_audiences": ["Agencies", "Publishers"],
    "status": "generated",
    "generated_at": "2026-01-30T12:51:00Z"
  }
}
```

**Status Codes:**
- `200` - ICP generated successfully
- `400` - Invalid website URL
- `401` - Unauthorized
- `429` - Rate limited (Perplexity API)
- `500` - Generation failed

**Database Changes:**
- Updates `organizations.icp_*` fields
- Sets `organizations.icp_status = 'generated'`
- Sets `organizations.icp_generated_at`

**Feature Flag:** `enable_new_icp_generation`

---

## 2. Competitor Analysis Endpoint

### POST /api/research/competitors

**Purpose:** Analyze competitor domains and extract insights

**Request:**
```json
{
  "competitor_urls": [
    "https://competitor1.com",
    "https://competitor2.com",
    "https://competitor3.com"
  ],
  "analysis_type": "full" // or "quick"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "competitors": [
      {
        "id": "uuid",
        "url": "https://competitor1.com",
        "domain": "competitor1.com",
        "status": "analyzed",
        "analysis_data": {
          "domain_authority": 45,
          "backlinks": 1250,
          "organic_traffic": 50000,
          "top_keywords": ["keyword1", "keyword2"],
          "content_count": 342
        },
        "analyzed_at": "2026-01-30T12:51:00Z"
      }
    ],
    "total_analyzed": 3,
    "total_failed": 0
  }
}
```

**Status Codes:**
- `200` - Analysis completed
- `400` - Invalid URLs
- `401` - Unauthorized
- `429` - Rate limited (DataForSEO)
- `500` - Analysis failed

**Database Changes:**
- Creates records in `competitors` table
- Sets `competitors.status = 'analyzed'`
- Stores analysis data in `competitors.analysis_data`

**Feature Flag:** `enable_competitor_analysis`

---

## 3. Seed Keyword Generation Endpoint

### POST /api/research/seeds

**Purpose:** Generate seed keywords from competitor URLs

**Request:**
```json
{
  "competitor_ids": ["uuid1", "uuid2"],
  "max_seeds_per_competitor": 3,
  "icp_context": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "seeds": [
      {
        "id": "uuid",
        "keyword": "Content Marketing",
        "competitor_id": "uuid",
        "competitor_url": "https://competitor1.com",
        "volume": 50000,
        "difficulty": 45,
        "relevance_score": 0.92,
        "status": "generated"
      }
    ],
    "total_seeds": 9,
    "user_selection_required": true
  }
}
```

**Status Codes:**
- `200` - Seeds generated
- `400` - Invalid competitor IDs
- `401` - Unauthorized
- `403` - ICP not generated
- `429` - Rate limited
- `500` - Generation failed

**Database Changes:**
- Creates records in `keywords` table with `keyword_type = 'seed'`
- Sets `keywords.competitor_id`
- Stores volume, difficulty, relevance

**Feature Flag:** `enable_seed_generation`

---

## 4. Longtail Keyword Generation Endpoint

### POST /api/research/longtails

**Purpose:** Generate longtail keywords from seed keywords using all DataForSEO methods

**Request:**
```json
{
  "seed_keyword_ids": ["uuid1", "uuid2"],
  "max_results_per_method": 3,
  "methods": ["related", "ideas", "suggestions", "autocomplete"],
  "apply_filters": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "longtails": [
      {
        "id": "uuid",
        "keyword": "Content Marketing Strategy",
        "seed_keyword": "Content Marketing",
        "seed_keyword_id": "uuid",
        "volume": 8200,
        "difficulty": 38,
        "source_method": "related",
        "commercial_intent": 0.78,
        "icp_relevance": 0.85,
        "hub_spoke_potential": 0.92,
        "status": "generated"
      }
    ],
    "total_longtails": 36,
    "total_filtered_out": 4,
    "filtering_applied": true
  }
}
```

**Status Codes:**
- `200` - Longtails generated
- `400` - Invalid seed IDs
- `401` - Unauthorized
- `403` - Seeds not selected
- `429` - Rate limited
- `500` - Generation failed

**Database Changes:**
- Creates records in `keywords` table with `keyword_type = 'longtail'`
- Sets `keywords.seed_keyword_id`
- Sets `keywords.source_method`
- Stores volume, difficulty, relevance scores

**Feature Flag:** `enable_longtail_generation`

---

## 5. Subtopic Generation Endpoint

### POST /api/research/subtopics

**Purpose:** Generate subtopics from longtail keywords

**Request:**
```json
{
  "longtail_keyword_ids": ["uuid1", "uuid2"],
  "max_subtopics_per_keyword": 3,
  "include_angles": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subtopics": [
      {
        "id": "uuid",
        "title": "How to Create a Content Strategy",
        "angle": "how-to",
        "source_keyword": "Content Marketing Strategy",
        "source_keyword_id": "uuid",
        "source_url": "https://competitor1.com",
        "description": "Step-by-step guide for creating effective content strategy",
        "estimated_word_count": 2500,
        "status": "generated",
        "generated_at": "2026-01-30T12:51:00Z"
      }
    ],
    "total_subtopics": 27,
    "ready_for_approval": true
  }
}
```

**Status Codes:**
- `200` - Subtopics generated
- `400` - Invalid keyword IDs
- `401` - Unauthorized
- `403` - Longtails not generated
- `429` - Rate limited
- `500` - Generation failed

**Database Changes:**
- Stores subtopics in `keywords.subtopics` JSONB array
- Sets `keywords.status = 'subtopics_generated'`
- Tracks subtopic metadata

**Feature Flag:** `enable_subtopic_generation`

---

## 6. Subtopic Approval Endpoint

### PUT /api/research/approve

**Purpose:** Approve or reject subtopics for article generation

**Request:**
```json
{
  "approvals": [
    {
      "subtopic_id": "uuid",
      "action": "approve" // or "reject"
    }
  ],
  "bulk_action": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "approved_count": 9,
    "rejected_count": 2,
    "ready_for_generation": true,
    "approved_subtopics": [
      {
        "id": "uuid",
        "title": "How to Create a Content Strategy",
        "status": "approved"
      }
    ]
  }
}
```

**Status Codes:**
- `200` - Approvals processed
- `400` - Invalid subtopic IDs
- `401` - Unauthorized
- `404` - Subtopics not found
- `500` - Processing failed

**Database Changes:**
- Updates subtopic status in `keywords.subtopics`
- Tracks approval metadata and timestamp
- Prepares for article generation

**Feature Flag:** `enable_approval_workflow`

---

## 7. Workflow Status Endpoint

### GET /api/workflow/status

**Purpose:** Get comprehensive workflow status matrix

**Query Parameters:**
- `include_details` (boolean) - Include full details
- `step` (string) - Filter to specific step

**Response:**
```json
{
  "success": true,
  "data": {
    "workflow_status": {
      "step_1_icp": {
        "status": "completed",
        "completed_at": "2026-01-30T12:00:00Z",
        "data": { /* ICP data */ }
      },
      "step_2_competitors": {
        "status": "in_progress",
        "total": 3,
        "analyzed": 2,
        "failed": 0,
        "pending": 1,
        "data": [ /* competitor data */ ]
      },
      "step_3_seeds": {
        "status": "pending",
        "blocked_reason": "Competitors not fully analyzed"
      },
      "step_4_longtails": {
        "status": "pending",
        "blocked_reason": "Seeds not selected"
      },
      "step_5_filtering": {
        "status": "pending",
        "blocked_reason": "Longtails not generated"
      },
      "step_6_clustering": {
        "status": "pending",
        "blocked_reason": "Filtering not complete"
      },
      "step_7_subtopics": {
        "status": "pending",
        "blocked_reason": "Clustering not complete"
      },
      "step_8_approval": {
        "status": "pending",
        "blocked_reason": "Subtopics not generated"
      }
    },
    "overall_progress": {
      "current_step": 2,
      "total_steps": 8,
      "percentage": 25
    }
  }
}
```

**Status Codes:**
- `200` - Status retrieved
- `401` - Unauthorized
- `404` - Workflow not found

**Feature Flag:** `enable_status_matrix`

---

## 8. Article Generation Endpoint (Extended)

### POST /api/articles/generate

**Purpose:** Generate articles from approved subtopics (existing endpoint, extended)

**Request (Extended):**
```json
{
  "subtopic_ids": ["uuid1", "uuid2"],
  "workflow_mode": "primary", // or "legacy"
  "priority": "normal",
  "schedule_for": null
}
```

**Response (Extended):**
```json
{
  "success": true,
  "data": {
    "articles_queued": 2,
    "queue_ids": ["uuid1", "uuid2"],
    "estimated_completion": "2026-01-30T14:51:00Z",
    "workflow_mode": "primary"
  }
}
```

**Status Codes:**
- `200` - Articles queued
- `400` - Invalid subtopic IDs
- `401` - Unauthorized
- `403` - Subtopics not approved
- `429` - Rate limited
- `500` - Queueing failed

**Database Changes:**
- Creates article records with `workflow_mode = 'primary'`
- Links to source subtopics
- Tracks source keyword hierarchy

**Feature Flag:** `enable_primary_workflow` (fallback to `enable_legacy_workflow`)

---

## Error Handling & Recovery

### Common Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `ICP_NOT_GENERATED` | ICP required before proceeding | Generate ICP first |
| `COMPETITORS_NOT_ANALYZED` | Competitors must be analyzed | Analyze competitors |
| `SEEDS_NOT_SELECTED` | Seeds must be selected | Select seed keywords |
| `LONGTAILS_NOT_GENERATED` | Longtails must be generated | Generate longtails |
| `SUBTOPICS_NOT_APPROVED` | Subtopics must be approved | Approve subtopics |
| `RATE_LIMITED` | API rate limit exceeded | Retry after delay |
| `INVALID_ICP_CONTEXT` | ICP data invalid | Regenerate ICP |
| `ANALYSIS_FAILED` | External API failed | Retry or skip |

### Retry Logic

```
Max Retries: 3
Backoff Strategy: Exponential (1s, 2s, 4s)
Timeout: 30 seconds per request
```

---

## Feature Flags

### Primary Workflow Flags

| Flag | Purpose | Default |
|------|---------|---------|
| `enable_new_icp_generation` | Enable ICP generation | false |
| `enable_competitor_analysis` | Enable competitor analysis | false |
| `enable_seed_generation` | Enable seed keyword generation | false |
| `enable_longtail_generation` | Enable longtail generation | false |
| `enable_subtopic_generation` | Enable subtopic generation | false |
| `enable_approval_workflow` | Enable human approval | false |
| `enable_status_matrix` | Enable status tracking | false |
| `enable_primary_workflow` | Enable primary workflow mode | false |
| `enable_legacy_workflow` | Enable legacy workflow (fallback) | true |

### Gradual Rollout

```
Phase 1: Internal testing (all flags off)
Phase 2: Beta users (enable_new_icp_generation = 10%)
Phase 3: Expanded beta (enable_competitor_analysis = 25%)
Phase 4: Full rollout (all flags = 100%)
```

---

## Rate Limiting

### Per-Endpoint Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/icp/generate` | 5 | 1 hour |
| `/api/research/competitors` | 10 | 1 hour |
| `/api/research/seeds` | 20 | 1 hour |
| `/api/research/longtails` | 20 | 1 hour |
| `/api/research/subtopics` | 20 | 1 hour |
| `/api/research/approve` | 100 | 1 hour |
| `/api/workflow/status` | 100 | 1 hour |

### External API Limits

| Service | Limit | Handling |
|---------|-------|----------|
| DataForSEO | 100 req/min | Queue & backoff |
| OpenRouter | 100 req/min | Queue & backoff |
| Perplexity | 10 req/min | Queue & backoff |

---

## Database Schema Changes

### New Columns on `organizations`
```sql
ALTER TABLE organizations ADD COLUMN onboarding_status TEXT DEFAULT 'not_started';
ALTER TABLE organizations ADD COLUMN icp_description TEXT;
ALTER TABLE organizations ADD COLUMN icp_target_industries JSONB DEFAULT '[]';
ALTER TABLE organizations ADD COLUMN icp_buyer_roles JSONB DEFAULT '[]';
ALTER TABLE organizations ADD COLUMN icp_pain_points JSONB DEFAULT '[]';
ALTER TABLE organizations ADD COLUMN icp_value_proposition TEXT;
ALTER TABLE organizations ADD COLUMN icp_excluded_audiences JSONB DEFAULT '[]';
ALTER TABLE organizations ADD COLUMN icp_status TEXT DEFAULT 'not_started';
ALTER TABLE organizations ADD COLUMN icp_generated_at TIMESTAMP WITH TIME ZONE;
```

### New Tables
```sql
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    analysis_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE blog_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    input_type TEXT NOT NULL,
    source_url TEXT,
    source_keyword TEXT,
    data JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### New Columns on `keywords`
```sql
ALTER TABLE keywords ADD COLUMN competitor_id UUID REFERENCES competitors(id);
ALTER TABLE keywords ADD COLUMN seed_keyword_id UUID REFERENCES keywords(id);
ALTER TABLE keywords ADD COLUMN keyword_type TEXT NOT NULL DEFAULT 'longtail';
ALTER TABLE keywords ADD COLUMN source_method TEXT;
ALTER TABLE keywords ADD COLUMN subtopics JSONB DEFAULT '[]';
ALTER TABLE keywords ADD COLUMN cluster_hierarchy JSONB DEFAULT '{}';
```

---

**Status:** Complete  
**Next:** Status Matrix Document
