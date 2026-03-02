# Component Inventory - UI Catalog

Generated: 2026-02-28
Library: **React 19 / Tailwind 4**

## Dashboard Components (`components/dashboard/`)
-   `ArticleStatusList`: Real-time reactive list for article progress.
-   `BulkActionsBar`: Contextual bar for multi-selection management.
-   `ScrollableArticleList`: High-performance virtualization for large content sets.
-   `ActivityFeed`: Audit log visualization via real-time stream.

## Core UI (`components/ui/`)
-   Base Radix Primitives: `Button`, `Dialog`, `Popover`, `Card`, `Badge`, `Toast`.
-   Design Tokens: CSS variables for scale, surface, and interaction.

## Specialized Components
-   `VisualStatusIndicator`: FSM state mapping to SVG/CSS states.
-   `OnboardingWizard`: Multi-step organization setup flow.
-   `KeywordResearchForm`: Specialized Form handler with DataForSEO integration.

## Mobile Components (`components/mobile/`)
-   `MobileArticleStatusCard`: Touch-optimized article summary.
-   `MobileFilterPanel`: Bottom-sheet filtering for mobile.

## Shared Layers
-   `Layout`: Standardized shell for Dashboard vs Onboarding.
-   `Navigation`: Role-based sidebar/header injection.

---
*Standards: ESLint Design System Plugin (`tools/`) enforces token usage.*
