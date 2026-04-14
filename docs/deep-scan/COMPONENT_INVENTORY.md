---
description: Component inventory and Storybook mapping
---

# Component Inventory — Infin8Content

**Generated:** 2026-04-10

Where components live
- Primary UI components are under `infin8content/components/` and `infin8content/app/components`.
- Storybook is configured in the `infin8content` package and exposes interactive stories for the component library.

Top-level component categories (observed)
- `dashboard/` — dashboard screens and widgets
- `articles/` — article editor and list components
- `onboarding/` — onboarding UI
- `workflows/` — workflow visualization components
- `ui/` — reusable primitives (buttons, inputs, forms)
- `shared/` — cross-cutting components

How to generate a full inventory
1. Run `rg "export default|export const" infin8content/components -n` to list exported components.
2. Map Storybook stories to component files: search `.stories` / `stories` and `*.mdx` under the Storybook config.
3. Produce a CSV of `component,path,stories,props` using a small Node script that parses TSX files for exported components and Prop types.

Recommended deliverables
- `docs/components/component-catalog.csv` — machine-readable inventory
- Storybook link and snapshot collection for visual regression
