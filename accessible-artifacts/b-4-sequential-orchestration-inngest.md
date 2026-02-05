# Story B.4: Sequential Orchestration (Inngest)

**Status**: done

## Story Context

**Epic**: B – Deterministic Article Pipeline  
**Story ID**: B-4  
**User Story**: As a system, I need to orchestrate the pipeline sequentially so that sections are processed one at a time in order.

## Story Classification

- **Type**: Producer (Backend Orchestration)
- **Tier**: Tier 1 (Critical pipeline orchestration)
- **Epic**: B (Deterministic Article Pipeline)

## Business Intent

Extend the existing `generate-article` Inngest function to enforce strict sequential processing of article sections using the established research and writing services, ensuring deterministic section-by-section execution with proper context accumulation.

## Contracts Required

- **C1**: Extend existing `lib/inngest/functions/generate-article.ts` with sequential processing logic
- **C2/C4/C5**: article_sections table operations, articles table status updates
- **Terminal State**: Article status updated to 'completed' or 'failed', all sections processed sequentially
- **UI Boundary**: No UI events (backend orchestration only)
- **Analytics**: article.generation.pipeline.started/completed audit events

## Contracts Modified

- **Modified**: `lib/inngest/functions/generate-article.ts` (extend existing function)
- **No new files**: Leverage existing Inngest infrastructure

## Contracts Guaranteed

- ✅ No UI events emitted (backend orchestration only)
- ✅ No intermediate analytics (only terminal state events)
- ✅ No state mutation outside producer (article_sections and articles tables only)
- ✅ Idempotency: Re-running workflow skips completed sections, no duplicate processing
- ✅ Retry rules: Use existing retryWithBackoff utility (3 attempts, exponential backoff)

## Producer Dependency Check

- **Epic A Status**: COMPLETED ✅ (onboarding system)
- **Story B-1**: COMPLETED ✅ (article_sections data model)
- **Story B-2**: COMPLETED ✅ (research agent service)
- **Story B-3**: COMPLETED ✅ (content writing agent service)
- **Existing Infrastructure**: Inngest client, generate-article function, section-processor, research-optimizer
- **Blocking Decision**: ALLOWED ✅

## Acceptance Criteria

1. **Given** an article is queued for generation
   **When** the pipeline starts
   **Then** sections are processed sequentially:
   - Section 1: Research → Write → Persist
   - Section 2: Research → Write → Persist
   - Section 3: Research → Write → Persist
   - (etc.)

2. **And** no sections are processed in parallel

3. **And** each section receives prior sections as context

4. **And** if a section fails, the pipeline stops and logs error

5. **And** the article status is updated after each section completes

6. **And** the pipeline extends existing Inngest infrastructure

7. **And** the pipeline has a maximum timeout of 10 minutes per article

8. **And** retry logic uses existing retryWithBackoff utility

## Technical Requirements

### Extend Existing Inngest Function

**File**: `lib/inngest/functions/generate-article.ts` (modify existing)

**Key Changes**:
- Replace parallel `Promise.all()` section processing with sequential `for...of` loop
- Use existing `processSection()` and `performBatchResearch()` services
- Leverage existing `retryWithBackoff()` utility
- Maintain existing concurrency limits and error handling

**Sequential Processing Pattern**:
```typescript
// Replace existing parallel processing with:
for (const section of sections) {
  // Research step using existing service
  const research = await step.run(
    `research-section-${section.section_order}`,
    async () => {
      return performBatchResearch({
        section: section,
        priorSections: sections.slice(0, section.section_order - 1),
        organizationContext: article.organization,
      })
    }
  )

  // Writing step using existing service
  const content = await step.run(
    `write-section-${section.section_order}`,
    async () => {
      return processSection({
        section: section,
        researchPayload: research,
        priorSections: sections.slice(0, section.section_order - 1),
        organizationDefaults: article.organization.content_defaults,
      })
    }
  )
}
```

### Database Schema Integration

**article_sections table (from B-1)**:
- `status`: pending → researching → researched → writing → completed/failed
- `research_payload`: Populated after research step
- `content_markdown` & `content_html`: Populated after writing step
- `error_details`: Populated on failure with error context

**articles table updates**:
- `status`: queued → generating → completed/failed
- `updated_at`: Updated after each section completion

## Dependencies

- **Story B-1**: Article Sections Data Model (COMPLETED ✅)
- **Story B-2**: Research Agent Service (COMPLETED ✅)
- **Story B-3**: Content Writing Agent Service (COMPLETED ✅)
- **Existing Infrastructure**: Inngest client, generate-article function, section-processor, research-optimizer

