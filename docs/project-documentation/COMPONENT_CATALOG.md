# Infin8Content Component Catalog

## UI Components (`components/ui/`)

### Base Components

#### Button
- **File**: `components/ui/button.tsx`
- **Props**: `ButtonProps` extends `React.ButtonHTMLAttributes<HTMLButtonElement>`
- **Variants**: `default`, `secondary`, `outline`, `ghost`, `link`
- **Sizes**: `sm`, `md`, `lg`
- **Usage**: Primary action component throughout the application

#### Input
- **File**: `components/ui/input.tsx`
- **Props**: `InputProps` extends `React.InputHTMLAttributes<HTMLInputElement>`
- **Features**: Form validation, error states
- **Usage**: Form inputs, search fields, data entry

#### Card
- **File**: `components/ui/card.tsx`
- **Components**: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
- **Usage**: Content containers, dashboard widgets, article cards

#### Dialog
- **File**: `components/ui/dialog.tsx`
- **Components**: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`
- **Usage**: Modals, confirmations, forms

#### Avatar
- **File**: `components/ui/avatar.tsx`
- **Components**: `Avatar`, `AvatarImage`, `AvatarFallback`
- **Usage**: User profiles, comments, team members

#### Dropdown Menu
- **File**: `components/ui/dropdown-menu.tsx`
- **Components**: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`
- **Usage**: Navigation menus, action menus, user settings

#### Progress
- **File**: `components/ui/progress.tsx`
- **Props**: `ProgressProps` extends `React.HTMLAttributes<HTMLDivElement>`
- **Usage**: Loading states, completion indicators, upload progress

#### Separator
- **File**: `components/ui/separator.tsx`
- **Props**: `SeparatorProps` extends `React.HTMLAttributes<HTMLDivElement>`
- **Usage**: Visual content separation

#### Tooltip
- **File**: `components/ui/tooltip.tsx`
- **Components**: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`
- **Usage**: Contextual help, additional information

#### Slot
- **File**: `components/ui/slot.tsx`
- **Usage**: Component composition, polymorphic components

## Feature Components

### Article Components (`components/articles/`)

#### ArticleCard
- **File**: `components/articles/article-card.tsx`
- **Purpose**: Display article preview in list/grid
- **Props**: `article: Article`, `onEdit?: (article: Article) => void`, `onDelete?: (articleId: string) => void`
- **Features**: Title, excerpt, metadata, action buttons

#### ArticleEditor
- **File**: `components/articles/article-editor.tsx`
- **Purpose**: Rich text article editing
- **Props**: `article?: Article`, `onSave: (article: Article) => void`, `onCancel: () => void`
- **Features**: Rich text editing, auto-save, preview

#### ArticleList
- **File**: `components/articles/article-list.tsx`
- **Purpose**: Display collection of articles
- **Props**: `articles: Article[]`, `loading?: boolean`, `onArticleSelect: (article: Article) => void`
- **Features**: Filtering, sorting, pagination

#### ArticleView
- **File**: `components/articles/article-view.tsx`
- **Purpose**: Read-only article display
- **Props**: `article: Article`, `onEdit?: () => void`
- **Features**: Formatted content, metadata display, sharing

### Dashboard Components (`components/dashboard/`)

#### DashboardLayout
- **File**: `components/dashboard/dashboard-layout.tsx`
- **Purpose**: Main dashboard layout structure
- **Props**: `children: React.ReactNode`, `sidebar?: React.ReactNode`
- **Features**: Responsive layout, navigation, user menu

#### StatsCard
- **File**: `components/dashboard/stats-card.tsx`
- **Purpose**: Display key metrics
- **Props**: `title: string`, `value: string | number`, `change?: number`, `icon?: React.ReactNode`
- **Features**: Metric display, trend indicators

#### RecentActivity
- **File**: `components/dashboard/recent-activity.tsx`
- **Purpose**: Show recent user activity
- **Props**: `activities: Activity[]`, `maxItems?: number`
- **Features**: Activity feed, timestamps, user avatars

#### QuickActions
- **File**: `components/dashboard/quick-actions.tsx`
- **Purpose**: Common action shortcuts
- **Props**: `actions: QuickAction[]`
- **Features**: Action buttons, keyboard shortcuts

### Settings Components (`components/settings/`)

#### SettingsForm
- **File**: `components/settings/settings-form.tsx`
- **Purpose**: User/organization settings management
- **Props**: `settings: Settings`, `onSave: (settings: Settings) => void`
- **Features**: Form validation, auto-save, sections

#### ProfileSettings
- **File**: `components/settings/profile-settings.tsx`
- **Purpose**: User profile management
- **Props**: `user: User`, `onUpdate: (user: User) => void`
- **Features**: Avatar upload, profile fields, password change

#### OrganizationSettings
- **File**: `components/settings/organization-settings.tsx`
- **Purpose**: Organization configuration
- **Props**: `organization: Organization`, `onUpdate: (organization: Organization) => void`
- **Features**: Organization details, member management, billing

### Guard Components (`components/guards/`)

#### AuthGuard
- **File**: `components/guards/auth-guard.tsx`
- **Purpose**: Route protection for authenticated users
- **Props**: `children: React.ReactNode`, `redirectTo?: string`
- **Features**: Authentication check, redirect handling

#### RoleGuard
- **File**: `components/guards/role-guard.tsx`
- **Purpose**: Role-based access control
- **Props**: `children: React.ReactNode`, `roles: string[]`, `fallback?: React.ReactNode`
- **Features**: Role verification, access denied UI

#### SubscriptionGuard
- **File**: `components/guards/subscription-guard.tsx`
- **Purpose**: Subscription level access control
- **Props**: `children: React.ReactNode`, `requiredPlan: string`, `upgradeUrl?: string`
- **Features**: Plan verification, upgrade prompts

### Research Components (`components/research/`)

#### ResearchPanel
- **File**: `components/research/research-panel.tsx`
- **Purpose**: Research tools and content analysis
- **Props**: `content: string`, `onAnalysis: (analysis: ResearchAnalysis) => void`
- **Features**: Content analysis, keyword extraction, suggestions

#### SourceManager
- **File**: `components/research/source-manager.tsx`
- **Purpose**: Manage research sources and references
- **Props**: `sources: Source[]`, `onAddSource: (source: Source) => void`, `onRemoveSource: (sourceId: string) => void`
- **Features**: Source tracking, citation management, import/export

## Custom Hooks

### Core Hooks (`hooks/`)

#### useArticleProgress
- **File**: `hooks/use-article-progress.ts`
- **Purpose**: Track article reading/writing progress
- **Returns**: `{ progress: number, isComplete: boolean, updateProgress: (progress: number) => void }`
- **Features**: Auto-save progress, completion detection

#### useMobile
- **File**: `hooks/use-mobile.ts`
- **Purpose**: Mobile device detection
- **Returns**: `boolean`
- **Features**: Responsive design support

## Component Patterns

### Composition Pattern

```typescript
// Example: Card composition
<Card>
  <CardHeader>
    <CardTitle>Article Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Article content goes here...</p>
  </CardContent>
  <CardFooter>
    <Button>Read More</Button>
  </CardFooter>
