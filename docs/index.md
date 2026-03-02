# Infin8Content - Master Project Documentation Index

Generated: 2026-02-28  
Project Status: **Production Hardened**  
Authority: **Zero Drift Protocol**

## Welcome

Welcome to the central documentation for Infin8Content. This guide provides a comprehensive overview of the system architecture, development workflows, and core technical components, all verified through an exhaustive deep scan.

## Project Quick Reference

- **Type**: Multi-tenant SaaS Platform (Monorepo)
- **Primary Tech**: Next.js 16, React 19, Supabase, Inngest
- **Architecture**: **Zero Drift / Deterministic State Machine**
- **Lifecycle Mode**: Pure Generation Engine Locked

## Core Documentation

### 📚 Project Overview
- [Project Overview](./project-overview.md): Strategic summary of purpose and high-level architecture.
- [Source Tree Analysis](./source-tree-analysis.md): Annotated structure for the monorepo.
- [Complete Codebase Analysis](./COMPLETE_CODEBASE_ANALYSIS.md): Synthesis of system purity and architecture.

### 🏗️ Technical Architecture
- [Workflow Guide](./workflow-guide.md): Deep-dive into the FSM and Generation Pipeline.
- [Architecture Overview](./architecture-infin8content.md): Core platform design.
- [Data Models](./data-models.md): Database schema and RLS policies.
- [API Contracts](./api-contracts.md): Catalog of endpoints and integration layers.
- [Dependency Analysis](./DEPENDENCY_ANALYSIS_DEEP_SCAN.md): Deep scan of module relationships.

### 💻 Development & Maintenance
- [Development Guide](./development-guide.md): Setup, standards, and deployment.
- [Component Inventory](./component-inventory.md): Library of UI components and tokens.
- [Deployment Guide](./deployment-guide.md): CI/CD and infrastructure details.

### 🛡️ Specialized Stability Guides
- [State Machine Purity](./workflow-engine-state-machine-purity.md)
- [Realtime Stability Engineering](./realtime-stability-engineering-guide.md)
- [Zero Legacy FSM Completion](./zero-legacy-fsm-completion.md)

## Monorepo Parts

- [infin8content/](./infin8content/): Primary web application.
- [_bmad/](./_bmad/): Management framework.
- [supabase/](./supabase/): Infrastructure layer.

---
*Documentation updated via the `document-project` exhaustive workflow.*