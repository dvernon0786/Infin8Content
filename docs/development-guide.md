# Development Guide

Generated: 2026-02-04 (System Status Update)  
Project: Infin8Content  
Framework: Next.js 16.1.1 with TypeScript  
Environment: Development - ✅ **FULLY OPERATIONAL**

---

## System Status (2026-02-04)

✅ **All Systems Operational**
- Dev Server: Running cleanly without routing conflicts
- Authentication: Registration and OTP verification working
- Database: Supabase connected and configured
- Email: Brevo OTP delivery active
- Environment: All variables configured

## Quick Start (Verified Working)

```bash
# 1. Start development server
npm run dev

# 2. Test registration (working example)
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  http://localhost:3000/api/auth/register

# Expected: 200 OK with user data and OTP message
```

---

## Prerequisites

### Required Software
- **Node.js**: 18.x or higher (recommended: latest LTS)
- **npm**: 9.x or higher (comes with Node.js)
- **Git**: For version control
- **Docker**: Required for local Supabase development

### Development Tools (Recommended)
- **VS Code**: With official extensions for TypeScript, Tailwind CSS, and ESLint
- **Postman**: For API testing
- **Supabase CLI**: For database management
- **Playwright Browser**: For E2E testing

## 🔒 CRITICAL: Next.js Cache Management

### When Working with Dynamic Routes

If you perform ANY of these operations:
- Rename dynamic route folders (`[id]` → `[keyword_id]`)
- Change parameter names
- Move folders under `app/`
- Switch branches with route changes

**ALWAYS clear the cache immediately:**
```bash
rm -rf .next
npm run dev
```

**Never trust hot reload for dynamic route changes.** This prevents "ghost routing errors" where Next.js caches old route structures.

### Prevention Checklist
Before debugging routing issues:
1. `git status` - ensure clean state
2. `tree app/api | grep '\['` - confirm folder structure
3. Kill all dev servers
4. `rm -rf .next` - clear cache
5. Restart once

If errors persist after cache clearing → real bug. If not → cache illusion.

---

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd infin8content
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

### 4. Required Environment Variables

#### Database Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

#### Payment Configuration
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_AGENCY_MONTHLY=price_...
STRIPE_PRICE_AGENCY_ANNUAL=price_...
```

#### External API Keys
```bash
OPENROUTER_API_KEY=your-openrouter-api-key
TAVILY_API_KEY=your-tavily-api-key
DATAFORSEO_API_KEY=your-dataforseo-api-key
BREVO_API_KEY=your-brevo-api-key
```

#### Inngest Configuration
```bash
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
```

### 5. Database Setup

#### Option A: Local Development (Recommended)
```bash
# Start local Supabase instance
supabase start

# Apply migrations
supabase db reset

# Generate TypeScript types
npx tsx scripts/generate-types.ts
```

#### Option B: Hosted Supabase
```bash
# Link to hosted project
supabase link --project-ref <project-ref>

# Apply migrations to hosted project
supabase migration up

# Generate types from hosted schema
supabase gen types typescript --project-id <project-ref> > lib/supabase/database.types.ts
```

## Development Commands

### Running the Application
```bash
# Start development server
npm run dev

# Start with specific port
npm run dev -- -p 3001

# Start with Turbopack (experimental)
npm run dev -- --turbo
```

### Building and Production
```bash
# Build for production
npm run build

# Start production server
npm start

# Build and analyze bundle size
npm run build && npx @next/bundle-analyzer
```

### Testing Commands
```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests headed (with browser)
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint -- --fix

# Type checking
npx tsc --noEmit
```

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Start development server
npm run dev

# Make changes and test
npm run test

# Run E2E tests for critical features
npm run test:e2e

# Commit changes
git add .
git commit -m "feat: add new feature"
```

### 2. Database Changes
```bash
# Create new migration
supabase db diff --schema public --use-migra -f new_migration.sql

# Edit migration file
nano supabase/migrations/new_migration.sql

# Apply migration
supabase db reset

# Regenerate types
npx tsx scripts/generate-types.ts
```

### 3. API Development
```bash
# Create new API route
mkdir -p app/api/new-endpoint
touch app/api/new-endpoint/route.ts

# Write API handler
# Follow existing patterns in app/api/

# Add tests
touch tests/api/new-endpoint.test.ts

# Run tests
npm run test
```

### 4. Component Development
```bash
# Create new component
touch components/ui/new-component.tsx
touch components/ui/new-component.test.tsx

# Follow existing component patterns
# Use TypeScript interfaces for props
# Add proper accessibility attributes

# Test component
npm run test -- components/ui/new-component.test.tsx
```

## Database Development

### Migration Management
```bash
# Create new migration
supabase migration new new_feature_table

# Apply all migrations
supabase db reset

# Check migration status
supabase migration list

# Generate types after schema changes
npx tsx scripts/generate-types.ts
```

### Local Database Management
```bash
# Start local Supabase
supabase start

# View logs
supabase logs

# Access database directly
supabase db shell

# Reset to clean state
supabase db reset

# Stop local instance
supabase stop
```

### Database Seeding
```bash
# Run seed script (if available)
npx tsx scripts/seed.ts

# Or manually insert test data
supabase db shell
```

## Testing Strategy

### Unit Testing (Vitest)
```bash
# Run all unit tests
npm run test

# Run specific test file
npm run test -- components/ui/button.test.tsx

# Run tests in watch mode
npm run test:ui

# Run tests with coverage
npm run test -- --coverage
```

