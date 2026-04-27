# Component Inventory - Full UI Catalog

Deep Scan: 2026-04-22
Library: **React 19 / Tailwind CSS 4**
Source: `infin8content/components/` — **190 .tsx files across 33 directories**

---

## `components/ui/` — Base Design System (22 components)

Radix UI primitives wrapped with Tailwind + design tokens. These are the atomic building blocks used everywhere.

| Component | Description |
|-----------|-------------|
| `button.tsx` | Primary interactive element; variants: default, destructive, outline, ghost, link |
| `card.tsx` | Surface container with header/content/footer slots |
| `badge.tsx` | Status and label indicators |
| `dialog.tsx` | Modal overlay (Radix Dialog) |
| `alert-dialog.tsx` | Confirmation dialogs (destructive actions) |
| `alert.tsx` | Inline alert/notification banners |
| `input.tsx` | Text input with error state support |
| `textarea.tsx` | Multi-line text input |
| `select.tsx` | Dropdown select (Radix Select) |
| `checkbox.tsx` | Checkbox with label |
| `switch.tsx` | Toggle switch |
| `label.tsx` | Form label with required indicator |
| `dropdown-menu.tsx` | Context/action menus (Radix DropdownMenu) |
| `avatar.tsx` | User avatar with fallback initials |
| `tooltip.tsx` | Hover tooltip (Radix Tooltip) |
| `sheet.tsx` | Side drawer (Radix Dialog variant) |
| `sidebar.tsx` | App sidebar shell |
| `progress.tsx` | Linear progress bar |
| `skeleton.tsx` | Loading placeholder |
| `separator.tsx` | Visual divider |
| `table.tsx` | Data table primitives |
| `breadcrumb.tsx` | Navigation breadcrumb |
| `autocomplete-dropdown.tsx` | Searchable dropdown with async results |
| `feature-badge.tsx` | Feature flag / "New" badge indicator |
| `help-tooltip.tsx` | Tooltip with question mark trigger |
| `optimized-image.tsx` | Next.js Image wrapper with fallback |
| `error-reporter.tsx` | Error state display component |

---

## `components/dashboard/` — Dashboard Shell (28 components)

| Component | Description |
|-----------|-------------|
| `article-status-list.tsx` | Real-time reactive article list; subscribes to Supabase Realtime |
| `scrollable-article-list.tsx` | Virtualized list (react-window) for large article sets |
| `bulk-actions-bar.tsx` | Multi-select action toolbar (archive, delete, re-run) |
| `mobile-bulk-actions.tsx` | Mobile variant of bulk actions |
| `search-input.tsx` | Debounced search for article filtering |
| `filter-dropdown.tsx` | Status/date filter panel |
| `active-filters.tsx` | Active filter chip display |
| `sort-dropdown.tsx` | Sort order selector |
| `sidebar-navigation.tsx` | Org-aware sidebar with RBAC-filtered links |
| `top-navigation.tsx` | Top nav bar with user menu |
| `responsive-layout-provider.tsx` | Breakpoint context provider |
| `swipe-navigation.tsx` | Swipe gesture navigation for mobile |
| `swipe-navigation-wrapper.tsx` | Wrapper for swipe nav context |
| `usage-card.tsx` | Article usage meter (quota vs used) |
| `quick-actions.tsx` | Quick action buttons (generate, research) |
| `generate-articles-card.tsx` | Article generation entry card |
| `schedule-calendar.tsx` | Publishing schedule calendar view |
| `content-activity-chart.tsx` | Content publishing activity chart (Recharts) |
| `content-performance-dashboard.tsx` | Performance metrics overview |
| `efficiency-metrics-dashboard.tsx` | Generation efficiency tracking |
| `announcement-banner.tsx` | System announcement display |
| `payment-status-banner.tsx` | Payment warning / suspension alerts |
| `trial-checklist.tsx` | Onboarding trial progress checklist |
| `whats-new-card.tsx` | Recent feature highlights |
| `help-drawer.tsx` | Contextual help side drawer |
| `feedback-widget.tsx` | In-app feedback collection |
| `active-services-card.tsx` | Connected integration status |
| `error-boundary.tsx` | Dashboard-level error boundary |
| `BacklinkExchange.tsx` | Backlink exchange partner dashboard |

---

## `components/dashboard/activity-feed/` (3 components)

| Component | Description |
|-----------|-------------|
| `activity-feed.tsx` | Real-time activity feed container |
| `activity-filter.tsx` | Activity type filter controls |
| `activity-items.tsx` | Individual activity item renderers |

---

## `components/dashboard/generation-progress/` (6 components)

| Component | Description |
|-----------|-------------|
| `generation-progress.tsx` | Overall generation progress display |
| `parallel-section-progress.tsx` | Per-section parallel progress bars |
| `research-phase-visualization.tsx` | Research stage visualization |
| `performance-metrics-display.tsx` | Real-time generation metrics |
| `context-management-metrics.tsx` | Token context usage metrics |
| `test-integration.tsx` | Dev-only test integration helper |

---

