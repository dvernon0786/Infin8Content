# Component Patterns and Best Practices

This document outlines the recommended patterns and best practices for using the Infin8Content component library.

## Design Patterns

### 1. Progressive Enhancement Pattern

Start with base functionality and enhance with optional features:

```tsx
// Base component
<Button onClick={handleClick}>Basic Action</Button>

// Enhanced with loading state
<Button onClick={handleClick} loading={isLoading}>
  {isLoading ? 'Processing...' : 'Basic Action'}
</Button>

// Enhanced with icon and tooltip
<Button 
  onClick={handleClick} 
  variant="primary"
  data-tooltip="Click to perform action"
>
  <Icon className="w-4 h-4 mr-2" />
  Enhanced Action
</Button>
```

### 2. Semantic State Pattern

Use semantic components for state representation:

```tsx
// Instead of generic badges
<Badge className="bg-green-500">Success</Badge>
<Badge className="bg-yellow-500">Warning</Badge>

// Use semantic components
<ConfidenceBadge level="high" />
<ArticleStateBadge state="inReview" />
```

### 3. Composition Pattern

Combine components for complex UI elements:

```tsx
// Progress section with status
<div className="space-y-4">
  <SectionProgress 
    sectionNumber={1}
    sectionName="Research"
    isCompleted
  />
  <SectionProgress 
    sectionNumber={2}
    sectionName="Writing"
    isActive
    progress={65}
    showProgress
  />
  <div className="flex items-center gap-2">
    <ConfidenceBadge level="medium" size="sm" />
    <span className="text-sm text-muted-foreground">AI Confidence</span>
  </div>
</div>
```

### 4. Responsive Pattern

Use size variants for responsive design:

```tsx
// Mobile-first approach
<div className="block lg:hidden">
  <Button size="sm" variant="ghost">Action</Button>
</div>
<div className="hidden lg:block">
  <Button size="default" variant="primary">Full Action</Button>
</div>
```

## Usage Patterns

### Button Patterns

#### Primary Actions
```tsx
// Main call-to-action
<Button variant="primary" size="lg" onClick={handlePrimaryAction}>
  Get Started
</Button>

// Secondary actions
<Button variant="secondary" onClick={handleSecondaryAction}>
  Learn More
</Button>
```

#### Form Actions
```tsx
// Submit button with loading
<Button 
  type="submit" 
  variant="primary" 
  loading={isSubmitting}
  disabled={isSubmitting}
>
  {isSubmitting ? 'Saving...' : 'Save Changes'}
</Button>

// Cancel button
<Button variant="ghost" onClick={handleCancel}>
  Cancel
</Button>
```

#### Destructive Actions
```tsx
<Button 
  variant="destructive" 
  onClick={handleDelete}
  disabled={!canDelete}
>
  Delete Item
</Button>
```

### Progress Patterns

#### Upload Progress
```tsx
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Uploading file...</span>
    <span>{uploadProgress}%</span>
  </div>
  <ProgressBar 
    value={uploadProgress} 
    variant="brand"
    showLabel={false}
    aria-label="File upload progress"
  />
</div>
```

#### Multi-Step Progress
```tsx
<div className="space-y-3">
  {steps.map((step, index) => (
    <SectionProgress
      key={step.id}
      sectionNumber={index + 1}
      sectionName={step.name}
      isCompleted={step.completed}
      isActive={step.active}
      hasError={step.error}
      progress={step.progress}
      showProgress={step.active}
    />
  ))}
</div>
```

### Badge Patterns

#### Status Indicators
```tsx
// Article status in list
<div className="flex items-center gap-2">
  <h3 className="font-medium">{article.title}</h3>
  <ArticleStateBadge state={article.state} size="sm" />
</div>

// Confidence indicators
<div className="flex items-center gap-4">
  <ConfidenceBadge 
    level={article.confidence} 
    showTooltip 
    tooltipText="AI confidence score based on data quality and sources"
  />
  <span className="text-sm text-muted-foreground">
    Confidence: {article.confidence}
  </span>
</div>
```

