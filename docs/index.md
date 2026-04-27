# Infin8Content - Master Project Documentation Index

Generated: 2026-04-22  
Project Status: **Brownfield Next.js Application**  
Authority: **BMAD Document Project Workflow**

## Welcome

Welcome to the central documentation for Infin8Content. This guide provides a comprehensive overview of the system architecture, development workflows, and core technical components, generated through automated codebase scanning.

## Project Quick Reference

- **Type**: Web Application (Next.js)
- **Primary Tech**: Next.js, TypeScript, Supabase, Inngest
- **Architecture**: App Router, API Routes, Database with RLS
- **Database**: Supabase PostgreSQL
- **AI Stack**: OpenRouter, Tavily API
- **Payments**: Stripe
- **Testing**: Vitest, Playwright, Storybook

## Core Documentation

### 📚 Project Overview
- [Project Overview](./project-overview.md): Strategic summary of purpose and high-level architecture.
- [Architecture Overview](./architecture.md): Core platform design with current tech stack.
- [Data Models](./data-models.md): Database schema and RLS policies.
- [API Contracts](./api-contracts.md): Catalog of endpoints and integration layers.

### 💻 Development & Maintenance
- [Development Guide](./development-guide.md): Setup, standards, and deployment procedures.
- [Component Inventory](./component-inventory.md): Complete UI component library.
- [Deployment Guide](./deployment-guide.md): Current infrastructure and CI/CD setup.

### 🔧 Specialized Documentation
- [State Management](./state-management.md): Contexts, stores, and state flows.
- [Authentication & Security](./auth-security.md): Auth flows and permissions.
- [Async Events](./async-events.md): Inngest workflows and event handling.

## Documentation Requirements

- [Documentation Requirements](./DOCUMENTATION_REQUIREMENTS.md): Auto-generated requirements based on project type analysis.
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