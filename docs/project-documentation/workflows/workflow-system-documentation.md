# Workflow System Documentation

## Overview

The Infin8Content Workflow System is a sophisticated state machine that orchestrates the complete content creation pipeline from Ideal Customer Profile (ICP) generation through article publishing. It implements a deterministic, auditable, and scalable workflow engine with enterprise-grade safety guarantees.

## Workflow Architecture

### State Machine Design

The workflow system is built as a pure state machine with database-level atomicity:

```typescript
interface WorkflowState {
  id: UUID
  organization_id: UUID
  name: string
  state: WorkflowStateEnum    // Single source of truth
  created_at: timestamp
  updated_at: timestamp
}

type WorkflowStateEnum = 
  | 'step_1_icp'
  | 'step_2_competitors' 
  | 'step_3_seeds'
  | 'step_4_longtails'
  | 'step_5_filtering'
  | 'step_6_clustering'
  | 'step_7_validation'
  | 'step_8_subtopics'
  | 'step_9_articles'
  | 'completed'
  | 'cancelled'
```

### Deterministic State Mapping

```typescript
// Derived from single state field - no storage duplication
export function getStepFromState(state: WorkflowStateEnum): number {
  const stepMap = {
    'step_1_icp': 1,
    'step_2_competitors': 2,
    'step_3_seeds': 3,
    'step_4_longtails': 4,
    'step_5_filtering': 5,
    'step_6_clustering': 6,
    'step_7_validation': 7,
    'step_8_subtopics': 8,
    'step_9_articles': 9,
    'completed': 10,
    'cancelled': 0
  }
  return stepMap[state] || 0
}

export function getStatusFromState(state: WorkflowStateEnum): string {
  const statusMap = {
    'step_1_icp': 'icp_generation',
    'step_2_competitors': 'competitor_analysis',
    'step_3_seeds': 'seed_extraction',
    'step_4_longtails': 'longtail_expansion',
    'step_5_filtering': 'keyword_filtering',
    'step_6_clustering': 'topic_clustering',
    'step_7_validation': 'cluster_validation',
    'step_8_subtopics': 'subtopic_generation',
    'step_9_articles': 'article_generation',
    'completed': 'workflow_complete',
    'cancelled': 'workflow_cancelled'
  }
  return statusMap[state] || 'unknown'
}
```

## Workflow Steps

### Step 1: ICP Generation
**State**: `step_1_icp`  
**Purpose**: Generate Ideal Customer Profile using AI analysis  
**Input**: Organization settings and targeting parameters  
**Output**: ICP analysis stored in `intent_workflows.icp_data` (JSONB)  
**Service**: `icp-generator.ts`  
**Validation**: `icp-gate-validator.ts`

**Process**:
1. Load organization ICP settings
2. Generate ICP using OpenRouter (Gemini 2.5 Flash)
3. Validate ICP completeness
4. Store ICP data in workflow record
5. Transition to step 2

**Acceptance Criteria**:
- ICP contains target audience description
- ICP includes pain points and solutions
- ICP specifies content preferences
- Cost under $0.01 per generation
- Generation completes within 30 seconds

### Step 2: Competitor Analysis
**State**: `step_2_competitors`  
**Purpose**: Analyze competitor URLs and extract seed keywords  
**Input**: Competitor URLs from organization settings  
**Output**: Seed keywords in `keywords` table  
**Service**: `competitor-seed-extractor.ts`  
**Validation**: `competitor-gate-validator.ts`

**Process**:
1. Load competitor URLs (max 3 per organization)
2. For each competitor:
   - Call DataForSEO keywords_for_site endpoint
   - Extract top 3 keywords by search volume
   - Store as seed keywords (parent_seed_keyword_id = NULL)
3. Update workflow state to step 3

**Data Model**:
```sql
INSERT INTO keywords (
  organization_id,
  competitor_url_id,
  keyword,
  search_volume,
  competition_level,
  longtail_status = 'not_started'
)
```

