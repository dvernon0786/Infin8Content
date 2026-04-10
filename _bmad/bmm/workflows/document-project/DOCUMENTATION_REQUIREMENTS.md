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

**Entry points**

main.ts
index.ts
app.ts
server.ts
_app.tsx
_app.ts
layout.tsx

**Shared code**

shared/**
common/**
utils/**
lib/**
helpers/**
@*/**
packages/**

**Monorepo workspace files (check presence)**

pnpm-workspace.yaml
lerna.json
nx.json
turbo.json
workspace.json
rush.json

**Async / event patterns**

*event*.ts
*queue*.ts
*subscriber*.ts
*consumer*.ts
*producer*.ts
*worker*.ts
jobs/**

**CI / CD**

.github/workflows/**
.gitlab-ci.yml
Jenkinsfile
.circleci/**
azure-pipelines.yml
bitbucket-pipelines.yml
.drone.yml

**Assets**

public/**
static/**
assets/**
images/**
media/**

**Protocol / schema files to check**

*.proto
*.graphql
graphql/**
schema.graphql
*.avro
openapi.*
swagger.*

**Localization**

i18n/**
locales/**
lang/**
translations/**
messages/**
*.po
*.pot

## Notes & recommended next steps

1. Run a repository scan (ripgrep / rg) for the listed patterns and generate a short inventory for each section above.
2. Create individual docs under `docs/` (or `_bmad/docs/`) for: API, Data Models, State Management, UI Components, Deployment.
3. Link Storybook and generated API specs into the UI Components and API docs respectively.
4. Add a `docs/README.md` summarizing where each doc lives and how to keep it updated.
5. Optionally open a branch `docs/docs-documentation-requirements` containing these generated artifacts and a PR template for ongoing documentation work.

---
Generated from `_bmad/bmm/workflows/document-project/documentation-requirements.csv` and repository inspection (Next.js detected).
