# Intent Engine Implementation Analysis

## Overview

The Intent Engine is the core orchestration system for Infin8Content, managing the complete workflow from ICP generation through article completion. It consists of 27 service files organized around workflow stages and governance patterns.

## Service Architecture

### Core Services (27 files)

#### 1. ICP & Competitor Analysis Stage
- **icp-generator.ts** (16,077 bytes)
  - Generates Ideal Customer Profile using OpenRouter
  - Creates ICP analysis JSONB data
  - Handles model selection and fallback chains
  - Integrates with workflow state management

- **competitor-seed-extractor.ts** (17,126 bytes)
  - Extracts seed keywords from competitor URLs
  - Uses DataForSEO keywords_for_site endpoint
  - Handles per-competitor error recovery
  - Writes normalized keywords to database

- **icp-gate-validator.ts** (5,410 bytes)
  - Validates ICP generation completion
  - Checks workflow state prerequisites
  - Enforces blocking conditions
  - Prevents invalid state transitions

- **competitor-gate-validator.ts** (5,550 bytes)
  - Validates competitor analysis completion
  - Verifies competitor URL processing
  - Checks seed keyword extraction status
  - Enforces workflow progression rules

#### 2. Keyword Expansion Stage
- **longtail-keyword-expander.ts** (18,254 bytes)
  - Expands seed keywords using 4 DataForSEO endpoints:
    - Related Keywords
    - Keyword Suggestions
    - Keyword Ideas
    - Google Autocomplete
  - De-duplicates results across sources
  - Sorts by relevance (volume DESC, competition ASC)
  - Implements 5-minute timeout with retry logic
  - Stores results in normalized keywords table

#### 3. Keyword Filtering Stage
- **keyword-filter.ts** (9,649 bytes)
  - Filters keywords by business criteria
  - Supports multiple filter types:
    - Search volume ranges
    - Competition level thresholds
    - Keyword difficulty scores
  - Maintains filter status tracking
  - Handles partial success scenarios

#### 4. Topic Clustering Stage
- **keyword-clusterer.ts** (11,913 bytes)
  - Implements hub-and-spoke semantic clustering
  - Uses embedding-based cosine similarity
  - Hub selection: highest search volume
  - Spoke assignment: similarity >= 0.6 threshold
  - Cluster size constraints: 1 hub + 2-8 spokes
  - Stores results in topic_clusters table
  - Supports deterministic rebuilding

- **cluster-validator.ts** (5,776 bytes)
  - Validates cluster coherence and structure
  - Checks semantic similarity thresholds
  - Verifies cluster size requirements
  - Marks clusters as valid/invalid
  - Stores validation results

- **cluster-validator-types.ts** (1,912 bytes)
  - Type definitions for validation results
  - Validation status enums
  - Similarity score types

#### 5. Subtopic Generation & Approval Stage
- **subtopic-approval-gate-validator.ts** (8,542 bytes)
  - Validates subtopic generation completion
  - Checks subtopics_status field
  - Verifies subtopic data exists
  - Enforces approval gate requirements

- **human-approval-processor.ts** (11,543 bytes)
  - Processes human approval decisions
  - Creates intent_approvals records
  - Updates keyword article_status
  - Maintains full audit trail
  - Supports idempotent re-approval

- **seed-approval-processor.ts** (6,939 bytes)
  - Processes seed keyword approval
  - Updates longtail_status field
  - Creates approval records
  - Maintains audit trail

- **seed-approval-gate-validator.ts** (8,290 bytes)
  - Validates seed approval prerequisites
  - Checks workflow state
  - Verifies approval eligibility

#### 6. Article Generation & Completion Stage
- **article-queuing-processor.ts** (9,211 bytes)
  - Queues approved subtopics for article generation
  - Creates article records in database
  - Triggers Inngest background jobs
  - Handles batch queueing
  - Tracks queuing status

- **article-progress-tracker.ts** (10,139 bytes)
  - Tracks real-time article generation progress
  - Monitors section-by-section completion
  - Provides estimated completion times
  - Tracks error states and recovery
  - Supports progress filtering and pagination

