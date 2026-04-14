# Component Inventory - Infin8Content

This document provides a comprehensive inventory of the React components used in the Infin8Content platform, categorized by their primary function and location.

## Totals
- **Total Components**: 160+
- **Primary Framework**: React 19.2.3 (Next.js 16.1.1)
- **Styling**: Tailwind CSS 4
- **UI Base**: Radix UI Primitives

---

## 🏗️ Design System (UI Base)
Located in `infin8content/components/ui/`. These are the atomic building blocks of the platform.

| Category | Components |
| :--- | :--- |
| **Inputs & Forms** | `button.tsx`, `input.tsx`, `select.tsx`, `checkbox.tsx`, `textarea.tsx`, `switch.tsx`, `label.tsx`, `autocomplete-dropdown.tsx` |
| **Feedback & Status** | `badge.tsx`, `progress.tsx`, `skeleton.tsx`, `alert-dialog.tsx`, `error-reporter.tsx` |
| **Overlays & Layout** | `dialog.tsx`, `sheet.tsx`, `tooltip.tsx`, `dropdown-menu.tsx`, `sidebar.tsx`, `separator.tsx`, `breadcrumb.tsx` |
| **Displays** | `avatar.tsx`, `card.tsx`, `optimized-image.tsx` |

---

## 🔄 Intent Workflow Components
Located in `infin8content/components/workflows/`. These components drive the 9-step content strategy pipeline.

| Category | Components |
| :--- | :--- |
| **Layout & Nav** | `WorkflowStepLayoutClient.tsx`, `CreateWorkflowForm.tsx` |
| **Step 1 (ICP)** | `Step1ICPForm.tsx` |
| **Step 2 (Competitors)**| `Step2CompetitorsForm.tsx` |
| **Step 3 (Seeds)** | `Step3SeedsForm.tsx` |
| **Step 4 (Longtails)** | `Step4LongtailsForm.tsx` |
| **Step 5 (Filtering)** | `Step5FilteringForm.tsx` |
| **Step 6 (Clustering)** | `Step6ClusteringForm.tsx`, `KeywordOpportunityChart.tsx` |
| **Step 7 (Validation)** | `Step7ValidationForm.tsx` |
| **Step 8 (Subtopics)** | `Step8SubtopicsForm.tsx` |
| **Step 9 (Articles)** | `Step9ArticlesForm.tsx` |
| **Display Views** | `KeywordReviewPage.tsx`, `ClusterPreviewPage.tsx` |

---

## 📊 Dashboard & Monitoring
Located in `infin8content/components/dashboard/`.

| Category | Components |
| :--- | :--- |
| **Management** | `WorkflowCard.tsx`, `WorkflowDashboard.tsx`, `WorkflowFilters.tsx`, `WorkflowDetailModal.tsx`, `ArticleStatusList.tsx` |
| **Actions** | `QuickActions.tsx`, `BulkActionsBar.tsx`, `SearchInput.tsx`, `SortDropdown.tsx` |
| **Progress** | `GenerationProgress.tsx`, `ParallelSectionProgress.tsx`, `ResearchPhaseVisualization.tsx`, `TimeEstimation.tsx` |
| **Performance** | `PerformanceDashboard.tsx`, `EfficiencyMetricsDashboard.tsx`, `HistoricalTrendsChart.tsx`, `SystemHealthCard.tsx` |
| **Misc** | `SidebarNavigation.tsx`, `ResponsiveLayoutProvider.tsx`, `ErrorBoundary.tsx` |

---

## 📝 Article Management
Located in `infin8content/components/articles/`.

| Component | Description |
| :--- | :--- |
| `ArticleContentViewer.tsx` | Enhanced markdown viewer for generated content. |
| `GenerateArticleButton.tsx` | Manual trigger for the generation pipeline. |
| `PublishToWordpressButton.tsx`| Idempotent publishing trigger. |
| `ArticleStatusMonitor.tsx` | Real-time tracking of generation status. |
| `ProgressTracker.tsx` | Visual progress for article assembly. |
| `SectionProgress.tsx` | Nested progress for individual article sections. |

---

## 📈 Search Engine Optimization (SEO)
Located in `infin8content/components/seo/`.

| Component | Description |
| :--- | :--- |
| `SEOScoreDisplay.tsx` | Visual gauge for article SEO strength. |
| `SEORecommendations.tsx` | AI-generated improvement tasks for articles. |
| `SEOReports.tsx` | Historical SEO performance reporting. |
| `ValidationResults.tsx` | Technical SEO checklist results. |

---

## 🚀 Onboarding & Startup
Located in `infin8content/components/onboarding/`.

| Component | Description |
| :--- | :--- |
| `OnboardingWizard.tsx` | Central state manager for the multi-step onboarding. |
| `Stepper.tsx` | Visual progression for the wizard. |
| `StepBusiness.tsx` | Organization and ICP initialization. |
| `StepCompetitors.tsx` | Initial competitor URL setup. |
| `StepIntegration.tsx` | External service connection settings. |
| `AIEnhancedInput.tsx` | Smart input with AI autocompletion. |

---

## 📱 Mobile-Specific Components
Located in `infin8content/components/mobile/`.

| Component | Description |
| :--- | :--- |
| `MobileList.tsx` | Optimized list view for small screens. |
| `TouchTarget.tsx` | Utility for accessible tap targets. |
| `MobileFilterPanel.tsx` | Bottom-sheet style filtering. |
| `MobileActivityFeed.tsx` | Condensed chronological updates. |

---

## 🛠️ Infrastructure & Guards
- **Payment Guard**: `components/guards/payment-guard.tsx` - Subscription checking.
- **Error Boundary**: `components/dashboard/error-boundary.tsx` - Global crash protection.
- **Analytics Visualization**: `components/analytics/trend-analysis.tsx` - Charting data.
