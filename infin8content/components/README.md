# Infin8Content Component Library

A comprehensive component library built on shadcn/ui with custom enhancements for the Infin8Content platform.

## Overview

This component library extends the base shadcn/ui components with brand-specific styling, design token integration, and custom components tailored for content management workflows.

## Architecture

### Base Components (`/components/ui/`)
Enhanced shadcn/ui components with design token integration:
- **Button**: 4 variants (Primary, Secondary, Ghost, Destructive) with loading states
- **Badge**: Enhanced with semantic color mapping
- **Progress**: Base progress primitives with brand styling

### Custom Components (`/components/custom/`)
Platform-specific components:
- **ProgressBar**: Brand gradient progress indicators
- **SectionProgress**: Section-specific progress with dynamic text
- **ConfidenceBadge**: AI confidence level indicators
- **ArticleStateBadge**: Article status indicators

### Utility Library (`/components/lib/`)
Shared styling utilities and configurations:
- **component-styles.ts**: Design tokens, color mappings, and utility functions

## Design Token Integration

All components integrate with CSS design tokens from Story 30.1:

```css
/* Brand Colors */
--color-primary-blue: #217CEB
--color-primary-purple: #4A42CC
--gradient-brand: linear-gradient(90deg, #217CEB 0%, #4A42CC 100%)

/* Semantic Colors */
--color-success: #10B981
--color-warning: #F59E0B
--color-error: #EF4444
--color-info: #3B82F6
```

## Component Usage

### Button Component

Enhanced button with 4 variants and loading states:

```tsx
import { Button } from '@/components/ui/button'

// Primary variant (default)
<Button onClick={handleClick}>Primary Button</Button>

// Secondary variant
<Button variant="secondary">Secondary Button</Button>

// Ghost variant
<Button variant="ghost">Ghost Button</Button>

// Destructive variant
<Button variant="destructive">Delete</Button>

// Loading state
<Button loading>Processing...</Button>

// Disabled state
<Button disabled>Disabled</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Progress Components

#### ProgressBar
Brand gradient progress bar with accessibility:

```tsx
import { ProgressBar } from '@/components/custom/progress-bar'

// Basic usage
<ProgressBar value={75} />

// With brand gradient
<ProgressBar value={60} variant="brand" />

// With label
<ProgressBar value={45} showLabel />

// Different sizes
<ProgressBar value={30} size="lg" />

// Accessibility
<ProgressBar 
  value={50} 
  aria-label="Upload progress"
  aria-describedby="progress-description"
/>
```

#### SectionProgress
Section-specific progress with dynamic text:

```tsx
import { SectionProgress } from '@/components/custom/section-progress'

// Active section with progress
<SectionProgress 
  sectionNumber={1}
  sectionName="Introduction"
  isActive
  progress={65}
  showProgress
/>

// Completed section
<SectionProgress 
  sectionNumber={2}
  sectionName="Methods"
  isCompleted
/>

// Error state
<SectionProgress 
  sectionNumber={3}
  sectionName="Results"
  hasError
/>

// Different sizes
<SectionProgress 
  sectionNumber={4}
  sectionName="Conclusion"
  size="lg"
/>
```

### Badge Components

#### ConfidenceBadge
AI confidence level indicators:

```tsx
import { ConfidenceBadge } from '@/components/custom/confidence-badge'

// Different confidence levels
<ConfidenceBadge level="high" />
<ConfidenceBadge level="medium" />
<ConfidenceBadge level="low" />
<ConfidenceBadge level="veryLow" />

// With tooltip
<ConfidenceBadge 
  level="medium" 
  showTooltip
  tooltipText="AI confidence score based on data quality"
/>

// Different sizes
<ConfidenceBadge level="high" size="lg" />

// Without icon
<ConfidenceBadge level="low" showIcon={false} />
```

#### ArticleStateBadge
Article status indicators:

```tsx
import { ArticleStateBadge } from '@/components/custom/article-state-badge'

// Different states
<ArticleStateBadge state="draft" />
<ArticleStateBadge state="inReview" />
<ArticleStateBadge state="approved" />
<ArticleStateBadge state="published" />

// With tooltip
<ArticleStateBadge 
  state="inReview"
  showTooltip
  tooltipText="Currently under editorial review"
/>

// Different variants
<ArticleStateBadge state="draft" variant="outline" />
<ArticleStateBadge state="approved" variant="subtle" />

// Custom text
<ArticleStateBadge state="published">Live</ArticleStateBadge>
```

## Design Patterns

### Color Mapping

Semantic color mapping ensures consistency:

```typescript
const confidenceLevels = {
  high: { color: 'var(--color-success)', label: 'High' },
  medium: { color: 'var(--color-warning)', label: 'Medium' },
  low: { color: 'var(--color-warning)', label: 'Low' },
  veryLow: { color: 'var(--color-error)', label: 'Very Low' },
}