## Implementation Notes

### Sequential Processing Guarantees

- **No Parallelism**: Replace `Promise.all()` with `for...of` loop in existing function
- **Context Accumulation**: Prior sections passed to each subsequent step
- **Order Preservation**: Sections processed by `section_order` ascending
- **State Tracking**: Each section status updated independently

### Service Integration

- **Research Service**: Use existing `performBatchResearch()` from research-optimizer.ts
- **Writing Service**: Use existing `processSection()` from section-processor.ts
- **Retry Logic**: Use existing `retryWithBackoff()` utility
- **Error Handling**: Extend existing error handling patterns

### Performance Considerations

- **Research Timeout**: 30 seconds per section (from B-2)
- **Writing Timeout**: 60 seconds per section (from B-3)
- **Total Pipeline Time**: ~90 seconds × number_of_sections
- **Memory Usage**: Prior sections kept in memory for context

## Files to be Modified

1. **`lib/inngest/functions/generate-article.ts`**
   - Extend existing function with sequential processing
   - Replace parallel section processing with sequential loop
   - Integrate with existing services and retry logic

2. **`types/article.ts`**
   - Add pipeline-related interfaces (if needed)

3. **`types/audit.ts`**
   - Add article generation pipeline audit actions

4. **`docs/api-contracts.md`**
   - Document sequential processing changes

5. **`docs/development-guide.md`**
   - Add sequential processing patterns

6. **`accessible-artifacts/sprint-status.yaml`**
   - Update story B-4 status to ready-for-dev

## Testing Strategy

### Unit Tests

- **Sequential Processing**: Verify `for...of` loop replaces `Promise.all()`
- **Service Integration**: Test `processSection()` and `performBatchResearch()` calls
- **Error Handling**: Test existing `retryWithBackoff()` behavior
- **Status Updates**: Article and section status transitions

### Integration Tests

- **End-to-End Flow**: Complete sequential pipeline execution
- **Database Operations**: Section and article status updates
- **Performance**: Timeout and retry behavior
- **Context Accumulation**: Prior sections passed correctly

## Out of Scope

- **New Inngest Functions**: Extend existing, don't create new
- **New Service Creation**: Use existing services
- **Parallel Processing**: Explicitly forbidden by design
- **Real-time Updates**: Status updates via database polling

## Priority and Timeline

- **Priority**: High (Critical for Epic B completion)
- **Story Points**: 5 (Reduced due to leveraging existing infrastructure)
- **Target Sprint**: Current sprint
- **Dependencies**: All prerequisites completed

## Success Criteria

- ✅ Sequential processing enforced (no `Promise.all()`)
- ✅ Existing services integrated properly
- ✅ Context accumulation working
- ✅ Error handling using existing patterns
- ✅ Article status tracking maintained

## Developer Context & Implementation Intelligence

### Previous Story Intelligence

**Story B-3 (Content Writing Agent Service)** - COMPLETED ✅:
- Fixed prompt implementation with OpenRouter integration
- Markdown to HTML conversion pipeline
- Section status tracking (researched → writing → completed)
- Organization defaults integration
- Error handling with retry logic established

**Story B-2 (Research Agent Service)** - COMPLETED ✅:
- Perplexity Sonar integration with fixed prompt
- Max 10 searches per section enforcement
- Research payload persistence with citations
- Section status tracking (pending → researching → researched)
- Timeout handling (30 seconds per section)

**Story B-1 (Article Sections Data Model)** - COMPLETED ✅:
- article_sections table with proper schema
- Status enum enforcement
- RLS policies for organization isolation
- Migration with rollback capability
- Indexes for query performance

### Architecture Compliance

**Inngest Integration Patterns**:
- Use existing `inngest.createFunction()` structure
- Leverage `step.run()` for atomic operations
- Maintain existing event-driven architecture
- Preserve error handling and retry patterns

**Service Integration Requirements**:
- `performBatchResearch()` from research-optimizer.ts
- `processSection()` from section-processor.ts  
- `retryWithBackoff()` utility for error resilience
- Database operations via Supabase client

**Database Schema Constraints**:
- article_sections.status transitions: pending → researching → researched → writing → completed/failed
- articles.status transitions: queued → generating → completed/failed
- Organization isolation via RLS policies
- Unique constraints on (article_id, section_order)

### Sequential Processing Implementation Details

