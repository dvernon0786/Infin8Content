# Infin8Content Deployment Guide

## Overview

This guide covers the deployment process, infrastructure setup, and operational procedures for the Infin8Content platform across different environments.

## Architecture Overview

### Production Stack
- **Frontend**: Vercel (Next.js 14)
- **Backend**: Vercel Edge Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Monitoring**: Sentry
- **Background Jobs**: Inngest

### Environment Tiers
- **Development**: Local development with hot reload
- **Staging**: Production-like environment for testing
- **Production**: Live environment with full monitoring

## Prerequisites

### Required Accounts
- **Vercel**: For frontend and API deployment
- **Supabase**: For database and auth services
- **Sentry**: For error monitoring
- **Inngest**: For background job processing
- **Stripe**: For payment processing

### Domain Configuration
- **Primary Domain**: `your-domain.com`
- **API Domain**: `api.your-domain.com`
- **CDN Domain**: `cdn.your-domain.com`

## Environment Configuration

### Production Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# External Services
OPENROUTER_API_KEY=prod_openrouter_key
TAVILY_API_KEY=prod_tavily_key
DATAFORSEO_API_KEY=prod_dataforseo_key
STRIPE_SECRET_KEY=prod_stripe_key
STRIPE_WEBHOOK_SECRET=prod_webhook_secret

# Application Configuration
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=prod_nextauth_secret

# Monitoring
SENTRY_DSN=prod_sentry_dsn
SENTRY_AUTH_TOKEN=prod_sentry_token

# Feature Flags
ENABLE_INTENT_ENGINE=true
ENABLE_ADVANCED_ANALYTICS=true
ENABLE_BULK_OPERATIONS=true
```

### Staging Environment Variables
```env
# Use staging-specific keys and URLs
NEXT_PUBLIC_SUPABASE_URL=https://your-project-staging.supabase.co
OPENROUTER_API_KEY=staging_openrouter_key
# ... other staging variables

# Feature Flags (more permissive)
ENABLE_INTENT_ENGINE=true
ENABLE_ADVANCED_ANALYTICS=true
ENABLE_BULK_OPERATIONS=true
ENABLE_EXPERIMENTAL_FEATURES=true
```

## Database Setup

### 1. Production Database
```bash
# Create production project
supabase projects create --name "infin8content-prod"

# Apply migrations
supabase db push --db-url "postgresql://user:pass@host:port/db"

# Enable required extensions
supabase db push --file supabase/extensions.sql
```

### 2. Database Configuration
```sql
-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Configure connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
```

### 3. Backup Configuration
```bash
# Configure daily backups
supabase db backup --schedule "0 2 * * *" --retention 30

# Set up point-in-time recovery
supabase db backup --enable-pitr
```

## Frontend Deployment

### 1. Vercel Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2. Build Configuration
```json
// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY
  }
}

module.exports = nextConfig
```

### 3. Deployment Process
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel --preview

# Deploy to production
vercel --prod
```

## API Deployment

### 1. Edge Function Configuration
```typescript
// app/api/health/route.ts
export const runtime = 'edge'

export async function GET() {
  return new Response('OK', {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
}
```

### 2. API Rate Limiting
```typescript
// lib/utils/rate-limit.ts
export async function rateLimit(
  identifier: string,
  limit: number = 100,
  window: number = 3600000 // 1 hour
) {
  const key = `rate-limit:${identifier}`
  const current = await redis.get(key)
  
  if (current && parseInt(current) >= limit) {
    throw new RateLimitError('Rate limit exceeded')
  }
  
  await redis.incr(key)
  await redis.expire(key, window / 1000)
}
```

### 3. API Monitoring
```typescript
// lib/utils/monitoring.ts
import * as Sentry from '@sentry/nextjs'

export function withMonitoring(
  handler: Function,
  name: string
) {
  return async (...args: any[]) => {
    const span = Sentry.startSpan({
      op: 'api',
      name: name
    }, async () => {
      try {
        return await handler(...args)
      } catch (error) {
        Sentry.captureException(error)
        throw error
      }
    })
    
    return span
  }
}
```