const articleStates = {
  draft: { color: 'var(--color-info)', label: 'Draft' },
  inReview: { color: 'var(--color-warning)', label: 'In Review' },
  approved: { color: 'var(--color-success)', label: 'Approved' },
  published: { color: 'var(--color-success)', label: 'Published' },
}
```

### Accessibility Patterns

All components follow WCAG 2.1 AA guidelines:

- **Semantic HTML**: Proper element roles and structure
- **ARIA Labels**: Descriptive labels for screen readers
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: Sufficient contrast ratios for text
- **Focus Management**: Visible focus indicators

### Animation Patterns

Consistent animation timing and easing:

```css
/* Standard transitions */
transition-all duration-200 ease-out
transition-all duration-300 ease-in-out
transition-all duration-500 ease-out

/* Loading animations */
animate-spin
animate-pulse
```

## Anti-Patterns

### Avoid These Common Mistakes

1. **Hardcoded Colors**: Always use design tokens
   ```tsx
   // ❌ Wrong
   <div style={{ backgroundColor: '#217CEB' }}>
   
   // ✅ Correct
   <div className="bg-[--color-primary-blue]">
   ```

2. **Missing Accessibility**: Always include ARIA attributes
   ```tsx
   // ❌ Wrong
   <ProgressBar value={50} />
   
   // ✅ Correct
   <ProgressBar 
     value={50} 
     aria-label="Upload progress"
     role="progressbar"
   />
   ```

3. **Inconsistent Sizing**: Use defined size variants
   ```tsx
   // ❌ Wrong
   <div className="h-4 w-4">
   
   // ✅ Correct
   <div className="size-4">
   ```

## Migration Guide

### From shadcn/ui Base Components

#### Button
```tsx
// Before
import { Button } from '@/components/ui/button'
<Button variant="default">Click</Button>

// After (enhanced with brand variants)
import { Button } from '@/components/ui/button'
<Button variant="primary">Click</Button> // Uses brand blue
```

#### Badge
```tsx
// Before
import { Badge } from '@/components/ui/badge'
<Badge>Success</Badge>

// After (use semantic badges)
import { ConfidenceBadge } from '@/components/custom/confidence-badge'
<ConfidenceBadge level="high" />
```

### CSS Migration

Replace hardcoded colors with design tokens:

```css
/* Before */
.bg-blue-500 {
  background-color: rgb(59 130 246);
}

/* After */
.bg-[--color-primary-blue] {
  background-color: var(--color-primary-blue);
}
```

## Testing

### Component Testing Structure

```
__tests__/components/
├── ui/
│   └── button.test.tsx
└── custom/
    ├── progress-bar.test.tsx
    ├── section-progress.test.tsx
    ├── confidence-badge.test.tsx
    └── article-state-badge.test.tsx
```

### Testing Patterns

1. **Basic Rendering**: Test default props and rendering
2. **Variants**: Test all component variants
3. **Accessibility**: Test ARIA attributes and keyboard navigation
4. **Interactions**: Test user interactions and state changes
5. **Responsive**: Test different sizes and viewports

## Performance Considerations

### Bundle Optimization

- **Tree Shaking**: Components are properly exported for tree shaking
- **Code Splitting**: Load components on demand when possible
- **CSS Optimization**: Design tokens reduce CSS duplication

### Runtime Performance

- **React.memo**: Components use memo for expensive renders
- **CSS Transforms**: Use transforms over layout changes for animations
- **Debounced Updates**: Progress indicators use efficient update patterns

## Future Enhancements

### Planned Components

1. **DataTable**: Enhanced data table with sorting and filtering
2. **StatusIndicator**: Generic status indicator component
3. **NotificationToast**: Toast notification system
4. **Modal**: Enhanced modal with accessibility features

### Design System Evolution

1. **Dark Mode**: Complete dark mode support
2. **Theme Switching**: Dynamic theme switching
3. **Custom Themes**: Support for custom brand themes
4. **Component Variants**: Extended variant system

## Contributing

### Component Development Guidelines

1. **Design Token First**: Always integrate with design tokens
2. **Accessibility First**: Ensure WCAG compliance
3. **Test Coverage**: Maintain >95% test coverage
4. **Documentation**: Update README and component docs
5. **Performance**: Consider bundle size and runtime performance

### Code Review Checklist

- [ ] Design tokens used correctly
- [ ] Accessibility attributes included
- [ ] Tests cover all variants
- [ ] Documentation updated
- [ ] Performance impact considered
- [ ] TypeScript types are strict

## Support

For questions or issues with the component library:

1. Check this documentation first
2. Review existing component tests
3. Check design token definitions in `globals.css`
4. Consult the Dev Agent Record in story files
5. Review LayoutDiagnostic tool for layout issues
