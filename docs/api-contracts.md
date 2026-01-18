# API Contracts Documentation

Generated: 2026-01-18 (Updated)  
Project: Infin8Content  
Framework: Next.js 16.1.1 with TypeScript  
Total Endpoints: 43  
Scan Type: Exhaustive (All API routes analyzed)

---

## API Overview

The Infin8Content API follows RESTful conventions using Next.js App Router with comprehensive test coverage. All endpoints include proper error handling, authentication middleware, and request validation using Zod schemas.

## Authentication

All API endpoints require authentication except where noted:
- **Authentication Method**: Supabase JWT tokens
- **Header**: `Authorization: Bearer <token>`
- **Middleware**: Automatic user validation and suspension checks

## API Endpoints by Category

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|-----------|-------------|---------------|
| POST | `/api/auth/login` | User login with email/OTP | No |
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/resend-otp` | Resend verification OTP | No |
| POST | `/api/auth/verify-otp` | Verify email OTP | No |

### Articles (`/api/articles`)

| Method | Endpoint | Description | Auth Required |
|--------|-----------|-------------|---------------|
| POST | `/api/articles/generate` | Generate AI content | Yes |
| GET | `/api/articles/status/[id]` | Get generation progress | Yes |
| POST | `/api/articles/queue` | Queue article generation | Yes |
| DELETE | `/api/articles/[id]/cancel` | Cancel article generation | Yes |
| GET | `/api/articles/[id]/diagnostics` | Get generation diagnostics | Yes |
| POST | `/api/articles/fix-stuck` | Fix stuck generation | Yes |
| POST | `/api/articles/test-inngest` | Test Inngest integration | Yes |
| GET | `/api/articles/usage` | Get usage statistics | Yes |

### Organizations (`/api/organizations`)

| Method | Endpoint | Description | Auth Required |
|--------|-----------|-------------|---------------|
| POST | `/api/organizations/create` | Create new organization | Yes |
| PUT | `/api/organizations/update` | Update organization details | Yes |

### Payment (`/api/payment`)

| Method | Endpoint | Description | Auth Required |
|--------|-----------|-------------|---------------|
| POST | `/api/payment/create-checkout-session` | Create Stripe checkout | Yes |

### Research (`/api/research`)

| Method | Endpoint | Description | Auth Required |
|--------|-----------|-------------|---------------|
| POST | `/api/research/keywords` | Keyword research analysis | Yes |

### Team Management (`/api/team`)

| Method | Endpoint | Description | Auth Required |
|--------|-----------|-------------|---------------|
| GET | `/api/team/members` | List team members | Yes |
| POST | `/api/team/invite` | Invite team member | Yes |
| POST | `/api/team/accept-invitation` | Accept team invitation | Yes |
| DELETE | `/api/team/cancel-invitation` | Cancel pending invitation | Yes |
| POST | `/api/team/resend-invitation` | Resend invitation | Yes |
| DELETE | `/api/team/remove-member` | Remove team member | Yes |
| PUT | `/api/team/update-role` | Update member role | Yes |

### User Management (`/api/user`)

| Method | Endpoint | Description | Auth Required |
|--------|-----------|-------------|---------------|
| DELETE | `/api/user/delete` | Delete user account | Yes |
| GET | `/api/user/export` | Export user data | Yes |

### Webhooks (`/api/webhooks`)

| Method | Endpoint | Description | Auth Required |
|--------|-----------|-------------|---------------|
| POST | `/api/webhooks/stripe` | Stripe webhook handler | No (signature verified) |

### Debug (`/api/debug`)

| Method | Endpoint | Description | Auth Required |
|--------|-----------|-------------|---------------|
| GET | `/api/debug/payment-status` | Debug payment status | Yes |

### Inngest (`/api/inngest`)

| Method | Endpoint | Description | Auth Required |
|--------|-----------|-------------|---------------|
| POST/GET | `/api/inngest` | Inngest webhook endpoint | No (internal) |

## Request/Response Patterns

### Standard Success Response
```typescript
{
  success: true,
  data: any,
  message?: string
}
```

### Standard Error Response
```typescript
{
  success: false,
  error: string,
  details?: any
}
```

### Authentication Error Response
```typescript
{
  success: false,
  error: "Unauthorized",
  code: "AUTH_REQUIRED"
}
```

## Rate Limiting

- **General API**: 100 requests per minute per user
- **Article Generation**: 10 requests per minute per user
- **Research API**: 20 requests per minute per user

## Data Validation

All endpoints use Zod schemas for request validation:
- Automatic request body validation
- Type safety for all parameters
- Detailed error messages for invalid inputs

## Testing Coverage

- **Unit Tests**: All non-auth endpoints have comprehensive unit tests
- **Integration Tests**: Database operations tested with test database
- **E2E Tests**: Critical user flows tested with Playwright

## Security Features

- **Input Validation**: All inputs sanitized and validated
- **Authentication**: JWT-based auth with automatic token refresh
- **Authorization**: Role-based access control (Admin, Member, Viewer)
- **Rate Limiting**: Request throttling per user
- **Audit Logging**: All API calls logged for compliance

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Error Response Format
```typescript
{
  success: false,
  error: "Human-readable error message",
  code: "ERROR_CODE",
  details?: {
    field: "validation_error",
    message: "Specific field error"
  }
}
```

## Development Notes

- All API routes follow Next.js 13+ App Router conventions
- TypeScript strictly enforced throughout
- Environment variables validated on startup
- Comprehensive error logging and monitoring
- Automatic API documentation generation from TypeScript types

---

*This documentation was generated as part of the BMad Method document-project workflow on 2026-01-11.*