## Background Jobs Deployment

### 1. Inngest Configuration
```typescript
// lib/inngest/client.ts
import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'infin8content',
  retryFunction: ({ attempt, error }) => {
    if (attempt < 3) return { delay: Math.pow(2, attempt) * 1000 }
    return 'cancel'
  }
})
```

### 2. Job Functions
```typescript
// lib/inngest/functions/article-generation.ts
export const generateArticle = inngest.createFunction(
  { id: 'generate-article' },
  { event: 'article/generate.requested' },
  async ({ event, step }) => {
    const article = await step.run('generate-content', async () => {
      return await generateArticleContent(event.data.keywordId)
    })
    
    await step.run('update-status', async () => {
      return await updateArticleStatus(article.id, 'completed')
    })
    
    return article
  }
)
```

### 3. Job Monitoring
```typescript
// lib/inngest/middleware.ts
export const inngestMiddleware = inngest.createFunction(
  { id: 'job-monitoring' },
  { event: 'inngest/function.started' },
  async ({ event, step }) => {
    await logJobStart(event.data.function_id, event.data.run_id)
  }
)
```

## Security Configuration

### 1. SSL/TLS Setup
```bash
# Configure SSL certificates
vercel certs add your-domain.com /path/to/cert.pem /path/to/key.pem

# Enable HTTPS redirects
vercel alias prod-infin8content.vercel.app your-domain.com
```

### 2. CORS Configuration
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  response.headers.set('Access-Control-Allow-Origin', 'https://your-domain.com')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}
```

### 3. Security Headers
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ]
  }
}
```

## Monitoring and Observability

### 1. Sentry Configuration
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out sensitive data
    if (event.exception) {
      const error = event.exception.values?.[0]
      if (error?.value?.includes('password')) {
        return null
      }
    }
    return event
  }
})
```

### 2. Performance Monitoring
```typescript
// lib/utils/performance.ts
export function trackPerformance(
  name: string,
  operation: () => Promise<any>
) {
  return async (...args: any[]) => {
    const start = performance.now()
    
    try {
      const result = await operation(...args)
      const duration = performance.now() - start
      
      Sentry.addBreadcrumb({
        message: `${name} completed`,
        data: { duration },
        level: 'info'
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      
      Sentry.addBreadcrumb({
        message: `${name} failed`,
        data: { duration, error: error.message },
        level: 'error'
      })
      
      throw error
    }
  }
}
```

### 3. Health Checks
```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkExternalServices(),
    checkBackgroundJobs()
  ])
  
  const status = checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'degraded'
  
  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    checks: {
      database: checks[0].status === 'fulfilled',
      external_services: checks[1].status === 'fulfilled',
      background_jobs: checks[2].status === 'fulfilled'
    }
  })
}
```

## Scaling and Performance

### 1. Database Scaling
```sql
-- Read replica configuration
CREATE USER replica_user WITH REPLICATION;
ALTER USER replica_user WITH PASSWORD 'secure_password';

-- Connection pooling configuration
ALTER SYSTEM SET max_connections = 500;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
```

### 2. Caching Strategy
```typescript
// lib/cache/redis.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function cacheGet(key: string) {
  const value = await redis.get(key)
  return value ? JSON.parse(value) : null
}

export async function cacheSet(key: string, value: any, ttl: number = 3600) {
  await redis.setex(key, ttl, JSON.stringify(value))
}
```

### 3. CDN Configuration
```typescript
// next.config.ts
module.exports = {
  images: {
    domains: ['your-cdn-domain.com'],
    loader: 'custom',
    loaderFile: './lib/image-loader.js'
  },
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.your-domain.com' 
    : undefined
}
```

## Backup and Disaster Recovery

### 1. Database Backups
```bash
# Automated daily backups
supabase db backup --schedule "0 2 * * *" --retention 30

