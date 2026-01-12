# Infin8Content Component Catalog

## Overview
This catalog documents all reusable components in the Infin8Content application, organized by feature area and functionality.

## Component Categories

### UI Components (`components/ui/`)
Base shadcn/ui components and custom UI primitives.

#### Core UI
- **Button**: Custom button variants and styles
- **Card**: Card container components
- **Input**: Form input components
- **Label**: Form label components
- **Select**: Dropdown selection components
- **Textarea**: Multi-line text input
- **Dialog**: Modal dialog components
- **Avatar**: User avatar display
- **Progress**: Progress indicators
- **Separator**: Visual separators
- **Tooltip**: Tooltip components
- **Breadcrumb**: Navigation breadcrumbs

### Article Components (`components/articles/`)

#### Article Generation & Management
- **ArticleGenerationForm**: Form for creating new articles
  - Props: `onGenerate`, `isLoading`, `error`, `initialKeyword`
  - Features: Keyword input, word count selection, validation

- **ArticleContentViewer**: Displays article content sections
  - Props: `sections` (ArticleSection[])
  - Features: Markdown rendering, section navigation

- **EnhancedArticleContentViewer**: Advanced article viewer with SEO
  - Props: `sections`, `articleId`, `articleTitle`, `isLoading`
  - Features: SEO reports, recommendations, validation

#### Progress Tracking
- **ProgressTracker**: Real-time article generation progress
  - Props: `articleId`, `className`
  - Features: WebSocket updates, error boundaries

- **VisualStatusIndicator**: Visual progress and status display
  - Props: `status`, `progress`, `title`, `showETA`, `compact`
  - Features: Animated progress bars, status colors

- **ArticleQueueStatus**: Shows queued article generation status
  - Props: `organizationId`, `showCompleted`, `maxItems`
  - Features: Real-time queue updates

#### Time & Performance
- **TimeEstimation**: Estimated completion time display
  - Props: `estimatedSeconds`, `actualSeconds`, `className`
  - Features: Time formatting, progress calculation

### Dashboard Components (`components/dashboard/`)

#### Filtering & Search
- **FilterDropdown**: Dropdown for article status filtering
  - Props: `value`, `onChange`, `availableStatuses`, `disabled`
  - Features: Multi-select, clear all

- **SearchInput**: Article search functionality
  - Props: `value`, `onChange`, `onClear`, `placeholder`, `disabled`
  - Features: Debounced search, clear button

- **ActiveFilters**: Display currently active filters
  - Props: `filters`, `search`, `onClearFilter`, `className`
  - Features: Filter badges, clear all, mobile responsive

- **QuickFilters**: Quick filter preset buttons
  - Props: `onFilterChange`, `disabled`
  - Features: Common filter combinations

#### Sorting & Display
- **SortDropdown**: Article sorting options
  - Props: `value`, `onChange`, `disabled`, `options`
  - Features: Multiple sort fields, directions

- **VirtualizedArticleList**: Performance-optimized article list
  - Props: `articles`, `itemHeight`, `height`, `onArticleClick`
  - Features: Virtual scrolling, infinite loading

- **ArticleStatusList**: List of articles with status
  - Props: `orgId`, `maxItems`, `showCompleted`, `onUpdate`
  - Features: Real-time updates, status indicators

#### Navigation & Layout
- **TopNavigation**: Main application navigation
  - Props: `email`, `name`, `avatarUrl`
  - Features: User menu, logout, navigation links

#### Error Handling
- **ErrorBoundary**: React error boundary for dashboard
  - Features: Error logging, fallback UI
- **useErrorHandler**: Hook for error handling in components

### Research Components (`components/research/`)

#### Keyword Research
- **KeywordResearchForm**: Form for keyword research
  - Props: `onResearch`, `isLoading`, `error`
  - Features: Keyword validation, research submission

- **KeywordResultsTable**: Display keyword research results
  - Props: `results`, `isLoading`
  - Features: Sorting, filtering, export options

### SEO Components (`components/seo/`)

