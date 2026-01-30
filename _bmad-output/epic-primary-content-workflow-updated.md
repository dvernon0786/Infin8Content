# Epic: Primary Content Workflow (Intent Engine) - UPDATED

**Project:** Infin8Content  
**Method:** BMAD Brownfield  
**Phase:** Primary Workflow Foundation  
**Status:** Architecture LOCKED (BMAD-CLEAN)

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
- Subtopics are immutable once approved

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
- [ ] Status tracking: generated → generating → completed → failed
- [ ] DataForSEO domain analysis integration
- [ ] Competitor URLs become keyword sources
- [ ] Feature flag for new competitor analysis

### Story 3: Seed Keyword Generation (STEP 3)
**Title:** Generate Seed Keywords from Competitors  
**Priority:** High  
**Acceptance Criteria:**
- [ ] Generate max 3 seed keywords per competitor URL
- [ ] Seeds represent hub/pillar topics
- [ ] Criteria enforced: high volume, ICP relevance, cluster potential
- [ ] User can select which seeds to expand
- [ ] Seeds stored with competitor_id relationship
- [ ] Feature flag for seed generation

### Story 4: Longtail Keyword Engine (STEP 4)
**Title:** Generate Longtail Keywords from Seeds  
**Priority:** High  
**Acceptance Criteria:**
- [ ] For each selected seed, run ALL FOUR DataForSEO methods
- [ ] Max 3 results per method (~12 longtails per seed)
- [ ] Each longtail stores: volume, difficulty, source method, parent_keyword_id
- [ ] Feature flag for longtail generation

### Story 5: Automated Filtering (STEP 5)
**Title:** Filter and Rank Keywords  
**Priority:** High  
**Acceptance Criteria:**
- [ ] Hard filters applied: difficulty, volume, region, ICP match
- [ ] Soft ranking applied: commercial intent, service relevance, hub-spoke potential
- [ ] Garbage topics never reach user
- [ ] Filtering status tracked
- [ ] Feature flag for filtering logic

### Story 6: Topic Cluster Grouping (STEP 6)
**Title:** Organize Keywords into Hub-and-Spoke Structure  
**Priority:** High  
**Acceptance Criteria:**
- [ ] Structure enforced before writing
- [ ] Structure visible in dashboard
- [ ] Hierarchical relationships stored
- [ ] Navigation through clusters
- [ ] Feature flag for cluster view

### Story 7: Subtopic Generation (STEP 7)
**Title:** Generate Subtopics from Longtails  
**Priority:** High  
**Acceptance Criteria:**
- [ ] DataForSEO Content Generation API integration
- [ ] 3 subtopics per longtail keyword
- [ ] Subtopics stored as structured objects
- [ ] Feature flag for subtopic generation

### Story 8: Human Approval (STEP 8)
**Title:** Human Approval Workflow  
**Priority:** High  
**Acceptance Criteria:**
- [ ] Users can approve or reject subtopics
- [ ] Users must explicitly select what gets written
- [ ] No article generation without approval
- [ ] Approved subtopics are IMMUTABLE
- [ ] Regeneration creates new subtopic with new ID
- [ ] Original subtopic remains in audit trail
- [ ] Feature flag for approval workflow

### Story 9: Status Matrix Implementation
**Title:** Implement Comprehensive Status Tracking  
**Priority:** High  
**Acceptance Criteria:**
- [ ] Status tracking for all layers using standardized vocabulary
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

### Database Extensions (BMAD-CLEAN)

#### organizations table additions:
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

#### competitors table:
```sql
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'generated',
    analysis_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### blog_inputs table (CONFIG ONLY):
```sql
CREATE TABLE blog_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    writing_tone TEXT,
    target_audience TEXT,
    brand_voice_guidelines TEXT,
    style_examples JSONB DEFAULT '[]',
    excluded_topics JSONB DEFAULT '[]',
    preferred_sources JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### keywords table (BMAD-CLEAN HIERARCHY):
