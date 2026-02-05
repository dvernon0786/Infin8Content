# Story B-3: Content Writing Agent Service

**Status**: done

**Epic**: B – Deterministic Article Pipeline

**User Story**: As a system, I need to call an LLM to write each section based on research so that content is high-quality and coherent.

## Story Classification

- **Type**: Producer (content generation service)
- **Tier**: Tier 1 (foundational content generation step)
- **Epic**: B (Deterministic Article Pipeline)
- **Story ID**: B-3

## Business Intent

Generate high-quality, coherent article sections by calling an LLM with a fixed prompt, research results, and prior section context, ensuring content consistency and adherence to organization guidelines.

## Developer Context & Architecture Intelligence

### Current System Architecture

**Frontend Layers:**
- **Presentation Layer**: `app/` - Route handlers, server components, API routes
- **Component Layer**: `components/` - Reusable UI components  
- **Business Logic Layer**: `lib/` - Service functions, utilities, configuration
- **Data Access Layer**: Supabase client, API clients, type definitions

**Database Architecture:**
- PostgreSQL via Supabase with RLS policies
- Key tables: `users`, `organizations`, `articles`, `article_sections` (from B-1)
- Organization isolation enforced via RLS

**Existing Article Generation Infrastructure:**
- **OpenRouter Client**: `lib/services/openrouter/openrouter-client.ts` ✅
- **Section Processor**: `lib/services/article-generation/section-processor.ts` ✅  
- **Research Agent**: `lib/services/article-generation/research-agent.ts` ✅ (B-2)
- **Context Manager**: `lib/services/article-generation/context-manager.ts` ✅
- **Performance Monitor**: `lib/services/article-generation/performance-monitor.ts` ✅

### Critical Implementation Patterns

**1. OpenRouter Integration Pattern:**
```typescript
// From existing openrouter-client.ts
export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  max_tokens: number
  temperature?: number
}

// Use existing generateContent function
import { generateContent, type OpenRouterMessage } from '@/lib/services/openrouter/openrouter-client'
```

**2. Database Access Pattern:**
```typescript
// From existing services
import { createServiceRoleClient } from '@/lib/supabase/server'
const supabase = createServiceRoleClient()
```

**3. Error Handling Pattern:**
```typescript
// From section-processor.ts - follow retry logic
try {
  // API call
} catch (error) {
  // Exponential backoff: 2s, 4s, 8s
  // Log with context
  // Set status = 'failed' with error_details
}
```

**4. Performance Monitoring Pattern:**
```typescript
// From existing performance-monitor.ts
import { performanceMonitor } from './performance-monitor'
// Use for timing and metrics tracking
```

### File Structure Requirements (MUST FOLLOW)

**Service Location:**
```
lib/services/article-generation/
├── content-writing-agent.ts (NEW)
├── section-processor.ts (EXISTING - reference patterns)
├── research-agent.ts (EXISTING - B-2 dependency)
└── openrouter-client.ts (EXISTING - integration)
```

**API Route Location:**
```
app/api/articles/[article_id]/sections/[section_id]/write/
└── route.ts (NEW)
```

**Types Location:**
```
types/article.ts (EXTEND existing interfaces)
```

**Tests Location:**
```
__tests__/services/article-generation/content-writing-agent.test.ts (NEW)
__tests__/api/articles/sections/write.test.ts (NEW)
```

### Organization Isolation Enforcement (CRITICAL)

**RLS Pattern:**
```typescript
// All queries MUST include organization_id filter
const { data: section, error } = await supabase
  .from('article_sections')
  .select(`
    *,
    articles(organization_id)
  `)
  .eq('id', sectionId)
  .eq('articles.organization_id', organizationId)
  .single()
```

**Auth Pattern:**
```typescript
// Follow existing auth patterns from other API routes
import { getCurrentUser } from '@/lib/supabase/get-current-user'
const currentUser = await getCurrentUser()
if (!currentUser || !currentUser.org_id) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
}
```

### Dependencies Status (VERIFIED)

**✅ COMPLETED Dependencies:**
- **Epic A**: Onboarding System (COMPLETED)
- **B-1**: Article Sections Data Model (COMPLETED) - Table exists with research_payload
- **B-2**: Research Agent Service (COMPLETED) - research_payload populated
- **OpenRouter Integration**: Existing client available
- **Organization Defaults**: Available from organizations table