## `components/dashboard/performance-dashboard/` (7 components)

| Component | Description |
|-----------|-------------|
| `performance-dashboard.tsx` | Main performance metrics shell |
| `generation-metrics-card.tsx` | Generation speed/quality metrics |
| `research-metrics-card.tsx` | Research phase metrics |
| `context-metrics-card.tsx` | Context window usage |
| `historical-trends-chart.tsx` | Historical performance chart (Recharts) |
| `performance-alerts.tsx` | Performance degradation alerts |
| `system-health-card.tsx` | System health indicators |

---

## `components/dashboard/workflow-dashboard/` (4 components)

| Component | Description |
|-----------|-------------|
| `WorkflowDashboard.tsx` | Intent workflow list and status overview |
| `WorkflowCard.tsx` | Single workflow summary card |
| `WorkflowDetailModal.tsx` | Workflow detail modal with step progress |
| `WorkflowFilters.tsx` | Workflow status/date filters |

---

## `components/dashboard/debug-dashboard/` (2 components)

| Component | Description |
|-----------|-------------|
| `log-viewer.tsx` | Real-time log stream viewer |
| `real-time-errors.tsx` | Live error monitoring display |

---

## `components/articles/` — Article Management (12 components)

| Component | Description |
|-----------|-------------|
| `article-generation-form.tsx` | Article generation form (keyword, style, length) |
| `generate-article-button.tsx` | Trigger generation button with state |
| `article-content-viewer.tsx` | Markdown content viewer (react-markdown) |
| `article-status-monitor.tsx` | Real-time status polling display |
| `visual-status-indicator.tsx` | FSM state → SVG/CSS visual mapping |
| `publish-history.tsx` | CMS publish history list |
| `PublishToCmsButton.tsx` | CMS publish trigger with adapter selection |
| `PublishToSocialButton.tsx` | Social publish trigger |
| `publish-to-wordpress-button.tsx` | WordPress-specific publish button |
| `SocialPublishModal.tsx` | Social platform selection modal |
| `SocialAnalytics.tsx` | Social post performance display |
| `trial-upgrade-card.tsx` | Trial upgrade prompt for article limits |
| `markdown-error-boundary.tsx` | Error boundary for markdown rendering |
| `progress-error-boundary.tsx` | Error boundary for progress displays |

---

## `components/workflows/` — Intent Workflow Steps (10 components)

| Component | Description |
|-----------|-------------|
| `CreateWorkflowForm.tsx` | New workflow creation form |
| `WorkflowStepLayoutClient.tsx` | Step wrapper with navigation controls |
| `steps/Step1ICPForm.tsx` | ICP definition form |
| `steps/Step2CompetitorsForm.tsx` | Competitor input form |
| `steps/Step3SeedsForm.tsx` | Seed keyword review/edit |
| `steps/Step4LongtailsForm.tsx` | Longtail keyword review |
| `steps/Step5FilteringForm.tsx` | Keyword filtering controls |
| `steps/Step6ClusteringForm.tsx` | Topic cluster visualization |
| `steps/Step7ValidationForm.tsx` | Cluster validation interface |
| `steps/Step8SubtopicsForm.tsx` | Subtopic approval form |
| `steps/ClusterPreviewPage.tsx` | Visual cluster preview |
| `steps/KeywordReviewPage.tsx` | Keyword list review with approval |
| `steps/KeywordOpportunityChart.tsx` | Keyword opportunity visualization (Recharts) |

---

## `components/onboarding/` — Onboarding Wizard (9 components)

| Component | Description |
|-----------|-------------|
| `OnboardingWizard.tsx` | Multi-step wizard shell with progress |
| `Stepper.tsx` | Step indicator navigation |
| `StepBusiness.tsx` | Business profile form (Step 1) |
| `StepCompetitors.tsx` | Competitor input form (Step 2) |
| `StepBlog.tsx` | Blog configuration (Step 3) |
| `StepKeywordSettings.tsx` | Keyword preferences (Step 4) |
| `StepContentDefaults.tsx` | Content default settings (Step 5) |
| `StepIntegration.tsx` | CMS integration setup (Step 6) |
| `StepCompletion.tsx` | Completion screen (Step 7) |
| `ai-enhanced-input.tsx` | AI-assisted text input with suggestions |
| `guided-tour/GuidedTour.tsx` | Product tour overlay |
| `guided-tour/GuidedTourWrapper.tsx` | Tour state context wrapper |

---

## `components/research/` (2 components)

| Component | Description |
|-----------|-------------|
| `keyword-research-form.tsx` | DataForSEO keyword research form |
| `keyword-results-table.tsx` | Keyword data results with volume/difficulty |

---

## `components/seo/` (4 components)

| Component | Description |
|-----------|-------------|
| `seo-score-display.tsx` | Overall SEO score gauge |
| `seo-recommendations.tsx` | Actionable SEO improvement list |
| `seo-reports.tsx` | Full SEO report view |
| `validation-results.tsx` | SEO validation rule results |

---

## `components/analytics/` (8 components)