- **article-workflow-linker.ts** (11,761 bytes)
  - Links generated articles to workflows
  - Maintains article-workflow relationships
  - Tracks article status transitions
  - Updates workflow completion metrics

#### 7. Workflow Management & Governance
- **workflow-steps.ts** (1,007 bytes)
  - Defines workflow step constants
  - Step enumeration and ordering

- **workflow-gate-validator.ts** (8,021 bytes)
  - Validates workflow state transitions
  - Enforces step ordering
  - Checks prerequisites for each step
  - Prevents invalid state changes

- **blocking-condition-resolver.ts** (7,572 bytes)
  - Resolves blocking conditions
  - Checks data availability
  - Validates prerequisites
  - Provides detailed blocking reasons

- **workflow-dashboard-service.ts** (5,267 bytes)
  - Provides workflow progress data
  - Aggregates step completion metrics
  - Calculates progress percentages
  - Supports real-time dashboard updates

#### 8. Audit & Logging
- **intent-audit-logger.ts** (8,213 bytes)
  - Core audit logging service
  - Sync and async logging options
  - IP address and user agent tracking
  - Actor identification
  - Non-blocking error handling

- **intent-audit-archiver.ts** (5,301 bytes)
  - Archives old audit logs
  - Manages retention policies
  - Supports long-term compliance storage
  - Handles archival scheduling

#### 9. Workflow Management & Governance
- **workflow-steps.ts** (1,007 bytes)
  - Defines workflow step constants
  - Step enumeration and ordering

- **workflow-gate-validator.ts** (8,021 bytes)
  - Validates workflow state transitions
  - Enforces step ordering
  - Checks prerequisites for each step
  - Prevents invalid state changes

- **blocking-condition-resolver.ts** (7,572 bytes)
  - Resolves blocking conditions
  - Checks data availability
  - Validates prerequisites
  - Provides detailed blocking reasons

- **workflow-dashboard-service.ts** (5,267 bytes)
  - Provides workflow progress data
  - Aggregates step completion metrics
  - Calculates progress percentages
  - Supports real-time dashboard updates

- **workflow-state-engine.ts** (8,456 bytes)
  - Centralized atomic state machine
  - Database-level concurrency control
  - Single source of truth for transitions
  - Race condition prevention

#### 10. Audit & Logging
- **intent-audit-logger.ts** (8,213 bytes)
  - Core audit logging service
  - Sync and async logging options
  - IP address and user agent tracking
  - Actor identification
  - Non-blocking error handling

- **intent-audit-archiver.ts** (5,301 bytes)
  - Archives old audit logs
  - Manages retention policies
  - Supports long-term compliance storage
  - Handles archival scheduling

#### 11. Utilities
- **retry-utils.ts** (5,173 bytes)
  - Exponential backoff retry logic
  - Configurable attempt counts
  - Delay calculation (2s, 4s, 8s pattern)
  - Transient error detection
  - Timeout management

#### 12. Testing & Deterministic Services
- **deterministic-fake-extractor.ts** (3,245 bytes)
  - Test-only deterministic extractor
  - Predictable results for testing
  - Eliminates external API dependencies
  - Supports concurrent testing scenarios

- **cluster-validator-types.ts** (1,912 bytes)
  - Type definitions for validation results
  - Validation status enums
  - Similarity score types

## Workflow State Machine

### Complete State Flow
```
step_1_icp 
  ↓ (ICP generation)
step_2_competitors 
  ↓ (Competitor analysis)
step_3_seeds 
  ↓ (Seed extraction)
step_4_longtails 
  ↓ (Long-tail expansion)
step_5_filtering 
  ↓ (Keyword filtering)
step_6_clustering 
  ↓ (Topic clustering)
step_7_validation 
  ↓ (Cluster validation)
step_8_subtopics 
  ↓ (Subtopic generation)
step_9_articles 
  ↓ (Article generation)
completed
```

### State Characteristics