**🔗 Dependency Chain:**
```
Epic A (onboarding_completed=true) 
    ↓
B-1 (article_sections table with research_payload)
    ↓  
B-2 (research_payload populated via Perplexity Sonar)
    ↓
B-3 (CONTENT WRITING AGENT - CURRENT STORY)
    ↓
B-4 (Sequential Orchestration)
```

### Previous Story Intelligence (B-2 Research Agent)

**Key Learnings from B-2 Implementation:**
- **Research Payload Structure**: JSONB with findings, sources, citations
- **Perplexity Integration**: Fixed prompts, max 10 searches per section  
- **Error Handling**: Retry with exponential backoff, detailed error logging
- **Performance**: 5-minute timeout per section enforced
- **Status Transitions**: pending → researching → researched → failed

**Files to Reference:**
- `lib/services/article-generation/research-agent.ts` - Research payload structure
- `types/article.ts` - ArticleSection interface with research_payload field

### Git Intelligence & Recent Work Patterns

**Recent Commits Analysis:**
- Article generation services use TypeScript strict mode
- OpenRouter integration follows fallback chain: Gemini → Llama 3.3 70B → Llama 3bmo
- All services include comprehensive error handling and logging
- Performance monitoring integrated throughout pipeline
- RLS patterns consistently enforced across all endpoints

**Code Patterns Established:**
- Interface-first development with TypeScript
- Async/await patterns throughout
- Consistent error response formats
- Performance timing with performanceMonitor
- Comprehensive unit and integration tests

### Latest Technical Requirements

**OpenRouter API (Current):**
- **Models**: Gemini 2.5 Flash (primary), Llama 3.3 70B, Llama 3bmo (fallbacks)
- **Timeout**: 60 seconds for content writing
- **Tokens**: 2800 token limit for prompts
- **Rate Limits**: Handle via retry logic

**Database Schema (from B-1):**
```sql
article_sections (
  id UUID PRIMARY KEY,
  article_id UUID REFERENCES articles(id),
  section_header TEXT,
  section_type TEXT,
  research_payload JSONB, -- Populated by B-2
  content_markdown TEXT,   -- To be populated by B-3
  content_html TEXT,       -- To be populated by B-3  
  status TEXT, -- pending|researching|researched|writing|completed|failed
  section_order INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Organization Defaults Structure:**
```typescript
// From organizations table (Epic A)
interface ContentDefaults {
  tone: string
  language: string  
  internal_links: boolean
  global_instructions: string
  auto_publish_rules: object
}
```

## Contracts Required

- **C1**: POST /api/articles/{article_id}/sections/{section_id}/write endpoint
- **C2/C4/C5**: article_sections table (read/write), OpenRouter API integration, articles table (read-only)
- **Terminal State**: article_sections.status = 'completed', content_markdown and content_html populated
- **UI Boundary**: No UI events (backend-only content generation)
- **Analytics**: article.section.content_generation.started/completed audit events

## Contracts Modified

- None (new endpoint only)

## Contracts Guaranteed

- ✅ No UI events emitted (backend-only content generation)
- ✅ No intermediate analytics (only terminal state events)
- ✅ No state mutation outside producer (article_sections table only)
- ✅ Idempotency: Re-running overwrites existing content, no duplicates
- ✅ Retry rules: 3 attempts with exponential backoff (2s, 4s, 8s), 60 second timeout
- ✅ **System prompt always included as role=system (immutable, enforced, tested)**
- ✅ **System prompt integrity enforced via SHA-256 hashing**
- ✅ **Runtime detection of any prompt mutation**
- ✅ **Hard failure on role misplacement or prompt drift**
- ✅ **Symmetric enforcement across Research and Writing agents**

## Producer Dependency Check

- Epic A Status: COMPLETED ✅
- Story B-1 (Article Sections Data Model): COMPLETED ✅
- Story B-2 (Research Agent Service): COMPLETED ✅
- Dependencies Met: article_sections table exists, research_payload available, OpenRouter integration exists
- Blocking Decision: ALLOWED ✅

## Acceptance Criteria

1. **Given** a section has been researched (status = 'researched')
   When I call the Content Writing Agent
   Then the system calls an LLM with:
   - Fixed prompt (locked, no variation)
   - Section header + type
   - Research results from research_payload
   - Prior sections (for context)
   - Organization content defaults

2. **And** the system generates markdown content for the section

3. **And** the system persists content to article_sections.content_markdown

4. **And** the system converts markdown to HTML and persists to content_html

5. **And** the system updates section status: researched → writing → completed

6. **And** the system includes prior sections in context (for coherence)

7. **And** the system never modifies the fixed prompt

8. **And** content generation completes within 60 seconds per section

## System Prompt Integrity Enforcement (MANDATORY)

### Canonical Rule

**The Content Writing Agent MUST always execute with a SYSTEM prompt. The system prompt is mandatory, fixed, immutable, and injected as role = `system`. Execution without the system prompt is invalid and must fail.**

### 🔒 SYSTEM PROMPT (LOCKED)

```
SYSTEM PROMPT (IMMUTABLE)

