# Deployment Guide - Infin8Content

**Version:** v2.1.0 (Zero-Legacy FSM)  
**Last Updated:** 2026-02-17  
**Platform:** Vercel + Supabase  
**Architecture:** Production-Grade Deterministic FSM

---

## 🎯 Overview

This guide covers the complete deployment process for the Infin8Content platform, including environment setup, database migrations, monitoring configuration, and production best practices.

---

## 🏗️ Architecture Overview

### Deployment Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Stack                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend: Vercel (Next.js 16.1.1)                           │
│  ├── Edge Functions: API routes                             │
│  ├── Static Assets: Optimized builds                        │
│  ├── CDN: Global distribution                               │
│  └── Analytics: Built-in monitoring                         │
├─────────────────────────────────────────────────────────────┤
│  Database: Supabase (PostgreSQL 15)                          │
│  ├── Primary DB: Multi-tenant with RLS                      │
│  ├── Pooling: pgbouncer connection management               │
│  ├── Realtime: WebSocket subscriptions                      │
│  └── Storage: File uploads and backups                     │
├─────────────────────────────────────────────────────────────┤
│  External Services                                           │
│  ├── OpenRouter: AI model access                            │
│  ├── DataForSEO: SEO data APIs                             │
│  ├── Tavily: Research API                                  │
│  ├── Brevo: Email service                                  │
│  └── WordPress: Content publishing                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Environment Setup

### Required Environment Variables

#### Database Configuration
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://user:pass@db.supabase.co:5432/postgres
```

#### Authentication
```bash
# Supabase Auth
NEXT_PUBLIC_SUPABASE_AUTH_URL=https://your-project.supabase.co/auth/v1
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

#### External APIs
```bash
# AI Services
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key

# SEO Data Services
DATAFORSEO_LOGIN=your-dataforseo-login
DATAFORSEO_PASSWORD=your-dataforseo-password

# Research API
TAVILY_API_KEY=your-tavily-key

# Email Service
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@your-domain.com
```

#### Application Configuration
```bash
# Application
NODE_ENV=production

# WordPress Publishing
WORDPRESS_PUBLISH_ENABLED=true
WORDPRESS_DEFAULT_SITE_URL=https://your-wordpress-site.com
WORDPRESS_DEFAULT_USERNAME=your-username
WORDPRESS_DEFAULT_APPLICATION_PASSWORD=your-app-password

# Monitoring & Debugging
LOG_LEVEL=info
DEBUG_ENABLED=true
MONITORING_ENABLED=true
SENTRY_DSN=your-sentry-dsn

# Feature Flags
ENABLE_REALTIME_UPDATES=true
ENABLE_AUDIT_LOGGING=true
```

### Environment Setup Script

```bash
#!/bin/bash
# setup-environment.sh

echo "Setting up Infin8Content production environment..."

# Check required variables
check_env() {
  if [ -z "${!1}" ]; then
    echo "❌ Missing required environment variable: $1"
    exit 1
  fi
}

# Core required variables
check_env "NEXT_PUBLIC_SUPABASE_URL"
check_env "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_env "SUPABASE_SERVICE_ROLE_KEY"
check_env "OPENROUTER_API_KEY"

echo "✅ Environment variables validated"

# Set up database connection test
echo "Testing database connection..."
psql $SUPABASE_DB_URL -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Database connection successful"
else
  echo "❌ Database connection failed"
  exit 1
fi

echo "✅ Environment setup complete"
```

---

## 🗄️ Database Deployment

### Migration Strategy

#### 1. Prepare Migration Scripts
```bash
# List all migration files in order
ls -la supabase/migrations/*.sql | sort

# Verify migration sequence
cat supabase/migrations/*.sql | grep -E "(CREATE|ALTER|DROP)" | head -20
```

#### 2. Database Migration Process
```bash
#!/bin/bash
# migrate-database.sh

echo "Starting database migration..."

# Create migration tracking table
psql $SUPABASE_DB_URL << 'EOF'
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
EOF

# Apply migrations in order
for migration in supabase/migrations/*.sql; do
  version=$(basename "$migration" .sql)
  
  # Check if migration already applied
  applied=$(psql $SUPABASE_DB_URL -tAc "SELECT 1 FROM schema_migrations WHERE version = '$version'")
  
  if [ "$applied" = "1" ]; then
    echo "⏭️  Migration $version already applied"
    continue
  fi
  
  echo "🔄 Applying migration: $version"
  
  # Apply migration with error handling
  if psql $SUPABASE_DB_URL < "$migration"; then
    psql $SUPABASE_DB_URL -c "INSERT INTO schema_migrations (version) VALUES ('$version')"
    echo "✅ Migration $version applied successfully"
  else
    echo "❌ Migration $version failed"
    exit 1
  fi
done

echo "✅ Database migration complete"
```