# Point-in-time recovery
supabase db backup --enable-pitr --retention 7

# Manual backup
supabase db backup --file backup-$(date +%Y%m%d).sql
```

### 2. Application Backups
```bash
# Backup environment variables
vercel env pull .env.backup

# Backup static assets
aws s3 sync s3://your-bucket ./backup/assets

# Backup configuration files
git archive HEAD --format=zip --output=backup-$(date +%Y%m%d).zip
```

### 3. Recovery Procedures
```bash
# Database recovery
supabase db restore --file backup-20260201.sql

# Application recovery
vercel rollback --to <deployment-url>

# Full environment recovery
supabase projects restore --backup-id <backup-id>
```

## Maintenance Procedures

### 1. Regular Maintenance
```bash
# Weekly database maintenance
supabase db vacuum --analyze

# Monthly security updates
npm audit fix
supabase db update

# Quarterly performance review
# Review metrics and optimize queries
```

### 2. Update Procedures
```bash
# Dependency updates
npm update
npm audit

# Database schema updates
supabase db push

# Application deployment
npm run build
vercel --prod
```

### 3. Monitoring Alerts
```yaml
# alerts.yml
alerts:
  - name: high_error_rate
    condition: error_rate > 0.05
    action: notify_team
    
  - name: slow_database_queries
    condition: avg_query_time > 1000ms
    action: investigate_performance
    
  - name: external_service_failure
    condition: service_availability < 0.99
    action: check_service_status
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database status
supabase status

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Reset connection pool
supabase db restart
```

#### API Performance Issues
```bash
# Check Vercel logs
vercel logs prod

# Monitor response times
curl -w "@curl-format.txt" https://api.your-domain.com/health

# Analyze database queries
supabase db query --analyze
```

#### External Service Failures
```bash
# Test service connectivity
curl -X POST https://openrouter.ai/api/v1/chat/completions

# Check API key validity
echo $OPENROUTER_API_KEY | cut -c1-8

# Monitor rate limits
curl -I https://api.tavily.com/search
```

### Debugging Tools
- **Vercel Logs**: Application and function logs
- **Supabase Dashboard**: Database and auth logs
- **Sentry Dashboard**: Error tracking and performance
- **Inngest Dashboard**: Background job monitoring

## Security Best Practices

### 1. Secret Management
```bash
# Use environment variables, not hardcoded secrets
# Rotate keys regularly
# Use different keys per environment
# Audit key usage
```

### 2. Access Control
```bash
# Principle of least privilege
# Regular access reviews
# Multi-factor authentication
# Audit logging
```

### 3. Data Protection
```bash
# Encrypt sensitive data at rest
# Use HTTPS for all communications
# Implement data retention policies
# Regular security audits
```

## Compliance and Governance

### 1. Data Privacy
- GDPR compliance for EU users
- CCPA compliance for California users
- Data export and deletion capabilities
- Privacy policy and consent management

### 2. Audit Requirements
- Complete audit trail for all operations
- Immutable logs for compliance
- Regular security assessments
- Documentation of all changes

### 3. Service Level Agreements
- 99.9% uptime guarantee
- Response time SLAs
- Support availability
- Incident response procedures

## Resources

### Documentation
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Supabase Production Guide](https://supabase.com/docs/guides/platform/going-into-prod)
- [Sentry Monitoring Guide](https://docs.sentry.io)
- [Inngest Background Jobs](https://inngest.com/docs)

### Tools
- **Database Management**: Supabase Dashboard, pgAdmin
- **Monitoring**: Sentry, Vercel Analytics
- **Performance**: Lighthouse, WebPageTest
- **Security**: OWASP ZAP, SSL Labs

### Support
- **Infrastructure**: Vercel Support, Supabase Support
- **Application**: GitHub Issues, Discord Community
- **Emergency**: On-call rotation, incident response
