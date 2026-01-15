# Effects Design Tokens

## Overview

Effects tokens provide a systematic approach to visual effects including borders, shadows, gradients, and transitions. They ensure consistent visual hierarchy, depth, and interaction patterns across all components.

## Border Radius Tokens

### Scale
```css
--radius-xs: 2px;    /* Micro rounding - tags, badges */
--radius-sm: 4px;    /* Small rounding - buttons, inputs */
--radius-md: 6px;    /* Medium rounding - cards, panels */
--radius-lg: 8px;    /* Large rounding - large cards */
--radius-xl: 12px;   /* Extra large - special elements */
--radius-2xl: 16px;  /* Double extra large - hero elements */
--radius-3xl: 20px;  /* Triple extra large - modals */
--radius-4xl: 24px;  /* Quadruple extra large - special containers */
--radius-full: 9999px; /* Full rounding - avatars, pills */
```

### Usage Patterns

#### Micro Elements (2px-4px)
```tsx
// Tags and badges
<Badge style={{ borderRadius: 'var(--radius-xs)' }}>New</Badge>

// Small buttons
<Button size="sm" style={{ borderRadius: 'var(--radius-sm)' }}>
  Small
</Button>

// Input fields
<Input style={{ borderRadius: 'var(--radius-sm)' }} />
```

#### Standard Components (6px-8px)
```tsx
// Cards and panels
<Card style={{ borderRadius: 'var(--radius-md)' }}>
  Content
</Card>

// Standard buttons
<Button style={{ borderRadius: 'var(--radius-lg)' }}>
  Standard Button
</Button>

// Form containers
<FormGroup style={{ borderRadius: 'var(--radius-md)' }}>
  Form Content
</FormGroup>
```

#### Large Elements (12px-24px)
```tsx
// Hero sections
<Hero style={{ borderRadius: 'var(--radius-2xl)' }}>
  Hero Content
</Hero>

// Modals
<Modal style={{ borderRadius: 'var(--radius-3xl)' }}>
  Modal Content
</Modal>

// Special containers
<SpecialCard style={{ borderRadius: 'var(--radius-4xl)' }}>
  Premium Content
</SpecialCard>
```

#### Fully Rounded Elements
```tsx
// Avatars
<Avatar style={{ borderRadius: 'var(--radius-full)' }}>
  <img src="/avatar.jpg" alt="User" />
</Avatar>

// Pill buttons
<PillButton style={{ borderRadius: 'var(--radius-full)' }}>
  Pill Button
</PillButton>

// Status indicators
<StatusDot style={{ borderRadius: 'var(--radius-full)' }} />
```

## Shadow Tokens

### Shadow Scale
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

### Shadow Hierarchy

#### Subtle Elevation (shadow-sm)
```css
.subtle-elevation {
  box-shadow: var(--shadow-sm);
}
```

**Use Cases:**
- Hover states on buttons
- Form field focus states
- Subtle card elevation
- Tooltips and popovers

**Examples:**
```tsx
// Button hover state
<Button 
  onMouseEnter={(e) => e.target.style.boxShadow = 'var(--shadow-sm)'}
  onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
>
  Hover Me
</Button>

// Input focus state
<Input 
  onFocus={(e) => e.target.style.boxShadow = 'var(--shadow-sm)'}
  onBlur={(e) => e.target.style.boxShadow = 'none'}
/>
```

#### Standard Elevation (shadow-md)
```css
.standard-elevation {
  box-shadow: var(--shadow-md);
}
```

**Use Cases:**
- Standard cards
- Dropdown menus
- Modal containers
- Elevated buttons

**Examples:**
```tsx
// Standard card
<Card style={{ boxShadow: 'var(--shadow-md)' }}>
  Card Content
</Card>

// Dropdown menu
<Dropdown style={{ boxShadow: 'var(--shadow-md)' }}>
  Menu Items
</Dropdown>
```

#### High Elevation (shadow-lg)
```css
.high-elevation {
  box-shadow: var(--shadow-lg);
}
```

