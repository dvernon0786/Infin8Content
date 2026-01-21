# Button System Implementation Guide

## 🎯 Quick Start

This guide provides step-by-step instructions for implementing buttons correctly in the Infin8Content dashboard.

## 🚀 5-Minute Implementation

### Step 1: Choose Your Button Type

```tsx
// Primary action (most important)
<Button>Generate Article</Button>

// Secondary action (alternative)
<Button variant="secondary">Cancel</Button>

// Tertiary action (less important)
<Button variant="outline">Edit</Button>

// Minimal action (subtle)
<Button variant="ghost">Close</Button>
```

### Step 2: Add Mobile Support (if needed)

```tsx
// For mobile-optimized buttons
<TouchTarget variant="primary" size="large">Mobile Action</TouchTarget>
```

### Step 3: Test It
1. **Visual check**: Button should show correct color
2. **Hover test**: Hover should show blue tint
3. **Mobile test**: Touch target should be large enough

## 📋 Complete Implementation Examples

### Primary Action Button
```tsx
import { Button } from '@/components/ui/button'

export function GenerateArticleButton() {
  return (
    <Button 
      onClick={() => console.log('Generate article')}
      disabled={false}
    >
      Generate Article
    </Button>
  )
}
```

### Settings Management Buttons
```tsx
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function SettingsButtons() {
  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/settings/organization">
          Manage Organization
        </Link>
      </Button>
      
      <Button variant="outline" asChild>
        <Link href="/settings/billing">
          Manage Billing
        </Link>
      </Button>
      
      <Button variant="outline" asChild>
        <Link href="/settings/team">
          Manage Team
        </Link>
      </Button>
    </div>
  )
}
```

### Mobile-Optimized Actions
```tsx
import { TouchTarget } from '@/components/mobile/touch-target'

export function MobileActions() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <TouchTarget 
        variant="primary" 
        size="large"
        onPress={() => console.log('Primary action')}
      >
        Primary
      </TouchTarget>
      
      <TouchTarget 
        variant="secondary" 
        size="large"
        onPress={() => console.log('Secondary action')}
      >
        Secondary
      </TouchTarget>
    </div>
  )
}
```

## 🎨 Button Variants Reference

### Primary Button
- **Use**: Main actions, primary CTAs
- **Appearance**: Blue background, white text
- **Code**: `<Button>` or `<Button variant="primary">`
- **Example**: "Generate Article", "Save Changes"

### Secondary Button
- **Use**: Alternative actions, secondary CTAs
- **Appearance**: Purple background, white text
- **Code**: `<Button variant="secondary">`
- **Example**: "Cancel", "Skip"

### Outline Button
- **Use**: Secondary actions, less prominent
- **Appearance**: Border, neutral text, blue hover
- **Code**: `<Button variant="outline">`
- **Example**: "Edit", "Settings", "Manage"

### Ghost Button
- **Use**: Minimal actions, tertiary level
- **Appearance**: No border, neutral text, blue hover
- **Code**: `<Button variant="ghost">`
- **Example**: "Close", "Dismiss", "Learn More"

## 📱 Mobile Implementation

### When to Use TouchTarget
- **Mobile-first pages**
- **Touch-heavy interfaces**
- **Small touch targets needed**
- **Accessibility requirements**

### TouchTarget Sizes
- **Small**: 40px (minimum)
- **Medium**: 44px (iOS HIG recommended)
- **Large**: 48px (enhanced accessibility)

### Mobile Example
```tsx
import { TouchTarget } from '@/components/mobile/touch-target'

export function MobileArticleActions() {
  return (
    <div className="flex flex-col gap-3">
      <TouchTarget 
        variant="primary" 
        size="large"
        onPress={() => router.push('/dashboard/articles/generate')}
      >
        <Plus className="h-5 w-5 mr-2" />
        Generate Article
      </TouchTarget>
      
      <TouchTarget 
        variant="outline" 
        size="medium"
        onPress={() => setShowFilters(!showFilters)}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
      </TouchTarget>
    </div>
  )
}
```

## 🔧 Common Implementation Patterns

### Form Actions
```tsx
export function FormActions() {
  return (
    <div className="flex gap-3 justify-end">
      <Button variant="outline" type="button">
        Cancel
      </Button>
      <Button type="submit">
        Save Changes
      </Button>
    </div>
  )
}
```

### Navigation Actions
```tsx
import Link from 'next/link'

export function NavigationActions() {
  return (
    <nav className="flex gap-2">
      <Button variant="ghost" asChild>
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link href="/dashboard/articles">Articles</Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link href="/dashboard/settings">Settings</Link>
      </Button>
    </nav>
  )
}
```