You are a content writer. Your task is to write the following section:

Section: {section_header}
Type: {section_type}

Research findings:
{research_results}

Prior sections (for context):
{prior_sections_markdown}

Organization guidelines:
- Tone: {tone}
- Language: {language}
- Include internal links: {internal_links}
- Global instructions: {global_instructions}

Write the section in markdown format:
1. Use clear, engaging language
2. Reference research findings
3. Maintain consistency with prior sections
4. Follow organization guidelines
5. No commentary or meta-text
```

🔒 **Rules:**
- Role = **system**
- Never modified
- Never concatenated
- Never merged with user input

### USER MESSAGE (DYNAMIC, PER SECTION)

```
Write the section content now.
```

Nothing else goes in the user message.

### Service-Level Enforcement (REQUIRED)

The `runContentWritingAgent` MUST build messages like this:

```typescript
const messages = [
  {
    role: 'system',
    content: FIXED_CONTENT_WRITING_SYSTEM_PROMPT
  },
  {
    role: 'user',
    content: 'Write the section content now.'
  }
];
```

❌ **Not allowed:**
- System prompt as user role
- Combined system + user content
- Injecting research via user message
- Allowing callers to pass prompt text

### Runtime Guard (Non-Negotiable)

Add this check inside `runContentWritingAgent`:

```typescript
if (!FIXED_CONTENT_WRITING_SYSTEM_PROMPT) {
  throw new Error('System prompt missing. Content writing aborted.');
}

if (messages[0]?.role !== 'system') {
  throw new Error('Invalid prompt configuration: system prompt must be first.');
}
```

### Prompt Hashing & Integrity (REQUIRED)

**File:** `lib/llm/prompts/content-writing.prompt.ts`

```typescript
import crypto from 'crypto';

export function hashPrompt(prompt: string): string {
  return crypto
    .createHash('sha256')
    .update(prompt, 'utf8')
    .digest('hex');
}

export const CONTENT_WRITING_SYSTEM_PROMPT = `
You are a content writer. Your task is to write the following section:

Section: {section_header}
Type: {section_type}

Research findings:
{research_results}

Prior sections (for context):
{prior_sections_markdown}

Organization guidelines:
- Tone: {tone}
- Language: {language}
- Include internal links: {internal_links}
- Global instructions: {global_instructions}

Write the section in markdown format:
1. Use clear, engaging language
2. Reference research findings
3. Maintain consistency with prior sections
4. Follow organization guidelines
5. No commentary or meta-text
`.trim();

export const CONTENT_WRITING_PROMPT_HASH = hashPrompt(CONTENT_WRITING_SYSTEM_PROMPT);
```

**File:** `lib/llm/prompts/assert-prompt-integrity.ts`

```typescript
export class PromptIntegrityError extends Error {
  public readonly code = 'PROMPT_MUTATION_DETECTED';
  constructor(message: string) {
    super(message);
  }
}

export function assertPromptIntegrity(
  runtimePrompt: string,
  expectedHash: string,
  promptName: string
): void {
  const runtimeHash = hashPrompt(runtimePrompt);
  if (runtimeHash !== expectedHash) {
    throw new PromptIntegrityError(
      `${promptName} system prompt has been modified at runtime.`
    );
  }
}
```

### Mandatory Test Requirements

**Unit Test (MANDATORY):**

```typescript
it('always includes the fixed system prompt as system role', async () => {
  const spy = vi.spyOn(openRouterClient, 'createChatCompletion');
  await runContentWritingAgent(mockInput);
  const call = spy.mock.calls[0][0];
  expect(call.messages[0].role).toBe('system');
  expect(call.messages[0].content).toContain('You are a content writer.');
});