### E2E Testing (Playwright)
```bash
# Install Playwright browsers
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests with UI
npm run test:e2e:ui

# Run tests headed
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug
```

### Test File Organization
```
tests/
├── unit/                    # Unit tests
│   ├── components/          # Component tests
│   ├── lib/                 # Library function tests
│   └── utils/               # Utility function tests
├── integration/             # Integration tests
│   ├── api/                 # API endpoint tests
│   └── database/            # Database operation tests
└── e2e/                     # End-to-end tests
    ├── auth.spec.ts         # Authentication flows
    ├── dashboard.spec.ts    # Dashboard functionality
    └── articles.spec.ts     # Article generation
```

## Code Style and Standards

### ESLint Configuration
- **Base**: Next.js ESLint configuration
- **TypeScript**: Strict type checking enabled
- **React**: React hooks rules enforced
- **Accessibility**: A11y rules enabled

### TypeScript Configuration
- **Strict Mode**: All strict checks enabled
- **Target**: ES2017 for modern browser support
- **Module**: ESNext with bundler resolution
- **JSX**: React-jsx transform for better performance

### Component Standards
```typescript
// Component interface example
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  disabled = false,
  children,
  onClick,
}) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### API Route Standards
```typescript
// API route example
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = requestSchema.parse(body);
    
    // Process request
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

## Debugging and Troubleshooting

### Common Development Issues

#### Environment Variable Errors
```bash
# Check environment variables
npm run dev

# If missing variables error appears:
# 1. Check .env.local exists
# 2. Verify all required variables are set
# 3. Restart development server
```

#### Database Connection Issues
```bash
# Check Supabase status
supabase status

# Reset database if needed
supabase db reset

# Regenerate types
npx tsx scripts/generate-types.ts
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Clear TypeScript cache
rm -rf .next/types

# Restart development server
npm run dev
```

### Debug Tools

#### Next.js Debug Mode
```bash
# Start with debug logging
DEBUG=* npm run dev

# Or specific module debug
DEBUG=next:* npm run dev
```

#### Database Debugging
```bash
# View database logs
supabase logs

# Access database directly
supabase db shell

# Run specific query
supabase db shell --command "SELECT * FROM users LIMIT 10;"
```

#### API Debugging
```bash
# Test API endpoints
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Or use Postman for complex requests
```

## Performance Optimization

### Development Performance
```bash
# Use Turbopack for faster builds (experimental)
npm run dev -- --turbo

# Enable fast refresh
# Automatic in Next.js development

# Optimize imports
# Use barrel exports for cleaner imports
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check for large dependencies
npm ls --depth=0
```

### Database Performance
```bash
# Check query performance
supabase db shell --command "EXPLAIN ANALYZE SELECT * FROM articles;"

# Add indexes if needed
# Create migration for new indexes
```

## Deployment Preparation

### Pre-Deployment Checklist
```bash
# 1. Run all tests
npm run test
npm run test:e2e

# 2. Type checking
npx tsc --noEmit

# 3. Linting
npm run lint

# 4. Build test
npm run build

# 5. Environment validation
# Ensure all production variables are set
```

### Environment-Specific Builds
```bash
# Development build
npm run build

# Production build
NODE_ENV=production npm run build

# Build with specific environment
NODE_ENV=staging npm run build
```

## Intent Workflow State Management

### Seed Keyword Approval (Story 35.3)

The seed approval workflow provides a human governance gate before long-tail expansion:

#### Approval States
```
step_3_seeds → step_3_seeds (approval gate - status unchanged)
            → step_3_seeds (rejection - status unchanged)
```

**Approval Process:**
```typescript
POST /api/intent/workflows/{workflow_id}/steps/approve-seeds
```

**Business Logic:**
- **Governance Gate**: Workflow status remains `step_3_seeds` (this is approval, not advancement)
- **Authorization**: Only organization admins can approve/reject
- **Idempotency**: One approval record per workflow + approval_type
- **Partial Approval**: Can approve subset of keywords via `approved_keyword_ids`
- **Full Approval**: All keywords approved when `approved_keyword_ids` is omitted

**Approval Types:**
- **Approved**: Keywords eligible for long-tail expansion
- **Rejected**: Keywords blocked from expansion

**Success Path:**
1. Approval record created in `intent_approvals` table
2. Workflow status remains `step_3_seeds`
3. Audit event logged: `workflow.seed_keywords.approved` or `workflow.seed_keywords.rejected`
4. Long-tail expansion (Story 35.2) checks approval before proceeding

**Audit Events:**
```typescript
// Approval event
action: 'workflow.seed_keywords.approved'
details: {
  workflow_id: string,
  approved_keyword_ids: string[] | null,
  feedback: string | null
}

// Rejection event
action: 'workflow.seed_keywords.rejected'
details: {
  workflow_id: string,
  feedback: string | null
}
```

#### Testing the Approval Workflow

```bash
# Run unit tests for approval processor
npm test -- __tests__/services/intent-engine/seed-approval-processor.test.ts

# Run integration tests for API endpoint
npm test -- __tests__/api/intent/workflows/approve-seeds.test.ts
```

#### Troubleshooting

**Issue: "Admin access required"**
- Verify user has `role = 'admin'` in users table
- Check user belongs to correct organization

**Issue: "Workflow must be at step_3_seeds"**
- Verify workflow status is `step_3_seeds`
- Ensure previous steps (ICP, competitors) completed successfully

**Issue: "Invalid keyword ID format"**
- Verify keyword IDs are valid UUIDs
- Check keywords exist in keywords table

