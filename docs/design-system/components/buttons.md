# Button Components

## Overview

Button components are the primary interactive elements in the design system. They provide consistent styling, behavior, and accessibility across all user interactions.

## Component Variants

### Primary Button
```tsx
<Button variant="primary" size="md">
  Primary Action
</Button>
```

**Use Cases:**
- Main call-to-action buttons
- Form submissions
- Critical user actions
- Primary navigation

**Design Tokens Used:**
- `--color-primary-blue` for background
- `--color-background-primary` for text
- `--spacing-md` for padding
- `--radius-md` for border radius

### Secondary Button
```tsx
<Button variant="secondary" size="md">
  Secondary Action
</Button>
```

**Use Cases:**
- Alternative actions
- Cancel buttons
- Secondary navigation
- Non-critical actions

**Design Tokens Used:**
- `--color-background-secondary` for background
- `--color-text-primary` for text
- `--color-border-medium` for border

### Ghost Button
```tsx
<Button variant="ghost" size="md">
  Ghost Action
</Button>
```

**Use Cases:**
- Minimalist interfaces
- Toolbar buttons
- Icon-only actions
- Subtle interactions

**Design Tokens Used:**
- Transparent background
- `--color-text-primary` for text
- Hover states with `--color-background-accent`

### Destructive Button
```tsx
<Button variant="destructive" size="md">
  Delete
</Button>
```

**Use Cases:**
- Delete actions
- Remove operations
- Irreversible actions
- Warning actions

**Design Tokens Used:**
- `--color-error` for background
- `--color-background-primary` for text

## Size Variants

### Small Button
```tsx
<Button variant="primary" size="sm">
  Small
</Button>
```

**Design Tokens:**
- `--spacing-xs` for vertical padding
- `--spacing-sm` for horizontal padding
- `--font-small` for text size
- `--radius-sm` for border radius

### Medium Button (Default)
```tsx
<Button variant="primary" size="md">
  Medium
</Button>
```

**Design Tokens:**
- `--spacing-sm` for vertical padding
- `--spacing-md` for horizontal padding
- `--font-body` for text size
- `--radius-md` for border radius

### Large Button
```tsx
<Button variant="primary" size="lg">
  Large
</Button>
```

**Design Tokens:**
- `--spacing-md` for vertical padding
- `--spacing-lg` for horizontal padding
- `--font-body` for text size
- `--radius-lg` for border radius

## State Variants

### Default State
```css
.button {
  background-color: var(--color-primary-blue);
  color: var(--color-background-primary);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  font-weight: var(--font-weight-medium);
  transition: all 0.2s ease;
}
```

### Hover State
```css
.button:hover {
  background-color: var(--color-primary-blue);
  opacity: 0.9;
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

### Active State
```css
.button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
  opacity: 0.8;
}
```

### Focus State
```css
.button:focus {
  outline: 2px solid var(--color-primary-blue);
  outline-offset: 2px;
  box-shadow: var(--shadow-sm);
}
```

### Disabled State
```css
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
```

## Implementation Examples

### Complete Button Component
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  onClick
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-xs)',
    fontWeight: 'var(--font-weight-medium)',
    transition: 'all 0.2s ease',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    fontFamily: 'inherit',
    textDecoration: 'none',
    width: fullWidth ? '100%' : 'auto'
  };

  const sizeStyles = {
    sm: {
      padding: 'var(--spacing-xs) var(--spacing-sm)',
      fontSize: 'var(--font-small)',
      borderRadius: 'var(--radius-sm)',
      minHeight: '32px'
    },
    md: {
      padding: 'var(--spacing-sm) var(--spacing-md)',
      fontSize: 'var(--font-body)',
      borderRadius: 'var(--radius-md)',
      minHeight: '40px'
    },
    lg: {
      padding: 'var(--spacing-md) var(--spacing-lg)',
      fontSize: 'var(--font-body)',
      borderRadius: 'var(--radius-lg)',
      minHeight: '48px'
    }
  };

  const variantStyles = {
    primary: {
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
    },
    destructive: {
      backgroundColor: 'var(--color-error)',
      color: 'var(--color-background-primary)',
      boxShadow: 'var(--shadow-sm)'
    }
  };

  const disabledStyles = disabled ? {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none'
  } : {};

  const loadingStyles = loading ? {
    opacity: 0.7,
    cursor: 'wait'
  } : {};

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...disabledStyles,
    ...loadingStyles
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!disabled && !loading) {
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      e.currentTarget.style.transform = 'translateY(-1px)';
      if (variant === 'secondary') {
        e.currentTarget.style.backgroundColor = 'var(--color-background-accent)';
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (!disabled && !loading) {
      e.currentTarget.style.boxShadow = variantStyles[variant].boxShadow || 'none';
      e.currentTarget.style.transform = 'translateY(0)';
      if (variant === 'secondary') {
        e.currentTarget.style.backgroundColor = 'var(--color-background-secondary)';
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!disabled && !loading) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    return (
      <span style={{ 
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.875em'
      }}>
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          icon
        )}
      </span>
    );
  };

  return (
    <button
      style={combinedStyles}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onFocus={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.outline = '2px solid var(--color-primary-blue)';
          e.currentTarget.style.outlineOffset = '2px';
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
    >
      {iconPosition === 'left' && renderIcon()}
      <span>{children}</span>
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
};
```