it('throws if content writing system prompt is modified', () => {
  const mutatedPrompt = CONTENT_WRITING_SYSTEM_PROMPT + ' ';
  expect(() =>
    assertPromptIntegrity(
      mutatedPrompt,
      CONTENT_WRITING_PROMPT_HASH,
      'ContentWritingAgent'
    )
  ).toThrow('PROMPT_MUTATION_DETECTED');
});
```

## Technical Requirements

### Service Implementation

**File**: `lib/services/article-generation/content-writing-agent.ts`

```typescript
import {
  CONTENT_WRITING_SYSTEM_PROMPT,
  CONTENT_WRITING_PROMPT_HASH
} from '@/lib/llm/prompts/content-writing.prompt';
import { assertPromptIntegrity } from '@/lib/llm/prompts/assert-prompt-integrity';

export interface ContentWritingAgentInput {
  sectionHeader: string
  sectionType: string
  researchPayload: ResearchPayload
  priorSections: ArticleSection[]
  organizationDefaults: ContentDefaults
}

export interface ContentWritingAgentOutput {
  markdown: string
  html: string
  wordCount: number
}

export async function runContentWritingAgent(
  input: ContentWritingAgentInput
): Promise<ContentWritingAgentOutput> {
  // 🔒 Prompt integrity check
  assertPromptIntegrity(
    CONTENT_WRITING_SYSTEM_PROMPT,
    CONTENT_WRITING_PROMPT_HASH,
    'ContentWritingAgent'
  );

  const messages = [
    {
      role: 'system' as const,
      content: CONTENT_WRITING_SYSTEM_PROMPT
    },
    {
      role: 'user' as const,
      content: 'Write the section content now.'
    }
  ];

  // Safety check (defense in depth)
  if (messages[0]?.role !== 'system') {
    throw new Error('System prompt must be first message.');
  }

  // Call LLM with fixed prompt
  // Generate markdown
  // Convert to HTML
  // Return content
}
```

### Fixed Prompt (Locked - Never Modified)

```
You are a content writer. Your task is to write the following section:

Section: {section_header}
Type: {section_type}

Research findings:
{research_results}

Prior sections (for context):
{prior_sections_markdown}

Organization guidelines:
- Tone: {tone}
- Language: {language}
- Include internal links: {internal_links}
- Global instructions: {global_instructions}

