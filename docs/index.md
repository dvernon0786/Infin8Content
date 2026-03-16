# Infin8Content - Master Project Documentation Index

Generated: 2026-03-17  
Project Status: **Production Hardened**  
Authority: **Zero Drift Protocol**

## Welcome

Welcome to the central documentation for Infin8Content. This guide provides a comprehensive overview of the system architecture, development workflows, and core technical components, all verified through an exhaustive deep scan of the entire 7,581+ file codebase.

## Project Quick Reference

- **Type**: Multi-tenant SaaS Platform (Monorepo)
- **Primary Tech**: Next.js 16.1.1, React 19.2.3, Supabase, Inngest 3.48.1
- **Architecture**: **Zero Drift / Deterministic State Machine**
- **Lifecycle Mode**: Pure Generation Engine Locked
- **Database**: PostgreSQL with RLS, 75+ migrations applied
- **AI Stack**: OpenRouter (Gemini 2.0, Claude 3.5, Llama 3), Tavily API
- **Payments**: Stripe integration with usage tracking
- **Testing**: Vitest, Playwright, Storybook, 183+ component files

## Core Documentation

### 📚 Project Overview
- [Project Overview](./project-overview.md): Strategic summary of purpose and high-level architecture.
- [Source Tree Analysis](./source-tree-analysis.md): Annotated structure for the monorepo.
- [Complete Codebase Analysis](./COMPLETE_CODEBASE_ANALYSIS.md): Synthesis of system purity and architecture.

### 🏗️ Technical Architecture
- [Workflow Guide](./workflow-guide.md): Deep-dive into the FSM and Generation Pipeline.
- [Architecture Overview](./architecture-infin8content.md): Core platform design with current tech stack.
- [Data Models](./data-models.md): Database schema and RLS policies (verified against migrations).
- [API Contracts](./api-contracts.md): Catalog of endpoints and integration layers (scanned from app/api/).
- [Dependency Analysis](./DEPENDENCY_ANALYSIS_DEEP_SCAN.md): Deep scan of module relationships.

### 💻 Development & Maintenance
- [Development Guide](./development-guide.md): Setup, standards, and deployment procedures.
- [Component Inventory](./component-inventory.md): Complete UI component library (183 .tsx files cataloged).
- [Deployment Guide](./deployment-guide.md): Current infrastructure and CI/CD setup.

### 🛡️ Specialized Stability Guides
- [State Machine Purity](./workflow-engine-state-machine-purity.md)
- [Realtime Stability Engineering](./realtime-stability-engineering-guide.md)
- [Zero Legacy FSM Completion](./zero-legacy-fsm-completion.md)

## Monorepo Parts

- [infin8content/](./infin8content/): Primary web application (Next.js 16.1.1, React 19.2.3).
- [_bmad/](./_bmad/): Management framework with agentic capabilities.
- [supabase/](./supabase/): Infrastructure layer with 75+ migrations.
- [docs/](./docs/): Comprehensive documentation suite.

## Key Metrics (From Deep Scan)

- **Total Files**: 7,581+
- **Active Components**: 183 .tsx files
- **API Endpoints**: 50+ routes across domains
- **Database Tables**: 15+ with full RLS implementation
- **FSM States**: 25 states, 30+ events
- **Migrations**: 75+ applied, latest 2026-02-23

---
*Documentation updated via exhaustive codebase scan on 2026-03-17.*