**Use Cases:**
- Featured cards
- Floating action buttons
- Important modals
- Hero elements

**Examples:**
```tsx
// Featured card
<FeaturedCard style={{ boxShadow: 'var(--shadow-lg)' }}>
  Important Content
</FeaturedCard>

// Floating action button
<FAB style={{ boxShadow: 'var(--shadow-lg)' }}>
  +
</FAB>
```

#### Maximum Elevation (shadow-xl)
```css
.maximum-elevation {
  box-shadow: var(--shadow-xl);
}
```

**Use Cases:**
- Modal overlays
- Hero sections
- Critical notifications
- Premium elements

**Examples:**
```tsx
// Modal overlay
<Modal style={{ boxShadow: 'var(--shadow-xl)' }}>
  Critical Content
</Modal>

// Hero section
<Hero style={{ boxShadow: 'var(--shadow-xl)' }}>
  Hero Content
</Hero>
```

## Gradient Tokens

### Brand Gradients
```css
--gradient-brand: linear-gradient(90deg, #217CEB 0%, #4A42CC 100%);
--gradient-brand-vertical: linear-gradient(180deg, #217CEB 0%, #4A42CC 100%);
--gradient-brand-diagonal: linear-gradient(135deg, #217CEB 0%, #4A42CC 100%);
```

### Functional Gradients
```css
--gradient-success: linear-gradient(90deg, #10B981 0%, #059669 100%);
--gradient-warning: linear-gradient(90deg, #F59E0B 0%, #D97706 100%);
--gradient-error: linear-gradient(90deg, #EF4444 0%, #DC2626 100%);
--gradient-info: linear-gradient(90deg, #3B82F6 0%, #2563EB 100%);
```

### Subtle Gradients
```css
--gradient-subtle-light: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);
--gradient-subtle-dark: linear-gradient(180deg, #F4F4F6 0%, #E5E7EB 100%);
--gradient-subtle-accent: linear-gradient(180deg, #F9FAFB 0%, #F3F4F6 100%);
```

### Gradient Usage Patterns

#### Brand Applications
```tsx
// Hero sections
<Hero style={{ background: 'var(--gradient-brand)' }}>
  Hero Content
</Hero>

// Call-to-action buttons
<Button style={{ background: 'var(--gradient-brand)' }}>
  Primary Action
</Button>

// Accent elements
<Accent style={{ background: 'var(--gradient-brand-diagonal)' }}>
  Accent Content
</Accent>
```

#### Status Applications
```tsx
// Success states
<SuccessBadge style={{ background: 'var(--gradient-success)' }}>
  Success
</SuccessBadge>

// Warning states
<WarningBanner style={{ background: 'var(--gradient-warning)' }}>
  Warning Message
</WarningBanner>

// Error states
<ErrorAlert style={{ background: 'var(--gradient-error)' }}>
  Error Message
</ErrorAlert>
```

#### Subtle Applications
```tsx
// Card backgrounds
<Card style={{ background: 'var(--gradient-subtle-light)' }}>
  Subtle Card
</Card>

// Section backgrounds
<Section style={{ background: 'var(--gradient-subtle-accent)' }}>
  Section Content
</Section>
```

## Border Tokens

### Border Widths
```css
--border-width-thin: 1px;    /* Standard borders */
--border-width-medium: 2px;   /* Emphasis borders */
--border-width-thick: 3px;    /* Strong borders */
--border-width-thicker: 4px;  /* Special borders */
```

### Border Styles
```css
--border-style-solid: solid;
--border-style-dashed: dashed;
--border-style-dotted: dotted;
```

### Border Patterns

#### Standard Borders
```css
.standard-border {
  border: var(--border-width-thin) var(--border-style-solid) var(--color-border-light);
}
```

#### Emphasis Borders
```css
.emphasis-border {
  border: var(--border-width-medium) var(--border-style-solid) var(--color-border-medium);
}
```