#### SEO Analysis
- **SEOScoreDisplay**: SEO score visualization
  - Props: `scoreResult`, `showDetails`, `compact`
  - Features: Score grades, color coding, detailed metrics

- **SEOReports**: Comprehensive SEO reports
  - Props: `report`, `onExport`, `className`
  - Features: Multiple report types, export functionality

- **SEORecommendations**: SEO improvement suggestions
  - Props: `recommendations`, `onApplyRecommendation`, `className`
  - Features: Actionable recommendations, apply functionality

- **ValidationResults**: SEO validation results
  - Props: `result`, `className`
  - Features: Error/warning/info display, severity indicators

### Settings Components (`components/settings/`)

#### Organization Management
- **AuditLogsTable**: Organization audit log display
  - Features: Log filtering, pagination, export
  - Props: None (uses internal state)

### Navigation Components (`components/navigation/`)

#### Error Handling
- **NavigationErrorBoundary**: Error boundary for navigation
  - Features: Navigation error recovery
- **useNavigationErrorBoundary**: Hook for navigation error handling

### Guards Components (`components/guards/`)

#### Route Protection
- **AuthGuard**: Authentication route protection
  - Features: Redirect logic, loading states
  - Props: `children`, `requiredRole`

## Custom Hooks (`hooks/`)

### Article Management
- **useArticleNavigation**: Article browsing and navigation
  - Features: Keyboard navigation, article history
  - Returns: Navigation methods and state

- **useArticleProgress**: Real-time article progress tracking
  - Features: WebSocket updates, progress calculation
  - Returns: Progress data and status

- **useRealtimeArticles**: Real-time article updates
  - Features: Supabase real-time subscriptions
  - Returns: Article data and updates

### Dashboard Management
- **useDashboardFilters**: Dashboard filter state management
  - Features: Filter persistence, validation
  - Returns: Filter state and methods

### Utility Hooks
- **useMobile**: Mobile device detection
  - Features: Responsive breakpoints
  - Returns: Mobile state and utilities

## TypeScript Types

### Core Types
```typescript
// Article Progress
export type ArticleProgressStatus = 
  | 'queued' | 'researching' | 'writing' 
  | 'generating' | 'completed' | 'failed';

// Article Section
export interface ArticleSection {
  id: string;
  title: string;
  content: string;
  order: number;
  word_count: number;
}

// Filter State
export interface FilterState {
  status: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  category: string[];
}

// Search State
export interface SearchState {
  query: string;
  results: Article[];
  isLoading: boolean;
}
```

## Component Patterns

### Error Boundaries
Most components include error boundary integration:
- Progress components use `ProgressErrorBoundary`
- Dashboard uses `ErrorBoundary`
- Navigation uses `NavigationErrorBoundary`

### Real-time Updates
Components that support real-time features:
- `ProgressTracker` - WebSocket progress updates
- `ArticleQueueStatus` - Queue status updates
- `useRealtimeArticles` - Article data updates

### Responsive Design
Mobile-optimized variants:
- `MobileStatusIndicator`
- `MobileVirtualizedArticleList`
- `CompactActiveFilters`

### Performance Optimization
Virtualized components for large datasets:
- `VirtualizedArticleList`
- `AdaptiveVirtualizedArticleList`

## Usage Guidelines

### Component Import Patterns
```typescript
// Feature components
import { ArticleGenerationForm } from '@/components/articles/article-generation-form';
import { ProgressTracker } from '@/components/articles/progress-tracker';

// UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Hooks
import { useArticleProgress } from '@/hooks/use-article-progress';
import { useDashboardFilters } from '@/hooks/use-dashboard-filters';
```

### Error Handling
```typescript
// Using error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <DashboardComponent />
</ErrorBoundary>

// Using error handler hook
const { handleError } = useErrorHandler();
```

### Real-time Features
```typescript
// Real-time progress tracking
const { progress, isLoading, error } = useArticleProgress(articleId);

// Real-time article updates
const { articles, isConnected } = useRealtimeArticles(orgId);
```

---

*Generated: 2026-01-13T10:24:00.000Z*  
*Component Count: 50+ documented components*  
*Documentation Version: 1.0*
