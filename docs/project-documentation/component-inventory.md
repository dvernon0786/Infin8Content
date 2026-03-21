# Component Inventory: Infin8Content

This inventory catalogs the reusable React components within the Infin8Content project, detailing their purpose and categorized by architectural layer.

## 1. UI Foundation (Primitives)
*Located in `/components/ui/` - Highly reusable, stateless primitives.*

-   **Button**: Customizable button with multiple variants (default, outline, ghost).
-   **Select / DropdownMenu**: Radix-powered accessible selection interfaces.
-   **Skeleton**: Placeholder components for loading states.
-   **Avatar**: User representation with fallback handling.
-   **Dialog / AlertDialog**: Modal overlays for critical actions (e.g., article deletion).
-   **Progress**: Linear indicators for generation and upload states.
-   **Sidebar**: Navigation container for the Dashboard.

## 2. Onboarding & Creation Wizard
*Located in `/components/onboarding/` - State-heavy components for the 9-step flow.*

-   **OnboardingWizard**: The container component managing step logic and persistence.
-   **Stepper**: Visual indicator of progress through the 9 steps.
-   **StepBlog**: Configuration for blog URL and brand voice.
-   **StepCompetitors**: URL input and analysis for target competitors.
-   **StepKeywordSettings**: Configuration for intent and search volume thresholds.
-   **StepCompletion**: Success UI after the workflow is initiated.
-   **AI-Enhanced Input**: Smart input fields that suggest improvements using LLMs.

## 3. Dashboard & Operations
*Located in `/components/custom/` & `/components/mobile/`*

-   **ArticleStateBadge**: Dynamic color-coded badge reflecting the generation lifecycle (Processing=Yellow, Completed=Green).
-   **ProgressBar**: High-precision progress tracking for the Inngest workflow.
-   **ConfidenceBadge**: Displays the AI's internal rating of grounding quality.
-   **MobileActivityFeed**: List of recent events optimized for small screens.
-   **MobileBulkActions**: Batch management interface for articles on touch devices.
-   **SectionProgress**: Granular tracking of individual article sections.

## 4. Research & SEO
*Located in `/components/research/` & `/components/seo/`*

-   **KeywordResultsTable**: Sortable, paginated display of DataForSEO metrics.
-   **KeywordResearchForm**: Targeted input for seed keywords and location settings.
-   **SEOScoreDisplay**: Circular gauge showing the quality score of an article.
-   **SEORecommendations**: Interactive list of suggested content improvements.
-   **ValidationResults**: Real-time feedback on article structure and citation density.

## 5. Security & Guards
*Located in `/components/guards/`*

-   **PaymentGuard**: Higher-order component that restricts access based on subscription status.
-   **OrganizationGuard**: Ensures the user has a valid organization context before rendering.

---
**Development Standard**: All components use Tailwind CSS 4 for styling and adhere to the project's accessibility guidelines (Radix-driven).
