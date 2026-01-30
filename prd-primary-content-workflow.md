# Product Requirements Document (PRD)
# Primary Content Workflow (Intent Engine)

**Project:** Infin8Content  
**Workflow:** Primary Content Workflow (Intent Engine)  
**Date:** 2026-01-30  
**Status:** DRAFT FOR REVIEW  
**Method:** BMAD Brownfield  

---

## 1. Problem Statement

Infin8Content currently generates articles through a single, monolithic pipeline that lacks:

- **Intent validation** - Articles may not align with target audience (ICP)
- **Competitive awareness** - No systematic competitor research before writing
- **Topic hierarchy** - No hub-and-spoke SEO structure
- **Human oversight** - No explicit approval gate before article generation
- **Traceability** - No clear audit trail of how topics were selected

This results in:
- Potential SEO misalignment
- Wasted effort on low-value topics
- Lack of editorial control
- No competitive differentiation

---

## 2. Goals

### Primary Goals

- **Enable intent-driven content** - Ensure every article serves a validated business purpose
- **Implement gated workflow** - Require explicit approval at each step
- **Preserve existing system** - Keep legacy article generation available and untouched
- **Enable gradual rollout** - Deploy new workflow behind feature flags with full rollback
- **Establish audit trail** - Track every decision and approval

### Secondary Goals

- **Support competitive analysis** - Systematically research competitor content
- **Enable topic clustering** - Build hub-and-spoke SEO structures
- **Provide status visibility** - Real-time dashboard of workflow progress
- **Support team collaboration** - Multiple stakeholders can approve/reject at each step

---

## 3. Non-Goals

Explicitly **NOT** included in this PRD:

- SEO strategy redesign
- UI/UX polish or design decisions
- Performance optimization
- Refactoring legacy code
- Changes to existing articles
- Rewriting article generation logic
- Database performance tuning
- Advanced analytics or reporting

---

## 4. Users and Personas

### Primary Users

**Content Manager**
- Role: Reviews and approves topics, keywords, and subtopics
- Needs: Clear status visibility, easy approval/rejection, audit trail
- Pain: Currently no way to validate topics before writing

**SEO Specialist**
- Role: Validates keyword research, competitor analysis, topic hierarchy
- Needs: Detailed keyword metrics, competitor data, clustering visualization
- Pain: No systematic way to ensure SEO alignment

**Product Manager**
- Role: Monitors workflow progress, manages rollout, handles escalations
- Needs: Dashboard view, risk alerts, dependency tracking
- Pain: No visibility into content pipeline

**Engineering**
- Role: Maintains workflow, fixes issues, handles edge cases
- Needs: Clear requirements, unambiguous gates, testable criteria
- Pain: Unclear requirements lead to rework

### Secondary Users

**Organization Admin**
- Role: Configures ICP, writing guidelines, brand voice
- Needs: Configuration interface, settings management
- Pain: Currently no way to set organization-level preferences

---

## 5. Workflow Overview

### The 9-Step Workflow (LOCKED)

```
STEP 0  Auth + Org exists
        ↓
STEP 1  ICP generation (Perplexity AI)
        ↓
STEP 2  Competitor analysis (DataForSEO URLs)
        ↓
STEP 3  Seed keywords (3 per competitor)
        ↓
STEP 4  Longtail expansion (4 DataForSEO methods)
        ↓
STEP 5  Automated filtering
        ↓
STEP 6  Topic clustering (hub → spoke)
        ↓
STEP 7  Subtopic generation
        ↓
STEP 8  Human approval (GATE)
        ↓
STEP 9  Article generation (agents)
```

### Workflow Rules

- **No step may be skipped** - All 9 steps must be executed in order
- **No step may auto-advance** - Each step requires explicit completion signal
- **Each step has explicit input and output** - Clear data contracts between steps
- **Approval is mandatory** - Step 8 (human approval) is a hard gate before Step 9

---

## 6. Hard Gates (MANDATORY)

The workflow enforces these blocking conditions:

| Gate | Blocks | Reason |
|------|--------|--------|
| No ICP | competitors, seeds, longtails, subtopics, articles | ICP defines target audience; nothing else makes sense without it |
| No competitors | seeds | Seeds are derived from competitor keywords |
| No approved seeds | longtails | Longtails expand from approved seeds |
| No longtails | subtopics | Subtopics cluster longtails into articles |
| No approved subtopics | articles | Articles are written only for approved subtopics |

**Implementation Rule:** If any gate is violated, the system returns an error and blocks the request.

---

## 7. Functional Requirements

### 7.1 ICP Generation

**Input:** Organization profile, target market, business goals  
**Output:** ICP document with industries, buyer roles, pain points, value proposition  
**Process:** AI-assisted (Perplexity) with human review  
**Gate:** Required before any keyword work begins

### 7.2 Competitor Analysis

**Input:** ICP, list of competitor URLs  
**Output:** Competitor profiles with keyword analysis  
**Process:** DataForSEO API integration  
**Gate:** Required before seed keyword generation

### 7.3 Seed Keywords

**Input:** Competitor data, ICP  
**Output:** 3 seed keywords per competitor (validated against ICP)  
**Process:** Automated extraction + filtering  
**Gate:** Must be approved before longtail expansion

### 7.4 Longtail Expansion

**Input:** Approved seed keywords  
**Output:** Expanded keyword list using 4 DataForSEO methods  
**Process:** Systematic expansion with filtering  
**Gate:** Longtails must be completed before subtopic generation

### 7.5 Automated Filtering