**Acceptance Criteria**:
- Extract exactly 3 seed keywords per competitor
- Store with proper search volume and competition data
- Handle competitor analysis failures gracefully
- Complete within 2 minutes
- Maintain organization isolation

### Step 3: Seed Keyword Approval
**State**: `step_3_seeds`  
**Purpose**: Human approval gate for seed keywords  
**Input**: Extracted seed keywords  
**Output**: Approval records and status updates  
**Service**: `seed-approval-processor.ts`  
**Validation**: `seed-approval-gate-validator.ts`

**Process**:
1. Present seed keywords for human review
2. Collect approval/rejection decisions
3. Create approval records in `intent_approvals` table
4. Update keyword `longtail_status` based on decisions
5. Transition to step 4 when all seeds processed

**Approval Flow**:
```typescript
interface SeedApproval {
  keyword_id: UUID
  decision: 'approved' | 'rejected'
  feedback?: string
  user_id: UUID
  timestamp: timestamp
}
```

**Acceptance Criteria**:
- Human approval required before progression
- Full audit trail of decisions
- Rejected seeds excluded from expansion
- Idempotent approval (re-approval overwrites)
- Organization isolation enforced

### Step 4: Long-tail Keyword Expansion
**State**: `step_4_longtails`  
**Purpose**: Expand approved seeds into long-tail keywords  
**Input**: Approved seed keywords  
**Output**: Long-tail keywords in `keywords` table  
**Service**: `longtail-keyword-expander.ts`  
**Validation**: Automatic (no human gate)

**Process**:
1. For each approved seed keyword:
   - Call 4 DataForSEO endpoints:
     - Related Keywords
     - Keyword Suggestions  
     - Keyword Ideas
     - Google Autocomplete
   - Collect 3 results per endpoint (12 total)
   - De-duplicate across all sources
   - Sort by relevance (volume DESC, competition ASC)
   - Store as long-tail keywords (parent_seed_keyword_id = seed_id)
2. Update seed `longtail_status = 'completed'`
3. Transition to step 5

**De-duplication Logic**:
```typescript
function deduplicateKeywords(keywords: Keyword[]): Keyword[] {
  const seen = new Set<string>()
  return keywords.filter(kw => {
    const normalized = kw.keyword.toLowerCase().trim()
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}
```

**Acceptance Criteria**:
- Generate up to 12 long-tails per seed
- Use all 4 DataForSEO endpoints
- De-duplicate results across sources
- Sort by relevance algorithm
- Complete within 5 minutes
- Handle partial success gracefully

### Step 5: Keyword Filtering
**State**: `step_5_filtering`  
**Purpose**: Filter long-tail keywords by business criteria  
**Input**: All long-tail keywords  
**Output**: Filtered keywords ready for clustering  
**Service**: `keyword-filter.ts`  
**Validation**: Automatic

**Process**:
1. Load all long-tail keywords
2. Apply organization filter criteria:
   - Minimum search volume
   - Maximum competition level
   - Keyword difficulty range
   - Business relevance rules
3. Mark keywords as approved/rejected
4. Update `filter_status` field
5. Transition to step 6

**Filter Criteria**:
```typescript
interface FilterCriteria {
  minSearchVolume?: number
  maxCompetitionLevel?: 'low' | 'medium' | 'high'
  maxDifficulty?: number
  includeIntent?: SearchIntent[]
  excludePatterns?: string[]
}
```

**Acceptance Criteria**:
- Apply configurable filter rules
- Maintain filter status tracking
- Support multiple filter combinations
- Process within 1 minute
- Preserve original keyword data

### Step 6: Topic Clustering
**State**: `step_6_clustering`  
**Purpose**: Create semantic hub-and-spoke clusters  
**Input**: Filtered keywords  
**Output**: Clusters in `topic_clusters` table  
**Service**: `keyword-clusterer.ts`  
**Validation**: Automatic

