# API Contracts - Infin8Content

## Overview
Infin8Content uses Next.js 16.1.1 API routes with TypeScript, providing RESTful endpoints for article generation, user authentication, payment processing, and team management.

## Base URL
```
/api/
```

## Authentication
- **Method**: Supabase Auth with JWT tokens
- **Header**: `Authorization: Bearer <token>`
- **Validation**: Middleware-based authentication checks

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Login user with email and password
```typescript
Request: {
  email: string;
  password: string;
}
Response: {
  success: true;
  user: { id: string; email: string; role: string };
  redirectTo: '/dashboard' | '/payment' | '/create-organization';
}
```

#### POST /api/auth/register
Register new user with email and password
```typescript
Request: {
  email: string;
  password: string;
}
Response: {
  success: true;
  user: { id: string; email: string };
  redirectTo: '/auth';
}
```

#### POST /api/auth/verify-otp
Verify OTP code for authentication
```typescript
Request: {
  email: string;
  code: string;
}
Response: {
  success: boolean;
  message: string;
}
```

#### POST /api/auth/resend-otp
Resend OTP code to user email
```typescript
Request: {
  email: string;
}
Response: {
  success: boolean;
  message: string;
}
```

#### POST /api/auth/logout
Logout user and invalidate session
```typescript
Request: {}
Response: {
  success: boolean;
  message: string;
}
```

### Article Management Endpoints

#### POST /api/articles/generate
Generate new article with AI
```typescript
Request: {
  keyword: string;
  targetWordCount: number;
  writingStyle?: 'Professional' | 'Conversational' | 'Technical' | 'Casual' | 'Formal';
  targetAudience?: 'General' | 'B2B' | 'B2C' | 'Technical' | 'Consumer';
  customInstructions?: string;
}
Response: {
  success: boolean;
  articleId?: string;
  message?: string;
}
```

#### GET /api/articles/[id]/status
Get generation status for specific article
```typescript
Response: {
  id: string;
  status: 'queued' | 'generating' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}
```

#### POST /api/articles/[id]/publish
Publish article to external CMS (WordPress)
```typescript
Request: {
  cmsType: 'wordpress';
  cmsCredentials: CMSConnectionDetails;
}
Response: {
  success: boolean;
  publishedUrl?: string;
  externalId?: string;
  error?: string;
}
```

#### GET /api/articles/queue
Get all articles in generation queue
```typescript
Response: {
  articles: Article[];
  total: number;
}
```

#### POST /api/articles/bulk
Bulk operations on multiple articles
```typescript
Request: {
  action: 'delete' | 'publish' | 'regenerate';
  articleIds: string[];
}
Response: {
  success: boolean;
  processed: number;
  failed: number;
}
```

### Organization Management Endpoints

#### GET /api/organizations
Get user's organizations
```typescript
Response: {
  organizations: Organization[];
  current: Organization;
}
```

#### POST /api/organizations
Create new organization
```typescript
Request: {
  name: string;
  plan: 'starter' | 'pro' | 'agency';
}
Response: {
  success: boolean;
  organization: Organization;
}
```

#### PUT /api/organizations/[id]
Update organization details
```typescript
Request: {
  name?: string;
  settings?: OrganizationSettings;
}
Response: {
  success: boolean;
  organization: Organization;
}
```

### Payment Endpoints

#### POST /api/payment/create-checkout
Create Stripe checkout session
```typescript
Request: {
  planId: string;
  successUrl: string;
  cancelUrl: string;
}
Response: {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
}
```

#### POST /api/payment/webhooks
Handle Stripe webhook events
```typescript
Headers: {
  'stripe-signature': string;
}
Request: StripeWebhookEvent
Response: {
  received: boolean;
}
```

### Team Management Endpoints

#### GET /api/team/members
Get organization team members
```typescript
Response: {
  members: TeamMember[];
  total: number;
}
```

#### POST /api/team/invite
Invite new team member
```typescript
Request: {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}
Response: {
  success: boolean;
  inviteId: string;
}
```

#### PUT /api/team/members/[id]/role
Update team member role
```typescript
Request: {
  role: 'admin' | 'member' | 'viewer';
}
Response: {
  success: boolean;
  member: TeamMember;
}
```

### Analytics Endpoints

#### GET /api/analytics/dashboard
Get dashboard analytics data
```typescript
Response: {
  articles: {
    total: number;
    published: number;
    inProgress: number;
  };
  usage: {
    current: number;
    limit: number;
    period: string;
  };
  performance: {
    avgGenerationTime: number;
    successRate: number;
  };
}
```

#### GET /api/analytics/usage
Get usage statistics
```typescript
Response: {
  usage: UsageStats[];
  billing: BillingInfo;
}
```

### Research Endpoints

#### POST /api/research/keyword
Perform keyword research
```typescript
Request: {
  keyword: string;
  location?: string;
  language?: string;
}
Response: {
  success: boolean;
  data: KeywordResearchData;
}
```

#### GET /api/research/suggestions
Get keyword suggestions
```typescript
Request: {
  seedKeyword: string;
  limit?: number;
}
Response: {
  suggestions: KeywordSuggestion[];
}
```

### SEO Endpoints

#### GET /api/seo/metrics
Get SEO metrics for articles
```typescript
Response: {
  metrics: SEOMetrics[];
  summary: SEOSummary;
}
```

#### POST /api/seo/optimize
Get SEO optimization suggestions
```typescript
Request: {
  articleId: string;
  targetKeywords: string[];
}
Response: {
  suggestions: SEOSuggestion[];
  score: number;
}
```

### Admin Endpoints

#### GET /api/admin/system
Get system health and metrics
```typescript
Response: {
  system: SystemHealth;
  metrics: SystemMetrics;
}
```

#### POST /api/admin/maintenance
Perform maintenance operations
```typescript
Request: {
  operation: 'cleanup' | 'backup' | 'optimize';
}
Response: {
  success: boolean;
  result: MaintenanceResult;
}
```

## Error Handling

All endpoints return consistent error responses:
```typescript
{
  error: string;
  details?: any;
  code?: string;
}
```

Common error codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **Article generation**: Based on plan limits
- **Research endpoints**: 100 requests per hour
- **General endpoints**: 1000 requests per hour

## Data Validation

All requests are validated using Zod schemas with:
- Type checking
- Length limits
- Format validation
- Sanitization for security

## Security Features

- **CSRF Protection**: Built-in Next.js middleware
- **Input Sanitization**: All user inputs sanitized
- **SQL Injection Prevention**: Supabase RLS policies
- **Rate Limiting**: Endpoint-specific limits
- **Audit Logging**: All actions logged for compliance

## WebSocket Support

Real-time updates available via:
- **Article generation progress**: `/api/articles/[id]/status` with polling
- **Team collaboration**: Real-time updates via WebSocket connections
- **Dashboard metrics**: Live data updates

## Testing

API endpoints covered by:
- **Unit tests**: Vitest for individual functions
- **Integration tests**: Full endpoint testing
- **E2E tests**: Playwright for user flows

## Versioning

Current API version: **v1**
- Version specified in URL: `/api/v1/...`
- Backward compatibility maintained
- Deprecation notices sent for breaking changes