#### 3. Zero-Legacy FSM Migration
```sql
-- Critical migration for FSM architecture
-- File: 20260217_zero_legacy_fsm_migration.sql

BEGIN;

-- Add FSM state column
ALTER TABLE intent_workflows ADD COLUMN state workflow_state_enum;

-- Create state enum type
DO $$ BEGIN
  CREATE TYPE workflow_state_enum AS ENUM (
    'step_1_icp',
    'step_2_competitors',
    'step_3_seeds',
    'step_4_longtails',
    'step_5_filtering',
    'step_6_clustering',
    'step_7_validation',
    'step_8_subtopics',
    'step_9_articles',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Migrate existing data
UPDATE intent_workflows 
SET state = CASE 
  WHEN current_step = 1 AND status = 'step_1_icp' THEN 'step_1_icp'
  WHEN current_step = 2 AND status = 'step_2_competitors' THEN 'step_2_competitors'
  WHEN current_step = 3 AND status = 'step_3_seeds' THEN 'step_3_seeds'
  WHEN current_step = 4 AND status = 'step_4_longtails' THEN 'step_4_longtails'
  WHEN current_step = 5 AND status = 'step_5_filtering' THEN 'step_5_filtering'
  WHEN current_step = 6 AND status = 'step_6_clustering' THEN 'step_6_clustering'
  WHEN current_step = 7 AND status = 'step_7_validation' THEN 'step_7_validation'
  WHEN current_step = 8 AND status = 'step_8_subtopics' THEN 'step_8_subtopics'
  WHEN current_step = 9 AND status = 'step_9_articles' THEN 'step_9_articles'
  WHEN status = 'completed' THEN 'completed'
  ELSE 'step_1_icp' -- Safe default
END;

-- Make state column NOT NULL
ALTER TABLE intent_workflows ALTER COLUMN state SET NOT NULL;

-- Drop legacy columns
ALTER TABLE intent_workflows 
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS current_step,
  DROP COLUMN IF EXISTS step_1_icp_completed_at,
  DROP COLUMN IF EXISTS step_2_competitors_completed_at,
  DROP COLUMN IF EXISTS step_3_seeds_completed_at,
  DROP COLUMN IF EXISTS step_4_longtails_completed_at,
  DROP COLUMN IF EXISTS step_5_filtering_completed_at,
  DROP COLUMN IF EXISTS step_6_clustering_completed_at,
  DROP COLUMN IF EXISTS step_7_validation_completed_at,
  DROP COLUMN IF EXISTS step_8_subtopics_completed_at,
  DROP COLUMN IF EXISTS step_9_articles_completed_at;

COMMIT;
```

---

## 🚀 Application Deployment

### Vercel Configuration

#### 1. Next.js Configuration
```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```

#### 2. Environment Variables
The application uses environment variables defined in `.env.example`:
- Supabase configuration
- External API keys (OpenRouter, DataForSEO, Tavily, Brevo)
- WordPress publishing settings
- Monitoring and debugging options

#### 2. Build Configuration
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:contracts": "vitest run __tests__/contracts",
    "test:integration": "vitest run __tests__/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:ts-001": "npm run test:contracts && npm run test:integration",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### Deployment Process

#### 1. Automated Deployment (GitHub Actions)
```yaml
# .github/workflows/ci.yml
name: CI

on:
  workflow_dispatch:
  pull_request:
    branches: [test-main-all]
  push:
    branches: [test-main-all, sm-*]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        working-directory: ./infin8content
        run: npm ci --ignore-scripts
        env:
          npm_config_ignore_scripts: true

      - name: Type check
        working-directory: ./infin8content
        run: npm run typecheck

      - name: Build
        working-directory: ./infin8content
        env:
          NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder-key
          SUPABASE_URL: https://placeholder.supabase.co
          SUPABASE_ANON_KEY: placeholder-key
          SUPABASE_SERVICE_ROLE_KEY: placeholder-service-key
          SUPABASE_KEY: placeholder-key
        run: npm run build

  ci-gate:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - run: echo "CI passed"
```