### Button Group
```tsx
interface ButtonGroupProps {
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  orientation = 'horizontal',
  size = 'md',
  children
}) => {
  const groupStyles = {
    display: 'flex',
    flexDirection: orientation === 'vertical' ? 'column' : 'row',
    gap: orientation === 'vertical' ? 'var(--spacing-xs)' : 0
  };

  const childStyles = {
    borderRadius: 0,
    borderRight: orientation === 'horizontal' ? '1px solid var(--color-border-light)' : 'none',
    borderBottom: orientation === 'vertical' ? '1px solid var(--color-border-light)' : 'none'
  };

  const firstChildStyles = {
    ...childStyles,
    borderTopLeftRadius: 'var(--radius-md)',
    borderBottomLeftRadius: orientation === 'horizontal' ? 'var(--radius-md)' : 0,
    borderTopRightRadius: orientation === 'vertical' ? 'var(--radius-md)' : 0
  };

  const lastChildStyles = {
    ...childStyles,
    borderTopRightRadius: 'var(--radius-md)',
    borderBottomRightRadius: 'var(--radius-md)',
    borderBottomLeftRadius: orientation === 'vertical' ? 'var(--radius-md)' : 0,
    borderRight: 'none',
    borderBottom: 'none'
  };

  return (
    <div style={groupStyles}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const isFirstChild = index === 0;
          const isLastChild = index === React.Children.count(children) - 1;
          
          let additionalStyles = childStyles;
          if (isFirstChild) additionalStyles = firstChildStyles;
          if (isLastChild) additionalStyles = lastChildStyles;

          return React.cloneElement(child, {
            style: {
              ...child.props.style,
              ...additionalStyles
            }
          });
        }
        return child;
      })}
    </div>
  );
};
```

## Usage Patterns

### Form Actions
```tsx
const FormActions = () => {
  return (
    <div style={{ 
      display: 'flex', 
      gap: 'var(--spacing-md)', 
      justifyContent: 'flex-end',
      marginTop: 'var(--spacing-xl)'
    }}>
      <Button variant="secondary" onClick={() => router.back()}>
        Cancel
      </Button>
      <Button variant="primary" type="submit">
        Save Changes
      </Button>
    </div>
  );
};
```

### Navigation Actions
```tsx
const NavigationActions = () => {
  return (
    <nav style={{ 
      display: 'flex', 
      gap: 'var(--spacing-sm)',
      padding: 'var(--spacing-md)',
      backgroundColor: 'var(--color-background-secondary)',
      borderRadius: 'var(--radius-lg)'
    }}>
      <Button variant="ghost" size="sm">
        <Icon name="home" />
        Home
      </Button>
      <Button variant="ghost" size="sm">
        <Icon name="settings" />
        Settings
      </Button>
      <Button variant="primary" size="sm">
        <Icon name="plus" />
        New
      </Button>
    </nav>
  );
};
```