#### Interactive Borders
```css
.interactive-border {
  border: var(--border-width-thin) var(--border-style-solid) var(--color-border-light);
  transition: border-color 0.2s ease;
}

.interactive-border:hover {
  border-color: var(--color-primary-blue);
}

.interactive-border:focus {
  border-color: var(--color-primary-blue);
  border-width: var(--border-width-medium);
}
```

## Implementation Examples

### Complete Component with Effects
```tsx
const Card = ({ variant, interactive, children }) => {
  const baseStyles = {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-light)',
    backgroundColor: 'var(--color-background-primary)',
    padding: 'var(--spacing-lg)',
    transition: 'all 0.2s ease'
  };

  const variants = {
    default: {
      boxShadow: 'var(--shadow-sm)'
    },
    elevated: {
      boxShadow: 'var(--shadow-md)'
    },
    featured: {
      boxShadow: 'var(--shadow-lg)',
      border: '2px solid var(--color-primary-blue)'
    },
    gradient: {
      background: 'var(--gradient-brand)',
      border: 'none',
      color: 'var(--color-background-primary)',
      boxShadow: 'var(--shadow-lg)'
    }
  };

  const interactiveStyles = interactive ? {
    cursor: 'pointer',
    '&:hover': {
      boxShadow: 'var(--shadow-lg)',
      transform: 'translateY(-2px)'
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: 'var(--shadow-md)'
    }
  } : {};

  return (
    <div 
      style={{ 
        ...baseStyles, 
        ...variants[variant],
        ...interactiveStyles 
      }}
    >
      {children}
    </div>
  );
};
```

### Button with Multiple Effects
```tsx
const Button = ({ variant, size, gradient, children }) => {
  const baseStyles = {
    borderRadius: size === 'sm' ? 'var(--radius-sm)' : 'var(--radius-md)',
    border: 'none',
    fontWeight: 'var(--font-weight-medium)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-xs)'
  };

  const sizes = {
    sm: {
      padding: 'var(--spacing-xs) var(--spacing-sm)',
      fontSize: 'var(--font-small)'
    },
    md: {
      padding: 'var(--spacing-sm) var(--spacing-md)',
      fontSize: 'var(--font-body)'
    },
    lg: {
      padding: 'var(--spacing-md) var(--spacing-lg)',
      fontSize: 'var(--font-body)',
      borderRadius: 'var(--radius-lg)'
    }
  };

  const variants = {
    primary: gradient ? {
      background: 'var(--gradient-brand)',
      color: 'var(--color-background-primary)',
      boxShadow: 'var(--shadow-md)'
    } : {
      backgroundColor: 'var(--color-primary-blue)',
      color: 'var(--color-background-primary)',
      boxShadow: 'var(--shadow-sm)'
    },
    secondary: {
      backgroundColor: 'var(--color-background-secondary)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border-medium)'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary)'
    }
  };

  return (
    <button 
      style={{ 
        ...baseStyles, 
        ...sizes[size],
        ...variants[variant]
      }}
      onMouseEnter={(e) => {
        e.target.style.boxShadow = 'var(--shadow-md)';
        if (variant === 'secondary') {
          e.target.style.backgroundColor = 'var(--color-background-accent)';
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.boxShadow = variants[variant].boxShadow || 'none';
        if (variant === 'secondary') {
          e.target.style.backgroundColor = 'var(--color-background-secondary)';
        }
      }}
    >
      {children}
    </button>
  );
};
```

## Anti-Patterns

### ❌ What Not to Do
```tsx
// Don't use arbitrary border radius values
<div style={{ borderRadius: '7px' }}>Custom radius</div>

// Don't create custom shadows
<div style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>Custom shadow</div>

// Don't use hard-coded gradients
<div style={{ background: 'linear-gradient(90deg, #blue, #purple)' }}>
  Custom gradient
</div>

// Don't mix effects without system
<div style={{ 
  borderRadius: '12px', 
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  border: '1px solid #ccc'
 }}>
  Mixed effects
</div>
```