**Process**:
1. Generate embeddings for all filtered keywords
2. Identify potential hubs (highest search volume)
3. Assign spokes by semantic similarity:
   - Calculate cosine similarity
   - Threshold: ≥ 0.6 similarity
   - Limit: 2-8 spokes per hub
4. Store clusters in `topic_clusters` table
5. Transition to step 7

**Clustering Algorithm**:
```typescript
function createHubAndSpokeClusters(keywords: Keyword[]): Cluster[] {
  const sorted = keywords.sort((a, b) => b.search_volume - a.search_volume)
  const clusters: Cluster[] = []
  const used = new Set<string>()

  for (const hub of sorted) {
    if (used.has(hub.id)) continue

    const spokes = sorted
      .filter(k => !used.has(k.id) && k.id !== hub.id)
      .filter(k => cosineSimilarity(hub.embedding, k.embedding) >= 0.6)
      .slice(0, 8)

    if (spokes.length >= 2) {
      clusters.push({ hub, spokes })
      used.add(hub.id)
      spokes.forEach(s => used.add(s.id))
    }
  }

  return clusters
}
```

**Acceptance Criteria**:
- Create hub-and-spoke semantic clusters
- Use embedding-based similarity (≥0.6 threshold)
- Limit cluster size (1 hub + 2-8 spokes)
- Each keyword in exactly one cluster
- Complete within 2 minutes

### Step 7: Cluster Validation
**State**: `step_7_validation`  
**Purpose**: Validate cluster coherence and structure  
**Input**: Generated clusters  
**Output**: Validation results and cluster status  
**Service**: `cluster-validator.ts`  
**Validation**: Automatic

**Process**:
1. Load all topic clusters
2. Validate each cluster:
   - Minimum size: 1 hub + 2 spokes
   - Maximum size: 1 hub + 8 spokes
   - Average similarity ≥ 0.6
   - Semantic coherence check
3. Store validation results
4. Mark clusters as valid/invalid
5. Transition to step 8

**Validation Rules**:
```typescript
interface ClusterValidation {
  cluster_id: UUID
  hub_keyword_id: UUID
  validation_status: 'valid' | 'invalid'
  avg_similarity: number
  spoke_count: number
  validation_errors?: string[]
}
```