### Long-Tail Keyword Expansion (Story 35.1)

The long-tail expansion workflow follows a state machine pattern with the following transitions:

#### Workflow States
```
step_3_seeds → step_4_longtails (on successful expansion)
            → step_3_seeds (on failure, retry available)
```

#### State Transition Details

**Initial State: `step_3_seeds`**
- Seed keywords extracted and stored with `longtail_status = 'not_started'`
- Ready for long-tail expansion

**Expansion Process:**
```typescript
POST /api/intent/workflows/{workflow_id}/steps/longtail-expand
```

**Success Path:**
1. Workflow status: `step_3_seeds` → `step_4_longtails`
2. Seed keywords: `longtail_status = 'not_started'` → `'complete'`
3. Long-tail keywords created with:
   - `parent_seed_keyword_id` = seed keyword ID
   - `longtail_status = 'complete'`
   - `subtopics_status = 'not_started'`
   - `article_status = 'not_started'`

**Failure Path:**
1. Workflow status remains at `step_3_seeds`
2. Error message stored in `step_4_longtails_error_message`
3. User can retry the expansion

#### DataForSEO Integration

The expansion calls four endpoints per seed keyword with retry logic:

```typescript
// Retry Configuration
const LONGTAIL_RETRY_POLICY = {
  maxAttempts: 3,           // 3 total attempts
  initialDelayMs: 2000,     // 2 seconds
  backoffMultiplier: 2,     // exponential backoff
  maxDelayMs: 8000          // 8 second max
}

// Backoff Sequence: 2s → 4s → 8s
```

**Endpoints Called:**
1. Related Keywords: `/v3/dataforseo_labs/google/related_keywords/live`
2. Keyword Suggestions: `/v3/dataforseo_labs/google/keyword_suggestions/live`
3. Keyword Ideas: `/v3/dataforseo_labs/google/keyword_ideas/live`
4. Google Autocomplete: `/v3/serp/google/autocomplete/live/advanced`

#### Organization Settings

The expansion respects organization-level configuration:

```typescript
// From organizations table
{
  default_location_code: number;    // e.g., 2840 for United States
  default_language_code: string;    // e.g., 'en' for English
}
```

If settings are missing, defaults are used with a warning log:
```
[LongtailExpander] Organization {id} missing location/language settings. 
Using defaults: locationCode=2840, languageCode=en
```

#### Audit Logging

All expansion operations are logged:

```typescript
// Start event
action: 'workflow.longtail_keywords.started'
details: {
  workflow_id: string,
  seed_count: number,
  sources: ['related', 'suggestions', 'ideas', 'autocomplete'],
  max_longtails_per_seed: 12
}

// Completion event
action: 'workflow.longtail_keywords.completed'
details: {
  workflow_id: string,
  seeds_processed: number,
  longtails_created: number,
  duration_ms: number
}

// Failure event
action: 'workflow.longtail_keywords.failed'
details: {
  workflow_id: string,
  error: string
}
```

#### Testing the Workflow

```bash
# Run unit tests for expansion service
npm test -- lib/services/intent-engine/longtail-keyword-expander.test.ts

# Run integration tests for API endpoint
npm test -- __tests__/api/intent/workflows/longtail-expand.test.ts

# Test with real DataForSEO credentials (requires .env.local)
npm run test:integration
```

#### Troubleshooting

**Issue: "No seed keywords found for expansion"**
- Verify workflow is in `step_3_seeds` status
- Check that seed keywords exist with `longtail_status = 'not_started'`
- Ensure previous step (seed extraction) completed successfully

**Issue: DataForSEO API errors**
- Verify `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` environment variables
- Check DataForSEO API rate limits
- Review retry logs for specific error messages

**Issue: Organization settings not applied**
- Check `organizations` table for `default_location_code` and `default_language_code`
- Verify organization record exists and is not deleted
- Check logs for warning messages about missing settings

### Intent Audit Logging (Story 37.4)

#### Overview
The Intent Engine maintains a comprehensive, immutable audit trail of all workflow actions and decisions for compliance tracking. This provides complete traceability of who performed which action, when it occurred, and why it occurred.

#### Architecture
- **Table**: `intent_audit_logs` (main) + `intent_audit_logs_archive` (historical)
- **Immutability**: WORM compliance enforced via database triggers
- **Retention**: 1 year in main table, lifetime in archive table
- **Access**: Organization owners only (RLS enforced)

#### Key Components

**Service**: `lib/services/intent-engine/intent-audit-logger.ts`
```typescript
// Log an intent action
await logIntentAction({
  organizationId: 'org-123',
  workflowId: 'workflow-123',
  entityType: 'workflow',
  entityId: 'entity-123',
  actorId: 'user-123',
  action: 'workflow.step.completed',
  details: { step: 'step_4_longtails' },
})

// Fire-and-forget logging
logIntentActionAsync({...})
```

**API**: `GET /api/intent/audit/logs`
```typescript
// Query with filters
const logs = await fetch('/api/intent/audit/logs?' + new URLSearchParams({
  workflow_id: 'workflow-123',
  action: 'workflow.step.completed',
  limit: '100',
  include_count: 'true'
}))
```

**Archival**: `lib/services/intent-engine/intent-audit-archiver.ts`
```typescript
// Archive logs older than 1 year
const result = await archiveOldIntentAuditLogs()
console.log(`Archived ${result.archived_count} logs`)

// Get archival statistics
const stats = await getIntentAuditArchivalStats()
```

#### Integration Pattern
Add Intent audit logging to all workflow steps and critical actions:

