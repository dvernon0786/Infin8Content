# Keyword Research System Analysis

## Overview

The Keyword Research System is a specialized subsystem that handles SEO keyword intelligence, extraction, expansion, and semantic organization. It consists of 8 core service files implementing the hub-and-spoke keyword model with DataForSEO integration.

## Service Architecture

### Core Services (8 files)

#### 1. DataForSEO Client Integration
- **dataforseo-client.ts** (7,224 bytes)
  - Unified DataForSEO API client
  - Handles multiple endpoint types
  - Implements retry logic with exponential backoff
  - Manages API authentication and rate limiting
  - Provides error handling and recovery
  - Supports batch operations

**Key Methods:**
```typescript
// Seed keyword extraction
async extractSeedKeywords(url: string): Promise<Keyword[]>

// Long-tail expansion (4 endpoints)
async getRelatedKeywords(keyword: string): Promise<Keyword[]>
async getKeywordSuggestions(keyword: string): Promise<Keyword[]>
async getKeywordIdeas(keyword: string): Promise<Keyword[]>
async getAutocompleteKeywords(keyword: string): Promise<Keyword[]>

// SERP analysis
async analyzeSERP(keyword: string): Promise<SERPData>

// Keyword metrics
async getKeywordMetrics(keyword: string): Promise<KeywordMetrics>
```

**API Endpoints Used:**
- `/v3/dataforseo_labs/google/keywords_for_site/live` - Seed extraction
- `/v3/keywords_data/google/related_keywords/live` - Related keywords
- `/v3/keywords_data/google/search_suggestions/live` - Suggestions
- `/v3/keywords_data/google/keyword_ideas/live` - Keyword ideas
- `/v3/keywords_data/google/autocomplete/live` - Autocomplete
- `/v3/serp_data/google/organic/live` - SERP analysis

#### 2. Subtopic Generation
- **subtopic-generator.ts** (3,956 bytes)
  - Generates subtopics for keywords
  - Uses DataForSEO subtopic endpoint
  - Implements subtopic validation
  - Handles subtopic deduplication
  - Manages subtopic metadata

**Key Methods:**
```typescript
async generateSubtopics(keyword: string): Promise<Subtopic[]>
async validateSubtopics(subtopics: Subtopic[]): Promise<ValidationResult>
async deduplicateSubtopics(subtopics: Subtopic[]): Promise<Subtopic[]>
```

#### 3. Subtopic Parsing
- **subtopic-parser.ts** (2,133 bytes)
  - Parses DataForSEO subtopic responses
  - Extracts structured data
  - Validates response format
  - Handles parsing errors

**Key Methods:**
```typescript
async parseSubtopicResponse(response: any): Promise<ParsedSubtopic[]>
async extractSubtopicMetadata(subtopic: any): Promise<SubtopicMetadata>
```

#### 4. Subtopic Approval
- **subtopic-approval-processor.ts** (6,768 bytes)
  - Processes human approval of subtopics
  - Creates approval records
  - Updates keyword status
  - Maintains audit trail
  - Supports idempotent operations

#### 5. Subtopic Generation
- **subtopic-generator.ts** (4,892 bytes)
  - Generates subtopics for keywords
  - Uses DataForSEO subtopic endpoint
  - Implements subtopic validation
  - Handles subtopic deduplication
  - Manages subtopic metadata

#### 6. Subtopic Parsing
- **subtopic-parser.ts** (2,876 bytes)
  - Parses DataForSEO subtopic responses
  - Extracts structured data
  - Validates response format
  - Handles parsing errors

#### 7. Geo Configuration
- **dataforseo-geo.ts** (1,845 bytes)
  - Unified geo configuration for all services
  - 94 location mappings with DataForSEO codes
  - 48 supported language codes
  - Case-insensitive resolution functions
  - Safe fallbacks for missing geo data

#### 8. Approval Gate Validation
- **subtopic-approval-gate-validator.ts** (3,234 bytes)
  - Validates subtopic approval prerequisites
  - Checks workflow state requirements
  - Verifies approval eligibility
  - Enforces approval gate logic

**Key Methods:**
```typescript
async approveSubtopics(
  keywordId: string,
  decision: 'approved' | 'rejected',
  feedback?: string
): Promise<ApprovalResult>

async getApprovalStatus(keywordId: string): Promise<ApprovalStatus>
```

## Keyword Data Model

### Keyword Hierarchy

```
Seed Keywords (3 per competitor)
  ↓
Long-tail Keywords (up to 12 per seed)
  ↓
Subtopics (exactly 3 per longtail)
  ↓
Articles (1+ per subtopic)
```

### Keyword Record Structure