**Input:** Full keyword list  
**Output:** Filtered keywords (remove duplicates, low-volume, off-brand)  
**Process:** Automated rules + ICP semantic matching  
**Gate:** Filtering must complete before clustering

### 7.6 Topic Clustering

**Input:** Filtered keywords  
**Output:** Hub-and-spoke structure (main topics + subtopics)  
**Process:** Semantic clustering + hierarchy definition  
**Gate:** Clustering must complete before subtopic generation

### 7.7 Subtopic Generation

**Input:** Clustered topics  
**Output:** Subtopic definitions (each becomes an article)  
**Process:** AI-assisted (Perplexity) with structure validation  
**Gate:** Subtopics must be approved before article generation

### 7.8 Human Approval

**Input:** Subtopic list  
**Output:** Approved/rejected subtopics with feedback  
**Process:** Manual review by content manager  
**Gate:** MANDATORY - no articles without approval

### 7.9 Article Generation

**Input:** Approved subtopics  
**Output:** Complete articles with sections  
**Process:** Agent-based (Planner → Research → Writer)  
**Gate:** Only runs after Step 8 approval

---

## 8. Non-Functional Requirements

### Performance

- ICP generation: < 5 minutes
- Competitor analysis: < 10 minutes
- Seed keywords: < 2 minutes
- Longtail expansion: < 15 minutes
- Filtering: < 1 minute
- Clustering: < 2 minutes
- Subtopic generation: < 5 minutes
- Article generation: < 30 minutes per article

### Reliability

- 99.9% uptime for workflow status dashboard
- All workflow steps must be retryable without data loss
- Rollback must be possible without manual intervention

### Scalability

- Support 100+ organizations simultaneously
- Support 1000+ keywords per organization
- Support 100+ articles per organization

### Security

- Row-level security (RLS) enforces org isolation
- No cross-org data leakage
- Audit trail for all approvals/rejections
- User authentication required for all steps

---

## 9. Constraints and Assumptions

### Constraints

- **Additive-only schema** - No modifications to existing tables, only new tables
- **Legacy system preserved** - Existing article generation remains untouched
- **Feature flags required** - All new behavior gated behind feature flags
- **No data migration** - Existing articles and data remain unchanged
- **API-first design** - All workflow steps accessible via API

### Assumptions

- ICP data is provided by organization admin
- Competitor URLs are provided by organization admin
- DataForSEO API is available and functional
- Perplexity API is available and functional
- Users have stable internet connection
- Organization has valid subscription

---

## 10. Brownfield Constraints

### Existing System Preservation

- **Existing article generation remains untouched** - Legacy workflow continues to work
- **No changes to existing articles** - All historical data remains unchanged
- **No schema modifications to legacy tables** - Only new tables are created
- **Backward compatibility** - All existing APIs continue to work

### Additive-Only Design

- New workflow is **completely separate** from legacy system
- Feature flags control which workflow is used
- Users can switch between workflows
- Rollback is possible without data loss

### Rollback Capability

- Disabling feature flags reverts to legacy workflow
- No data cleanup required
- Rollback time: < 5 minutes
- No manual intervention needed

---

## 11. Success Metrics

### Workflow Completion

- [ ] All 9 steps execute without errors
- [ ] Each step produces expected output
- [ ] Gates block illegal transitions
- [ ] Approval workflow functions correctly

### Data Quality

- [ ] ICP accurately reflects target audience
- [ ] Keywords are relevant to ICP
- [ ] Topics are clustered correctly
- [ ] Subtopics are distinct and non-overlapping

### User Experience

- [ ] Status dashboard shows real-time progress
- [ ] Approval/rejection takes < 2 minutes
- [ ] Users understand why steps are blocked
- [ ] Audit trail is clear and accessible

### System Reliability

- [ ] 99.9% uptime for workflow
- [ ] All steps are retryable
- [ ] No data loss on failure
- [ ] Rollback works without issues

---

## 12. Explicit Out-of-Scope Items

The following are **NOT** part of this PRD:

- SEO keyword strategy or optimization
- Content quality scoring
- AI model selection or tuning
- UI/UX design
- Performance optimization
- Database schema design
- API endpoint design
- Authentication implementation
- Monitoring and alerting
- Cost optimization
- Multi-language support
- Mobile app support

---

## 13. Dependencies

### External Services

- **Perplexity API** - ICP generation, subtopic generation
- **DataForSEO API** - Competitor analysis, keyword expansion
- **Supabase** - Database and RLS
- **Inngest** - Workflow orchestration

### Internal Dependencies

- Existing authentication system
- Existing organization management
- Existing article generation system
- Existing user management

---

## 14. Acceptance Criteria

The PRD is complete and ready for architecture design when:

- [ ] All 9 steps are clearly defined
- [ ] All 5 hard gates are explicit
- [ ] Workflow rules are unambiguous
- [ ] User personas are documented
- [ ] Functional requirements are detailed
- [ ] Non-functional requirements are measurable
- [ ] Constraints are clear
- [ ] Success metrics are testable
- [ ] Out-of-scope items are explicit
- [ ] Another agent could design architecture without asking questions

---

## 15. Next Steps (Not Part of This PRD)

After PRD approval:

1. Architecture agent designs system
2. Implementation readiness review
3. Sprint planning
4. Engineering execution

**This PRD does not include:**
- Architecture decisions
- Sprint planning
- Implementation details
- Engineering specifications

---

**PRD Status:** READY FOR REVIEW  
**Approval Required:** Product Manager, Engineering Lead  
**Next Action:** Architecture Design Phase