**Acceptance Criteria**:
- Validate all cluster constraints
- Mark invalid clusters (don't delete)
- Store validation metrics
- Provide detailed validation reports
- Complete within 1 minute

### Step 8: Subtopic Generation
**State**: `step_8_subtopics`  
**Purpose**: Generate subtopics for valid cluster keywords  
**Input**: Validated cluster keywords  
**Output**: Subtopics in `keywords.subtopics` JSONB  
**Service**: `subtopic-generator.ts`  
**Validation**: `subtopic-approval-gate-validator.ts`

**Process**:
1. Load keywords from valid clusters only
2. For each keyword:
   - Call DataForSEO subtopic endpoint
   - Generate exactly 3 subtopics
   - Parse subtopic metadata
   - Store in `keywords.subtopics` JSONB field
3. Update `subtopics_status = 'completed'`
4. Transition to step 9

**Subtopic Structure**:
```typescript
interface Subtopic {
  title: string
  type: 'how-to' | 'comparison' | 'guide' | 'faq' | 'news'
  keywords: string[]
  search_volume?: number
  difficulty?: number
  intent?: 'informational' | 'commercial' | 'transactional'
}
```

**Acceptance Criteria**:
- Generate exactly 3 subtopics per keyword
- Use DataForSEO subtopic endpoint
- Parse structured subtopic data
- Store in JSONB format
- Complete within 5 minutes

### Step 9: Article Generation
**State**: `step_9_articles`  
**Purpose**: Generate articles from approved subtopics  
**Input**: Keywords with approved subtopics  
**Output**: Articles in `articles` table  
**Service**: `article-queuing-processor.ts` + Inngest jobs  
**Validation**: Automatic

**Process**:
1. Load keywords with approved subtopics
2. Create article records for each subtopic
3. Queue article generation via Inngest
4. Article generation pipeline:
   - Load research data
   - Generate outline
   - Process sections with OpenRouter
   - Quality validation
   - Store final article
5. Transition to 'completed' when all articles done

**Article Pipeline**:
```typescript
// Inngest function
export const generateArticle = inngest.createFunction(
  { id: 'generate-article' },
  { event: 'article/generate.requested' },
  async ({ event, step }) => {
    const { articleId } = event.data

    // Step 1: Load article and research
    const article = await step.run('load', () => loadArticle(articleId))
    
    // Step 2: Generate outline
    const outline = await step.run('outline', () => generateOutline(article))
    
    // Step 3: Process sections
    const sections = await step.run('sections', () => processSections(outline))
    
    // Step 4: Quality check
    const quality = await step.run('quality', () => validateQuality(sections))
    
    // Step 5: Store article
    await step.run('store', () => storeArticle(articleId, sections, quality))
    
    return { success: true, articleId }
  }
)
```

**Acceptance Criteria**:
- Generate articles for all approved subtopics
- Use 6-step generation pipeline
- Implement quality validation
- Track generation progress
- Complete within 30 minutes total

### Step 10: Completed
**State**: `completed`  
**Purpose**: Workflow finished successfully  
**Output**: Final summary and metrics  
**Validation**: Terminal state (immutable)

**Completion Metrics**:
- Total keywords processed
- Articles generated
- Quality scores
- Cost analysis
- Time tracking

## State Transitions

### Atomic Transition Engine

```typescript
export async function transitionWorkflow({
  workflowId,
  fromStep,
  toStep,
  status
}: TransitionParams): Promise<TransitionResult> {
  // Atomic UPDATE with WHERE clause prevents race conditions
  const { data, error } = await supabaseAdmin
    .from('intent_workflows')
    .update({ 
      state: toStep,
      updated_at: new Date()
    })
    .eq('id', workflowId)
    .eq('state', fromStep)  // Critical: ensures we're in expected state

  if (error) {
    throw new DatabaseError('Failed to transition workflow', error)
  }

  if (!data || data.length === 0) {
    // Transition failed - likely concurrent request won
    return { success: false, reason: 'concurrent_transition' }
  }

  // Log successful transition
  await logWorkflowTransition(workflowId, fromStep, toStep)

  return { success: true }
}
```

### Legal Transition Graph

```typescript
const legalTransitions: Record<WorkflowStateEnum, WorkflowStateEnum[]> = {
  'step_1_icp': ['step_2_competitors', 'cancelled'],
  'step_2_competitors': ['step_3_seeds', 'cancelled'],
  'step_3_seeds': ['step_4_longtails', 'cancelled'],
  'step_4_longtails': ['step_5_filtering', 'cancelled'],
  'step_5_filtering': ['step_6_clustering', 'cancelled'],
  'step_6_clustering': ['step_7_validation', 'cancelled'],
  'step_7_validation': ['step_8_subtopics', 'cancelled'],
  'step_8_subtopics': ['step_9_articles', 'cancelled'],
  'step_9_articles': ['completed', 'cancelled'],
  'completed': [], // Terminal state
  'cancelled': []  // Terminal state
}

export function isLegalTransition(
  from: WorkflowStateEnum, 
  to: WorkflowStateEnum
): boolean {
  return legalTransitions[from]?.includes(to) || false
}
```

## Workflow Guards

### Step Access Validation

```typescript
export function requireWorkflowStepAccess(
  workflowState: WorkflowStateEnum,
  targetStep: number
): AccessResult {
  const currentStep = getStepFromState(workflowState)
  
  // Can't access if workflow is cancelled
  if (workflowState === 'cancelled') {
    return { allowed: false, reason: 'workflow_cancelled' }
  }
  
  // Can always access completed workflow
  if (workflowState === 'completed') {
    return { allowed: true, reason: 'workflow_completed' }
  }
  
  // Can access current step
  if (currentStep === targetStep) {
    return { allowed: true, reason: 'current_step' }
  }
  
  // Can't access future steps
  if (targetStep > currentStep) {
    return { allowed: false, reason: 'step_not_reached' }
  }
  
  // Can view past steps
  return { allowed: true, reason: 'past_step' }
}
```

### Blocking Condition Resolution

```typescript
export async function getBlockingConditions(
  workflowId: string,
  targetStep: number
): Promise<BlockingCondition[]> {
  const conditions: BlockingCondition[] = []
  
  // Check if previous step completed
  const previousStep = targetStep - 1
  const previousState = await getWorkflowState(workflowId)
  
  if (getStepFromState(previousState) < previousStep) {
    conditions.push({
      type: 'prerequisite_not_met',
      message: `Step ${previousStep} must be completed first`,
      resolution: `Complete step ${previousStep} before proceeding`
    })
  }
  
  // Check for data availability
  const dataCheck = await validateStepData(workflowId, targetStep)
  if (!dataCheck.available) {
    conditions.push({
      type: 'data_unavailable',
      message: 'Required data not available',
      resolution: dataCheck.resolution
    })
  }
  
  return conditions
}
```

## Error Handling & Recovery

### Error Classification

```typescript
export enum WorkflowErrorType {
  VALIDATION_ERROR = 'validation_error',
  SERVICE_ERROR = 'service_error',
  TIMEOUT_ERROR = 'timeout_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  DATABASE_ERROR = 'database_error',
  AUTHORIZATION_ERROR = 'authorization_error'
}

export interface WorkflowError {
  type: WorkflowErrorType
  message: string
  step: number
  retryable: boolean
  details?: any
}
```

### Recovery Strategies

1. **Retryable Errors**: Automatic retry with exponential backoff
2. **Data Errors**: Manual intervention required
3. **Service Errors**: Fallback to alternative providers
4. **Timeout Errors**: Increase timeout and retry
5. **Authorization Errors**: User re-authentication required

### Rollback Support

```typescript
export async function rollbackWorkflowStep(
  workflowId: string,
  targetStep: number
): Promise<void> {
  // Only allow rollback to previous steps
  const currentState = await getWorkflowState(workflowId)
  const currentStep = getStepFromState(currentState)
  
  if (targetStep >= currentStep) {
    throw new ValidationError('Can only rollback to previous steps')
  }
  
  // Update state
  const targetState = getStateFromStep(targetStep)
  await transitionWorkflow({
    workflowId,
    fromStep: currentState,
    toStep: targetState,
    status: 'rollback_initiated'
  })
  
  // Clean up step-specific data
  await cleanupStepData(workflowId, currentStep)
}
```

## Performance & Scalability

### Concurrency Safety

- **Database-Level Locking**: WHERE clause in UPDATE prevents race conditions
- **Single Source of Truth**: Only state field drives progression
- **Atomic Operations**: All transitions are atomic database operations
- **Idempotent Operations**: Re-running steps overwrites existing data safely

### Performance Metrics

- **State Transition**: < 100ms
- **Step Validation**: < 200ms  
- **Data Loading**: < 500ms per 1000 records
- **Concurrent Workflows**: 100+ simultaneous workflows
- **Database Connections**: Pooled with connection limits

### Optimization Strategies

1. **Indexed Queries**: All workflow queries use appropriate indexes
2. **Batch Operations**: Process multiple records in single transactions
3. **Async Processing**: Heavy operations use Inngest background jobs
4. **Caching**: Frequently accessed data cached in memory
5. **Connection Pooling**: Database connections efficiently managed

## Monitoring & Observability

### Audit Trail

```typescript
interface WorkflowAuditLog {
  id: UUID
  workflow_id: UUID
  action: string
  from_state?: WorkflowStateEnum
  to_state?: WorkflowStateEnum
  user_id?: UUID
  timestamp: timestamp
  details: JSONB
  ip_address?: string
  user_agent?: string
}
```

### Metrics Tracked

- Workflow creation and completion rates
- Step transition timing
- Error rates by step and type
- User interaction patterns
- Resource utilization
- Cost tracking per workflow

### Health Checks

- Database connectivity
- External service availability
- Background job queue health
- Workflow state consistency
- Performance threshold monitoring

## Testing Strategy

### Unit Tests

- Service layer business logic
- State transition logic
- Validation functions
- Error handling scenarios
- Retry logic

### Integration Tests

- Complete workflow execution
- API endpoint integration
- Database operations
- External service mocking
- Error recovery scenarios

### E2E Tests

- Full user workflows
- Multi-user scenarios
- Concurrency testing
- Performance testing
- Error path validation

### Test Data Management

- Deterministic test data
- Isolated test databases
- Mock external services
- Cleanup procedures
- Performance benchmarks

## Security & Compliance

### Organization Isolation

- **RLS Policies**: All tables enforce organization_id filtering
- **User Context**: All operations use authenticated user context
- **Data Separation**: Complete multi-tenant data isolation
- **Audit Logging**: All operations logged with user attribution

### Access Control

- **Role-Based Access**: Different permissions for different user roles
- **Step-Based Access**: Users can only access appropriate workflow steps
- **API Authentication**: JWT-based authentication for all API calls
- **Resource Ownership**: Users can only access their organization's data

### Compliance Features

- **Audit Trail**: Complete immutable audit log
- **Data Retention**: Configurable data retention policies
- **Export Capabilities**: Data export for compliance requirements
- **Privacy Controls**: User data privacy and deletion capabilities

## Configuration & Customization

### Workflow Configuration

```typescript
interface WorkflowConfig {
  organization_id: UUID
  step_configs: {
    [step: number]: {
      enabled: boolean
      timeout: number
      retry_attempts: number
      custom_settings?: Record<string, any>
    }
  }
  approval_gates: {
    [step: number]: boolean
  }
  notifications: {
    [step: number]: NotificationConfig[]
  }
}
```

### Feature Flags

- **Step Enable/Disable**: Turn workflow steps on/off
- **Approval Gates**: Configure which steps require approval
- **Service Selection**: Choose between different service providers
- **Performance Tuning**: Adjust timeouts and retry limits

### Customization Points

1. **Step Logic**: Custom business logic per step
2. **Validation Rules**: Organization-specific validation
3. **Approval Workflows**: Custom approval processes
4. **Notifications**: Custom notification templates
5. **Reporting**: Custom metrics and reports

## Future Enhancements

### Planned Features

1. **Workflow Templates**: Predefined workflow configurations
2. **Conditional Branching**: Workflow paths based on conditions
3. **Parallel Steps**: Execute multiple steps simultaneously
4. **Workflow Versioning**: Track and manage workflow versions
5. **Advanced Analytics**: Enhanced workflow analytics and insights

### Scalability Improvements

1. **Horizontal Scaling**: Distribute workflow processing
2. **Event Sourcing**: Event-driven workflow architecture
3. **Caching Layer**: Redis caching for performance
4. **Microservices**: Split workflow engine into services
5. **GraphQL API**: GraphQL interface for workflow queries

### Integration Opportunities

1. **Third-Party Workflows**: Integrate external workflow systems
2. **Webhook Support**: Webhook notifications for workflow events
3. **API Extensions**: RESTful API for external integrations
4. **Custom Steps**: Plugin system for custom workflow steps
5. **Workflow Marketplace**: Share and sell workflow templates

## Conclusion

The Infin8Content Workflow System provides a robust, scalable, and maintainable foundation for content creation workflows. Its state machine architecture ensures consistency and reliability, while its modular design allows for flexibility and customization.

The system's enterprise-grade features—including atomic state transitions, comprehensive audit trails, and organization-based isolation—make it suitable for production deployments in multi-tenant environments.

With comprehensive testing, monitoring, and error handling capabilities, the workflow system is designed to handle the complexities of real-world content creation workflows while maintaining high performance and reliability standards.