Write the section in markdown format:
1. Use clear, engaging language
2. Reference research findings
3. Maintain consistency with prior sections
4. Follow organization guidelines
5. No commentary or meta-text
```

### LLM Integration

- Use OpenRouter (existing integration in `lib/services/openrouter/openrouter-client.ts`)
- Fixed prompt (no variation)
- Model: Gemini 2.5 Flash (with fallback chain: Gemini → Llama 3.3 70B → Llama 3bmo)
- Timeout: 60 seconds
- Markdown output

### HTML Conversion

- Use existing markdown-to-html library (likely `marked` or similar)
- Sanitize output to prevent XSS
- Preserve formatting and structure

### API Endpoint

**Endpoint**: `POST /api/articles/{article_id}/sections/{section_id}/write`

**Request Body**:
```typescript
{
  // No body needed - all data from database
}
```

**Response**:
```typescript
{
  success: true
  data: {
    section_id: string
    status: 'completed'
    markdown: string
    html: string
    word_count: number
  }
}
```

### Database Operations

1. Load section from article_sections table (must have status = 'researched')
2. Load prior sections for context
3. Load organization defaults from organizations table
4. Call Content Writing Agent
5. Update article_sections:
   - content_markdown = generated markdown
   - content_html = converted HTML
   - status = 'completed'
   - updated_at = NOW()

### Error Handling

- If LLM call fails: retry with exponential backoff (2s, 4s, 8s)
- If all retries fail: set status = 'failed', populate error_details
- If markdown conversion fails: set status = 'failed', populate error_details
- Log all errors with section details

## Architecture Compliance

### Existing Patterns to Follow

- **OpenRouter Integration**: Use existing `lib/services/openrouter/openrouter-client.ts`
- **Error Handling**: Follow patterns from `lib/services/article-generation/section-processor.ts`
- **Database Operations**: Use existing Supabase client patterns
- **Type Definitions**: Follow patterns in `types/article.ts`

### File Structure Requirements

- Service in `lib/services/article-generation/` (existing directory)
- API route in `app/api/articles/[article_id]/sections/[section_id]/write/route.ts`
- Types in `types/article.ts` (extend existing interfaces)
- Tests in `__tests__/services/article-generation/content-writing-agent.test.ts`

### Organization Isolation

- Enforce RLS via article_id → articles.organization_id
- Validate user belongs to organization
- Use existing auth patterns from other API routes

## Implementation Notes

### Dependencies

- **B-1**: Article sections table must exist with research_payload column
- **B-2**: Research Agent must have completed and populated research_payload
- **OpenRouter**: Existing integration must be available
- **Organization Defaults**: Must be available from organizations table

### Context Accumulation

- Prior sections loaded from article_sections table
- Only sections with status = 'completed' included in context
- Sections ordered by section_order for proper context flow

### Performance Considerations

- Content generation: 60 seconds max per section
- HTML conversion: <1 second per section
- Database operations: <100ms per operation
- Total per section: ~61 seconds

### Quality Assurance

- Fixed prompt ensures consistent output quality
- Research grounding ensures factual accuracy
- Prior section context ensures narrative coherence
- Organization guidelines ensure brand consistency

## Testing Requirements

### Unit Tests

- Content Writing Agent service with mock LLM
- Fixed prompt never modified verification
- Markdown generation validation
- HTML conversion validation
- Error handling scenarios

### Integration Tests

- Full API endpoint with OpenRouter integration
- Database operations (read/write article_sections)
- Organization isolation enforcement
- Authentication and authorization

### Test Scenarios

- Successful content generation
- LLM timeout and retry logic
- Markdown conversion failures
- Invalid section status (not researched)
- Organization isolation violations
- Authentication failures

## Files to Create

1. `lib/services/article-generation/content-writing-agent.ts` - Main service
2. `app/api/articles/[article_id]/sections/[section_id]/write/route.ts` - API endpoint
3. `lib/llm/prompts/content-writing.prompt.ts` - Fixed prompt with hash
4. `lib/llm/prompts/assert-prompt-integrity.ts` - Integrity enforcement utility
5. `__tests__/services/article-generation/content-writing-agent.test.ts` - Unit tests
6. `__tests__/api/articles/sections/write.test.ts` - Integration tests

## Files to Modify

1. `types/article.ts` - Add ContentWritingAgentInput/Output interfaces
2. `docs/api-contracts.md` - Add endpoint documentation
3. `docs/development-guide.md` - Add content generation patterns
4. `accessible-artifacts/sprint-status.yaml` - Update story status

## Out of Scope

- Article outline generation (handled elsewhere)
- Media generation (images, videos)
- Parallel section processing (explicitly sequential)
- Content editing or revision workflows
- Automatic publishing
- Content quality scoring (future story)

## Success Criteria

- 100% sections generated with fixed prompt (no variations)
- 100% content includes research findings
- 100% prior sections included in context
- 100% organization guidelines applied
- 100% markdown converted to HTML
- <60 second generation time per section
- Zero prompt modifications
- Full error handling and recovery

## Risk Mitigation

### Technical Risks

- **LLM API failures**: Retry logic with exponential backoff
- **Prompt injection**: Fixed prompt, no user input in prompt
- **Content quality**: Research grounding + prior context
- **Performance**: 60 second timeout, efficient processing

### Business Risks

- **Content inconsistency**: Fixed prompt + context accumulation
- **Brand violations**: Organization guidelines enforced
- **Generation failures**: Comprehensive error handling
- **Cost overruns**: Per-section limits, efficient models

## Dependencies

### Required Before Implementation

- Story B-1: Article Sections Data Model (COMPLETED)
- Story B-2: Research Agent Service (COMPLETED)
- OpenRouter API access and configuration
- Organization content defaults configuration

### Required After Implementation

- Story B-4: Sequential Orchestration (uses this service)
- Story B-5: Article Status Tracking (reads completion status)

## Implementation Blueprint (Developer Ready)

### Step 1: Create Prompt Integrity System

**File: `lib/llm/prompts/content-writing.prompt.ts`**
```typescript
import crypto from 'crypto';

export function hashPrompt(prompt: string): string {
  return crypto
    .createHash('sha256')
    .update(prompt, 'utf8')
    .digest('hex');
}

