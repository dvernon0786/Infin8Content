---
description: Documentation requirements summary for this repository (auto-generated)
---

# Documentation Requirements — Infin8Content

Detected project type: **web (Next.js)** — evidence: `infin8content/package.json` includes `next` scripts and `next` dependency.

## Summary (required)

- **API surface scan:** Required
- **Data models documentation:** Required
- **State management documentation:** Required
- **UI components documentation (Storybook):** Required
- **Deployment / CI configuration docs:** Required

## Checklist

- [ ] API surface scan (OpenAPI/GraphQL/.proto discovery)
- [ ] Inventory data models (prisma/, migrations/) and mapping to DB
- [ ] Document state stores, contexts, and cross-page state flows
- [ ] Document UI components, Storybook stories, and component API
- [ ] Document deployment steps, environment variables, and rollbacks
- [ ] List integration points (third-party services, clients, SDKs)
- [ ] Inventory config files and secrets locations
- [ ] Document authentication and authorization flows
- [ ] Capture async/event-driven flows (Inngest, queues, jobs)
- [ ] Add localization coverage and asset inventory notes

## Detected patterns and locations

**Key file patterns**

package.json
tsconfig.json
*.config.js
*.config.ts
vite.config.*
webpack.config.*
next.config.*
nuxt.config.*

**Critical directories**

src/
app/
pages/
components/
api/
lib/
styles/
public/
static/

**Integration scan patterns**

*client.ts
*service.ts
*api.ts
fetch*.ts
axios*.ts
*http*.ts

**Test file patterns**

*.test.ts
*.spec.ts
*.test.tsx
*.spec.tsx
**/__tests__/**
**/*.test.*
**/*.spec.*

**Config patterns**

.env*
config/*
*.config.*
.config/
settings/

**Auth / security patterns**

*auth*.ts
*session*.ts
middleware/auth*
*.guard.ts
*authenticat*
*permission*
guards/

**Schema / migrations**

migrations/**
prisma/**
*.prisma
alembic/**
knex/**
*migration*.sql
*migration*.ts