## Plan: Multi-CMS Publishing Engine

Build a production-ready multi-CMS publishing system: new `cms_connections` table, platform-agnostic adapter layer, connection-based API, a Settings → Integrations UI, and a publish dropdown on articles. Migrates existing WordPress credentials safely.

---

**Phase 1 — Database (all other phases depend on this)**

1. New migration: `CREATE TABLE cms_connections` — `id, org_id, platform, name, credentials JSONB, status, created_by, created_at, updated_at`; RLS policy using `current_setting('request.jwt.claims')::jsonb->>'org_id'`
2. New migration: Alter `publish_references` — drop `CHECK (platform IN ('wordpress'))` constraint, add `connection_id UUID REFERENCES cms_connections(id) ON DELETE SET NULL` (nullable for backward compat), change UNIQUE from `(article_id, platform)` → `(article_id, connection_id)` to allow same article on two WP sites; keep `(article_id, platform)` partial unique index `WHERE connection_id IS NULL` for legacy rows
3. Data migration (same file or separate): `INSERT INTO cms_connections (platform, org_id, credentials) SELECT 'wordpress', id, blog_config->'integrations'->'wordpress' FROM organizations WHERE blog_config->'integrations'->'wordpress' IS NOT NULL` — credentials already encrypted in `blog_config`

**Phase 2 — Adapter Layer** (*parallel with Phase 1 since no DB reads*)

4. Create `infin8content/lib/services/publishing/cms-adapter.ts` — `PublishInput`, `PublishResult`, `CMSAdapter` interface
5. Create `infin8content/lib/services/publishing/cms-engine.ts` — `CMSPlatform` type + `createCMSAdapter(platform, credentials)` factory
6. Create `infin8content/lib/services/publishing/wordpress-adapter.ts` — re-export/wrap existing `infin8content/lib/services/wordpress-adapter.ts`; preserve its strict validation, 30s timeout, and error mapping
7. Create `webflow-adapter.ts`, `shopify-adapter.ts`, `ghost-adapter.ts`, `notion-adapter.ts`, `custom-adapter.ts` — match `CMSAdapter` interface; add proper error handling for non-ok responses on all adapters
8. Update `types/publishing.ts` — extend `PublishPlatform` enum to include all 6 platforms; add `CmsConnectionRow` type

**Phase 3 — API Layer** (*depends on Phase 1 + 2*)

9. New `infin8content/app/api/cms-connections/route.ts` — `GET` (list org's connections, return metadata only — never return credential values), `POST` (create; encrypt sensitive credential fields before insert)
10. New `infin8content/app/api/cms-connections/[id]/route.ts` — `PATCH` (update name/credentials), `DELETE`
11. Refactor `infin8content/app/api/articles/publish/route.ts` — new body: `{ articleId, connectionId }`; load connection from `cms_connections`, `decrypt(connection.credentials)`, `createCMSAdapter(platform, creds)`, call `adapter.publishPost(...)`, write `publish_references` with `connection_id`; preserve trial check, audit log, idempotency check
12. Create `infin8content/lib/services/publishing/cms-publisher.ts` — unified `publishArticle(articleId, orgId, connection)` replacing `publishArticleToWordPress`; handles article loading and HTML concatenation for all platforms

**Phase 4 — Settings UI** (*depends on Phase 3*)

13. New `infin8content/app/settings/integrations/page.tsx` — lists `cms_connections` for the org; shows platform icon, name, site URL, status badge; **Add new connection** button
14. New `infin8content/components/settings/CmsConnectionForm.tsx` — platform-aware form; fields switch based on selected platform (WP: url/username/app-password; Webflow: collection_id/api_token/site_url; Shopify: shop/blog_id/access_token; Ghost: url/api_key; Notion: token/database_id; Custom: endpoint/api_key/method); show masked credentials (e.g. `••••••••`) for sensitive fields
15. Add "Integrations" link to settings navigation (check `infin8content/app/settings/` layout for nav component)

**Phase 5 — Article Publish UI** (*depends on Phase 3*)

16. Create `infin8content/components/articles/publish-dropdown.tsx` — replaces `publish-to-wordpress-button.tsx`; fetches available connections from `GET /api/cms-connections`; renders dropdown with connection name + platform; on select calls `POST /api/articles/publish` with `{ articleId, connectionId }`; shows already-published badge per connection
17. Swap `publish-to-wordpress-button` usage with `publish-dropdown` in article views

---

**Relevant files**

- `infin8content/app/api/articles/publish/route.ts` — refactor
- `infin8content/lib/services/wordpress-adapter.ts` — wrap in new publishing folder
- `infin8content/lib/services/publishing/wordpress-publisher.ts` — supersede with `cms-publisher.ts`
- `infin8content/lib/security/encryption.ts` — reuse `encrypt`/`decrypt`
- `types/publishing.ts` — extend `PublishPlatform`
- `infin8content/components/articles/publish-to-wordpress-button.tsx` — replace
- `infin8content/components/settings/WordPressIntegrationForm.tsx` — reference for form pattern
- `supabase/migrations/` — new migration file(s)

---

**Verification**

1. Run `pnpm build` (or `npm run build`) — zero TypeScript errors
2. `supabase db push --local` or apply migration in dev Supabase dashboard and confirm `cms_connections` exists with RLS enabled
3. Confirm data migration: `SELECT COUNT(*) FROM cms_connections WHERE platform = 'wordpress'` equals existing orgs with WP configured
4. Hit `POST /api/cms-connections` with a WordPress connection, then `POST /api/articles/publish` with `connectionId` — verify `publish_references` row created with `connection_id` populated
5. Verify org isolation: confirm a user from Org A cannot `GET /api/cms-connections` and see Org B's connections
6. Open Settings → Integrations and verify connections list, add form, delete flow
7. Open an article, verify publish dropdown lists correct connections, marks already-published ones

---

**Decisions**

- `UNIQUE (article_id, connection_id)` replaces `(article_id, platform)` — allows one article to publish to two WordPress sites
- `connection_id` in `publish_references` is **nullable** for backward compat with existing WordPress references
- Credential encryption: sensitive fields (`application_password`, `api_token`, `access_token`, `api_key`) encrypted individually before storing in the JSONB; `url`/`username` stored plaintext for display
- The existing `wordpress-adapter.ts` is **wrapped, not replaced** — its strict validation and timeout behaviour is preserved
- `blog_config.integrations.wordpress` left in place after migration (not removed) as a Phase 2 cleanup task — avoids risk to onboarding flow during this rollout

---

**Further Considerations**

1. **Onboarding integration step** — `infin8content/components/onboarding/StepIntegration.tsx` currently writes to `blog_config`. Should it be updated to write to `cms_connections` instead as part of this work, or left for a follow-up? *Recommendation: update it now — otherwise new onboarding signups bypass the new system.*
2. **`publish_references` UNIQUE constraint change** — dropping `(article_id, platform)` unique and replacing with `(article_id, connection_id)` is a breaking schema change. Existing rows have `connection_id = NULL`. *Recommendation: add `(article_id, platform)` partial unique index `WHERE connection_id IS NULL` to preserve idempotency for legacy rows.*
3. **Credential display** — the Settings UI should show masked credentials (e.g. `••••••••`) for app passwords. The `GET /api/cms-connections` response should **never return** encrypted credential values — only metadata (platform, name, site URL) for display.
