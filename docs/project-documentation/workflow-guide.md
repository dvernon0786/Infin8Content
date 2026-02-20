# Infin8Content Workflow Engine Documentation

*Last Updated: 2026-02-20*  
*System Version: v2.1.0 - Zero-Legacy FSM Architecture*

## Overview

The Infin8Content Workflow Engine is a production-grade deterministic FSM (Finite State Machine) system that orchestrates the entire 9-step content creation pipeline, from initial research to final publication. It features zero-legacy architecture, human approval gates, and comprehensive audit trails.

**Key Features:**
- **Deterministic FSM**: Single state enum with legal transitions
- **Zero-Legacy Design**: No status/current_step columns
- **Atomic Transitions**: Database-level WHERE clause protection
- **Human-in-the-Loop**: Approval gates at critical decision points
- **Event-Driven**: Inngest functions for background automation

## FSM State Machine

### Complete State Flow
```
step_1_icp → step_2_competitors → step_3_seeds → step_4_longtails 
→ step_5_filtering → step_6_clustering → step_7_validation 
→ step_8_subtopics → step_9_articles → completed
```

### State Definitions
| State | Purpose | Type | Automation |
|-------|---------|------|------------|
| `step_1_icp` | Ideal Customer Profile generation | Automated | ✅ |
| `step_2_competitors` | Competitor analysis | Automated | ✅ |
| `step_3_seeds` | Seed keyword extraction | Automated | ✅ |
| `step_4_longtails` | Long-tail keyword expansion | Automated | ✅ |
| `step_5_filtering` | Keyword filtering | Automated | ✅ |
| `step_6_clustering` | Topic clustering | Automated | ✅ |
| `step_7_validation` | Cluster validation | Automated | ✅ |
| `step_8_subtopics` | Subtopic generation | Automated | ✅ |
| `step_9_articles` | Article generation | Automated | ✅ |
| `completed` | Workflow finished | Terminal | - |
| `cancelled` | Workflow cancelled | Terminal | - |

### Human Approval Gates
- **Step 3**: Seed keyword approval (human gate)
- **Step 8**: Subtopic approval (human gate)

## Epic Structure

The workflow engine is organized into 5 main epics, each containing multiple stories that implement specific functionality.

### Epic 34: ICP & Competitor Analysis ✅ COMPLETED
**Purpose**: Establish Ideal Customer Profile and analyze competitive landscape.

**Stories**:
- 34.1: Generate ICP via OpenRouter ✅
- 34.2: Extract Seed Keywords from Competitor URLs via DataForSEO ✅  
- 34.3: Retry Utilities and Error Handling ✅

**Workflow States**: `step_1_icp` → `step_2_competitors` → `step_3_seeds`

**Key Services**:
- `lib/services/intent-engine/competitor-seed-extractor.ts`
- `lib/services/intent-engine/icp-generator.ts`

### Epic 35: Keyword Research & Expansion ✅ COMPLETED
**Purpose**: Expand seed keywords into comprehensive long-tail keyword sets.

**Stories**:
- 35.1: Expand Seed Keywords into Long-Tail Keywords (4-Source Model) ✅
- 35.2: Expand Keywords Using Multiple DataForSEO Methods ✅

**Workflow States**: `step_3_seeds` → `step_4_longtails`

**DataForSEO Endpoints**:
- Related Keywords
- Keyword Suggestions  
- Keyword Ideas
- Google Autocomplete

**Key Services**:
- `lib/services/intent-engine/longtail-keyword-expander.ts`

### Epic 36: Keyword Refinement & Topic Clustering ✅ COMPLETED
**Purpose**: Filter keywords and organize into hub-and-spoke topic structures.

**Stories**:
- 36.1: Filter Keywords Based on Business Criteria ✅
- 36.2: Cluster Keywords into Hub-and-Spoke Structure ✅
- 36.3: Validate Cluster Coherence and Structure 📋 backlog

**Workflow States**: `step_4_longtails` → `step_5_filtering` → `step_6_clustering` → `step_7_validation`

**Key Services**:
- `lib/services/intent-engine/keyword-filter.ts`
- `lib/services/intent-engine/keyword-clusterer.ts`
- `lib/services/intent-engine/cluster-validator.ts`

### Epic 37: Content Topic Generation & Approval ✅ COMPLETED
**Purpose**: Generate subtopics for each keyword and implement approval workflow.

**Stories**:
- 37.1: Generate Subtopic Definitions via DataForSEO ✅
- 37.2: Review and Approve Subtopics Before Article Generation ✅
- 37.3: Human Approval Gates Implementation ✅
- 37.4: Maintain Complete Audit Trail of All Decisions ✅

**Workflow States**: `step_7_validation` → `step_8_subtopics`

