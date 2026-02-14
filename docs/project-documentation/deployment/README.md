# Deployment Guide

## Overview

This guide covers deploying Infin8Content to production environments, including infrastructure setup, configuration management, and operational procedures.

## Architecture Overview

### Deployment Targets
- **Production**: Live production environment
- **Staging**: Pre-production testing environment
- **Development**: Local development setup

### Infrastructure Components
- **Application**: Next.js on Vercel
- **Database**: Supabase PostgreSQL
- **Background Jobs**: Inngest
- **Monitoring**: Sentry
- **CDN**: Vercel Edge Network

## Prerequisites

### Required Accounts
- Vercel account (for hosting)
- Supabase project (for database)
- Inngest account (for background jobs)
- Sentry account (for monitoring)
- OpenRouter API key (for AI services)
- DataForSEO account (for SEO data)
- Tavily API key (for research)
- Stripe account (for payments)

### Development Environment
```bash
# Node.js 18+ required
node --version  # v18.0.0+

# Required tools
npm --version  # 9.0.0+
git --version  # 2.30.0+
```

## Environment Configuration

### Environment Variables

#### Application Configuration
```bash
# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# AI Services
OPENROUTER_API_KEY=your-openrouter-key
DATAFORSEO_USERNAME=your-dataforseo-username
DATAFORSEO_PASSWORD=your-dataforseo-password
TAVILY_API_KEY=your-tavily-key
PERPLEXITY_API_KEY=your-perplexity-key

# Payment Processing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-token

# Inngest
INNGEST_EVENT_KEY=your-inngest-key
INNGEST_SIGNING_KEY=your-signing-key

# Feature Flags
ENABLE_INTENT_ENGINE=true
ENABLE_ADVANCED_ANALYTICS=true
ENABLE_BETA_FEATURES=false
```

#### Database Configuration
```bash
# Supabase Database
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
SUPABASE_DB_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# Connection Pooling
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000
```

### Configuration Files

#### Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_APP_URL": "@app-url",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "framework": "nextjs"
}
```

#### Next.js Configuration (`next.config.js`)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      }
    ]
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      }
    }
    return config
  }
}

module.exports = nextConfig
```

## Database Setup

### Supabase Project Creation

1. **Create Supabase Project**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Create new project
   supabase projects create
   ```

2. **Configure Database**
   ```bash
   # Link to local project
   supabase link --project-ref your-project-ref
   
   # Apply migrations
   supabase db push
   
   # Generate types
   supabase gen types typescript --local > types/supabase.ts
   ```

3. **Set Up RLS Policies**
   ```sql
   -- Enable RLS
   ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   -- ... enable for all tables
   
   -- Create organization isolation policy
   CREATE POLICY "Users can view own organization data" 
   ON organizations FOR SELECT 
   USING (id = auth.jwt() ->> 'organization_id');
   ```

### Database Migration Process

```bash
# Create new migration
supabase migration new add_new_feature

# Apply migrations
supabase db push

# Reset database (development only)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

## Application Deployment

### Vercel Deployment

#### 1. Connect Repository
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

#### 2. Configure Environment Variables
```bash
# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENROUTER_API_KEY
# ... add all required variables
```

#### 3. Deploy Application
```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# List deployments
vercel ls
```

#### 4. Custom Domain Setup
```bash
# Add custom domain
vercel domains add your-domain.com

# Verify domain
vercel domains verify your-domain.com
```

### Build Process

#### Production Build
```bash
# Install dependencies
npm ci --only=production

# Build application
npm run build

# Start production server
npm run start
```

#### Build Optimization
```javascript
// next.config.js optimizations
const nextConfig = {
  // Optimize images
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif']
  },
  
  // Optimize bundles
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
    return config
  },
  
  // Enable compression
  compress: true,
  
  // Optimize fonts
  optimizeFonts: true
}
```

## Background Jobs Setup

### Inngest Configuration

#### 1. Create Inngest App
```typescript
// lib/inngest/client.ts
import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'infin8content',
  name: 'Infin8Content',
  baseUrl: process.env.INNGEST_EVENT_KEY 
    ? 'https://api.inngest.com' 
    : 'http://localhost:8288'
})
```

#### 2. Deploy Inngest Functions
```bash
# Install Inngest CLI
npm install -g inngest-cli

# Deploy functions
inngest deploy

# Check function status
inngest functions list
```