**Critical Architecture Decision**:
- Replace `Promise.all(sections.map(...))` with `for (const section of sections)`
- Ensure strict order by `section_order` ascending
- Pass prior sections as context: `sections.slice(0, section.section_order - 1)`
- Maintain atomic step execution via Inngest `step.run()`

**Context Accumulation Pattern**:
```typescript
const priorSections = sections.slice(0, section.section_order - 1)
const contextSummary = priorSections.map(s => s.content_markdown).join('\n\n')
```

**Error Handling Strategy**:
- Per-section retry with existing `retryWithBackoff`
- Pipeline halt on section failure (no continue-on-error)
- Detailed error logging to article_sections.error_details
- Article status update to 'failed' on pipeline stop

### Performance & Resource Management

**Timeout Configuration**:
- Research step: 30 seconds per section
- Writing step: 60 seconds per section  
- Total pipeline: ~90 seconds × section_count
- Maximum article timeout: 10 minutes

**Memory Management**:
- Prior sections kept in memory for context
- Research payload persisted to database
- Content markdown persisted immediately
- HTML conversion done inline

### Testing & Validation Requirements

**Unit Test Coverage**:
- Sequential loop vs parallel processing verification
- Service integration with mock data
- Error handling and retry logic
- Status transition validation

**Integration Test Scenarios**:
- End-to-end sequential pipeline
- Database transaction consistency
- Timeout and retry behavior
- Context accumulation accuracy

### Git Intelligence & Implementation Patterns

**Existing Code Patterns to Follow**:
- Inngest function structure from generate-article.ts
- Service call patterns from section-processor.ts
- Database operation patterns from research-optimizer.ts
- Error handling patterns from retry utilities

**File Modification Strategy**:
- Extend existing generate-article.ts (no new files)
- Preserve existing function signature and event handling
- Add sequential processing as internal implementation detail
- Maintain backward compatibility

## Latest Technical Information

**Inngest Best Practices (Current)**:
- Use `step.run()` for each atomic operation
- Leverage built-in retry and timeout mechanisms
- Maintain immutable step data
- Use `step.sendEvent()` for cross-function communication

**Supabase Integration Notes**:
- RLS policies automatically enforce organization isolation
- Use admin client for bypassing RLS when needed
- Transaction support for multi-table operations
- Real-time subscriptions available for future enhancements

**OpenRouter Integration**:
- Gemini 2.5 Flash as primary model
- Fallback chain: Llama 3.3 70B → Llama 3bmo
- Token limits: 2800 tokens per section
- Cost tracking via existing usage system

## Project Context Reference

**Epic B Flow**:
```
Epic A (Onboarding) → B-1 (Data Model) → B-2 (Research) → B-3 (Writing) → B-4 (Orchestration) → B-5 (Status Tracking)
```

**Current Epic B Status**:
- B-1: ✅ COMPLETED (article_sections table)
- B-2: ✅ COMPLETED (research agent service)  
- B-3: ✅ COMPLETED (content writing agent service)
- B-4: ✅ COMPLETED (sequential orchestration)
- B-5: ⏳ BACKLOG (status tracking API)

**Downstream Dependencies**:
- Epic C (Assembly & Publishing) depends on B-4 completion
- WordPress publishing requires completed article sections
- Status tracking API requires sequential processing data

## Story Completion Status

**Implementation Status**: ✅ COMPLETED
- Sequential orchestration implemented in generate-article.ts
- All acceptance criteria fulfilled
- Integration with existing services complete
- Testing coverage adequate
- Documentation updated

**Verification Results**:
- ✅ Sequential processing enforced (no Promise.all)
- ✅ Context accumulation working correctly
- ✅ Error handling using existing patterns
- ✅ Article and section status tracking maintained
- ✅ Performance within specified limits

**Files Modified**:
- `lib/inngest/functions/generate-article.ts` - **CORRECTED: Extended existing function with sequential processing**
- `lib/inngest/functions/article-generation-sequential.ts` - **DELETED: Shadow function removed**
- `__tests__/inngest/functions/article-generation-sequential.no-parallelism.test.ts` - **CORRECTED: Now tests actual generateArticle function**
- `docs/api-contracts.md` - Updated documentation
- `accessible-artifacts/sprint-status.yaml` - Status updated to done

---

**Status**: done  
**Completion Date**: 2026-02-06  
**SM Validation**: ✅ APPROVED - All canonical template requirements met, contracts verified, dependencies completed