```typescript
// In workflow step completion
logIntentActionAsync({
  organizationId,
  workflowId,
  entityType: 'workflow',
  entityId: workflowId,
  actorId: userId,
  action: AuditAction.WORKFLOW_STEP_COMPLETED,
  details: { step: 'step_4_longtails', duration: 120000 },
  ipAddress: extractIpAddress(request.headers),
  userAgent: extractUserAgent(request.headers),
})
```

#### Supported Actions
- **Workflow Events**: `workflow.created`, `workflow.archived`, `workflow.superseded`
- **Step Events**: `workflow.step.completed`, `workflow.step.failed`, `workflow.step.blocked`
- **Approval Events**: `workflow.approval.approved`, `workflow.approval.rejected`
- **Keyword Events**: `keyword.subtopics.approved`, `keyword.subtopics.rejected`
- **Article Events**: `article.queued`, `article.generated`, `article.failed`
- **System Events**: `system.error`, `system.retry_exhausted`

### Article Generation Progress Tracking (Story 38.2)

#### Overview
The article generation progress tracking system provides real-time visibility into article generation status for intent workflows. This read-only service tracks articles through queued → generating → completed/failed states with estimated completion times and comprehensive error reporting.

#### Architecture
- **Service Layer**: `lib/services/intent-engine/article-progress-tracker.ts`
- **API Endpoint**: `GET /api/intent/workflows/{workflow_id}/articles/progress`
- **Database**: `article_progress` table (existing) with real-time updates
- **Response Format**: Detailed progress objects with summary statistics

#### Service Pattern

```typescript
// Fetch workflow article progress with filters
const articles = await getWorkflowArticleProgress(workflowId, {
  status: 'generating',
  date_from: '2026-02-01',
  limit: 50
})

// Format response with summary statistics
const response = formatProgressResponse(articles, workflowId)
```

#### API Integration Pattern

```typescript
// In API route
const articles = await getWorkflowArticleProgress(workflowId, filters)
const response = formatProgressResponse(articles, workflowId)

// Log audit event
await logActionAsync({
  orgId: currentUser.org_id,
  userId: currentUser.id,
  action: AuditAction.WORKFLOW_ARTICLE_GENERATION_PROGRESS_QUERIED,
  details: {
    workflow_id: workflowId,
    article_count: articles.length,
    filters_applied: filters
  },
  ipAddress: extractIpAddress(request.headers),
  userAgent: extractUserAgent(request.headers),
})
```

#### Progress Calculation Pattern

```typescript
// Calculate estimated completion time
function calculateEstimatedCompletion(article: ArticleProgress): Date | null {
  if (article.status !== 'generating') return null
  
  const progress = article.progress_percentage || 0
  const timeSpent = article.actual_time_spent * 1000 // milliseconds
  
  if (progress === 0) {
    // Use average time per section
    const remainingSections = article.total_sections - article.current_section + 1
    return new Date(Date.now() + remainingSections * 60000) // 60s per section
  }
  
  // Calculate based on current progress rate
  const progressRate = timeSpent / progress
  const remainingProgress = 100 - progress
  return new Date(Date.now() + remainingProgress * progressRate)
}
```

#### Response Format Pattern

```typescript
interface ProgressResponse {
  workflow_id: string;
  total_articles: number;
  articles: ArticleProgress[];
  summary: {
    queued_count: number;
    generating_count: number;
    completed_count: number;
    failed_count: number;
    average_generation_time_seconds: number;
    estimated_total_completion_time?: string;
  };
}
```

#### Error Handling Pattern

```typescript
// Graceful error handling with audit logging
try {
  const articles = await getWorkflowArticleProgress(workflowId, filters)
  return formatProgressResponse(articles, workflowId)
} catch (error) {
  // Log error for debugging
  await logActionAsync({
    orgId: currentUser.org_id,
    userId: currentUser.id,
    action: AuditAction.WORKFLOW_ARTICLE_GENERATION_PROGRESS_ERROR,
    details: {
      workflow_id: workflowId,
      error: error.message
    }
  })
  
  // Return user-friendly error
  return NextResponse.json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching article progress'
    }
  }, { status: 500 })
}
```

#### Performance Considerations

- **Query Optimization**: Use indexed queries on (workflow_id, status, created_at)
- **Pagination**: Support 1000+ articles per workflow with efficient paging
- **Response Time**: Target < 2 seconds for typical queries
- **Memory Usage**: Stream results for large datasets

#### Testing Pattern

```typescript
// Unit tests for progress calculation
describe('calculateEstimatedCompletion', () => {
  it('should estimate completion for in-progress article', () => {
    const article = {
      status: 'generating',
      progress_percentage: 40,
      actual_time_spent: 120, // 2 minutes
      // ... other fields
    }
    
    const result = calculateEstimatedCompletion(article)
    expect(result).toBeInstanceOf(Date)
    expect(result.getTime()).toBeGreaterThan(Date.now())
  })
})

// Integration tests for API endpoint
describe('GET /api/intent/workflows/{workflow_id}/articles/progress', () => {
  it('should return progress data for authorized user', async () => {
    const response = await GET(request, { params: { workflow_id: 'test' } })
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.workflow_id).toBe('test')
    expect(data.summary).toBeDefined()
  })
})
```

#### Troubleshooting

**Issue: "No articles found for workflow"**
- Verify workflow exists and belongs to user's organization
- Check that articles have been queued (Story 38.1 completed)
- Ensure article_progress records exist for articles

