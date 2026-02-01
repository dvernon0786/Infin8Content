# Development Guide - Infin8Content

Generated: 2026-01-23 (Deep Scan Update)  
Framework: Next.js 16.1.1 + TypeScript 5  
Environment: Multi-tenant SaaS platform

## Prerequisites

### System Requirements
- **Node.js:** 18.x or higher
- **npm:** 9.x or higher  
- **PostgreSQL:** Supabase managed
- **Git:** For version control

### Development Tools
- **VS Code** recommended with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd Infin8Content
cd infin8content
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy environment template:
```bash
cp .env.example .env.local
```

**Required Environment Variables:**

**Supabase Configuration:**
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

**WordPress Publishing (Story 5-1):**
```env
WORDPRESS_PUBLISH_ENABLED=true
WORDPRESS_DEFAULT_SITE_URL=https://your-wordpress-site.com
WORDPRESS_DEFAULT_USERNAME=your-wordpress-username
WORDPRESS_DEFAULT_APPLICATION_PASSWORD=your-app-password
```

**Monitoring and Debugging:**
```env
LOG_LEVEL=info
DEBUG_ENABLED=true
MONITORING_ENABLED=true
SENTRY_DSN=your-sentry-dsn
```

**External Service APIs:**
```env
OPENROUTER_API_KEY=your-openrouter-key
TAVILY_API_KEY=your-tavily-key
DATAFORSEO_API_KEY=your-dataforseo-key
BREVO_API_KEY=your-brevo-key
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

### 4. Database Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Local Development

### Start Development Server
```bash
npm run dev
```
- **URL:** http://localhost:3000
- **Hot Reload:** Enabled
- **API Routes:** Available at http://localhost:3000/api/*

### Start Storybook (Component Development)
```bash
npm run storybook
```
- **URL:** http://localhost:6006
- **Component Documentation:** Interactive

### Database Development
```bash
# Start local Supabase
supabase start

# Generate TypeScript types
supabase gen types typescript --local > lib/supabase/database.types.ts

# Reset local database
supabase db reset
```

## Build and Deployment

### Build for Production
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build application
npm run build
```

### Start Production Server
```bash
npm start
```

## Testing

### Unit Testing
```bash
# Run all unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Integration Testing
```bash
# Run integration tests
npm run test:integration

# Run contract tests
npm run test:contracts
```

### End-to-End Testing
```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug
```

### Visual Regression Testing
```bash
# Run visual regression tests
npm run test:visual

# Run responsive testing
npm run test:responsive

# Run accessibility testing
npm run test:accessibility

# Run layout regression tests
npm run test:layout-regression
```

## Code Quality

### ESLint Configuration
```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix
```

**Custom ESLint Rules:**
- Design system compliance via `eslint-plugin-design-system`
- TypeScript strict mode enforcement
- Import/export organization

### Prettier Configuration
```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

## Development Workflow

### Feature Development
1. **Create feature branch:** `git checkout -b feature/your-feature`
2. **Implement changes:** Follow component patterns
3. **Add tests:** Unit + integration tests
4. **Run test suite:** `npm run test:ts-001`
5. **Type checking:** `npm run typecheck`
6. **Linting:** `npm run lint`
7. **Commit changes:** Follow conventional commits
8. **Push and create PR**

### Database Changes
1. **Create migration:** `supabase migration new new_feature`
2. **Write SQL:** In migration file
3. **Test locally:** `supabase db reset`
4. **Generate types:** `supabase gen types typescript`
5. **Push changes:** `supabase db push`

### Component Development
1. **Use Storybook:** For component isolation
2. **Follow design system:** Use established tokens
3. **Mobile-first:** Ensure responsive design
4. **Accessibility:** Test with screen readers
5. **Performance:** Optimize for mobile

## Common Development Tasks

### Adding New API Endpoint
1. Create route file: `app/api/your-endpoint/route.ts`
2. Add TypeScript types: `lib/types/api.ts`
3. Implement validation: Use Zod schemas
4. Add authentication: Use `getCurrentUser()` helper
5. Add tests: `__tests__/api/your-endpoint.test.ts`
6. Update documentation: API contracts

### Article Generation API Pattern
The `/api/articles/generate` endpoint demonstrates the standard pattern:

```typescript
// 1. Authentication
const currentUser = await getCurrentUser()
if (!currentUser || !currentUser.org_id) {
  return NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  )
}

// 2. Usage Tracking
const currentMonth = new Date().toISOString().slice(0, 7)
const { data: usageData } = await supabaseAdmin
  .from('usage_tracking')
  .select('usage_count')
  .eq('organization_id', currentUser.org_id)
  .eq('metric_type', 'article_generation')
  .eq('billing_period', currentMonth)
  .single()

// 3. Activity Logging
logActionAsync({
  orgId: currentUser.org_id,
  userId: currentUser.id,
  action: 'article.generation.started',
  details: { /* article details */ },
  ipAddress: extractIpAddress(request.headers),
  userAgent: extractUserAgent(request.headers),
})
```

**Key Features:**
- Authentication required with 401 response
- Usage limits enforced per plan
- Comprehensive activity logging
- Multi-tenant data isolation