**Key Services**:
- `lib/services/keyword-engine/subtopic-generator.ts`
- `lib/services/keyword-engine/subtopic-approval-processor.ts`

### Epic 38: Article Generation & Workflow Completion 🔄 ready-for-dev
**Purpose**: Generate articles and complete the workflow pipeline.

**Stories**:
- 38.1: Queue Approved Subtopics for Article Generation ✅
- 38.2: Track Article Generation Progress 📋 ready-for-dev
- 38.3: Article Assembly Service ✅
- 38.4: WordPress Publishing Execution 📋 backlog

**Workflow States**: `step_8_subtopics` → `step_9_articles` → `completed`

**Key Services**:
- `lib/services/article-generation/article-assembler.ts`
- `lib/services/article-generation/section-processor.ts`
- `lib/services/publishing/wordpress-publisher.ts`

## Automation Graph

The automation graph defines which FSM events trigger background workers:

```typescript
export const AUTOMATION_GRAPH = {
  // Human → Automation boundaries
  'SEEDS_APPROVED': 'intent.step4.longtails',
  'HUMAN_SUBTOPICS_APPROVED': 'intent.step9.articles',
  
  // Worker → Worker chaining
  'LONGTAIL_SUCCESS': 'intent.step5.filtering',
  'FILTERING_SUCCESS': 'intent.step6.clustering',
  'CLUSTERING_SUCCESS': 'intent.step7.validation',
  'VALIDATION_SUCCESS': 'intent.step8.subtopics',
  'ARTICLES_SUCCESS': 'WORKFLOW_COMPLETED',
} as const
```

## FSM Implementation

### Core Files
- `/lib/fsm/unified-workflow-engine.ts` - Central transition engine
- `/lib/fsm/fsm.internal.ts` - Internal FSM implementation
- `/lib/fsm/workflow-events.ts` - Event and state definitions

### Transition Pattern
```typescript
// 1. Validate current state
if (workflow.state !== 'step_3_seeds') {
  return NextResponse.json({ error: 'Invalid state' }, { status: 409 })
}

// 2. Execute side effects
const result = await service.process(request)

// 3. Transition state ONLY after success
const transitionResult = await transitionWithAutomation(workflowId, 'SEEDS_APPROVED', userId)

// 4. Handle concurrent requests
if (!transitionResult) {
  return NextResponse.json({ message: 'Already processed' }, { status: 200 })
}
```

## Inngest Functions

### Background Workers
- `step4Longtails` - Long-tail keyword expansion
- `step5Filtering` - Keyword filtering
- `step6Clustering` - Topic clustering
- `step7Validation` - Cluster validation
- `step8Subtopics` - Subtopic generation
- `step9Articles` - Article generation

### Event Flow
```
FSM Transition → Inngest Event → Background Worker → Service Processing → Next FSM Transition
```

## API Endpoints

### Workflow Step Endpoints
- `POST /api/intent/workflows/[id]/steps/competitor-analyze` - Step 2
- `POST /api/intent/workflows/[id]/steps/seed-extract` - Step 3
- `POST /api/intent/workflows/[id]/steps/longtail-expand` - Step 4
- `POST /api/intent/workflows/[id]/steps/cluster-topics` - Step 6
- `POST /api/intent/workflows/[id]/steps/validate-clusters` - Step 7
- `POST /api/intent/workflows/[id]/steps/human-approval` - Step 8

### Approval Endpoints
- `POST /api/keywords/[id]/approve-subtopics` - Subtopic approval

## DataForSEO Integration

### Endpoints by Step
- **Step 2**: `/v3/dataforseo_labs/google/keywords_for_site/live`
- **Step 4**: 4 endpoints (related, suggestions, ideas, autocomplete)
- **Step 8**: `/v3/content_generation/generate_sub_topics/live`

### Geo Configuration
- Single source of truth: `organizations.keyword_settings`
- 94 locations and 48 languages supported
- Case-insensitive resolution with safe fallbacks

## Error Handling

### FSM Error States
Each state has corresponding error states:
- `step_1_icp_failed`
- `step_2_competitors_failed`
- `step_4_longtails_failed`
- etc.

### Recovery Strategies
- **Retry Logic**: 3 attempts with exponential backoff
- **Manual Intervention**: Human gates for critical decisions
- **Rollback Support**: Atomic transitions prevent partial states

## Testing Strategy

### Unit Tests
- FSM state transitions
- Service business logic
- API endpoint validation

### Integration Tests
- End-to-end workflow execution
- Human approval workflows
- External API integration

### Concurrency Tests
- Atomic transition validation
- Race condition prevention
- Database lock verification

## Monitoring and Observability

### Metrics
- Workflow state distribution
- Step completion rates
- Error frequencies
- Processing times

### Audit Trail
All operations logged to `intent_audit_logs`:
- User actions
- State transitions
- External API calls
- Error events