#### 2. Manual Deployment
```bash
#!/bin/bash
# deploy-manual.sh

echo "Starting manual deployment..."

# 1. Run tests
echo "🧪 Running tests..."
npm run test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

# 2. Type check
echo "🔍 Type checking..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type check failed"
  exit 1
fi

# 3. Build application
echo "🏗️  Building application..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

# 4. Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete"
```

---

## 🔐 Security Configuration

### 1. Supabase Security

#### Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organization isolation policies
CREATE POLICY "Users can view own organization" ON organizations
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM organization_users WHERE organization_id = id
  ));

CREATE POLICY "Organization isolation for workflows" ON intent_workflows
  FOR ALL USING (organization_id = auth.org_id());

CREATE POLICY "Organization isolation for keywords" ON keywords
  FOR ALL USING (organization_id = auth.org_id());

CREATE POLICY "Organization isolation for articles" ON articles
  FOR ALL USING (organization_id = auth.org_id());
```

#### Security Functions
```sql
-- Get current user's organization
CREATE OR REPLACE FUNCTION auth.org_id()
RETURNS UUID AS $$
  SELECT organization_id 
  FROM organization_users 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Audit logging trigger
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    json_build_object(
      'old', OLD,
      'new', NEW
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### 2. Application Security

#### API Rate Limiting
```typescript
// middleware/rate-limiter.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimitMap = new Map()

export function rateLimit(request: NextRequest) {
  const ip = request.ip || 'unknown'
  const key = `${ip}:${request.nextUrl.pathname}`
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const limit = 100 // requests per minute

  const record = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs }
  
  if (now > record.resetTime) {
    record.count = 0
    record.resetTime = now + windowMs
  }

  record.count++
  rateLimitMap.set(key, record)

  if (record.count > limit) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  return null
}
```

#### Input Validation
```typescript
// lib/validation.ts
import { z } from 'zod'

export const workflowSchema = z.object({
  name: z.string().min(1).max(255),
  organization_id: z.uuid(),
  workflow_data: z.record(z.any()).optional()
})

export const keywordSchema = z.object({
  keyword_text: z.string().min(1).max(500),
  keyword_type: z.enum(['seed', 'longtail']),
  search_volume: z.number().int().min(0).optional(),
  competition_index: z.number().min(0).max(100).optional()
})

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.message}`)
  }
  return result.data
}
```

---

## 📊 Monitoring & Observability

### 1. Application Monitoring

#### Vercel Analytics
```typescript
// lib/analytics.ts
import { getAnalytics } from '@vercel/analytics/server'

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  getAnalytics().track(eventName, properties)
}

// Usage in API routes
export async function POST(request: Request) {
  trackEvent('workflow.started', { step: 'icp_generation' })
  
  // ... API logic
  
  trackEvent('workflow.completed', { step: 'icp_generation', success: true })
}
```

#### Custom Metrics
```typescript
// lib/metrics.ts
interface MetricData {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp: Date
}

class MetricsCollector {
  private metrics: MetricData[] = []

  collect(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: new Date()
    })
  }

  getMetrics(): MetricData[] {
    return this.metrics
  }

  // Workflow metrics
  trackWorkflowTransition(fromState: string, toState: string, duration: number) {
    this.collect('workflow.transition', duration, {
      from: fromState,
      to: toState
    })
  }

  // API metrics
  trackApiCall(endpoint: string, method: string, statusCode: number, duration: number) {
    this.collect('api.call', duration, {
      endpoint,
      method,
      status: statusCode.toString()
    })
  }
}

export const metrics = new MetricsCollector()
```

### 2. Database Monitoring

#### Performance Queries
```sql
-- Slow query monitoring
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE mean_time > 1000 -- queries taking >1 second
ORDER BY mean_time DESC
LIMIT 10;

-- Table size monitoring
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

#### Health Checks
```sql
-- Database health check
CREATE OR REPLACE FUNCTION health_check()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'database', 'healthy',
    'timestamp', NOW(),
    'version', version(),
    'connections', (
      SELECT count(*) 
      FROM pg_stat_activity 
      WHERE state = 'active'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### 3. Error Tracking

#### Error Boundary
```typescript
// components/ErrorBoundary.tsx
'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    // Send to error tracking service
    if (typeof window !== 'undefined') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        })
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