#### Filter Badges
```tsx
// Active filters
<div className="flex flex-wrap gap-2">
  {activeFilters.map(filter => (
    <ArticleStateBadge
      key={filter}
      state={filter}
      variant="outline"
      size="sm"
      showIcon={false}
    />
  ))}
</div>
```

## Anti-Patterns

### 1. Overriding Design Tokens

Don't hardcode colors that should use design tokens:

```tsx
// ❌ Wrong
<div style={{ backgroundColor: '#217CEB' }}>
<div className="bg-blue-500">

// ✅ Correct
<div className="bg-[--color-primary-blue]">
```

### 2. Missing Accessibility

Always include proper ARIA attributes:

```tsx
// ❌ Wrong
<ProgressBar value={50} />
<Badge>Status</Badge>

// ✅ Correct
<ProgressBar 
  value={50} 
  aria-label="Upload progress"
  role="progressbar"
/>
<ConfidenceBadge level="medium" /> {/* Includes proper ARIA */}
```

### 3. Inconsistent Sizing

Use defined size variants instead of arbitrary sizing:

```tsx
// ❌ Wrong
<div className="h-3 w-3">
<div className="text-xs px-1 py-0.5">

// ✅ Correct
<div className="size-3">
<Badge size="sm">
```

### 4. Breaking Component Contracts

Don't modify component internals or required props:

```tsx
// ❌ Wrong
const BadButton = ({ children, ...props }) => (
  <Button {...props} className="bg-red-500"> {/* Overrides variant */}
    {children}
  </Button>
)

// ✅ Correct
const GoodButton = ({ children, ...props }) => (
  <Button variant="destructive" {...props}>
    {children}
  </Button>
)
```

## Performance Patterns

### 1. Memoization

Use React.memo for expensive components:

```tsx
import React from 'react'

const ExpensiveProgress = React.memo(({ value, variant }: ProgressBarProps) => {
  // Complex calculations here
  return <ProgressBar value={value} variant={variant} />
})
```

### 2. Conditional Rendering

Render components conditionally to avoid unnecessary work:

```tsx
// Only render progress when active
{isActive && (
  <SectionProgress 
    sectionNumber={section.number}
    sectionName={section.name}
    isActive={true}
    progress={section.progress}
  />
)}
```

### 3. Event Handler Optimization

Use useCallback for event handlers:

```tsx
import React, { useCallback } from 'react'

const Component = () => {
  const handleClick = useCallback(() => {
    // Handle click
  }, [])

  return <Button onClick={handleClick}>Click me</Button>
}
```

## Testing Patterns

### 1. Component Testing

Test component behavior and accessibility:

```tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('button handles click events', async () => {
  const handleClick = vi.fn()
  render(<Button onClick={handleClick}>Click me</Button>)
  
  const button = screen.getByRole('button')
  await userEvent.click(button)
  
  expect(handleClick).toHaveBeenCalledTimes(1)
})

test('button has proper accessibility attributes', () => {
  render(<Button aria-label="Submit form">Submit</Button>)
  
  const button = screen.getByRole('button')
  expect(button).toHaveAttribute('aria-label', 'Submit form')
})
```

### 2. Visual Testing

Test component appearance and responsive behavior:

```tsx
test('confidence badge applies correct colors', () => {
  render(<ConfidenceBadge level="high" />)
  
  const badge = screen.getByRole('status')
  expect(badge).toHaveClass('bg-[--color-success]')
})
```

### 3. Integration Testing

Test component interactions:

```tsx
test('progress bar updates with new value', async () => {
  const { rerender } = render(<ProgressBar value={25} />)
  
  let progressBar = screen.getByRole('progressbar')
  expect(progressBar).toHaveAttribute('aria-valuenow', '25')
  
  rerender(<ProgressBar value={75} />)
  progressBar = screen.getByRole('progressbar')
  expect(progressBar).toHaveAttribute('aria-valuenow', '75')
})
```

## Responsive Patterns

### 1. Mobile-First Design

Start with mobile layout and enhance for larger screens:

```tsx
// Mobile: stacked layout
<div className="space-y-4 lg:space-y-0 lg:flex lg:gap-4">
  <Button size="sm" variant="ghost" className="lg:hidden">
    Mobile Action
  </Button>
  <Button variant="primary" className="hidden lg:block">
    Desktop Action
  </Button>
</div>
```

