# Infin8Content Workflow Engine Documentation

## Overview

The Infin8Content Workflow Engine is a sophisticated system that orchestrates the entire content creation pipeline, from initial research to final publication. It follows a step-by-step approach with human approval gates and comprehensive audit trails.

## Epic Structure

The workflow engine is organized into 5 main epics, each containing multiple stories that implement specific functionality.

### Epic 34: ICP & Competitor Analysis
**Purpose**: Establish Ideal Customer Profile and analyze competitive landscape.

**Stories**:
- 34.1: Generate ICP via OpenRouter
- 34.2: Extract Seed Keywords from Competitor URLs via DataForSEO  
- 34.3: Retry Utilities and Error Handling

**Workflow States**: `step_1_icp` → `step_2_competitors` → `step_3_seeds`

### Epic 35: Keyword Research & Expansion
**Purpose**: Expand seed keywords into comprehensive long-tail keyword sets.

**Stories**:
- 35.1: Expand Seed Keywords into Long-Tail Keywords (4-Source Model)
- 35.2: Expand Keywords Using Multiple DataForSEO Methods

**Workflow States**: `step_3_seeds` → `step_4_longtails`

### Epic 36: Keyword Refinement & Topic Clustering
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