## Performance Considerations

### Database Optimization
- Indexed state queries
- Partial indexes for status tracking
- Connection pooling

### Background Processing
- Inngest job queuing
- Timeout handling
- Retry policies

## Security Features

### Multi-tenant Isolation
- RLS policies on all tables
- Organization-based data scoping
- JWT authentication

### Audit Compliance
- WORM-compliant logging
- IP address tracking
- User agent logging

## Development Patterns

### Service Pattern
```typescript
export class ServiceProcessor {
  async process(workflowId: string): Promise<ProcessResult> {
    // 1. Validate workflow state
    // 2. Execute business logic
    // 3. Update database
    // 4. Return result
  }
}
```

### API Route Pattern
```typescript
export async function POST(request: NextRequest) {
  // 1. Authenticate user
  // 2. Validate workflow state
  // 3. Execute service
  // 4. Transition FSM state
  // 5. Return response
}
```

## Troubleshooting

### Common Issues
- **State Mismatch**: Workflow in unexpected state
- **Concurrency Conflicts**: Multiple simultaneous requests
- **External API Failures**: DataForSEO/OpenRouter errors

### Debug Tools
- Workflow state inspection
- Audit log analysis
- Performance metrics

This workflow engine represents a production-ready, deterministic system with enterprise-grade reliability and comprehensive automation capabilities.
**Purpose**: Filter and organize keywords into semantic topic clusters.

**Stories**:
- 36.1: Filter Keywords Based on Business Criteria
- 36.2: Cluster Keywords into Hub-and-Spoke Structure
- 36.3: Validate Cluster Coherence and Structure

**Workflow States**: `step_4_longtails` → `step_5_filtering` → `step_6_clustering` → `step_7_validation`

### Epic 37: Content Topic Generation & Approval
**Purpose**: Generate subtopics for content planning and implement approval gates.

**Stories**:
- 37.1: Generate Subtopic Definitions via DataForSEO
- 37.2: Review and Approve Subtopics Before Article Generation
- 37.3: Editorial Planning and Research Integration
- 37.4: Maintain Complete Audit Trail of All Decisions

**Workflow States**: `step_7_validation` → `step_8_subtopics`

### Epic 38: Article Generation & Workflow Completion
**Purpose**: Generate articles and track progress through completion.

**Stories**:
- 38.1: Queue Approved Subtopics for Article Generation
- 38.2: Track Article Generation Progress for All Approved Subtopics

**Workflow States**: `step_8_subtopics` → `step_9_articles` → `completed`

## Workflow State Machine

### Complete State Flow
```
step_1_icp → step_2_competitors → step_3_seeds → step_4_longtails → 
step_5_filtering → step_6_clustering → step_7_validation → 
step_8_subtopics → step_9_articles → completed
```

### State Descriptions

#### step_1_icp
- **Purpose**: Generate Ideal Customer Profile
- **Trigger**: Workflow creation
- **Output**: ICP analysis in JSONB field
- **Next**: Automatic progression to step_2_competitors

#### step_2_competitors  
- **Purpose**: Analyze competitor landscape
- **Trigger**: ICP completion
- **Output**: Competitor analysis in JSONB field
- **Next**: Automatic progression to step_3_seeds

#### step_3_seeds
- **Purpose**: Extract seed keywords from competitors
- **Trigger**: Competitor analysis completion
- **Output**: Seed keywords in keywords table
- **Next**: Automatic progression to step_4_longtails

#### step_4_longtails
- **Purpose**: Expand seeds into long-tail keywords
- **Trigger**: Seed extraction completion
- **Output**: Long-tail keywords in keywords table
- **Next**: Automatic progression to step_5_filtering

#### step_5_filtering
- **Purpose**: Filter keywords based on criteria
- **Trigger**: Long-tail expansion completion
- **Output**: Filtered keywords with status
- **Next**: Automatic progression to step_6_clustering

#### step_6_clustering
- **Purpose**: Create semantic topic clusters
- **Trigger**: Keyword filtering completion
- **Output**: Topic clusters in topic_clusters table
- **Next**: Automatic progression to step_7_validation

#### step_7_validation
- **Purpose**: Validate cluster coherence
- **Trigger**: Clustering completion
- **Output**: Validation results in cluster_validation_results table
- **Next**: Automatic progression to step_8_subtopics

#### step_8_subtopics
- **Purpose**: Generate subtopics for content planning
- **Trigger**: Cluster validation completion
- **Output**: Subtopics in keywords.subtopics JSONB field
- **Next**: Automatic progression to step_9_articles

#### step_9_articles
- **Purpose**: Generate articles from approved subtopics
- **Trigger**: Subtopic generation completion
- **Output**: Articles in articles table
- **Next**: Manual progression to completed