#### 3. Background Job Examples
```typescript
// lib/inngest/functions/generate-article.ts
export const generateArticle = inngest.createFunction(
  { id: 'generate-article' },
  { event: 'article/generate.requested' },
  async ({ event, step }) => {
    const { articleId } = event.data

    // Step 1: Load article data
    const article = await step.run('load-article', async () => {
      return await loadArticle(articleId)
    })

    // Step 2: Generate content
    const content = await step.run('generate-content', async () => {
      return await generateContent(article)
    })

    // Step 3: Store result
    await step.run('store-result', async () => {
      return await storeArticle(articleId, content)
    })

    return { success: true, articleId }
  }
)
```

## Monitoring & Observability

### Sentry Setup

#### 1. Configure Sentry
```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
})
```

#### 2. Error Tracking
```typescript
// Error boundary component
'use client'
import * as Sentry from '@sentry/nextjs'

export default function ErrorBoundary({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      {children}
    </Sentry.ErrorBoundary>
  )
}
```

#### 3. Performance Monitoring
```typescript
// Performance tracking
import * as Sentry from '@sentry/nextjs'

export function trackPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message: operation,
    category: 'performance',
    level: 'info',
    data: {
      duration,
      ...metadata
    }
  })
  
  Sentry.metrics.timing(operation, duration, metadata)
}
```

### Health Checks

#### Application Health
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Check database connectivity
    const { error } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .limit(1)
    
    if (error) {
      throw new Error('Database connection failed')
    }

    // Check external services
    const services = await checkExternalServices()

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}
```

#### Database Health
```sql
-- Database health check function
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'status', 'healthy',
    'timestamp', NOW(),
    'connections', (
      SELECT count(*) 
      FROM pg_stat_activity 
      WHERE state = 'active'
    ),
    'database_size', pg_size_pretty(pg_database_size(current_database()))
  ) INTO result;
  
  RETURN result;
END;
$$;
```

## Security Configuration

### SSL/TLS Setup
```bash
# Verify SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check certificate details
openssl x509 -in certificate.crt -text -noout
```

### Security Headers
```typescript
// lib/middleware/security.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // CSP header
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:"
  )
  
  return response
}
```

### API Rate Limiting
```typescript
// lib/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit'
import { NextRequest, NextResponse } from 'next/server'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})

export function rateLimitMiddleware(request: NextRequest) {
  // Implementation for Next.js middleware
  const ip = request.ip || request.headers.get('x-forwarded-for')
  // ... rate limiting logic
}
```

## Performance Optimization

### Caching Strategy

#### Application Caching
```typescript
// lib/cache/memory-cache.ts
class MemoryCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize = 100
  private ttl = 300000 // 5 minutes

  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.value
  }
}

interface CacheEntry {
  value: any
  timestamp: number
}
```

#### Database Caching
```sql
-- Materialized view for frequently accessed data
CREATE MATERIALIZED VIEW workflow_summary AS
SELECT 
  w.id,
  w.name,
  w.state,
  COUNT(k.id) as keyword_count,
  COUNT(a.id) as article_count,
  w.created_at
FROM intent_workflows w
LEFT JOIN keywords k ON w.id = k.workflow_id
LEFT JOIN articles a ON w.id = a.workflow_id
GROUP BY w.id, w.name, w.state, w.created_at;

-- Refresh materialized view
CREATE OR REPLACE FUNCTION refresh_workflow_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY workflow_summary;
END;
$$ LANGUAGE plpgsql;
```

### Bundle Optimization

#### Code Splitting
```typescript
// Dynamic imports for code splitting
const WorkflowDashboard = dynamic(() => 
  import('@/components/dashboard/WorkflowDashboard'),
  { 
    loading: () => <div>Loading dashboard...</div>,
    ssr: false 
  }
)

