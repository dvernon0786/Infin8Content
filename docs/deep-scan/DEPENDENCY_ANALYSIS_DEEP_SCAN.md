---
description: Dependency analysis (deep)
---

# Dependency Analysis — Deep Scan

**Generated:** 2026-04-10

Source: `infin8content/package.json` (dependencies + devDependencies)

## Production Dependencies

- @getbrevo/brevo: ^3.0.1
- @openrouter/ai-sdk-provider: ^2.1.1
- @radix-ui/react-avatar: ^1.1.11
- @radix-ui/react-dialog: ^1.1.15
- @radix-ui/react-dropdown-menu: ^2.1.16
- @radix-ui/react-progress: ^1.1.8
- @radix-ui/react-select: ^2.2.6
- @radix-ui/react-separator: ^1.1.8
- @radix-ui/react-slot: ^1.2.4
- @radix-ui/react-tooltip: ^1.2.8
- @sentry/nextjs: ^10.34.0
- @stripe/stripe-js: ^8.6.0
- @supabase/ssr: ^0.8.0
- @supabase/supabase-js: ^2.89.0
- @types/jsonwebtoken: ^9.0.10
- @types/mark.js: ^8.11.12
- @types/react-window: ^1.8.8
- ai: ^6.0.0
- class-variance-authority: ^0.7.1
- clsx: ^2.1.1
- inngest: ^3.48.1
- inngest-cli: ^1.16.0
- jsonwebtoken: ^9.0.3
- lucide-react: ^0.562.0
- mark.js: ^8.11.1
- next: 16.1.1
- react: 19.2.3
- react-dom: 19.2.3
- react-markdown: ^10.1.0
- react-window: ^2.2.4
- recharts: ^3.7.0
- stripe: ^20.1.0
- tailwind-merge: ^3.4.0
- winston: ^3.11.0
- zod: ^3.23.8

## Dev Dependencies

- @chromatic-com/storybook: ^5.0.0
- @inngest/test: ^0.1.9
- @playwright/test: ^1.57.0
- @storybook/addon-a11y: ^10.1.11
- @storybook/addon-docs: ^10.1.11
- @storybook/addon-onboarding: ^10.1.11
- @storybook/addon-vitest: ^10.1.11
- @storybook/nextjs-vite: ^10.1.11
- @tailwindcss/postcss: ^4
- @testing-library/dom: ^10.4.1
- @testing-library/jest-dom: ^6.9.1
- @testing-library/react: ^16.3.2
- @testing-library/user-event: ^14.6.1
- @types/jest: ^30.0.0
- @types/node: ^20
- @types/node-fetch: ^2.6.13
- @types/pg: ^8.16.0
- @types/react: ^19
- @types/react-dom: ^19
- @vitejs/plugin-react: ^5.1.2
- @vitest/browser-playwright: ^4.0.16
- @vitest/coverage-v8: ^4.0.16
- @vitest/ui: ^4.0.16
- dotenv: ^17.2.3
- eslint: ^9
- eslint-config-next: 16.1.1
- jest: ^30.2.0
- jsdom: ^27.4.0
- node-fetch: ^3.3.2
- pg: ^8.18.0
- playwright: ^1.57.0
- storybook: ^10.1.11
- supabase: ^2.70.5
- tailwindcss: ^4
- ts-jest: ^29.4.6
- ts-node: ^10.9.2
- tsx: ^4.21.0
- tw-animate-css: ^1.4.0
- typescript: ^5
- vite: ^7.3.1
- vitest: ^4.0.16

## Observations & Risks

- Several large runtime dependencies related to AI and third-party integrations (OpenRouter, DataForSEO adapters). Monitor cost and API usage.
- Keep `next`, `react`, and `typescript` versions coordinated with Storybook/Vite toolchains.
- Run dependency vulnerability scans (e.g., `npm audit` / `pnpm audit`) and schedule periodic pinning/updates.

## Recommended Actions

1. Generate a lockfile audit and produce a changelog of vulnerable packages.
2. Add dependency update cadence and automated PRs (Dependabot, Renovate).
3. Document third-party API quotas and secrets usage in `docs/security`.
