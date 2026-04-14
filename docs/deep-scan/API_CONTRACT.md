---
description: API contract and OpenAPI skeleton
---

# API Contract — Infin8Content (summary & skeleton)

**Generated:** 2026-04-10

Goal
- Provide a canonical machine-readable API contract (OpenAPI) for server routes and identify integration points.

API surface (categories)
- `/api/admin/*` — administrative endpoints
- `/api/analytics/*` — metrics and reporting
- `/api/articles/*` — article creation/management
- `/api/auth/*` — authentication, sessions
- `/api/intent/*` — intent engine and workflow orchestration
- `/api/workflows/*` — workflow control & step endpoints
- `/api/publishing/*` — WordPress / external CMS adapters

Example OpenAPI skeleton (start here and expand paths)

```yaml
openapi: 3.0.1
info:
  title: Infin8Content API
  version: 1.0.0
servers:
  - url: https://api.example.com
paths:
  /api/intent/workflows/{workflow_id}/steps/{step}:
    get:
      summary: Get workflow step status
      parameters:
        - name: workflow_id
          in: path
          required: true
          schema:
            type: string
        - name: step
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Step status

```

Recommended workflow to produce complete API spec
1. Collect route definitions under `infin8content/app/api` and `infin8content/pages/api`.
2. For each route, capture method, path params, query params, request/response shapes.
3. Generate an OpenAPI YAML using a small script or manual mapping and store it as `docs/openapi.yaml`.
4. Add OpenAPI validation step to CI.

Automated hints
- Use tools that parse Next.js route files (or a small AST script) to extract route paths and JSDoc types.
- Consider using `openapi-generator` or `oas-tools` once the YAML is available.