| State | Purpose | Output | Validation |
|-------|---------|--------|-----------|
| step_1_icp | Generate ICP | JSONB analysis | icp-gate-validator |
| step_2_competitors | Analyze competitors | Competitor data | competitor-gate-validator |
| step_3_seeds | Extract seeds | Keywords table | seed-approval-gate-validator |
| step_4_longtails | Expand keywords | Keywords table | (automatic) |
| step_5_filtering | Filter keywords | Filtered keywords | (automatic) |
| step_6_clustering | Create clusters | topic_clusters table | (automatic) |
| step_7_validation | Validate clusters | validation_results table | (automatic) |
| step_8_subtopics | Generate subtopics | keywords.subtopics JSONB | subtopic-approval-gate-validator |
| step_9_articles | Generate articles | articles table | (automatic) |
| completed | Workflow finished | Final summary | (terminal) |

## Service Dependency Graph

```
icp-generator
  ↓
competitor-seed-extractor
  ↓
longtail-keyword-expander
  ↓
keyword-filter
  ↓
keyword-clusterer
  ↓
cluster-validator
  ↓
human-approval-processor
  ↓
article-queuing-processor
  ↓
article-progress-tracker
```

## Error Handling Patterns

### Retry Strategy
- **Transient Errors**: 3 attempts with exponential backoff
- **Backoff Pattern**: 2s → 4s → 8s
- **Timeout**: 5 minutes per step
- **Per-Request Timeout**: Prevents infinite loops

### Error Categories
1. **Validation Errors**: Input validation failures (400)
2. **Service Errors**: External API failures (503)
3. **Business Logic Errors**: Rule violations (422)
4. **System Errors**: Infrastructure failures (500)

### Recovery Mechanisms
- Checkpoint state persistence
- Partial success support
- Manual intervention capabilities
- Retry queue management

## Database Integration

### Tables Used
- `intent_workflows` - Workflow state and metadata
- `keywords` - Keyword data with status tracking
- `topic_clusters` - Semantic clustering results
- `cluster_validation_results` - Validation outcomes
- `intent_approvals` - Approval records
- `articles` - Generated content
- `intent_audit_logs` - Compliance audit trail

### RLS Policies
All services enforce organization-based RLS:
```sql
organization_id = public.get_auth_user_org_id()
```

## External Service Integration

### OpenRouter
- ICP generation with model fallback
- Gemini 2.5 Flash → Llama 3.3 70B → Llama 3bmo

### DataForSEO
- Seed keyword extraction
- Long-tail expansion (4 endpoints)
- SERP analysis
- Keyword difficulty scoring

### Supabase
- PostgreSQL database
- Row Level Security
- Real-time subscriptions
- File storage

## Testing Coverage

### Test Files
- `__tests__/services/intent-engine/` - Unit tests
- `__tests__/api/intent/workflows/` - Integration tests

### Test Patterns
- Service layer unit tests
- API endpoint integration tests
- Database operation tests
- Error handling tests
- Retry logic tests

## Performance Characteristics

### Scalability
- Horizontal scaling via stateless services
- Database connection pooling
- Batch processing support
- Async job processing via Inngest

### Optimization
- Indexed database queries
- Lazy loading for large datasets
- Pagination support
- Caching for frequently accessed data

## Key Architectural Decisions

1. **Service Layer Pattern**: Business logic separated from API routes
2. **Gate Validators**: Explicit validation before state transitions
3. **Audit Trail**: Comprehensive logging for compliance
4. **Retry Logic**: Exponential backoff for transient failures
5. **RLS Enforcement**: Organization isolation at database level
6. **JSONB Storage**: Flexible workflow metadata storage
7. **Normalized Keywords**: Hub-and-spoke model in relational schema

## Code Quality Metrics

- **Total Lines**: ~200K+ across all services
- **Service Count**: 27 specialized services
- **Error Handling**: Comprehensive try-catch with specific error types
- **Type Safety**: Full TypeScript with strict mode
- **Test Coverage**: Unit and integration tests for critical paths

## Improvement Opportunities

1. **Service Consolidation**: Some small services could be combined
2. **Caching Layer**: Add Redis caching for frequently accessed data
3. **Async Processing**: More operations could use background jobs
4. **Monitoring**: Enhanced performance metrics collection
5. **Documentation**: Inline code documentation could be expanded
