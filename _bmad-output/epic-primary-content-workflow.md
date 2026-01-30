# Epic: Primary Content Workflow (Intent Engine)

**Project:** Infin8Content  
**Method:** BMAD Brownfield  
**Phase:** Primary Workflow Foundation  
**Status:** Architecture LOCKED  

## Epic Overview

Implement a new primary content generation workflow while keeping the existing system as a fallback. This phase builds the intent engine that makes article generation correct, scalable, and SEO-safe.

**Key Principles:**
- No rewrites, additive changes only
- Extend existing flows
- Comment legacy logic, don't delete
- Feature flags for rollback
- ICP is mandatory and FIRST
- Keywords are URL-driven
- Hub-and-spoke SEO is mandatory

## Stories

### Story 1: ICP Generation (STEP 1)
**Title:** Generate Ideal Customer Profile  
**Priority:** High  
**Acceptance Criteria:**
- [ ] User can input company website URL
- [ ] User can add optional manual description
- [ ] Perplexity Sonar model via OpenRouter processes inputs
- [ ] ICP data stored on organization record
- [ ] ICP status tracked: pending → generated → failed
- [ ] Feature flag to enable/disable new ICP flow
- [ ] Legacy keyword generation UI blocked until ICP exists

### Story 2: Competitor Analysis (STEP 2)
**Title:** Analyze Competitor Domains  
**Priority:** High  
**Acceptance Criteria:**
- [ ] User can input 3-7 competitor URLs
- [ ] Competitors stored in competitors table
- [ ] Status tracking: pending → analyzed → failed
- [ ] DataForSEO domain analysis integration
- [ ] Feature flag for new competitor analysis

### Story 3: Seed Keyword Generation (STEP 3)
**Title:** Generate Seed Keywords from Competitors  
**Priority:** High  
**Acceptance Criteria:**
- [ ] Generate max 3 seed keywords per competitor URL
- [ ] Seeds represent hub/pillar topics
- [ ] User can select which seeds to expand
- [ ] Feature flag for seed generation

### Story 4: Longtail Keyword Engine (STEP 4)
**Title:** Generate Longtail Keywords from Seeds  
**Priority:** High  
**Acceptance Criteria:**
- [ ] Run ALL FOUR DataForSEO methods per seed
- [ ] Max 3 results per method (~12 longtails per seed)
- [ ] Store: volume, difficulty, source method, parent relationships
- [ ] Feature flag for longtail generation

### Story 5: Automated Filtering (STEP 5)
**Title:** Filter and Rank Keywords  
**Priority:** High  
**Acceptance Criteria:**
- [ ] Hard filters: difficulty, volume, region, ICP match
- [ ] Soft ranking: commercial intent, service relevance, hub-spoke potential
- [ ] Garbage topics never reach user
- [ ] Feature flag for filtering logic

### Story 6: Topic Cluster Grouping (STEP 6)
**Title:** Organize Keywords into Hub-and-Spoke Structure  
**Priority:** High  
**Acceptance Criteria:**
- [ ] Enforce hierarchical structure before writing
- [ ] Structure visible in dashboard
- [ ] Hierarchical relationships stored
- [ ] Feature flag for cluster view

### Story 7: Subtopic Generation (STEP 7)
**Title:** Generate Subtopics from Longtails  
**Priority:** High  
**Acceptance Criteria:**
- [ ] DataForSEO Content Generation API integration
- [ ] 3 subtopics per longtail keyword
- [ ] Store as structured objects with title, angle, source
- [ ] Feature flag for subtopic generation

### Story 8: Human Approval (STEP 8)
**Title:** Human Approval Workflow  
**Priority:** High  
**Acceptance Criteria:**
- [ ] Users can approve or reject subtopics
- [ ] Explicit selection before article generation
- [ ] No article generation without approval
- [ ] Bulk approval/rejection capabilities
- [ ] Feature flag for approval workflow

### Story 9: Status Matrix Implementation
**Title:** Implement Comprehensive Status Tracking  
**Priority:** High  
**Acceptance Criteria:**
- [ ] Status tracking for all layers
- [ ] Status-driven UI states
- [ ] Blocked actions when prerequisites missing
- [ ] Status change notifications
- [ ] Feature flag for status matrix

### Story 10: Feature Flag Infrastructure
**Title:** Implement Feature Flag System  
**Priority:** High  
**Acceptance Criteria:**
- [ ] Feature flags for all new workflow components
- [ ] Rollback capability to legacy system
- [ ] Gradual rollout support
- [ ] Legacy system remains intact behind flags

## Technical Requirements

### Database Extensions

```sql
-- organizations table additions
ALTER TABLE organizations ADD COLUMN onboarding_status TEXT DEFAULT 'not_started';
ALTER TABLE organizations ADD COLUMN icp_description TEXT;
ALTER TABLE organizations ADD COLUMN icp_target_industries JSONB DEFAULT '[]';
ALTER TABLE organizations ADD COLUMN icp_buyer_roles JSONB DEFAULT '[]';
ALTER TABLE organizations ADD COLUMN icp_pain_points JSONB DEFAULT '[]';
ALTER TABLE organizations ADD COLUMN icp_value_proposition TEXT;
ALTER TABLE organizations ADD COLUMN icp_excluded_audiences JSONB DEFAULT '[]';
ALTER TABLE organizations ADD COLUMN icp_status TEXT DEFAULT 'not_started';
ALTER TABLE organizations ADD COLUMN icp_generated_at TIMESTAMP WITH TIME ZONE;

-- competitors table
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

-- blog_inputs table
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

-- keywords table extensions
ALTER TABLE keywords ADD COLUMN competitor_id UUID REFERENCES competitors(id);
ALTER TABLE keywords ADD COLUMN seed_keyword_id UUID REFERENCES keywords(id);
ALTER TABLE keywords ADD COLUMN keyword_type TEXT NOT NULL DEFAULT 'longtail';
ALTER TABLE keywords ADD COLUMN source_method TEXT;
ALTER TABLE keywords ADD COLUMN subtopics JSONB DEFAULT '[]';
ALTER TABLE keywords ADD COLUMN cluster_hierarchy JSONB DEFAULT '{}';
```

### API Endpoints

- `POST /api/icp/generate` - Generate ICP from website URL
- `POST /api/research/competitors` - Analyze competitor domains
- `POST /api/research/seeds` - Generate seed keywords
- `POST /api/research/longtails` - Generate longtail keywords
- `POST /api/research/subtopics` - Generate subtopics
- `PUT /api/research/approve` - Approve/reject subtopics
- `GET /api/workflow/status` - Get workflow status matrix

## Success Criteria

- [ ] Workflow fully mapped without ambiguity
- [ ] Each step has clear inputs, outputs, block conditions
- [ ] Engineers can build without asking "what happens next?"
- [ ] Legacy system remains intact behind flag
- [ ] All feature flags implemented and tested
- [ ] Status matrix provides complete visibility
- [ ] ICP-first enforcement working
- [ ] Hub-and-spoke structure enforced
- [ ] Human approval gates functional

---

**Status:** Ready for Development