### Adding New Component
1. Create component: `components/your-component.tsx`
2. Add Storybook stories: `components/your-component.stories.tsx`
3. Add tests: `__tests__/components/your-component.test.tsx`
4. Update exports: `components/index.ts`
5. Document usage: Component README

### Database Schema Changes
1. Create migration: `supabase migration new schema_change`
2. Write DDL statements
3. Add RLS policies
4. Update TypeScript types
5. Test with sample data

### External API Integration
1. Create service: `lib/services/new-service.ts`
2. Add environment variables
3. Implement error handling
4. Add contract tests
5. Update API documentation

## Debugging

### Local Debugging
```bash
# Enable debug logging
DEBUG_ENABLED=true npm run dev

# Database debugging
supabase logs --follow

# API debugging
curl -X POST http://localhost:3000/api/your-endpoint
```

### Performance Debugging
```bash
# Run performance tests
npm run test:performance

# Analyze bundle size
npm run analyze

# Profile memory usage
npm run profile
```

### Error Monitoring
- **Sentry:** Error tracking and performance monitoring
- **Custom metrics:** Business KPI tracking
- **Log aggregation:** Structured logging

## Security Considerations

### Development Security
- Use environment variables for secrets
- Never commit API keys
- Enable RLS policies in development
- Test authentication flows

### Code Security
- Input validation with Zod
- SQL injection prevention via RLS
- XSS prevention via React
- CSRF protection via Next.js

## Performance Optimization

### Frontend Performance
- Code splitting with dynamic imports
- Image optimization with Next.js
- Component lazy loading
- Mobile-first responsive design

### Backend Performance
- Database query optimization
- API response caching
- Background job processing
- Connection pooling

### Testing Performance
- Test parallelization
- Efficient test data setup
- Mock external services
- CI optimization

## Troubleshooting

### Common Issues
**Build failures:**
- Check TypeScript errors: `npm run typecheck`
- Verify imports and exports
- Check environment variables

**Database issues:**
- Verify Supabase connection
- Check RLS policies
- Reset local database

**Test failures:**
- Check test environment setup
- Verify mock implementations
- Update test data

### Getting Help
- **Documentation:** `/docs` directory
- **Component examples:** Storybook
- **API examples:** Postman collection
- **Database schema:** Migration files

## Intent Engine Workflow States

### State Machine Overview
The Intent Engine follows a linear progression through well-defined states:

```
step_1_icp → step_2_competitors → step_3_seeds → step_4_longtails → 
step_5_filtering → step_6_clustering → step_7_validation → 
step_8_approval → step_9_articles
```

### State Transitions

**Step 7: Subtopic Generation**
- **Entry:** `step_6_clustering` completed
- **Process:** Generate subtopics for longtail keywords
- **Exit:** `step_7_subtopics` (ready for human approval)

**Step 8: Human Approval (NEW)**
- **Entry:** `step_7_subtopics` with approved keywords
- **Process:** Final human review and approval
- **Approved Exit:** `step_9_articles` (article generation eligible)
- **Rejected Exit:** `step_{reset_to_step}` (return to correction phase)

**Step 9: Article Generation**
- **Entry:** `step_8_approval` completed successfully
- **Process:** Generate articles from approved keywords
- **Terminal:** Final state

### Approval Gates

**Seed Keyword Approval (Story 35.3)**
- Location: `/api/intent/workflows/{workflow_id}/steps/approve-seeds`
- State: `step_3_seeds`
- Scope: Seed keywords only
- Effect: Enables long-tail expansion

**Human Approval (Story 37.3)**
- Location: `/api/intent/workflows/{workflow_id}/steps/human-approval`
- State: `step_7_subtopics`
- Scope: Entire workflow
- Effect: Final gate before article generation

### Implementation Patterns

**Service Layer Pattern**
```typescript
// lib/services/intent-engine/{feature}-processor.ts
export async function process{Feature}(
  workflowId: string,
  request: {Feature}Request,
  headers?: Headers
): Promise<{Feature}Response>
```

**API Layer Pattern**
```typescript
// app/api/intent/workflows/[workflow_id]/steps/{feature}/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflow_id: string }> }
) {
  // Validation → Service → Error handling
}
```

**Audit Logging Pattern**
```typescript
logActionAsync({
  orgId: currentUser.org_id,
  userId: currentUser.id,
  action: AuditAction.WORKFLOW_{FEATURE}_{ACTION},
  details: { workflow_id, ... },
  ipAddress: extractIpAddress(headers),
  userAgent: extractUserAgent(headers),
})
```

### Database Schema Patterns

**Workflows Table**
- `status`: Current workflow state
- `organization_id`: Multi-tenant isolation
- Updated via state transitions only

**Approvals Table**
- `workflow_id + approval_type`: Unique constraint
- `decision`: 'approved' | 'rejected'
- `approver_id`: User who made decision
- `feedback`: Optional notes

## Contributing

### Code Style
- Use TypeScript strict mode
- Follow ESLint rules
- Format with Prettier
- Write descriptive commit messages

### Testing Requirements
- Unit tests for all functions
- Integration tests for API endpoints
- E2E tests for user flows
- Accessibility tests for UI components

### Documentation
- Update API documentation
- Add component documentation
- Document database changes
- Update README files