```typescript
interface Keyword {
  id: UUID
  organization_id: UUID
  competitor_url_id?: UUID
  parent_seed_keyword_id?: UUID
  
  // Keyword data
  keyword: string
  seed_keyword?: string
  
  // Metrics
  search_volume: number
  competition_level: 'low' | 'medium' | 'high'
  competition_index: number (0-100)
  keyword_difficulty: number (0-100)
  cpc?: decimal
  
  // Status tracking
  longtail_status: 'not_started' | 'in_progress' | 'completed' | 'failed'
  subtopics_status: 'not_started' | 'in_progress' | 'completed' | 'failed'
  article_status: 'not_started' | 'in_progress' | 'completed' | 'failed'
  
  // Content
  subtopics?: Subtopic[] (JSONB)
  embedding?: Vector(1536)
  
  // Timestamps
  created_at: timestamp
  updated_at: timestamp
}
```

### Subtopic Structure

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

## Keyword Extraction Pipeline

### Stage 1: Seed Keyword Extraction
**Source**: Competitor URLs  
**Method**: DataForSEO keywords_for_site endpoint  
**Output**: 3 seed keywords per competitor

```
Competitor URL → DataForSEO → Seed Keywords
                              (top 3 by volume)
```

**Process:**
1. Receive competitor URL
2. Call DataForSEO keywords_for_site endpoint
3. Extract top 3 keywords by search volume
4. Store in keywords table with parent_seed_keyword_id = NULL
5. Set longtail_status = 'not_started'

**Data Points Captured:**
- Keyword text
- Search volume
- Competition level
- Keyword difficulty
- CPC (cost per click)

### Stage 2: Long-tail Keyword Expansion
**Source**: Seed Keywords  
**Method**: 4 DataForSEO endpoints  
**Output**: Up to 12 long-tail keywords per seed

```
Seed Keyword → 4 DataForSEO Endpoints → De-duplicated Results
                                         (sorted by relevance)
```

**Endpoints Used:**
1. **Related Keywords**: Keywords semantically related to seed
2. **Keyword Suggestions**: Google Suggest-based keywords
3. **Keyword Ideas**: Broader keyword ideas
4. **Autocomplete**: Google Autocomplete suggestions

**Process:**
1. For each seed keyword:
   - Call 4 DataForSEO endpoints
   - Collect results (3 per endpoint = 12 total)
   - De-duplicate across sources
   - Sort by relevance (volume DESC, competition ASC)
   - Store in keywords table with parent_seed_keyword_id = seed_id
   - Set longtail_status = 'completed'

**De-duplication Logic:**
- Exact match removal
- Case-insensitive comparison
- Punctuation normalization
- Whitespace normalization

**Sorting Logic:**
```
Primary: search_volume DESC (highest volume first)
Secondary: competition_index ASC (lowest competition first)
Tertiary: keyword_difficulty ASC (easiest first)
```

### Stage 3: Keyword Filtering
**Source**: Long-tail Keywords  
**Method**: Business criteria filtering  
**Output**: Approved keywords for clustering

**Filter Criteria:**
- Minimum search volume (configurable)
- Maximum competition level
- Keyword difficulty range
- Intent matching
- Relevance scoring

**Process:**
1. Load all long-tail keywords
2. Apply filters
3. Mark approved keywords
4. Update filter_status field
5. Proceed to clustering

### Stage 4: Semantic Clustering
**Source**: Filtered Keywords  
**Method**: Embedding-based similarity  
**Output**: Hub-and-spoke topic clusters

**Hub Selection:**
- Highest search volume keyword = hub
- Remaining keywords = spokes

**Spoke Assignment:**
- Calculate cosine similarity between embeddings
- Threshold: >= 0.6 similarity
- Cluster size: 1 hub + 2-8 spokes
- Deterministic assignment (reproducible)

**Process:**
1. Generate embeddings for all keywords
2. Identify potential hubs (highest volume)
3. Assign spokes by similarity
4. Validate cluster coherence
5. Store in topic_clusters table

### Stage 5: Subtopic Generation
**Source**: Validated Clusters  
**Method**: DataForSEO subtopic endpoint  
**Output**: Exactly 3 subtopics per longtail keyword

**Subtopic Types:**
- How-to guides
- Comparison articles
- Comprehensive guides
- FAQ sections
- News/trend articles

**Process:**
1. For each longtail keyword:
   - Call DataForSEO subtopic endpoint
   - Extract exactly 3 subtopics
   - Parse subtopic metadata
   - Store in keywords.subtopics JSONB
   - Set subtopics_status = 'completed'

**Subtopic Metadata:**
- Title
- Type (how-to, comparison, etc.)
- Related keywords
- Search volume
- Keyword difficulty
- Search intent

## DataForSEO Integration Details

### API Authentication
```typescript
// Basic auth with DataForSEO credentials
const auth = Buffer.from(`${username}:${password}`).toString('base64')
headers['Authorization'] = `Basic ${auth}`
```

### Request Format
```typescript
{
  "login": "username",
  "password": "password",
  "data": [
    {
      "keyword": "content marketing",
      "language_code": "en",
      "location_code": 2840  // US
    }
  ]
}
```

### Response Parsing
```typescript
// DataForSEO returns nested structure
response.tasks[0].result[0].items.map(item => ({
  keyword: item.keyword,
  search_volume: item.search_volume,
  competition: item.competition,
  cpc: item.cpc
}))
```