**Issue: "Estimated completion time seems inaccurate"**
- Progress estimates are based on average generation rates
- Actual times vary by content complexity and API response times
- For more accuracy, consider historical performance data

**Issue: "Slow response times"**
- Check database indexes on article_progress table
- Verify query is using proper filtering (status, date range)
- Consider implementing caching for frequently accessed workflows

### Article-Workflow Linking (Story 38.3)

#### Overview
The article-workflow linking system establishes bidirectional links between generated articles and their originating intent workflow. This completes the workflow lifecycle by connecting completed articles back to their keyword research origins, enabling full traceability and workflow completion.

#### Architecture
- **Service Layer**: `lib/services/intent-engine/article-workflow-linker.ts`
- **API Endpoint**: `POST /api/intent/workflows/{workflow_id}/steps/link-articles`
- **Database**: New fields in `articles` and `intent_workflows` tables
- **Response Format**: Comprehensive linking results with detailed counts

#### Service Pattern

```typescript
// Link articles to workflow with comprehensive tracking
const result = await linkArticlesToWorkflow(workflowId, userId)

// Result includes detailed breakdown
interface LinkingResult {
  workflow_id: string;
  linking_status: 'in_progress' | 'completed' | 'failed';
  total_articles: number;
  linked_articles: number;
  already_linked: number;
  failed_articles: number;
  workflow_status: string;
  processing_time_seconds: number;
  details: {
    linked_article_ids: string[];
    failed_article_ids: string[];
    skipped_article_ids: string[];
  };
}
```

#### API Implementation

```typescript
// In API route
const currentUser = await getCurrentUser()
if (!currentUser || !currentUser.org_id) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
}

// Validate workflow state (must be step_9_articles)
const { valid, workflow } = await validateWorkflowForLinking(workflowId)
if (!valid) {
  return NextResponse.json({ error: 'Invalid workflow state' }, { status: 400 })
}

// Execute linking process
const linkingResult = await linkArticlesToWorkflow(workflowId, currentUser.id)

// Log completion
await logActionAsync({
  orgId: currentUser.org_id,
  userId: currentUser.id,
  action: AuditAction.WORKFLOW_ARTICLES_LINKING_COMPLETED,
  details: { /* linking results */ }
})

return NextResponse.json({ success: true, data: linkingResult })
```

#### Database Schema Changes

```sql
-- Articles table new fields
ALTER TABLE articles ADD COLUMN workflow_link_status TEXT DEFAULT 'not_linked';
ALTER TABLE articles ADD COLUMN linked_at TIMESTAMP WITH TIME ZONE;

-- Workflow table new fields  
ALTER TABLE intent_workflows ADD COLUMN article_link_count INTEGER DEFAULT 0;
ALTER TABLE intent_workflows ADD COLUMN article_linking_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE intent_workflows ADD COLUMN article_linking_completed_at TIMESTAMP WITH TIME ZONE;

-- Performance indexes
CREATE INDEX idx_articles_workflow_linking ON articles(workflow_id, status, workflow_link_status);
CREATE INDEX idx_workflows_article_link_count ON intent_workflows(article_link_count) WHERE article_link_count > 0;
```

#### Business Logic

```typescript
// Eligibility criteria for linking
const eligibleArticles = await getCompletedArticlesForWorkflow(workflowId)
// - status must be 'completed' or 'published'
// - workflow_link_status must be 'not_linked'
// - must belong to specified workflow

// Batch processing for performance
const batchSize = 10
for (let i = 0; i < articles.length; i += batchSize) {
  const batch = articles.slice(i, i + batchSize)
  // Process each article with individual error handling
}

// Idempotent design - safe to re-run
if (article.workflow_link_status === 'linked') {
  // Skip already linked articles
  continue
}

// Workflow state transition
if (linkingResult.failed_articles === 0) {
  // Update to final completion state
  await updateWorkflowStatus(workflowId, 'step_10_completed')
}
```

#### Error Handling

```typescript
// Individual article failures don't stop the process
try {
  await linkSingleArticle(articleId, workflowId, userId)
  result.linked_articles++
} catch (error) {
  result.failed_articles++
  // Mark article as failed but continue with others
  await markArticleAsFailed(articleId, error)
}

// Comprehensive audit logging
await logIntentAction({
  organizationId: workflow.organization_id,
  workflowId,
  entityType: 'article',
  entityId: articleId,
  actorId: userId,
  action: success ? 
    AuditAction.WORKFLOW_ARTICLE_LINKED : 
    AuditAction.WORKFLOW_ARTICLE_LINK_FAILED,
  details: { linking_result: success ? 'success' : 'failed' }
})
```

#### Testing Strategy

```typescript
// Unit tests for service layer
describe('Article-Workflow Linker Service', () => {
  it('should link completed articles to workflow', async () => {
    const result = await linkArticlesToWorkflow(workflowId, userId)
    expect(result.linked_articles).toBeGreaterThan(0)
    expect(result.linking_status).toBe('completed')
  })

  it('should handle individual article failures gracefully', async () => {
    // Mock one failing article
    const result = await linkArticlesToWorkflow(workflowId, userId)
    expect(result.failed_articles).toBe(1)
    expect(result.linked_articles).toBe(2) // others succeeded
  })
})

// Integration tests for API endpoint
describe('POST /api/intent/workflows/{workflow_id}/steps/link-articles', () => {
  it('should require authentication', async () => {
    const response = await POST(request, { params: { workflow_id: 'test' } })
    expect(response.status).toBe(401)
  })

  it('should validate workflow state', async () => {
    // Mock workflow in wrong state
    const response = await POST(request, { params: { workflow_id: 'test' } })
    expect(response.status).toBe(400)
    expect(response.data.error).toContain('step_9_articles')
  })
})
```

