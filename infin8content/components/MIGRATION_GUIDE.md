# Component Library Migration Guide

This guide helps migrate from existing components to the new enhanced component library.

## Overview

The new component library provides:
- Enhanced shadcn/ui components with brand styling
- Custom components for content management workflows
- Design token integration for consistency
- Improved accessibility and performance

## Migration Steps

### 1. Update Imports

#### Before
```tsx
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
```

#### After
```tsx
import { Button } from '@/components/ui/button' // Enhanced
import { ConfidenceBadge, ArticleStateBadge } from '@/components/custom'
import { ProgressBar, SectionProgress } from '@/components/custom'
```

### 2. Replace Button Variants

#### Before
```tsx
// Generic primary button
<Button variant="default">Primary</Button>

// Generic secondary button
<Button variant="secondary">Secondary</Button>

// Destructive action
<Button variant="destructive">Delete</Button>
```

#### After
```tsx
// Brand primary button
<Button variant="primary">Primary</Button>

// Brand secondary button
<Button variant="secondary">Secondary</Button>

// Ghost button for subtle actions
<Button variant="ghost">Cancel</Button>

// Destructive action (unchanged)
<Button variant="destructive">Delete</Button>
```

### 3. Replace Status Indicators

#### Before
```tsx
// Generic badge
<Badge variant="default">Status</Badge>

// Color-coded badges
<Badge className="bg-green-500">Success</Badge>
<Badge className="bg-yellow-500">Warning</Badge>
<Badge className="bg-red-500">Error</Badge>
```

#### After
```tsx
// Confidence levels
<ConfidenceBadge level="high" />
<ConfidenceBadge level="medium" />
<ConfidenceBadge level="low" />
<ConfidenceBadge level="veryLow" />

// Article states
<ArticleStateBadge state="draft" />
<ArticleStateBadge state="inReview" />
<ArticleStateBadge state="approved" />
<ArticleStateBadge state="published" />
```

### 4. Replace Progress Indicators

#### Before
```tsx
// Basic progress
<Progress value={50} />

// Custom progress bar
<div className="w-full bg-gray-200 rounded-full h-2">
  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '50%' }}></div>
</div>
```

#### After
```tsx
// Enhanced progress with brand styling
<ProgressBar value={50} />

// Brand gradient progress
<ProgressBar value={60} variant="brand" showLabel />

// Section-specific progress
<SectionProgress 
  sectionNumber={1}
  sectionName="Introduction"
  isActive
  progress={75}
  showProgress
/>
```

## Component Mapping

### Button Changes

| Old Variant | New Variant | Notes |
|-------------|-------------|-------|
| `default` | `primary` | Uses brand blue color |
| `secondary` | `secondary` | Uses brand purple color |
| `outline` | `ghost` | Subtle hover effect |
| `destructive` | `destructive` | Unchanged |

### Badge Changes

| Old Usage | New Component | Notes |
|-----------|--------------|-------|
| Status badges | `ArticleStateBadge` | Semantic states |
| Confidence indicators | `ConfidenceBadge` | AI confidence levels |
| Generic badges | `Badge` | Unchanged for generic use |

### Progress Changes

| Old Usage | New Component | Notes |
|-----------|--------------|-------|
| Basic progress | `ProgressBar` | Enhanced with variants |
| Custom progress | `ProgressBar` | Use brand variant |
| Section progress | `SectionProgress` | New component |

## CSS Migration

### Replace Hardcoded Colors

#### Before
```css
.bg-blue-500 { background-color: rgb(59 130 246); }
.bg-purple-500 { background-color: rgb(139 92 246); }
.bg-green-500 { background-color: rgb(34 197 94); }
.bg-yellow-500 { background-color: rgb(234 179 8); }
.bg-red-500 { background-color: rgb(239 68 68); }
```

#### After
```css
.bg-[--color-primary-blue] { background-color: var(--color-primary-blue); }
.bg-[--color-primary-purple] { background-color: var(--color-primary-purple); }
.bg-[--color-success] { background-color: var(--color-success); }
.bg-[--color-warning] { background-color: var(--color-warning); }
.bg-[--color-error] { background-color: var(--color-error); }
```