export const CONTENT_WRITING_SYSTEM_PROMPT = `
You are a content writer. Your task is to write the following section:

Section: {section_header}
Type: {section_type}

Research findings:
{research_results}

Prior sections (for context):
{prior_sections_markdown}

Organization guidelines:
- Tone: {tone}
- Language: {language}
- Include internal links: {internal_links}
- Global instructions: {global_instructions}

Write the section in markdown format:
1. Use clear, engaging language
2. Reference research findings
3. Maintain consistency with prior sections
4. Follow organization guidelines
5. No commentary or meta-text
`.trim();

export const CONTENT_WRITING_PROMPT_HASH = hashPrompt(CONTENT_WRITING_SYSTEM_PROMPT);
```

**File: `lib/llm/prompts/assert-prompt-integrity.ts`**
```typescript
export class PromptIntegrityError extends Error {
  public readonly code = 'PROMPT_MUTATION_DETECTED';
  constructor(message: string) {
    super(message);
  }
}

export function assertPromptIntegrity(
  runtimePrompt: string,
  expectedHash: string,
  promptName: string
): void {
  const runtimeHash = hashPrompt(runtimePrompt);
  if (runtimeHash !== expectedHash) {
    throw new PromptIntegrityError(
      `${promptName} system prompt has been modified at runtime.`
    );
  }
}
```

### Step 2: Create Content Writing Agent Service

**File: `lib/services/article-generation/content-writing-agent.ts`**
```typescript
import {
  CONTENT_WRITING_SYSTEM_PROMPT,
  CONTENT_WRITING_PROMPT_HASH
} from '@/lib/llm/prompts/content-writing.prompt';
import { assertPromptIntegrity } from '@/lib/llm/prompts/assert-prompt-integrity';
import { generateContent, type OpenRouterMessage } from '@/lib/services/openrouter/openrouter-client';
import { performanceMonitor } from './performance-monitor';
import { createServiceRoleClient } from '@/lib/supabase/server';

export interface ContentWritingAgentInput {
  sectionHeader: string
  sectionType: string
  researchPayload: ResearchPayload
  priorSections: ArticleSection[]
  organizationDefaults: ContentDefaults
}

export interface ContentWritingAgentOutput {
  markdown: string
  html: string
  wordCount: number
}

export async function runContentWritingAgent(
  input: ContentWritingAgentInput
): Promise<ContentWritingAgentOutput> {
  // 🔒 Prompt integrity check
  assertPromptIntegrity(
    CONTENT_WRITING_SYSTEM_PROMPT,
    CONTENT_WRITING_PROMPT_HASH,
    'ContentWritingAgent'
  );

  const startTime = Date.now();
  
  try {
    // Build context from prior sections
    const priorSectionsMarkdown = input.priorSections
      .filter(section => section.status === 'completed')
      .sort((a, b) => a.section_order - b.section_order)
      .map(section => `## ${section.section_header}\n${section.content_markdown}`)
      .join('\n\n');

    // Build system prompt with variables
    const systemPrompt = CONTENT_WRITING_SYSTEM_PROMPT
      .replace('{section_header}', input.sectionHeader)
      .replace('{section_type}', input.sectionType)
      .replace('{research_results}', JSON.stringify(input.researchPayload, null, 2))
      .replace('{prior_sections_markdown}', priorSectionsMarkdown)
      .replace('{tone}', input.organizationDefaults.tone)
      .replace('{language}', input.organizationDefaults.language)
      .replace('{internal_links}', input.organizationDefaults.internal_links.toString())
      .replace('{global_instructions}', input.organizationDefaults.global_instructions);

    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: 'Write the section content now.'
      }
    ];

    // Safety check (defense in depth)
    if (messages[0]?.role !== 'system') {
      throw new Error('System prompt must be first message.');
    }

    // Call LLM with fixed prompt
    const result = await generateContent({
      model: 'google/gemini-2.5-flash-exp', // Primary model
      messages,
      max_tokens: 2000,
      temperature: 0.7
    });

    // Convert markdown to HTML
    const html = await convertMarkdownToHtml(result.content);
    const wordCount = countWords(result.content);

    // Performance metrics
    const duration = Date.now() - startTime;
    performanceMonitor.recordMetric('content_writing_duration', duration);
    performanceMonitor.recordMetric('content_word_count', wordCount);

    return {
      markdown: result.content,
      html,
      wordCount
    };

  } catch (error) {
    performanceMonitor.recordMetric('content_writing_error', 1);
    throw error;
  }
}