const ArticleEditor = dynamic(() => 
  import('@/components/editor/ArticleEditor'),
  { 
    loading: () => <div>Loading editor...</div>,
    ssr: false 
  }
)
```

#### Image Optimization
```typescript
// next.config.js image optimization
const nextConfig = {
  images: {
    domains: ['your-domain.com', 'cdn.example.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  }
}
```

## CI/CD Pipeline

### GitHub Actions Workflow

#### `.github/workflows/ci.yml`
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:run
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Deployment Scripts

#### `scripts/deploy.sh`
```bash
#!/bin/bash

set -e

echo "Starting deployment process..."

# Check environment
if [ "$NODE_ENV" != "production" ]; then
  echo "Error: NODE_ENV must be set to production"
  exit 1
fi

# Run tests
echo "Running tests..."
npm run test:run

# Build application
echo "Building application..."
npm run build

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

# Run database migrations
echo "Running database migrations..."
supabase db push

# Verify deployment
echo "Verifying deployment..."
curl -f https://your-domain.com/api/health || {
  echo "Error: Health check failed"
  exit 1
}

echo "Deployment completed successfully!"
```

## Backup & Recovery

### Database Backup Strategy

#### Automated Backups
```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

BACKUP_DIR="/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/infin8content_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to cloud storage (AWS S3 example)
aws s3 cp $BACKUP_FILE.gz s3://your-backup-bucket/database/

# Clean up old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

#### Restore Procedure
```bash
#!/bin/bash
# scripts/restore-database.sh

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

echo "Restoring database from: $BACKUP_FILE"

# Download backup from cloud storage
aws s3 cp s3://your-backup-bucket/database/$BACKUP_FILE.gz ./

# Decompress backup
gunzip $BACKUP_FILE.gz

# Restore database
psql $DATABASE_URL < $BACKUP_FILE

echo "Database restore completed"
```

### Application Backup

#### Code Backup
```bash
# Git tags for releases
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Archive source code
tar -czf infin8content-v1.0.0.tar.gz --exclude=node_modules --exclude=.git .
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Reset connection pool
supabase db reset
```

#### Build Failures
```bash
# Clear build cache
rm -rf .next
rm -rf node_modules
npm install

# Check TypeScript errors
npm run typecheck

# Check ESLint errors
npm run lint
```

#### Performance Issues
```bash
# Check database queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

# Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;
```

### Debugging Tools

#### Application Debugging
```typescript
// Debug logging
import { logger } from '@/lib/logging'

export function debugLog(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, data)
    logger.debug(message, data)
  }
}
```

#### Database Debugging
```sql
-- Query performance analysis
EXPLAIN ANALYZE SELECT * FROM keywords WHERE organization_id = $1;

-- Index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'keywords';
```

## Maintenance Procedures

### Regular Maintenance

#### Daily Tasks
- Monitor application health
- Check error rates
- Review performance metrics
- Verify backup completion

#### Weekly Tasks
- Update dependencies
- Review security advisories
- Analyze performance trends
- Clean up old logs

#### Monthly Tasks
- Database maintenance
- Security audit
- Performance optimization
- Capacity planning

### Update Procedures

#### Application Updates
```bash
# Update dependencies
npm update

# Test updates
npm run test

# Deploy updates
npm run deploy

# Verify deployment
curl -f https://your-domain.com/api/health
```

#### Database Updates
```bash
# Create migration
supabase migration new update_feature

# Test migration locally
supabase db reset
supabase db push

# Deploy to staging
supabase db push --remote staging

# Deploy to production
supabase db push --remote production
```

## Security Best Practices

### Regular Security Tasks

#### Dependency Scanning
```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

#### Security Monitoring
```typescript
// Security event logging
export function logSecurityEvent(
  event: string,
  details: Record<string, any>
) {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent
  })
  
  // Send to Sentry
  Sentry.captureMessage(event, {
    level: 'warning',
    extra: details
  })
}
```

#### Access Control
```sql
-- Review user permissions
SELECT 
  u.email,
  u.role,
  o.name as organization,
  u.last_login
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.last_login < NOW() - INTERVAL '90 days';
```

## Scaling Considerations

### Horizontal Scaling

#### Application Scaling
- Load balancer configuration
- Multiple application instances
- Session state management
- Database connection pooling

#### Database Scaling
- Read replicas for analytics
- Connection pool optimization
- Query performance tuning
- Index optimization

### Performance Monitoring

#### Key Metrics
- Response time percentiles
- Error rates by endpoint
- Database query performance
- Resource utilization

#### Alerting
```typescript
// Performance alerts
export function checkPerformanceThresholds() {
  const metrics = getPerformanceMetrics()
  
  if (metrics.avgResponseTime > 1000) {
    alert('High response time detected')
  }
  
  if (metrics.errorRate > 0.05) {
    alert('High error rate detected')
  }
  
  if (metrics.databaseConnections > 80) {
    alert('High database connection usage')
  }
}
```

This deployment guide provides comprehensive procedures for deploying, maintaining, and troubleshooting Infin8Content in production environments.