#### Troubleshooting

**Issue: "No articles found for linking"**
- Verify articles exist with status 'completed' or 'published'
- Check workflow is in 'step_9_articles' state
- Ensure articles have workflow_link_status = 'not_linked'

**Issue: "Linking process taking too long"**
- Check database indexes on articles table
- Verify batch processing is working (10 articles per batch)
- Monitor for database connection issues

**Issue: "Workflow status not updating to completed"**
- Verify all articles linked successfully (failed_articles = 0)
- Check for database constraint violations
- Ensure workflow update transaction is not failing

**Issue: "Audit logging not working"**
- Verify intent-audit-logger service is properly imported
- Check organization_id is available for audit context
- Ensure audit logging failures don't affect core functionality

#### Testing
```bash
# Run audit logger tests
npm test -- __tests__/services/intent-engine/intent-audit-logger.test.ts

# Run API tests
npm test -- __tests__/api/intent/audit/logs.test.ts

# Test archival functionality
npm test -- __tests__/services/intent-engine/intent-audit-archiver.test.ts
```

#### Database Schema
```sql
-- Main table (last 12 months)
CREATE TABLE intent_audit_logs (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  workflow_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

-- Archive table (historical)
CREATE TABLE intent_audit_logs_archive (
  -- Same schema + archived_at timestamp
);
```

#### Security & Compliance
- **WORM Compliance**: No UPDATE/DELETE operations allowed
- **Organization Isolation**: RLS policies enforce data separation
- **Access Control**: Only organization owners can view audit logs
- **Non-blocking**: Audit failures never affect core functionality
- **Complete Coverage**: All Intent Engine actions are logged

#### Troubleshooting
**Issue: "Audit logging not working"**
- Check `intent_audit_logs` table exists and RLS is enabled
- Verify user has `owner` role in organization
- Check console for audit logging errors (non-blocking)

**Issue: "Performance degradation"**
- Run archival process: `await archiveOldIntentAuditLogs()`
- Check table size: `SELECT COUNT(*) FROM intent_audit_logs`
- Monitor query performance with indexes

**Issue: "Missing audit entries"**
- Verify `logIntentActionAsync()` calls are added to new features
- Check for errors in console (audit logging is fire-and-forget)
- Ensure proper organization context is available

## Contributing Guidelines

### Git Workflow
```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes with proper commits
git add .
git commit -m "feat: add new feature description"

# 3. Run tests
npm run test
npm run test:e2e

# 4. Push and create PR
git push origin feature/your-feature-name
```

### Commit Message Format
```
feat: add new feature
fix: fix bug description
docs: update documentation
style: code formatting changes
refactor: code refactoring
test: add or update tests
chore: build process or dependency changes
```

### Code Review Process
1. Ensure all tests pass
2. Check TypeScript types
3. Verify ESLint passes
4. Test functionality manually
5. Request review from team member

---

## ICP Gate Enforcement Patterns (Story 39-1)

### Overview
The ICP (Ideal Customer Profile) gate enforcement system ensures that ICP generation is completed before any downstream workflow steps can be executed. This provides a hard gate that prevents workflow progression until foundational ICP work is complete.

### Architecture
- **Validator Service**: `lib/services/intent-engine/icp-gate-validator.ts`
- **Middleware**: `lib/middleware/intent-engine-gate.ts`
- **Audit Actions**: `types/audit.ts` (WORKFLOW_GATE_ICP_ALLOWED/BLOCKED)
- **Protected Endpoints**: 8 downstream Intent Engine endpoints

### Key Components

#### Gate Validator
```typescript
import { ICPGateValidator } from '@/lib/services/intent-engine/icp-gate-validator'

const validator = new ICPGateValidator()
const result = await validator.validateICPCompletion(workflowId)

if (!result.allowed) {
  return NextResponse.json(result.errorResponse, { status: 423 })
}
```

#### Middleware Integration
```typescript
import { enforceICPGate } from '@/lib/middleware/intent-engine-gate'

// In API route after authentication
const gateResponse = await enforceICPGate(workflowId, 'step-name')
if (gateResponse) {
  return gateResponse
}

// Continue with step logic...
```

#### Workflow Status Validation
The gate checks for ICP completion using these status levels:
- **Blocked**: `step_1_icp` and earlier
- **Allowed**: `step_2_icp_complete` and later

#### Audit Logging
All gate enforcement attempts are logged with full context:
```typescript
await validator.logGateEnforcement(workflowId, stepName, result)
```

### Implementation Pattern

#### 1. Add Import
```typescript
import { enforceICPGate } from '@/lib/middleware/intent-engine-gate'
```

#### 2. Add Gate Check
```typescript
// After authentication, before business logic
const gateResponse = await enforceICPGate(workflowId, 'step-name')
if (gateResponse) {
  return gateResponse
}
```

#### 3. Test Integration
```typescript
// Mock gate for testing
vi.mock('@/lib/middleware/intent-engine-gate', () => ({
  enforceICPGate: vi.fn()
}))

// Test blocked scenario
vi.mocked(enforceICPGate).mockResolvedValue(mock423Response)
```

### Error Handling

#### Fail-Open Strategy
Database errors allow access for system availability:
```typescript
catch (error) {
  // Fail open for availability
  return NextResponse.json({
    error: 'Gate enforcement failed - failing open for availability'
  }, { status: 200 })
}
```