### Replace Gradient Backgrounds

#### Before
```css
.bg-gradient-to-r { background: linear-gradient(to right, ...); }
```

#### After
```css
.bg-[--gradient-brand] { background: var(--gradient-brand); }
```

## Accessibility Updates

### Add ARIA Labels

#### Before
```tsx
<ProgressBar value={50} />
<Badge>Status</Badge>
```

#### After
```tsx
<ProgressBar value={50} aria-label="Upload progress" />
<ConfidenceBadge level="medium" />
```

### Add Semantic Roles

#### Before
```tsx
<span className="badge">Status</span>
```

#### After
```tsx
<ArticleStateBadge state="draft" /> {/* Includes role="status" */}
```

## Testing Migration

### Update Component Tests

#### Before
```tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('renders button', () => {
  render(<Button>Click</Button>)
  expect(screen.getByRole('button')).toBeInTheDocument()
})
```

#### After
```tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('renders button with brand styling', () => {
  render(<Button variant="primary">Click</Button>)
  const button = screen.getByRole('button')
  expect(button).toHaveClass('bg-[--color-primary-blue]')
})
```

### Add New Component Tests

```tsx
import { render, screen } from '@testing-library/react'
import { ConfidenceBadge } from '@/components/custom/confidence-badge'

test('renders confidence badge with correct level', () => {
  render(<ConfidenceBadge level="high" />)
  const badge = screen.getByRole('status')
  expect(badge).toHaveClass('bg-[--color-success]')
  expect(badge).toHaveAttribute('aria-label', 'Confidence: High')
})
```

## Performance Considerations

### Bundle Size Impact

The new components add minimal bundle size:
- Enhanced Button: +0.5KB
- Custom components: +2KB total
- Design tokens: +0.1KB

### Runtime Performance

- Memoized components prevent unnecessary re-renders
- CSS transitions use transform for better performance
- Design tokens reduce CSS duplication

## Common Migration Issues

### Issue: CSS Specificity Conflicts

**Problem**: Custom styles not applying due to CSS specificity

**Solution**: Use design tokens or inline styles for critical properties

```tsx
// Problematic
<div className="bg-blue-500"> {/* Might be overridden */}

// Solution
<div className="bg-[--color-primary-blue]"> {/* Uses CSS variable */}
```

### Issue: Missing Design Tokens

**Problem**: Design tokens not loading

**Solution**: Ensure `globals.css` is imported in your app

```tsx
// In your app layout
import './globals.css' // Contains design tokens
```

### Issue: TypeScript Errors

**Problem**: Type errors with new component props

**Solution**: Update component interfaces

```tsx
// Before
interface Props {
  variant: 'default' | 'secondary'
}

// After
interface Props {
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive'
}
```

## Rollback Plan

If migration causes issues:

1. **Immediate Rollback**: Revert to previous component versions
2. **Gradual Migration**: Migrate one component at a time
3. **Feature Flags**: Use feature flags for new components
4. **Parallel Implementation**: Run both versions side-by-side

### Rollback Commands

```bash
# Revert component changes
git checkout HEAD~1 -- components/

# Reinstall previous dependencies
npm install

# Restart development server
npm run dev
```

## Support

For migration issues:

1. Check this documentation first
2. Review component examples in `/components/README.md`
3. Test components in isolation
4. Check browser console for CSS errors
5. Verify design tokens are loading

## Validation Checklist

After migration, verify:

- [ ] All buttons render with correct styling
- [ ] Badges show appropriate colors and states
- [ ] Progress indicators display correctly
- [ ] Accessibility attributes are present
- [ ] Design tokens are applied
- [ ] No CSS specificity conflicts
- [ ] Tests pass for migrated components
- [ ] Performance is acceptable
- [ ] Responsive design works
- [ ] Dark mode compatibility (if applicable)
