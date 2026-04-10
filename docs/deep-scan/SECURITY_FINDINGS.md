---
description: Security findings from deep scan
---

# Security Findings — Deep Scan (summary)

**Generated:** 2026-04-10

High-priority findings

1. Sensitive credentials in repository working tree
   - `infin8content/.env.local` exists and contains API keys and secrets (OpenRouter, Tavily, DataForSEO, Inngest keys, Supabase service role). This is a critical exposure. Immediate actions:
     - Remove the file from version control history (if committed) and from the working tree.
     - Rotate all exposed credentials immediately.
     - Move secrets to a secure secret manager (GitHub Secrets, Vault, etc.) and reference them in CI.

2. Secret scanning & pre-commit
   - Add a secret-scanning step to CI (truffleHog, GitHub secret scanning) and enforce a pre-commit hook that prevents committing `.env*` files.

3. Third-party API risk
   - Several external integrations (OpenRouter, DataForSEO) can incur high costs — track usage and add billing alerts.

4. RLS and access control
   - The repo implements Row Level Security (RLS). Validate policies after schema changes and include tests verifying multi-tenant isolation.

5. Recommended quick fixes
   - Add `.env*` to `.gitignore` and remove any committed `.env` from the history with `git filter-repo` or `git-filter-branch` (with care).
   - Rotate keys and reissue new keys using secret manager references.
   - Add CI secret-scanning and a scheduled audit.