#### 423 Response Format
```typescript
{
  error: "ICP completion required before {step}",
  workflowStatus: "step_1_icp",
  icpStatus: "step_1_icp",
  requiredAction: "Complete ICP generation (step 2) before proceeding",
  currentStep: "{step}",
  blockedAt: "2026-01-31T10:00:00.000Z"
}
```

### Performance Considerations

- **Validation Time**: < 50ms per request
- **Database Query**: Single workflow lookup
- **Audit Logging**: Async, non-blocking
- **Memory Usage**: Minimal, stateless design

### Testing Strategy

#### Unit Tests
```bash
npm test -- __tests__/services/intent-engine/icp-gate-validator.test.ts
```

#### Integration Tests
```bash
npm test -- __tests__/api/intent/workflows/competitor-analyze-gate-integration.test.ts
```

#### Test Scenarios

## Competitor Gate Enforcement Patterns (Story 39-2)

### Overview
The competitor gate enforcement system ensures that competitor analysis is completed before seed keyword extraction can begin. This provides a hard gate that prevents seed extraction until foundational competitor work is complete, ensuring all seed keywords are derived from actual competitor data.

### Architecture
- **Validator Service**: `lib/services/intent-engine/competitor-gate-validator.ts`
- **Middleware**: `lib/middleware/intent-engine-gate.ts` (extended from ICP gate)
- **Audit Actions**: `types/audit.ts` (WORKFLOW_GATE_COMPETITORS_ALLOWED/BLOCKED/ERROR)
- **Protected Endpoints**: 1 seed extraction endpoint

### Key Components

#### Gate Validator
```typescript
import { CompetitorGateValidator } from '@/lib/services/intent-engine/competitor-gate-validator'

const validator = new CompetitorGateValidator()
const result = await validator.validateCompetitorCompletion(workflowId)

if (!result.allowed) {
  // Block access with 423 response
  return NextResponse.json(result.errorResponse, { status: 423 })
}

// Allow access - continue with step logic
```

#### Middleware Integration
```typescript
import { enforceCompetitorGate } from '@/lib/middleware/intent-engine-gate'

// In API route after authentication and ICP gate
const gateResponse = await enforceCompetitorGate(workflowId, 'seed-extract')
if (gateResponse) {
  return gateResponse
}

// Continue with step logic...
```

#### Workflow Status Validation
The gate checks for competitor analysis completion using these status levels:
- **Blocked**: `step_2_icp_complete` and earlier
- **Allowed**: `step_3_competitors` and later

#### Audit Logging
All gate enforcement attempts are logged with full context:
```typescript
await validator.logGateEnforcement(workflowId, stepName, result)
```

### Implementation Pattern

#### 1. Add Import
```typescript
import { enforceCompetitorGate } from '@/lib/middleware/intent-engine-gate'
```

#### 2. Add Gate Check (after ICP gate)
```typescript
// After authentication and ICP gate, before business logic
const gateResponse = await enforceCompetitorGate(workflowId, 'seed-extract')
if (gateResponse) {
  return gateResponse
}
```

#### 3. Test Integration
```typescript
// Mock gate for testing
vi.mock('@/lib/middleware/intent-engine-gate', () => ({
  enforceCompetitorGate: vi.fn()
}))

// Test blocked scenario
vi.mocked(enforceCompetitorGate).mockResolvedValue(mock423Response)
```

### Error Handling
The gate follows the same fail-open pattern as the ICP gate:
```typescript
catch (error) {
  // Fail open for availability
  return NextResponse.json({
    error: 'Gate enforcement failed - failing open for availability'
  }, { status: 200 })
}
```

### Error Response Format
```json
{
  "error": "Competitor analysis required before seed keywords",
  "workflowStatus": "step_2_icp_complete",
  "competitorStatus": "not_complete",
  "requiredAction": "Complete competitor analysis (step 2) before proceeding",
  "currentStep": "step_2_icp_complete",
  "blockedAt": "2026-02-03T10:13:00.000Z"
}
```

### Testing

#### Unit Tests
```bash
npm test -- __tests__/services/intent-engine/competitor-gate-validator.test.ts
```

#### Integration Tests
```bash
npm test -- __tests__/api/intent/workflows/seed-extract.test.ts
```

#### Test Scenarios
- ✅ Allow access when workflow status is `step_3_competitors`
- ✅ Block access when workflow status is `step_2_icp_complete`
- ✅ Fail open on database errors
- ✅ Proper audit logging for enforcement
- ✅ Organization isolation enforcement
- ✅ Performance validation (< 100ms)

### Relationship to ICP Gate
The competitor gate is designed to work in conjunction with the ICP gate:
1. **ICP Gate**: Validates ICP completion (step 2)
2. **Competitor Gate**: Validates competitor analysis completion (step 3)
3. **Sequential Enforcement**: Both gates must pass for seed extraction

This creates a strict dependency chain: ICP → Competitors → Seeds → Longtails

#### Test Scenarios
- ICP complete → 200 OK
- ICP incomplete → 423 Blocked
- Database error → 200 Fail-open
- Workflow not found → 423 Blocked
- Audit logging verification

---

## Keyword Engine Patterns

### Overview
The Keyword Engine provides SEO-focused keyword processing capabilities, separate from the Intent Engine workflow system. It handles individual keyword operations like subtopic generation.

### Architecture
- **Service Layer**: `lib/services/keyword-engine/`
- **API Layer**: `app/api/keywords/[id]/`
- **Type Definitions**: `types/keyword.ts`

