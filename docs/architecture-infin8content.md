# Architecture - infin8content

Generated: 2026-03-17  
Scan Level: Deep  

## Executive Summary

Infin8Content is an AI-powered content generation and SaaS platform built using a multi-tenant architecture. It leverages Next.js for the frontend, Supabase for the backend and authentication, and Inngest for reliable background workflow orchestration.

## Technology Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **Database & Auth**: Supabase (PostgreSQL with RLS)
- **Workflow Engine**: Inngest
- **AI Integration**: OpenRouter (Gemini, Llama, etc.)
- **Payments**: Stripe
- **Testing**: Vitest, Playwright, Storybook

## Core Architecture Patterns

### 1. Multi-Tenant SaaS Pattern
The system uses Row Level Security (RLS) in Supabase to ensure complete data isolation between organizations. Every request is filtered by `org_id`.

### 2. State-Driven Workflows
Content generation is managed through a state machine orchestrated by Inngest. Transitions like `queued` → `generating` → `completed` are handled atomically with detailed audit logging.

### 3. Service Layer Architecture
Business logic for external integrations (Stripe, OpenRouter, WordPress) is encapsulated in the `lib/services/` directory, providing a clean separation from the UI and API layers.

### 4. Real-time Synchronization
The application uses Supabase real-time subscriptions (via custom hooks like `useRealtimeArticles`) to provide live updates on generation progress and user activity without manual polling.

### 5. Mobile-First Design
The UI is built with a mobile-first approach, using brand-compliant tokens and Radix UI primitives to ensure accessibility and performance across devices.

## Data Architecture

Refer to [Data Models](./data-models-infin8content.md) for detailed schema information. Core entities include `articles`, `keywords`, `usage_tracking`, and `audit_log`.

## API Design

Refer to [API Contracts](./api-contracts-infin8content.md) for endpoint documentation. The API follows RESTful principles with Zod validation and standardized error handling.

## Development & Deployment

Refer to [Development Guide](./development-guide-infin8content.md) and [Deployment Guide](./deployment-guide.md) for operational details.
