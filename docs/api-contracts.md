# API Contracts - Infin8Content

Generated: 2026-01-23 (Deep Scan Update)  
Framework: Next.js 16.1.1 API Routes  
Base URL: `/api`

## Overview

Infin8Content implements a comprehensive REST API using Next.js App Router with TypeScript, featuring multi-tenant architecture, authentication, payment processing, and AI content generation capabilities.

## Authentication

All API endpoints require authentication via Supabase Auth sessions. Authentication is handled through middleware and user context validation.

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Registers new user with OTP verification via Brevo email service.

**Request Body:**
```typescript
{
  email: string;
  password: string; // min 8 characters
}
```

**Response:** 201 Created
```typescript
{
  message: "Registration successful. Please check your email for OTP code.";
  userId: string;
}
```

#### POST /api/auth/verify-otp
Verifies OTP code for user registration.

**Request Body:**
```typescript
{
  email: string;
  code: string; // 6-digit OTP
}
```

#### POST /api/auth/login
Authenticates user and creates session.

#### POST /api/auth/logout
Terminates user session.

### Articles Endpoints

#### POST /api/articles/generate
Creates new article and queues it for AI generation (Story 4a implementation).

**Authentication:** Required (401 if not authenticated)  
**Usage Limits:** Enforced per plan (Starter: 10, Pro: 50, Agency: unlimited)

**Request Body:**
```typescript
{
  keyword: string; // min 1, max 200 characters
  targetWordCount: number; // min 500, max 10000
  writingStyle?: 'Professional' | 'Conversational' | 'Technical' | 'Casual' | 'Formal';
  targetAudience?: 'General' | 'B2B' | 'B2C' | 'Technical' | 'Consumer';
  customInstructions?: string; // max 2000 characters
}
```

**Response:** 200 OK
```typescript
{
  id: string;
  keyword: string;
  status: 'queued';
  createdAt: string;
  estimatedCompletionTime: string;
}
```

**Error Responses:**
- 401 Unauthorized: Authentication required
- 403 Forbidden: Usage limit exceeded
```typescript
{
  error: "You've reached your article limit for this month";
  details: {
    code: 'USAGE_LIMIT_EXCEEDED';
    usageLimitExceeded: true;
    currentUsage: number;
    limit: number | null;
  };
}
```

**Features:**
- Multi-tenant article creation with organization isolation
- Usage tracking with monthly billing periods
- Activity logging for audit trail
- Automatic queuing via Inngest for AI generation
- Plan-based usage limits enforcement

#### POST /api/articles/publish
Publishes article to WordPress (Story 5-1 implementation).

**Request Body:**
```typescript
{
  articleId: string;
}
```

**Response:** 200 OK
```typescript
{
  success: boolean;
  wordpressPostId?: string;
  wordpressUrl?: string;
  publishedAt: string;
}
```

**Features:**
- Idempotent publishing via publish_references table
- WordPress Application Password authentication
- Synchronous execution with 30s timeout
- Error handling for API failures

### Organizations Endpoints

#### GET /api/organizations
Retrieves user's organizations.

#### POST /api/organizations
Creates new organization.

#### PUT /api/organizations/{id}
Updates organization details.

### Payment Endpoints

#### POST /api/payment/create-checkout-session
Creates Stripe checkout session for subscription.

#### POST /api/payment/webhook
Handles Stripe webhook events.

### Team Management Endpoints

#### GET /api/team/members
Lists organization team members.

#### POST /api/team/invite
Invites new team member.

#### POST /api/team/accept-invitation
Accepts team invitation.

### Analytics Endpoints

#### GET /api/analytics/dashboard
Retrieves dashboard analytics data.

#### GET /api/analytics/performance
Gets performance metrics.

### Research Endpoints

#### POST /api/research/keyword
Performs keyword research using Tavily API.

#### POST /api/research/seo-analysis
Conducts SEO analysis using DataForSEO.

### SEO Endpoints

#### GET /api/seo/metrics
Retrieves SEO metrics for content.

#### POST /api/seo/optimize
Optimizes content for SEO.

## Error Handling

Standard error response format:
```typescript
{
  error: string;
  code?: string;
  details?: any;
}
```

Common HTTP status codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error
- 503: Service Unavailable (feature disabled)

## Rate Limiting

API endpoints implement rate limiting to prevent abuse. Specific limits vary by endpoint type.

## Security Features

- Row Level Security (RLS) on all database operations
- Multi-tenant data isolation via org_id
- OTP verification for registration
- Stripe webhook signature validation
- Input validation using Zod schemas

## Real-time Features

While API endpoints are synchronous, the application uses Supabase real-time subscriptions for:
- Article generation progress
- Dashboard updates
- Team collaboration features

## External API Integrations

- **OpenRouter**: AI content generation
- **Tavily**: Keyword research and analysis
- **DataForSEO**: SEO data services
- **Brevo**: Email notifications and OTP
- **Stripe**: Payment processing
- **WordPress**: Content publishing

## Testing

API endpoints are tested with:
- Unit tests (Vitest)
- Integration tests 
- Contract tests
- Error scenario validation

## Version Information

- API Version: 1.0
- Framework: Next.js 16.1.1
- Language: TypeScript 5
- Database: Supabase (PostgreSQL)