### ✅ What to Do Instead
```tsx
// Use border radius tokens
<div style={{ borderRadius: 'var(--radius-md)' }}>Standard radius</div>

// Use shadow tokens
<div style={{ boxShadow: 'var(--shadow-md)' }}>Standard shadow</div>

// Use gradient tokens
<div style={{ background: 'var(--gradient-brand)' }}>Brand gradient</div>

// Use consistent effect combinations
<div style={{ 
  borderRadius: 'var(--radius-lg)', 
  boxShadow: 'var(--shadow-md)',
  border: '1px solid var(--color-border-light)'
 }}>
  Systematic effects
</div>
```

## Testing Effects Usage

### Automated Tests
```typescript
describe('Effects Token Compliance', () => {
  it('should use effects tokens instead of arbitrary values', () => {
    const component = render(<TestComponent />);
    const styles = getComputedStyle(component.container);
    
    // Should use border radius tokens
    expect(styles.borderRadius).toMatch(/var\(--radius-\w+\)/);
    
    // Should use shadow tokens
    expect(styles.boxShadow).toMatch(/var\(--shadow-\w+\)/);
    
    // Should not contain arbitrary values
    expect(styles.borderRadius).not.toMatch(/\d+px$/);
  });
  
  it('should maintain consistent visual hierarchy', () => {
    const cards = component.getAllByTestId('card');
    const shadows = cards.map(card => 
      getComputedStyle(card).boxShadow
    );
    
    // Featured cards should have stronger shadows
    const featuredCard = component.getByTestId('featured-card');
    const standardCard = component.getByTestId('standard-card');
    
    const featuredShadow = getComputedStyle(featuredCard).boxShadow;
    const standardShadow = getComputedStyle(standardCard).boxShadow;
    
    expect(featuredShadow).not.toBe(standardShadow);
  });
});
```

### Visual Testing Checklist
- [ ] Border radius uses design tokens
- [ ] Shadows follow elevation hierarchy
- [ ] Gradients use predefined tokens
- [ ] Interactive states have consistent effects
- [ ] No arbitrary visual effects present
- [ ] Effects work across different themes
- [ ] Performance impact is minimal

## Performance Considerations

### CSS Custom Properties Performance
- **Border Radius**: GPU-accelerated rendering
- **Box Shadow**: Efficient compositing
- **Gradients**: Hardware acceleration support
- **Transitions**: Optimized animations

### Rendering Optimization
```css
/* Use transform for better performance */
.optimized-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  will-change: transform, box-shadow;
}

.optimized-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

### Animation Performance
- **GPU Acceleration**: Use transform and opacity
- **Avoid Layout Thrashing**: Minimize property changes
- **Efficient Transitions**: Use transition properties wisely
- **Reduced Motion**: Respect user preferences

## Accessibility Considerations

### Visual Hierarchy
- **Contrast**: Ensure effects don't impair readability
- **Focus States**: Clear visual indicators
- **Reduced Motion**: Respect prefers-reduced-motion
- **Color Independence**: Effects shouldn't rely solely on color

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    transition: none;
    animation: none;
  }
}
```

### Focus Indicators
```css
.focusable:focus {
  outline: 2px solid var(--color-primary-blue);
  outline-offset: 2px;
  box-shadow: var(--shadow-sm);
}
```

## Migration Guide

### From Arbitrary Values
```tsx
// Before
<div style={{ 
  borderRadius: '12px', 
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  background: 'linear-gradient(90deg, #217CEB, #4A42CC)'
 }>
  Content
</div>

// After
<div style={{ 
  borderRadius: 'var(--radius-xl)', 
  boxShadow: 'var(--shadow-lg)',
  background: 'var(--gradient-brand)'
 }}>
  Content
</div>
```

### From Mixed Systems
```tsx
// Before
<div className="rounded-lg shadow-md" style={{ border: '1px solid #ccc' }}>
  Mixed system
</div>

// After
<div style={{ 
  borderRadius: 'var(--radius-lg)', 
  boxShadow: 'var(--shadow-md)',
  border: '1px solid var(--color-border-light)'
 }}>
  Token system
</div>
```

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