### 2. Adaptive Sizing

Use different sizes based on viewport:

```tsx
// Smaller buttons on mobile
<Button 
  size="sm" 
  className="md:size-default lg:size-lg"
>
  Responsive Button
</Button>
```

### 3. Touch-Friendly Interactions

Ensure touch targets are large enough on mobile:

```tsx
// Minimum touch target: 44px
<Button 
  size="lg" 
  className="min-h-[44px] min-w-[44px]"
>
  Touch Button
</Button>
```

## Error Handling Patterns

### 1. Graceful Degradation

Provide fallbacks when features fail:

```tsx
const SafeProgress = ({ value, ...props }) => {
  if (typeof value !== 'number' || value < 0 || value > 100) {
    return <div className="text-muted-foreground">Progress unavailable</div>
  }
  
  return <ProgressBar value={value} {...props} />
}
```

### 2. Error States

Use error variants for error conditions:

```tsx
<SectionProgress
  sectionNumber={1}
  sectionName="Failed Section"
  hasError={error}
/>
```

### 3. Loading States

Show loading states during async operations:

```tsx
<Button 
  loading={isLoading}
  disabled={isLoading}
  onClick={handleSubmit}
>
  {isLoading ? 'Submitting...' : 'Submit'}
</Button>
```

## Composition Guidelines

### 1. Component Composition

Combine small components to build complex UI:

```tsx
// Complex status indicator
const ArticleStatus = ({ article }) => (
  <div className="flex items-center gap-3">
    <ArticleStateBadge state={article.state} />
    <ConfidenceBadge level={article.confidence} size="sm" />
    <div className="text-sm text-muted-foreground">
      Updated {formatDate(article.updatedAt)}
    </div>
  </div>
)
```

### 2. Layout Components

Create layout components that compose UI components:

```tsx
const ArticleCard = ({ article }) => (
  <div className="border rounded-lg p-4 space-y-3">
    <h3 className="font-medium">{article.title}</h3>
    <p className="text-sm text-muted-foreground">{article.excerpt}</p>
    <div className="flex justify-between items-center">
      <ArticleStatus article={article} />
      <Button size="sm" variant="ghost">Edit</Button>
    </div>
  </div>
)
```

### 3. Provider Patterns

Use context providers for shared state:

```tsx
const ProgressProvider = ({ children }) => {
  const [progress, setProgress] = useState(0)
  
  return (
    <ProgressContext.Provider value={{ progress, setProgress }}>
      {children}
    </ProgressContext.Provider>
  )
}
```

## Migration Patterns

### 1. Gradual Migration

Migrate one component at a time:

```tsx
// Phase 1: Keep old component
<OldButton onClick={handleClick}>Click</OldButton>

// Phase 2: Add new component alongside
<NewButton variant="primary" onClick={handleClick}>Click</NewButton>

// Phase 3: Replace old component
<NewButton variant="primary" onClick={handleClick}>Click</NewButton>
```

### 2. Feature Flags

Use feature flags for gradual rollout:

```tsx
const Button = ({ children, ...props }) => {
  if (featureFlags.useNewButton) {
    return <NewButton {...props}>{children}</NewButton>
  }
  return <OldButton {...props}>{children}</OldButton>
}
```

### 3. Backward Compatibility

Maintain backward compatibility during migration:

```tsx
// Support both old and new props
const Button = ({ variant, newVariant, ...props }) => {
  const finalVariant = newVariant || mapOldVariant(variant)
  return <EnhancedButton variant={finalVariant} {...props} />
}
```

## Best Practices Summary

1. **Use Design Tokens**: Always prefer design tokens over hardcoded values
2. **Maintain Accessibility**: Include proper ARIA attributes and semantic HTML
3. **Test Components**: Write comprehensive tests for all components
4. **Consider Performance**: Use memoization and conditional rendering
5. **Handle Errors**: Provide graceful fallbacks and error states
6. **Responsive Design**: Use mobile-first approach with adaptive sizing
7. **Component Composition**: Build complex UI from simple components
8. **Gradual Migration**: Migrate incrementally with feature flags when needed