## 🔄 CI/CD Pipeline

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
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
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run security audit
        run: npm audit --audit-level moderate
      
      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD

  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 2. Database Migration Pipeline

```yaml
# .github/workflows/database-migration.yml
name: Database Migration

on:
  workflow_dispatch:
    inputs:
      migration_type:
        description: 'Migration type'
        required: true
        default: 'incremental'
        type: choice
        options:
        - incremental
        - full
        - rollback

jobs:
  migrate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup PostgreSQL Client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      
      - name: Run Migration
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          chmod +x scripts/migrate-database.sh
          ./scripts/migrate-database.sh ${{ github.event.inputs.migration_type }}
      
      - name: Verify Migration
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          psql $DATABASE_URL -c "SELECT version, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 5;"
```

---

## 🚨 Production Troubleshooting

### Common Issues & Solutions

#### 1. Database Connection Issues
```bash
# Check connection pool status
psql $DATABASE_URL -c "
  SELECT 
    state,
    count(*) as connections
  FROM pg_stat_activity 
  WHERE datname = current_database()
  GROUP BY state;
"

# Check for long-running queries
psql $DATABASE_URL -c "
  SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query
  FROM pg_stat_activity 
  WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  ORDER BY duration DESC;
"
```

#### 2. Workflow State Issues
```sql
-- Check for stuck workflows
SELECT 
  id,
  name,
  state,
  updated_at,
  CASE 
    WHEN updated_at < NOW() - INTERVAL '1 hour' THEN 'STUCK'
    ELSE 'ACTIVE'
  END as status
FROM intent_workflows
WHERE state != 'completed'
ORDER BY updated_at ASC;

-- Reset stuck workflow
UPDATE intent_workflows 
SET state = 'step_1_icp', updated_at = NOW()
WHERE id = 'stuck-workflow-id';
```

#### 3. Performance Issues
```bash
# Check Vercel function logs
vercel logs --limit 100

# Check database performance
psql $DATABASE_URL -c "
  SELECT 
    query,
    calls,
    total_time,
    mean_time
  FROM pg_stat_statements
  ORDER BY mean_time DESC
  LIMIT 10;
"
```

### Emergency Procedures

#### 1. Rollback Deployment
```bash
# Rollback to previous Vercel deployment
vercel rollback [deployment-url]

# Rollback database migration
psql $DATABASE_URL < supabase/migrations/rollback/[migration-file].sql
```

#### 2. Emergency Maintenance Mode
```typescript
// middleware/maintenance.ts
export function maintenanceMode(request: NextRequest) {
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true'
  
  if (isMaintenance && request.nextUrl.pathname !== '/maintenance') {
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }
  
  return null
}
```

---

## 📋 Deployment Checklist

### Pre-Deployment Checklist

- [ ] **Environment Variables**: All required variables set and verified
- [ ] **Database Migration**: Migration scripts tested and ready
- [ ] **Tests**: All tests passing (unit, integration, e2e)
- [ ] **Type Check**: TypeScript compilation successful
- [ ] **Lint**: No linting errors
- [ ] **Security**: Security audit passed
- [ ] **Performance**: Load testing completed
- [ ] **Backup**: Database backup created
- [ ] **Monitoring**: Monitoring and alerting configured

### Post-Deployment Checklist

- [ ] **Health Check**: All services responding correctly
- [ ] **Database**: Migration applied successfully
- [ ] **APIs**: All endpoints responding with correct status codes
- [ ] **Authentication**: Login/logout working
- [ ] **Workflows**: FSM transitions working correctly
- [ ] **Real-time**: WebSocket subscriptions connected
- [ ] **Monitoring**: Metrics collection working
- [ ] **Alerts**: Alert notifications configured

### Production Readiness Checklist

- [ ] **Zero-Legacy FSM**: No legacy field references in code
- [ ] **RLS Policies**: All tables have proper Row Level Security
- [ ] **Audit Logging**: Comprehensive activity tracking enabled
- [ ] **Error Handling**: Graceful error handling implemented
- [ ] **Rate Limiting**: API rate limiting configured
- [ ] **SSL/TLS**: HTTPS enforced everywhere
- [ ] **Backup Strategy**: Automated backups configured
- [ ] **Disaster Recovery**: Recovery procedures documented

---

This deployment guide provides comprehensive coverage of the Infin8Content production deployment process, including security, monitoring, and troubleshooting procedures for the zero-legacy FSM architecture.