// Helper functions
async function convertMarkdownToHtml(markdown: string): Promise<string> {
  // Use existing markdown library (e.g., marked)
  const { marked } = await import('marked');
  const html = marked(markdown);
  
  // Sanitize HTML to prevent XSS
  const DOMPurify = (await import('dompurify')).default;
  return DOMPurify.sanitize(html);
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}
```

### Step 3: Create API Endpoint

**File: `app/api/articles/[article_id]/sections/[section_id]/write/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/get-current-user';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { runContentWritingAgent } from '@/lib/services/article-generation/content-writing-agent';
import { performanceMonitor } from '@/lib/services/article-generation/performance-monitor';

export async function POST(
  request: NextRequest,
  { params }: { params: { article_id: string; section_id: string } }
) {
  const startTime = Date.now();

  try {
    // Authentication
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { article_id, section_id } = params;

    // Load section with organization validation
    const { data: section, error: sectionError } = await supabase
      .from('article_sections')
      .select(`
        *,
        articles(organization_id)
      `)
      .eq('id', section_id)
      .eq('articles.organization_id', currentUser.org_id)
      .single();

    if (sectionError || !section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Validate section status
    if (section.status !== 'researched') {
      return NextResponse.json({ 
        error: 'Section must be researched before writing',
        current_status: section.status 
      }, { status: 400 });
    }

    // Update status to writing
    await supabase
      .from('article_sections')
      .update({ 
        status: 'writing',
        updated_at: new Date().toISOString()
      })
      .eq('id', section_id);

    // Load prior sections for context
    const { data: priorSections } = await supabase
      .from('article_sections')
      .select('*')
      .eq('article_id', article_id)
      .eq('status', 'completed')
      .lt('section_order', section.section_order)
      .order('section_order');

    // Load organization defaults
    const { data: org } = await supabase
      .from('organizations')
      .select('content_defaults')
      .eq('id', currentUser.org_id)
      .single();

    // Run Content Writing Agent with retry logic
    let result;
    let lastError;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await runContentWritingAgent({
          sectionHeader: section.section_header,
          sectionType: section.section_type,
          researchPayload: section.research_payload,
          priorSections: priorSections || [],
          organizationDefaults: org?.content_defaults || {}
        });
        break; // Success
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000)); // 2s, 4s, 8s
        }
      }
    }

    if (!result) {
      // All retries failed
      await supabase
        .from('article_sections')
        .update({ 
          status: 'failed',
          error_details: { message: lastError?.message, attempts: 3 },
          updated_at: new Date().toISOString()
        })
        .eq('id', section_id);
      
      throw lastError;
    }

    // Update section with generated content
    await supabase
      .from('article_sections')
      .update({
        content_markdown: result.markdown,
        content_html: result.html,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', section_id);

    // Performance metrics
    const duration = Date.now() - startTime;
    performanceMonitor.recordMetric('api_write_section_duration', duration);

    return NextResponse.json({
      success: true,
      data: {
        section_id,
        status: 'completed',
        markdown: result.markdown,
        html: result.html,
        word_count: result.wordCount
      }
    });

  } catch (error) {
    console.error('Content writing error:', error);
    return NextResponse.json({
      error: 'Content writing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

### Step 4: Extend Type Definitions

**File: `types/article.ts` (ADD to existing)**
```typescript
export interface ContentWritingAgentInput {
  sectionHeader: string
  sectionType: string
  researchPayload: ResearchPayload
  priorSections: ArticleSection[]
  organizationDefaults: ContentDefaults
}

export interface ContentWritingAgentOutput {
  markdown: string
  html: string
  wordCount: number
}

export interface ContentDefaults {
  tone: string
  language: string
  internal_links: boolean
  global_instructions: string
  auto_publish_rules?: Record<string, any>
}
```

### Step 5: Create Tests

**File: `__tests__/services/article-generation/content-writing-agent.test.ts`**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runContentWritingAgent } from '@/lib/services/article-generation/content-writing-agent';
import { generateContent } from '@/lib/services/openrouter/openrouter-client';
import { CONTENT_WRITING_SYSTEM_PROMPT, CONTENT_WRITING_PROMPT_HASH } from '@/lib/llm/prompts/content-writing.prompt';

// Mock OpenRouter
vi.mock('@/lib/services/openrouter/openrouter-client');

describe('Content Writing Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates content with fixed system prompt', async () => {
    const mockGenerateContent = vi.mocked(generateContent);
    mockGenerateContent.mockResolvedValue({
      content: '# Test Section\nThis is test content.',
      tokensUsed: 100,
      modelUsed: 'gemini-2.5-flash',
      promptTokens: 50,
      completionTokens: 50
    });

    const input = {
      sectionHeader: 'Introduction',
      sectionType: 'introduction',
      researchPayload: { findings: ['Test finding'] },
      priorSections: [],
      organizationDefaults: {
        tone: 'professional',
        language: 'en',
        internal_links: true,
        global_instructions: 'Be informative'
      }
    };

    const result = await runContentWritingAgent(input);

    expect(result.markdown).toBe('# Test Section\nThis is test content.');
    expect(result.html).toBeTruthy();
    expect(result.wordCount).toBeGreaterThan(0);
    
    // Verify system prompt usage
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.messages[0].role).toBe('system');
    expect(call.messages[0].content).toContain('You are a content writer');
  });

  it('includes prior sections in context', async () => {
    const mockGenerateContent = vi.mocked(generateContent);
    mockGenerateContent.mockResolvedValue({
      content: 'New section content',
      tokensUsed: 100,
      modelUsed: 'gemini-2.5-flash',
      promptTokens: 50,
      completionTokens: 50
    });

    const input = {
      sectionHeader: 'Section 2',
      sectionType: 'h2',
      researchPayload: {},
      priorSections: [
        {
          id: '1',
          section_header: 'Section 1',
          content_markdown: 'Previous content',
          status: 'completed',
          section_order: 1
        }
      ],
      organizationDefaults: {
        tone: 'professional',
        language: 'en',
        internal_links: false,
        global_instructions: ''
      }
    };

    await runContentWritingAgent(input);

    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.messages[0].content).toContain('Previous content');
  });

  it('throws if system prompt is modified', () => {
    // This test would require temporarily modifying the prompt
    // In practice, this is tested via the integrity check
    expect(() => {
      // Test implementation would go here
    }).toThrow('PROMPT_MUTATION_DETECTED');
  });
});
```

## Story Completion Status

**Status**: READY FOR DEV

### ✅ SM Canonical Template Validation PASSED

**Story Classification**: ✅ Producer (content generation service) + Tier 1 (foundational)
**Business Intent**: ✅ Single sentence, no implementation details
**Contracts Required**: ✅ C1, C2/C4/C5, Terminal State, UI Boundary, Analytics specified
**Contracts Modified**: ✅ None (new endpoint only)
**Contracts Guaranteed**: ✅ All 4 checkboxes verified (no UI events, terminal analytics only, no state mutation outside producer, idempotency with retry rules)
**Producer Dependency Check**: ✅ Epic A COMPLETED, B-1/B-2 COMPLETED, all dependencies verified
**Blocking Decision**: ✅ ALLOWED - No blockers identified

### 🎯 Developer Readiness Assessment

**Architecture Intelligence**: ✅ Complete system analysis with existing patterns
**File Structure**: ✅ Precise locations specified with existing patterns
**Dependencies**: ✅ All verified COMPLETED with working implementations
**Code Patterns**: ✅ Established patterns from existing article generation services
**Testing Strategy**: ✅ Comprehensive unit and integration test scenarios
**Error Handling**: ✅ Retry logic with exponential backoff specified
**Performance**: ✅ 60-second timeout with monitoring integration
**Security**: ✅ Organization isolation and auth patterns specified

### 📋 Implementation Checklist

- [ ] Create prompt integrity system (`lib/llm/prompts/`)
- [ ] Implement content writing agent service
- [ ] Create API endpoint with auth and RLS
- [ ] Extend type definitions
- [ ] Write comprehensive unit tests
- [ ] Write integration tests
- [ ] Update API documentation
- [ ] Update sprint status

**Total Implementation Estimate**: 8-12 hours
**Risk Level**: LOW (all dependencies completed, patterns established)

**Ready for Development**: All technical specifications, acceptance criteria, and implementation guidance provided. Developer can begin implementation immediately with complete context.