### Key Components

#### Subtopic Generator
```typescript
import { KeywordSubtopicGenerator } from '@/lib/services/keyword-engine/subtopic-generator'

const generator = new KeywordSubtopicGenerator()
const subtopics = await generator.generate(keywordId)
await generator.store(keywordId, subtopics)
```

#### DataForSEO Integration
```typescript
import { generateSubtopics } from '@/lib/services/keyword-engine/dataforseo-client'

const subtopics = await generateSubtopics(
  topic,
  language,
  locationCode,
  limit
)
```

### Database Schema
- `keywords.subtopics`: JSONB array storing subtopic ideas
- `keywords.subtopics_status`: Track generation progress
- `keywords.longtail_status`: Prerequisite for subtopic generation

### Error Handling
- Authentication required for all operations
- Organization isolation via RLS
- Idempotency: Skip if already completed
- Retry logic for external API calls

### Testing Patterns
```typescript
// Mock external dependencies
vi.mock('@/lib/services/keyword-engine/dataforseo-client')
vi.mock('@/lib/supabase/server')

// Test service methods
it('should generate subtopics for valid keyword', async () => {
  const generator = new KeywordSubtopicGenerator()
  const result = await generator.generate(keywordId)
  expect(result).toHaveLength(3) // Exactly 3 subtopics
})
```

### Troubleshooting

**DataForSEO API Issues**
- Check environment variables: `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`
- Verify rate limits and retry configuration
- Monitor API cost and usage

**Database Issues**
- Verify keyword has `longtail_status = 'complete'`
- Check organization isolation (RLS policies)
- Ensure proper JSONB structure for subtopics

**Authentication Issues**
- Verify user session and organization membership
- Check RLS policies on keywords table
- Ensure proper middleware configuration

---

## Intent Engine Workflow Gates

### Seed Approval Gate Pattern (Story 39-3)

The seed approval gate enforces that seed keywords must be approved before long-tail expansion proceeds.

**Gate Enforcement Pattern:**
```typescript
// In API endpoint handler
import { enforceSeedApprovalGate } from '@/lib/middleware/intent-engine-gate'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflow_id: string }> }
) {
  const { workflow_id } = await params

  // Enforce seed approval gate
  const seedGateResponse = await enforceSeedApprovalGate(workflow_id, 'longtail-expand')
  if (seedGateResponse) {
    return seedGateResponse  // Returns 423 Locked if not approved
  }

  // Continue with step logic if gate passes
  // ...
}
```

**Gate Validation Rules:**
1. **Workflow State Check**: Workflow must be at `step_3_seeds` or beyond
2. **Approval Check**: `intent_approvals` table must have `approval_type='seed_keywords'` and `decision='approved'`
3. **Organization Isolation**: Workflow must belong to user's organization (RLS enforced)
4. **Fail-Open Principle**: Database errors allow request to proceed (availability over strictness)

**Response Codes:**
- **423 Locked**: Seed keywords not approved or not yet extracted
- **200 OK**: Gate passes, continue to step logic
- **401 Unauthorized**: Authentication required
- **404 Not Found**: Workflow not found

**Audit Logging:**
- `workflow.gate.seeds_allowed`: Gate passes, access granted
- `workflow.gate.seeds_blocked`: Gate blocks, access denied
- `workflow.gate.seeds_error`: Gate enforcement encounters error

**Testing Strategy:**
```typescript
// Mock the gate validator
vi.mock('@/lib/services/intent-engine/seed-approval-gate-validator')

// Test blocking behavior
it('should return 423 when seeds not approved', async () => {
  vi.mocked(SeedApprovalGateValidator).mockImplementation(() => ({
    validateSeedApproval: vi.fn().mockResolvedValue({
      allowed: false,
      seedApprovalStatus: 'not_approved',
      workflowStatus: 'step_3_seeds'
    }),
    logGateEnforcement: vi.fn()
  }))

  const response = await enforceSeedApprovalGate('workflow-123', 'longtail-expand')
  expect(response?.status).toBe(423)
})

// Test passing behavior
it('should return null when seeds approved', async () => {
  vi.mocked(SeedApprovalGateValidator).mockImplementation(() => ({
    validateSeedApproval: vi.fn().mockResolvedValue({
      allowed: true,
      seedApprovalStatus: 'approved',
      workflowStatus: 'step_3_seeds'
    }),
    logGateEnforcement: vi.fn()
  }))

  const response = await enforceSeedApprovalGate('workflow-123', 'longtail-expand')
  expect(response).toBeNull()
})
```

**Troubleshooting:**

**Gate Returns 423 Locked**
- Verify seed keywords have been approved: Check `intent_approvals` table for `approval_type='seed_keywords'` and `decision='approved'`
- Ensure workflow is at `step_3_seeds`: Check `intent_workflows.status`
- Verify organization isolation: Confirm workflow belongs to user's organization

**Gate Fails Open (Allows Despite Error)**
- Database connection issues trigger fail-open behavior
- Check database connectivity and RLS policies
- Monitor error logs for underlying database errors

**Gate Enforcement Not Triggered**
- Verify gate is called before step logic: `const response = await enforceSeedApprovalGate(...)`
- Check gate function is imported: `import { enforceSeedApprovalGate } from '@/lib/middleware/intent-engine-gate'`
- Ensure response is checked: `if (seedGateResponse) { return seedGateResponse }`

---

*This documentation was generated as part of the BMad Method document-project workflow on 2026-01-11.*