### Table Actions
```tsx
export function TableActions({ articleId }: { articleId: string }) {
  return (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm">
        <Eye className="h-3 w-3" />
        View
      </Button>
      <Button variant="ghost" size="sm">
        <Edit className="h-3 w-3" />
        Edit
      </Button>
      <Button variant="ghost" size="sm">
        <Trash className="h-3 w-3" />
        Delete
      </Button>
    </div>
  )
}
```

## 🚫 Common Mistakes to Avoid

### ❌ Don't Use Arbitrary Values
```tsx
// WRONG
<Button className="bg-[--color-primary-blue]">
  Bad Button
</Button>

// RIGHT
<Button>
  Good Button
</Button>
```

### ❌ Don't Create Custom Hover Classes
```tsx
// WRONG
<Button className="hover:text-[--color-primary-blue]">
  Bad Button
</Button>

// RIGHT
<Button variant="outline">
  Good Button
</Button>
```

### ❌ Don't Hard-code Colors
```tsx
// WRONG
<Button className="bg-blue-500 text-white">
  Bad Button
</Button>

// RIGHT
<Button>
  Good Button
</Button>
```

### ❌ Don't Use Inline Styles
```tsx
// WRONG
<Button style={{ backgroundColor: '#217CEB' }}>
  Bad Button
</Button>

// RIGHT
<Button>
  Good Button
</Button>
```

## ✅ Best Practices

### Do Use Semantic Variants
```tsx
// GOOD - Semantic meaning
<Button variant="primary">Save</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Help</Button>
```

### Do Use Proper Accessibility
```tsx
// GOOD - Accessible
<Button 
  onClick={handleAction}
  aria-label="Generate new article"
  disabled={isLoading}
>
  {isLoading ? <Loader className="animate-spin" /> : 'Generate Article'}
</Button>
```

### Do Handle Loading States
```tsx
// GOOD - Loading state
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader className="mr-2 h-4 w-4 animate-spin" />
      Generating...
    </>
  ) : (
    'Generate Article'
  )}
</Button>
```

### Do Use Proper Spacing
```tsx
// GOOD - Consistent spacing
<div className="flex gap-3">
  <Button variant="outline">Cancel</Button>
  <Button>Submit</Button>
</div>
```

## 🧪 Testing Your Implementation

### Visual Checklist
- [ ] Button shows correct background color
- [ ] Text is readable (contrast ratio)
- [ ] Hover state works correctly
- [ ] Disabled state is visible
- [ ] Focus state is visible

### Mobile Checklist
- [ ] Touch target is large enough (44px minimum)
- [ ] Touch targets have adequate spacing
- [ ] Buttons work with touch input
- [ ] No accidental touches

### Accessibility Checklist
- [ ] Button has semantic meaning
- [ ] Screen reader reads button text
- [ ] Keyboard navigation works
- [ ] Focus indicators are visible
- [ ] ARIA labels are correct

## 🔍 Debugging Common Issues

### Button Not Showing Color
**Problem**: Button appears transparent or wrong color
**Solution**: Use variant prop instead of custom classes
```tsx
// Instead of this
<Button className="bg-blue-500">Action</Button>

// Use this
<Button variant="primary">Action</Button>
```

### Hover Not Working
**Problem**: Hover state doesn't change color
**Solution**: Use standard Tailwind hover syntax
```tsx
// Instead of this
<Button className="hover:text-[--color-primary-blue]">Action</Button>

// Use this
<Button variant="outline">Action</Button>
```

### Mobile Button Too Small
**Problem**: Button hard to tap on mobile
**Solution**: Use TouchTarget component
```tsx
// Instead of this
<Button size="sm">Action</Button>

// Use this
<TouchTarget size="large">Action</TouchTarget>
```

## 📚 Additional Resources

### Documentation
- [Button System Technical Specification](./button-system-technical-specification.md)
- [UI Governance Guidelines](./ui-governance-guidelines.md)
- [Dashboard Implementation Changelog](./dashboard-implementation-changelog.md)

### Component References
- [Button Component](../../components/ui/button.tsx)
- [TouchTarget Component](../../components/mobile/touch-target.tsx)

### Design System
- [Color Tokens](#color-tokens)
- [Typography System](#typography-system)
- [Spacing Guidelines](#spacing-guidelines)

---

## 🎯 Quick Reference Card

```tsx
// Primary Action
<Button>Save Changes</Button>

// Secondary Action
<Button variant="secondary">Cancel</Button>

// Outline Action
<Button variant="outline">Edit</Button>

// Ghost Action
<Button variant="ghost">Close</Button>

// Mobile Action
<TouchTarget variant="primary" size="large">Mobile Action</TouchTarget>
```

**Remember**: Always use variants, never custom classes. The system handles the rest!

---

**Status**: ✅ Ready for Use  
**Version**: 2.2.0  
**Last Updated**: January 21, 2026  
**Maintainer**: Barry (Quick Flow Solo Dev)
