# Infin8Content Quick Reference Guide

**Version:** v2.1  
**Updated:** 2026-02-09

## Essential Links

### 🚀 Quick Start
- [Development Guide](DEVELOPMENT_GUIDE.md) - Setup and first steps
- [Project Index](PROJECT_INDEX.md) - Complete documentation overview
- [API Reference](api/API_REFERENCE.md) - All endpoints

### 🏗️ Architecture
- [Architecture Overview](architecture/ARCHITECTURE_OVERVIEW.md) - System design
- [Database Schema](database/DATABASE_SCHEMA.md) - Data model
- [Workflow Guide](workflows/WORKFLOW_GUIDE.md) - Intent Engine

## Workflow States (v2.1)

```
step_0_auth (5%) → step_1_icp (15%) → step_2_competitors (25%) → 
step_3_keywords (35%) → step_4_longtails (45%) → step_5_filtering (55%) → 
step_6_clustering (65%) → step_7_validation (75%) → step_8_subtopics (85%) → 
step_9_articles (95%) → completed (100%)
```

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/login` - User login

### Intent Engine
- `GET /api/intent/workflows` - List workflows
- `POST /api/intent/workflows` - Create workflow
- `GET /api/intent/workflows/[id]/articles/progress` - Track progress

### Articles
- `POST /api/articles/generate` - Generate article
- `POST /api/articles/publish` - Publish to WordPress
- `GET /api/articles/[id]/status` - Get status

## Database Tables

### Core Tables
- `organizations` - Multi-tenant orgs
- `intent_workflows` - Workflow orchestration
- `keywords` - Keyword hierarchy
- `articles` - Generated content
- `topic_clusters` - Hub-and-spoke clusters

### New Tables (v2.1)
- `publish_references` - Idempotent publishing
- `article_sections` - Section-level tracking

## Development Commands

### Setup
```bash
cd infin8content
npm install
cp .env.example .env.local
npx supabase db push
npm run dev
```

### Testing
```bash
npm test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e     # E2E tests
```

### Database
```bash
npx supabase db push      # Apply migrations
npx supabase db reset      # Reset database
npm run db:seed           # Seed data
```

## Service Patterns

### Service Interface
```typescript
export interface ServiceInterface<Input, Output> {
  execute(input: Input): Promise<Output>;
  validate(input: Input): ValidationResult;
}
```

### API Route Pattern
```typescript
// app/api/example/route.ts
import { getCurrentUser } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const currentUser = await getCurrentUser()
  // ... implementation
}
```

## External Services

### AI Services
- **OpenRouter:** LLM content generation
- **Perplexity:** ICP generation
- **DataForSEO:** Keyword research

### Infrastructure
- **Supabase:** Database & Auth
- **Inngest:** Workflow orchestration
- **Stripe:** Payment processing
- **WordPress:** Publishing platform

## Common Tasks

### Create New Workflow
```typescript
POST /api/intent/workflows
{
  "name": "My Content Workflow",
  "description": "Workflow description"
}
```

### Generate Article
```typescript
POST /api/articles/generate
{
  "keyword_id": "uuid",
  "workflow_id": "uuid"
}
```

### Check Progress
```typescript
GET /api/intent/workflows/[id]/articles/progress
```

## Troubleshooting

### Common Issues
1. **Authentication failures** - Check JWT token in headers
2. **Database connection** - Verify Supabase credentials
3. **Workflow stuck** - Check blocking conditions endpoint
4. **Article generation fails** - Review diagnostics endpoint

### Debug Commands
```bash
# Check database connection
npx supabase status

# View recent migrations
npx supabase db diff

# Check environment
npm run env:check
```

## Security Notes

### Authentication Required
All API endpoints require valid JWT token:
```http
Authorization: Bearer <jwt_token>
```

### Organization Isolation
Data automatically filtered by `organization_id` via RLS policies.

### Audit Logging
All actions logged to `audit_logs` table for compliance.

## Performance Tips

### Database Queries
- Use indexed columns for filtering
- Limit result sets with pagination
- Consider read replicas for heavy queries

### API Calls
- Implement retry logic for external services
- Cache frequently accessed data
- Use streaming for large responses

## Support

### Documentation
- Complete docs: [Project Index](PROJECT_INDEX.md)
- API reference: [API Reference](api/API_REFERENCE.md)
- Development: [Development Guide](DEVELOPMENT_GUIDE.md)

### Issues & Questions
- GitHub Issues: Report bugs and request features
- Documentation Issues: Report documentation problems
- Community: Join developer discussions

---

**Quick Reference Version:** v2.1  
**Last Updated:** 2026-02-09  
**Platform Version:** Infin8Content v2.1