```sql
ALTER TABLE keywords ADD COLUMN keyword_level TEXT NOT NULL 
  CHECK (keyword_level IN ('seed', 'longtail'))
  DEFAULT 'longtail';

ALTER TABLE keywords ADD COLUMN parent_keyword_id UUID 
  REFERENCES keywords(id) ON DELETE CASCADE;

ALTER TABLE keywords ADD COLUMN competitor_id UUID 
  REFERENCES competitors(id) ON DELETE CASCADE;

ALTER TABLE keywords ADD COLUMN source_method TEXT;

ALTER TABLE keywords ADD COLUMN subtopics JSONB DEFAULT '[]';

ALTER TABLE keywords ADD COLUMN cluster_hierarchy JSONB DEFAULT '{}';

ALTER TABLE keywords ADD COLUMN regenerated_from_id UUID 
  REFERENCES keywords(id);

-- Enforce hierarchy: seeds have no parent, longtails must have parent
ALTER TABLE keywords ADD CONSTRAINT valid_keyword_hierarchy CHECK (
  (keyword_level = 'seed' AND parent_keyword_id IS NULL) OR
  (keyword_level = 'longtail' AND parent_keyword_id IS NOT NULL)
);
```

### Status Vocabulary (STANDARDIZED)

| Phase | Status Verb | Meaning |
|-------|-------------|---------|
| System produced | `generated` | System created the artifact |
| System filtered | `filtered` | System applied hard filters |
| Human decision | `approved` | Human explicitly approved |
| Human decision | `rejected` | Human explicitly rejected |
| Execution queued | `queued` | Waiting in queue |
| Execution running | `generating` | Currently processing |
| Execution finished | `completed` | Successfully finished |
| Execution failed | `failed` | Error during processing |
| Archived | `archived` | Removed from workflow |

### Applied Status Flows

**Competitor:** generated → generating → completed → failed → archived

**Seed Keyword:** generated → approved/rejected → archived

**Longtail Keyword:** generated → filtered → completed → approved/rejected → archived

**Subtopic:** generated → pending_approval → approved (IMMUTABLE) → archived

**Article:** queued → generating → completed → failed → published → archived

### API Endpoints Required

- `POST /api/icp/generate` - Generate ICP from website URL
- `POST /api/research/competitors` - Analyze competitor domains
- `POST /api/research/seeds` - Generate seed keywords
- `POST /api/research/longtails` - Generate longtail keywords
- `POST /api/research/subtopics` - Generate subtopics
- `PUT /api/research/approve` - Approve/reject subtopics (enforces immutability)
- `GET /api/workflow/status` - Get workflow status matrix

### Integration Points

#### External Services:
- **Perplexity Sonar (via OpenRouter)** - ICP generation
- **DataForSEO** - Competitor analysis, keyword research, subtopic generation
- **Existing OpenRouter integration** - Extend for ICP

#### Internal Services:
- **Existing article generation** - Extend to use new workflow
- **Existing keyword research** - Preserve and extend
- **Usage tracking** - Track new workflow usage

## Success Criteria

Epic is complete when:
- [ ] Workflow is fully mapped without ambiguity
- [ ] Each step has clear inputs, outputs, and block conditions
- [ ] Engineers can build without asking "what happens next?"
- [ ] Legacy system remains intact behind a flag
- [ ] All feature flags implemented and tested
- [ ] Status matrix provides complete visibility
- [ ] ICP-first enforcement is working
- [ ] Hub-and-spoke structure is enforced
- [ ] Human approval gates are functional
- [ ] Subtopic immutability is enforced
- [ ] Keywords hierarchy is explicit (no polymorphism)
- [ ] blog_inputs is config-only (no workflow artifacts)

## Immutability Rule (LOCKED)

**Approved subtopics are IMMUTABLE.**

Once a subtopic is `approved`:
- Cannot be modified
- Cannot be deleted
- Regeneration creates new subtopic with new ID
- Original remains in audit trail
- Enables A/B testing and traceability

Implementation:
```sql
CREATE TRIGGER prevent_approved_subtopic_updates
BEFORE UPDATE ON keywords
FOR EACH ROW
WHEN (OLD.status = 'approved' AND NEW.status = 'approved')
EXECUTE FUNCTION raise_immutable_error();

ALTER TABLE keywords ADD COLUMN regenerated_from_id UUID 
  REFERENCES keywords(id);
```

---

**Status:** BMAD-CLEAN AND EXECUTION-SAFE  
**Ready for Engineering:** YES
