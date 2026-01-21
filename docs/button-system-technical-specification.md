# Button System Technical Specification

## 🎯 Purpose

This document defines the canonical button system for Infin8Content, ensuring consistent behavior, styling, and maintainability across all dashboard components.

## 🏗️ System Architecture

### CSS Variable Foundation

```css
:root {
  --color-primary-blue: #217CEB;
  --color-primary-purple: #4A42CC;
}
```

### Tailwind Configuration

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: "var(--color-primary-blue)",
      },
    },
  },
},
```

### Explicit Utilities

```css
@layer utilities {
  .bg-primary-blue {
    background-color: var(--color-primary-blue);
  }
  
  .bg-primary-purple {
    background-color: var(--color-primary-purple);
  }
  
  .hover\:bg-primary-blue\/90:hover {
    background-color: rgb(33 124 235 / 0.9);
  }
  
  .hover\:bg-primary-purple\/90:hover {
    background-color: rgb(74 66 204 / 0.9);
  }
}
```

## 🎨 Button Variants

### Primary Buttons
- **Purpose**: Main actions, primary CTAs
- **Background**: `bg-primary-blue` (`#217CEB`)
- **Text**: `text-white`
- **Hover**: `hover:bg-primary-blue/90`
- **Usage**: `<Button>` or `<Button variant="primary">`

### Secondary Buttons
- **Purpose**: Alternative actions, secondary CTAs
- **Background**: `bg-primary-purple` (`#4A42CC`)
- **Text**: `text-white`
- **Hover**: `hover:bg-primary-purple/90`
- **Usage**: `<Button variant="secondary">`

### Outline Buttons
- **Purpose**: Secondary actions, less prominent
- **Background**: Transparent
- **Border**: `border-neutral-200`
- **Text**: `text-neutral-600`
- **Hover**: `hover:text-primary`
- **Usage**: `<Button variant="outline">`

### Ghost Buttons
- **Purpose**: Minimal actions, tertiary level
- **Background**: Transparent
- **Border**: None
- **Text**: `text-neutral-600`
- **Hover**: `hover:text-primary`
- **Usage**: `<Button variant="ghost">`

## 📱 Mobile Components

### TouchTarget Component
- **Purpose**: Mobile-optimized buttons with larger touch targets
- **Variants**: Same as Button component
- **Sizes**: Small (40px), Medium (44px - iOS HIG), Large (48px)
- **Usage**: `<TouchTarget variant="primary" size="large">`

## 🔧 Implementation Guidelines

### ✅ Do's

1. **Use explicit utilities** for backgrounds:
   ```tsx
   className="bg-primary-blue text-white"
   ```

2. **Use standard Tailwind hover syntax**:
   ```tsx
   className="hover:text-primary"
   ```

3. **Use variant props** for semantic meaning:
   ```tsx
   <Button variant="primary">Primary Action</Button>
   ```

4. **Use TouchTarget for mobile**:
   ```tsx
   <TouchTarget variant="primary" size="large">Mobile Action</TouchTarget>
   ```

### ❌ Don'ts

1. **Never use arbitrary CSS variable classes**:
   ```tsx
   // ❌ WRONG
   className="bg-[--color-primary-blue]"
   ```

2. **Never create custom hover utilities**:
   ```css
   /* ❌ WRONG */
   .hover-text-primary-blue:hover {
     color: var(--color-primary-blue);
   }
   ```

3. **Never use hard-coded colors**:
   ```tsx
   // ❌ WRONG
   className="bg-[#217CEB]"
   ```

4. **Never mix color tokens**:
   ```tsx
   // ❌ WRONG
   className="hover:text-[--brand-electric-blue]"
   ```

## 🎯 Component Contracts

### Button Component Interface

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  asChild?: boolean;
}
```

### TouchTarget Component Interface

```tsx
interface TouchTargetProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onPress?: () => void;
}
```

## 🧪 Testing Requirements

### Visual Tests
1. **Primary buttons** display blue background (`#217CEB`)
2. **Secondary buttons** display purple background (`#4A42CC`)
3. **Hover states** work correctly on all variants
4. **Disabled states** show 50% opacity
5. **Mobile touch targets** meet minimum size requirements

### DevTools Verification
1. **Primary buttons**: `background-color: rgb(33, 124, 235)`
2. **Hover states**: `color: rgb(33, 124, 235)` for utility buttons
3. **No arbitrary values** in compiled CSS
4. **Consistent color tokens** across all buttons

### Automated Tests
```tsx
// Example test structure
describe('Button System', () => {
  it('should render primary button with correct background', () => {
    render(<Button variant="primary">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-blue');
  });
  
  it('should apply hover state correctly', () => {
    render(<Button variant="outline">Test</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:text-primary');
  });
});
```

## 📋 Migration Guide

### Converting Legacy Buttons

1. **Identify arbitrary classes**:
   ```bash
   grep -r "bg-\[--color-" app components
   ```

2. **Replace with explicit utilities**:
   ```tsx
   // Before
   className="bg-[--color-primary-blue] text-white"
   
   // After
   className="bg-primary-blue text-white"
   ```

3. **Update hover states**:
   ```tsx
   // Before
   className="hover:text-[--color-primary-blue]"
   
   // After
   className="hover:text-primary"
   ```

4. **Test thoroughly**:
   - Visual inspection
   - DevTools verification
   - Hover state testing

## 🔍 Troubleshooting

### Common Issues

1. **Invisible Buttons**
   - **Cause**: Tailwind JIT purged arbitrary classes
   - **Fix**: Use explicit utilities (`bg-primary-blue`)

2. **Wrong Hover Colors**
   - **Cause**: Mixed color tokens or custom utilities
   - **Fix**: Use `hover:text-primary` consistently

3. **Mobile Touch Issues**
   - **Cause**: Touch targets too small
   - **Fix**: Use `TouchTarget` component with proper sizing

4. **Inconsistent Styling**
   - **Cause**: Manual overrides or inline styles
   - **Fix**: Use variant props and canonical utilities

### Debug Commands

```bash
# Find arbitrary values
grep -r "bg-\[" app components
grep -r "hover:text-\[" app components

# Find brand-electric-blue usage
grep -r "brand-electric-blue" app components

# Verify Tailwind compilation
npm run build
```

## 🚀 Performance Considerations

### CSS Bundle Size
- **Explicit utilities**: Minimal impact
- **No arbitrary values**: Reduces bundle size
- **Consistent tokens**: Better compression

### Runtime Performance
- **CSS variables**: Fast resolution
- **Tailwind JIT**: Optimized compilation
- **Component variants**: Efficient rendering

### Build Performance
- **Explicit classes**: Faster compilation
- **No dynamic values**: Predictable builds
- **Standard syntax**: Better tooling support

## 📚 References

1. **Button System Canonicalization Summary**: `/docs/button-system-canonicalization-summary.md`
2. **Dashboard Implementation Changelog**: `/docs/dashboard-implementation-changelog.md`
3. **Tailwind CSS Documentation**: https://tailwindcss.com/docs
4. **iOS Human Interface Guidelines**: Touch target sizes

---

**Status**: ✅ Active  
**Version**: 2.2.0  
**Last Updated**: January 21, 2026  
**Maintainer**: Barry (Quick Flow Solo Dev)