| Component | Description |
|-----------|-------------|
| `analytics-dashboard.tsx` | Analytics overview dashboard |
| `performance-metrics-display.tsx` | Core metrics display |
| `trend-analysis.tsx` | Trend charts (Recharts) |
| `recommendation-engine.tsx` | AI-driven content recommendations |
| `simple-chart.tsx` | Lightweight Recharts wrapper |
| `data-export.tsx` | CSV/PDF export UI |
| `weekly-report-generator.tsx` | Weekly report trigger and preview |
| `ux-metrics-visualization.tsx` | UX metrics display |

---

## `components/settings/` (7 components)

| Component | Description |
|-----------|-------------|
| `CmsConnectionsManager.tsx` | CMS connections list and management |
| `CmsConnectionForm.tsx` | Add/edit CMS connection form |
| `WordPressIntegrationForm.tsx` | WordPress-specific integration form |
| `IntegrationsManager.tsx` | All integrations overview |
| `WebhooksPanel.tsx` | Outbound webhook management |
| `ApiKeysPanel.tsx` | v1 API key management |
| `audit-logs-table.tsx` | Organization audit log table |

---

## `components/marketing/` — Landing / Marketing Pages (20+ components)

| Component | Description |
|-----------|-------------|
| `LandingPage.tsx` | Main landing page |
| `HeroSection.tsx` | Hero with CTA |
| `FeatureShowcase.tsx` | Feature grid display |
| `HowItWorks.tsx` | Step-by-step explainer |
| `PricingSection.tsx` | Pricing plan cards |
| `Testimonials.tsx` | Social proof section |
| `FAQ.tsx` / `marketing/sections/FAQSection.tsx` | FAQ accordion |
| `FinalCTA.tsx` / `sections/CTASection.tsx` | Bottom CTA |
| `Navigation.tsx` / `navigation/MegaMenu.tsx` | Marketing site nav with mega menu |
| `Footer.tsx` | Site footer |
| `StatsBar.tsx` | Key stats display |
| `ProblemSection.tsx` | Problem/solution framing |
| `pricing/PricingPlans.tsx` | Full pricing comparison |
| `pricing/PricingComparison.tsx` | Feature comparison table |
| `pricing/PricingHero.tsx` | Pricing page hero |
| `pricing/PricingFAQ.tsx` | Pricing FAQ |
| `pricing/BespokeAIContentService.tsx` | Enterprise pricing section |
| `pricing/StickyUpgradeBar.tsx` | Sticky upgrade CTA bar |
| `pricing/MobileStickyUpgradeBar.tsx` | Mobile variant |
| `pages/FeaturePageTemplate.tsx` | Reusable feature page layout |
| `pages/SolutionPageTemplate.tsx` | Reusable solution page layout |

---

## `components/mobile/` — Mobile-Optimized (8 components)

| Component | Description |
|-----------|-------------|
| `mobile-article-status-list.tsx` | Touch-optimized article list |
| `mobile-bulk-actions.tsx` | Mobile bulk action sheet |
| `mobile-filter-panel.tsx` | Bottom-sheet filter panel |
| `mobile-activity-feed.tsx` | Mobile activity feed |
| `mobile-card.tsx` | Mobile-optimized card primitive |
| `mobile-list.tsx` | Mobile list with swipe actions |
| `touch-target.tsx` | 44px minimum touch target wrapper |
| `mobile/mobile-optimized-image.tsx` | Mobile image optimization |

---

## `components/guards/` (2 components)

| Component | Description |
|-----------|-------------|
| `payment-guard.tsx` | Redirects to upgrade if payment not active |
| `schedule-guard.tsx` | Guards scheduling features behind plan |

---

## `components/custom/` — Status Indicators (4 components)

| Component | Description |
|-----------|-------------|
| `article-state-badge.tsx` | FSM state → badge color/label |
| `confidence-badge.tsx` | AI confidence score indicator |
| `progress-bar.tsx` | Styled progress bar with label |
| `section-progress.tsx` | Section-level generation progress |

---

## `components/usage/` (2 components)

| Component | Description |
|-----------|-------------|
| `usage-meter.tsx` | Visual quota usage meter |
| `limit-reached-modal.tsx` | Usage limit reached modal with upgrade CTA |

---

## `components/admin/` (2 components)

| Component | Description |
|-----------|-------------|
| `performance/efficiency-metrics-card.tsx` | Admin efficiency metrics card |
| `performance/real-time-monitor.tsx` | Admin real-time system monitor |

---

## Design System Tooling

- **ESLint Plugin**: `tools/eslint-plugin-design-system/` — enforces design token usage, bans hardcoded colors
- **Storybook 10.1.11**: Component stories in `components/__stories__/` (if present) and `*.stories.tsx` files
- **Testing Library**: `@testing-library/react` 16.x for component unit tests
- **Vitest**: All component tests run via `vitest` (not Jest, despite `jest` being in devDeps for legacy)

---

*Total: 190 component files across 33 directories*  
*Standards enforced by: `tools/eslint-plugin-design-system/`*