### Rate Limiting
- Requests per second: Configurable
- Concurrent requests: Limited
- Retry on 429: Exponential backoff
- Daily quota: Monitored

### Error Handling
```typescript
// Transient errors (retry)
- 429 (Rate limit)
- 503 (Service unavailable)
- 504 (Gateway timeout)

// Permanent errors (fail)
- 400 (Bad request)
- 401 (Unauthorized)
- 403 (Forbidden)
```

## Semantic Clustering Algorithm

### Embedding Generation
```typescript
// Using existing embedding utilities
const embedding = await generateEmbedding(keyword)
// Returns Vector(1536) for similarity calculations
```

### Similarity Calculation
```typescript
// Cosine similarity between embeddings
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0)
  const magnitude1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0))
  const magnitude2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0))
  return dotProduct / (magnitude1 * magnitude2)
}
```

### Hub-and-Spoke Assignment
```typescript
// 1. Sort keywords by search volume
const sortedKeywords = keywords.sort((a, b) => b.search_volume - a.search_volume)

// 2. First keyword = hub
const hub = sortedKeywords[0]

// 3. Assign spokes by similarity
const spokes = sortedKeywords.slice(1).filter(keyword => {
  const similarity = cosineSimilarity(hub.embedding, keyword.embedding)
  return similarity >= 0.6 && spokes.length < 8
})
```

## Database Schema

### Keywords Table
```sql
CREATE TABLE keywords (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  competitor_url_id UUID,
  parent_seed_keyword_id UUID,
  
  seed_keyword TEXT,
  keyword TEXT NOT NULL,
  
  search_volume INTEGER DEFAULT 0,
  competition_level TEXT,
  competition_index INTEGER DEFAULT 0,
  keyword_difficulty INTEGER DEFAULT 0,
  cpc DECIMAL(10, 2),
  
  longtail_status TEXT DEFAULT 'not_started',
  subtopics_status TEXT DEFAULT 'not_started',
  article_status TEXT DEFAULT 'not_started',
  
  subtopics JSONB,
  embedding VECTOR(1536),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Topic Clusters Table
```sql
CREATE TABLE topic_clusters (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL,
  hub_keyword_id UUID NOT NULL,
  spoke_keyword_id UUID NOT NULL,
  similarity_score DECIMAL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workflow_id, spoke_keyword_id)
)
```

## Performance Characteristics

### Extraction Performance
- **Seed Extraction**: ~1 second per competitor
- **Long-tail Expansion**: ~2-3 seconds per seed (4 API calls)
- **Subtopic Generation**: ~1 second per keyword
- **Total for 9 seeds**: ~30-40 seconds

### Data Volume
- **Competitors**: 3 per organization
- **Seeds**: 3 per competitor = 9 total
- **Long-tails**: 12 per seed = 108 total
- **Subtopics**: 3 per long-tail = 324 total
- **Total Keywords**: 117 per workflow

### Storage
- **Keywords Table**: ~1-2 MB per workflow
- **Embeddings**: 1536 floats × 117 keywords ≈ 0.7 MB
- **Subtopics JSONB**: ~50 KB per workflow

## Testing Coverage

### Test Files
- `__tests__/api/keywords/subtopics.test.ts`
- `__tests__/api/keywords/subtopics-gate.test.ts`
- `__tests__/api/intent/workflows/seed-extract.test.ts`
- `__tests__/api/intent/workflows/longtail-expand.test.ts`

### Test Scenarios
- Seed extraction from competitor URLs
- Long-tail expansion with de-duplication
- Subtopic generation and validation
- Approval workflow
- Error handling and retries
- Data validation

## Code Patterns

### Service Pattern
```typescript
export class SubtopicGenerator {
  async generateSubtopics(keywordId: string): Promise<Subtopic[]> {
    // Validation
    // API call
    // Parsing
    // Storage
  }
}
```

### Error Handling
```typescript
try {
  const result = await dataforseoClient.call()
} catch (error) {
  if (isTransientError(error)) {
    // Retry with backoff
  } else {
    // Log and fail
  }
}
```

## Improvement Opportunities

1. **Caching**: Cache DataForSEO results for repeated keywords
2. **Batch Processing**: Batch API calls for efficiency
3. **Parallel Expansion**: Process seeds in parallel
4. **Smart Filtering**: ML-based keyword filtering
5. **Semantic Enrichment**: Additional semantic analysis
6. **Trend Analysis**: Track keyword trend data
7. **Competitive Analysis**: Compare with competitor keywords
8. **Intent Classification**: Better search intent classification

## Architecture Decisions

1. **Normalized Storage**: Keywords in relational table (not JSON)
2. **Hub-and-Spoke Model**: Semantic organization for content planning
3. **Embedding-Based Clustering**: Semantic similarity over keyword matching
4. **DataForSEO Multi-Source**: 4 endpoints for comprehensive expansion
5. **Exact Subtopic Count**: 3 subtopics per keyword for consistency
6. **Approval Gate**: Human review before article generation