### Loading States
```tsx
const LoadingButton = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await performAsyncAction();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="primary" 
      loading={loading}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Processing...' : 'Submit'}
    </Button>
  );
};
```

## Accessibility

### ARIA Attributes
```tsx
const AccessibleButton = ({ children, ...props }) => {
  return (
    <button
      aria-label={props.ariaLabel}
      aria-describedby={props.ariaDescribedBy}
      aria-expanded={props.ariaExpanded}
      aria-pressed={props.ariaPressed}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Keyboard Navigation
```css
.button:focus-visible {
  outline: 2px solid var(--color-primary-blue);
  outline-offset: 2px;
  box-shadow: var(--shadow-sm);
}

.button:focus:not(:focus-visible) {
  outline: none;
}
```

### Screen Reader Support
```tsx
const ScreenReaderButton = ({ children, srLabel, ...props }) => {
  return (
    <button {...props}>
      {children}
      <span style={{ 
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0
      }}>
        {srLabel}
      </span>
    </button>
  );
};
```

## Anti-Patterns

### ❌ What Not to Do
```tsx
// Don't create custom button styles
<div 
  onClick={handleClick}
  style={{ 
    backgroundColor: '#217CEB', 
    color: 'white', 
    padding: '12px 24px',
    borderRadius: '6px',
    cursor: 'pointer'
  }}
>
  Custom Button
</div>

// Don't use buttons for navigation links
<Button variant="primary" onClick={() => router.push('/about')}>
  About Page
</Button>

// Don't override design tokens with inline styles
<Button 
  variant="primary"
  style={{ backgroundColor: '#custom-blue' }}
>
  Custom Styled
</Button>

// Don't use buttons without proper semantic meaning
<Button variant="ghost">
  <div className="complex-content">
    <h3>Title</h3>
    <p>Description</p>
  </div>
</Button>
```

### ✅ What to Do Instead
```tsx
// Use the Button component with variants
<Button variant="primary" onClick={handleClick}>
  Standard Button
</Button>

// Use links for navigation
<Link href="/about">
  <Button variant="primary">About Page</Button>
</Link>

// Use design tokens and variants
<Button variant="primary">
  Token-based
</Button>

// Keep button content simple and semantic
<Button variant="primary">
  Simple Action
</Button>
```

## Testing

### Unit Tests
```typescript
describe('Button Component', () => {
  it('should render with correct variant styles', () => {
    render(<Button variant="primary">Test</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveStyle({
      backgroundColor: 'var(--color-primary-blue)',
      color: 'var(--color-background-primary)'
    });
  });

  it('should handle hover states', () => {
    render(<Button variant="primary">Test</Button>);
    const button = screen.getByRole('button');
    
    fireEvent.mouseEnter(button);
    expect(button).toHaveStyle({
      boxShadow: 'var(--shadow-md)',
      transform: 'translateY(-1px)'
    });
  });

  it('should be accessible', () => {
    render(<Button aria-label="Submit form">Submit</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-label', 'Submit form');
    expect(button).toBeEnabled();
  });

  it('should handle disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveStyle({
      opacity: '0.5',
      cursor: 'not-allowed'
    });
  });
});
```

### Visual Testing Checklist
- [ ] All variants render correctly
- [ ] Hover states work properly
- [ ] Focus states are visible
- [ ] Disabled states are clear
- [ ] Loading states show spinner
- [ ] Icons position correctly
- [ ] Full-width buttons work
- [ ] Button groups render properly

## Performance Considerations

### CSS Transitions
- Use `transform` instead of changing layout properties
- Limit transition properties for better performance
- Use `will-change` sparingly

### Rendering Optimization
- Avoid inline styles in hot paths
- Use CSS classes for static styles
- Minimize re-renders with proper memoization

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