#### completed
- **Purpose**: Workflow finished successfully
- **Trigger**: All articles generated
- **Output**: Final workflow summary
- **Next**: Terminal state

## Story Implementation Patterns

### Producer Stories
Most stories follow the "Producer" pattern:

**Characteristics**:
- Backend-only processing
- No UI events emitted
- Database mutations only
- Idempotent operations
- Comprehensive audit logging

**Structure**:
1. Service class in `lib/services/intent-engine/`
2. API endpoint in `app/api/intent/workflows/[workflow_id]/steps/`
3. Unit tests in `__tests__/services/intent-engine/`
4. Integration tests in `__tests__/api/intent/workflows/`

### Governance Stories
Stories requiring human approval:

**Characteristics**:
- Human-in-the-loop approval gates
- Intent approvals table usage
- Audit trail requirements
- Organization isolation

**Examples**:
- 37.2: Subtopic approval
- Future approval gates for editorial decisions

### Contract Specifications

Each story defines explicit contracts:

**C1: API Contract**
- Endpoint definition
- Request/response formats
- Authentication requirements

**C2/C4/C5: Database Contracts**
- Tables accessed
- Data mutations
- Relationship constraints

**Terminal State**
- Workflow status after completion
- Data consistency requirements
- Success/failure conditions

## Data Flow Patterns

### 1. Research Pipeline
```
ICP → Competitors → Seed Keywords → Long-tail Keywords
```

### 2. Organization Pipeline  
```
Keywords → Filtering → Clustering → Validation
```

### 3. Content Pipeline
```
Validated Clusters → Subtopics → Articles → Publishing
```

## Error Handling and Recovery

### Retry Strategies
- **Transient Errors**: 3 attempts with exponential backoff (2s, 4s, 8s)
- **Service Failures**: Circuit breaker patterns
- **Data Validation**: Rollback on partial failures

### Error Categories
- **Validation Errors**: Input validation failures
- **Service Errors**: External API failures
- **Business Logic Errors**: Rule violations
- **System Errors**: Infrastructure failures

### Recovery Mechanisms
- **Checkpointing**: Workflow state persistence
- **Rollback**: Partial transaction reversal
- **Manual Intervention**: Admin override capabilities
- **Retry Queues**: Background job retry logic

## Audit and Compliance

### Audit Trail
All workflow operations are logged in `intent_audit_logs`:

**Fields**:
- `workflow_id`: Workflow context
- `organization_id`: Multi-tenant isolation
- `user_id`: Actor identification
- `action`: Specific operation performed
- `details`: Operation metadata
- `ip_address`: Security tracking
- `user_agent`: Client information

### Compliance Features
- **WORM Compliance**: Immutable audit logs
- **Data Retention**: Configurable retention periods
- **Export Capabilities**: GDPR/CCPA compliance
- **Access Logging**: Complete audit trail

## Performance Considerations

### Scalability
- **Horizontal Scaling**: Stateless service design
- **Database Optimization**: Indexed queries and connection pooling
- **Background Processing**: Async operations for long-running tasks

### Monitoring
- **Step Duration Tracking**: Performance metrics per workflow step
- **Success/Failure Rates**: Quality metrics and reliability tracking
- **Resource Usage**: Memory and CPU utilization monitoring

### Optimization Strategies
- **Batch Processing**: Bulk operations for efficiency
- **Caching**: Frequently accessed data caching
- **Connection Reuse**: External service connection pooling

## Testing Strategy

### Unit Tests
- Service layer business logic
- Data transformation and validation
- Error handling scenarios

### Integration Tests
- API endpoint contracts
- Database operations
- External service integrations

### End-to-End Tests
- Complete workflow execution
- User journey validation
- Performance benchmarking

### Contract Tests
- API response validation
- Database schema compliance
- External service compatibility

## Configuration and Feature Flags

### Feature Flags
- `ENABLE_INTENT_ENGINE`: Master toggle for workflow engine
- `ENABLE_ADVANCED_ANALYTICS`: Enhanced reporting features
- `ENABLE_BULK_OPERATIONS`: Batch operation capabilities

### Environment Configuration
- **Development**: Full logging, relaxed rate limits
- **Staging**: Production-like configuration with test data
- **Production**: Optimized settings with comprehensive monitoring

## Future Enhancements

### Advanced Workflow Features
- **Conditional Branching**: Dynamic workflow paths based on data
- **Parallel Processing**: Concurrent step execution
- **Workflow Templates**: Reusable workflow patterns

### Enhanced Monitoring
- **Real-time Dashboards**: Live workflow progress tracking
- **Alerting System**: Proactive issue detection
- **Performance Analytics**: Detailed performance insights

### Integration Opportunities
- **Third-party Workflows**: External workflow system integration
- **Webhook Support**: Event-driven workflow triggers
- **API Extensions**: Custom workflow step development