</Card>
```

### Guard Pattern

```typescript
// Example: Route protection
<AuthGuard>
  <RoleGuard roles={['admin', 'editor']}>
    <ArticleEditor article={article} onSave={handleSave} />
  </RoleGuard>
</AuthGuard>
```

### Loading State Pattern

```typescript
// Example: Loading states
{loading ? (
  <ArticleCardSkeleton />
) : articles.length > 0 ? (
  <ArticleList articles={articles} />
) : (
  <EmptyState message="No articles found" />
)}
```

## Styling System

### Tailwind Configuration

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
}
```

### CSS Variables

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
}
```

## Accessibility

### ARIA Support

All components include proper ARIA attributes:

- `aria-label` for icon-only buttons
- `aria-describedby` for form validation
- `aria-expanded` for dropdown menus
- `role` attributes for semantic elements

### Keyboard Navigation

- Tab order follows logical flow
- Enter/Space for button activation
- Escape for modal dismissal
- Arrow keys for dropdown navigation

## Testing

### Component Testing

Each component includes corresponding test files:

```
tests/
├── components/
│   ├── ui/
│   │   ├── button.test.tsx
│   │   └── input.test.tsx
│   ├── articles/
│   │   ├── article-card.test.tsx
│   │   └── article-editor.test.tsx
│   └── dashboard/
│       ├── dashboard-layout.test.tsx
│       └── stats-card.test.tsx
```

### Test Examples

```typescript
// button.test.tsx
import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("handles click events", () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    screen.getByRole("button").click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## Performance Considerations

### Code Splitting

Heavy components use dynamic imports:

```typescript
const ChartComponent = dynamic(() => import('./chart-component'), {
  loading: () => <ChartSkeleton />,
  ssr: false
})
```

### Memoization

Components use `React.memo` for optimization:

```typescript
export const ArticleCard = React.memo(({ article, onEdit, onDelete }) => {
  // Component implementation
})
```

### Bundle Size Optimization

- Tree-shaking with specific imports
- Icon optimization with lucide-react
- CSS purging with Tailwind

---

*This component catalog provides a comprehensive overview of all reusable components in the Infin8Content application.*
