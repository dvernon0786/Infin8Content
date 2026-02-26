# Infin8Content - Project Documentation Index

This index serves as the primary entry point for understanding the Infin8Content codebase, architecture, and development processes.

## Project Summary

- **Name**: Infin8Content
- **Type**: Monolith Web Application
- **Primary Tech**: Next.js 16.1.1, TypeScript, React 19.2.3, Supabase, Inngest
- **Architecture**: Layered Component-Based with FSM-driven workflows

## Generated Documentation

| Document | Description | Status |
| :--- | :--- | :--- |
| [Project Overview](./project-overview.md) | Executive summary and core capabilities. | ✅ Updated |
| [Architecture](./architecture.md) | System-level design and patterns. | ✅ Updated |
| [Source Tree Analysis](./source-tree-analysis.md) | Codebase structure and directory purpose. | ✅ Updated |
| [API Contracts](./api-contracts.md) | Comprehensive endpoint catalog. | ✅ Updated |
| [Data Models](./data-models.md) | Database schema and entity relationships. | ✅ Updated |
| [Development Guide](./development-guide.md) | Setup and local development instructions. | ✅ Updated |

## Reference Documentation (External)

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Inngest Documentation](https://www.inngest.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)

## Critical Areas of Interest

- **FSM Logic**: Located in `lib/fsm/` and `lib/intent-workflow/`.
- **Background Jobs**: Orchestrated via `inngest/` functions.
- **Onboarding Pipeline**: UI and data persistence for new users.
- **Article Generation**: The multi-stage AI content creation engine.

---

**Last Full Rescan**: February 27, 2026
**Scan Depth**: Deep Scan
**Status**: All core documentation updated.
