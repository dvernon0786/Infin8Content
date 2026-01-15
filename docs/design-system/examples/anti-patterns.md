# Anti-Patterns and Solutions

## Overview

This document highlights common anti-patterns in design system usage and provides correct alternatives. Understanding these patterns helps teams avoid common mistakes and maintain consistency.

## Color Anti-Patterns

### ❌ Hard-coded Colors
```tsx
// Anti-Pattern: Hard-coded hex colors
const BadButton = () => {
  return (
    <button style={{
      backgroundColor: '#217CEB',
      color: '#ffffff',
      borderColor: '#e5e7eb'
    }}>
      Bad Button
    </button>
  );
};

const BadCard = () => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      color: '#2c2c2e',
      border: '1px solid #e5e7eb'
    }}>
      Bad Card
    </div>
  );
};
```

### ✅ Solution: Design Tokens
```tsx
// Correct: Use design tokens
const GoodButton = () => {
  return (
    <Button variant="primary">
      Good Button
    </Button>
  );
};

const GoodCard = () => {
  return (
    <Card>
      Good Card
    </Card>
  );
};

// Or with direct token usage
const DirectTokenButton = () => {
  return (
    <button style={{
      backgroundColor: 'var(--color-primary-blue)',
      color: 'var(--color-background-primary)',
      borderColor: 'var(--color-border-light)'
    }}>
      Token Button
    </button>
  );
};
```

### ❌ Non-Semantic Colors
```tsx
// Anti-Pattern: Using literal color names
const StatusIndicator = ({ status }) => {
  return (
    <div style={{
      backgroundColor: status === 'success' ? '#10B981' : '#EF4444',
      color: '#ffffff'
    }}>
      {status}
    </div>
  );
};
```

### ✅ Solution: Semantic Color Tokens
```tsx
// Correct: Use semantic color tokens
const StatusIndicator = ({ status }) => {
  return (
    <Badge variant={status === 'success' ? 'success' : 'error'}>
      {status}
    </Badge>
  );
};

// Or with direct semantic tokens
const SemanticStatusIndicator = ({ status }) => {
  return (
    <div style={{
      backgroundColor: status === 'success' ? 'var(--color-success)' : 'var(--color-error)',
      color: 'var(--color-background-primary)'
    }}>
      {status}
    </div>
  );
};
```

## Spacing Anti-Patterns

### ❌ Arbitrary Spacing Values
```tsx
// Anti-Pattern: Arbitrary pixel values
const BadLayout = () => {
  return (
    <div style={{
      padding: '12px 20px',
      margin: '15px 0',
      gap: '8px'
    }}>
      Bad Layout
    </div>
  );
};

const BadForm = () => {
  return (
    <form style={{ padding: '24px' }}>
      <input style={{ marginBottom: '16px' }} />
      <button style={{ padding: '10px 18px' }}>Submit</button>
    </form>
  );
};
```

### ✅ Solution: Spacing Tokens
```tsx
// Correct: Use spacing tokens
const GoodLayout = () => {
  return (
    <div style={{
      padding: 'var(--spacing-sm) var(--spacing-md)',
      margin: 'var(--spacing-md) 0',
      gap: 'var(--spacing-sm)'
    }}>
      Good Layout
    </div>
  );
};

const GoodForm = () => {
  return (
    <form style={{ padding: 'var(--spacing-lg)' }}>
      <input style={{ marginBottom: 'var(--spacing-md)' }} />
      <button style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>Submit</button>
    </form>
  );
};

// Better: Use layout components
const BestForm = () => {
  return (
    <Card>
      <Stack spacing="md">
        <Input />
        <Button variant="primary">Submit</Button>
      </Stack>
    </Card>
  );
};
```

### ❌ Inconsistent Spacing
```tsx
// Anti-Pattern: Mixed spacing systems
const InconsistentComponent = () => {
  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ marginBottom: '24px' }}>Title</h1>
      <p style={{ margin: '12px 0' }}>Content</p>
      <button style={{ padding: '8px 16px' }}>Button</button>
    </div>
  );
};
```

### ✅ Solution: Consistent Spacing
```tsx
// Correct: Consistent spacing tokens
const ConsistentComponent = () => {
  return (
    <div style={{ padding: 'var(--spacing-md)' }}>
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Title</h1>
      <p style={{ margin: 'var(--spacing-sm) 0' }}>Content</p>
      <button style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>Button</button>
    </div>
  );
};

// Better: Use layout patterns
const BestComponent = () => {
  return (
    <Card>
      <Stack spacing="md">
        <h1>Title</h1>
        <p>Content</p>
        <Button variant="primary">Button</Button>
      </Stack>
    </Card>
  );
};
```

## Typography Anti-Patterns

### ❌ Hard-coded Font Sizes
```tsx
// Anti-Pattern: Arbitrary font sizes
const BadTypography = () => {
  return (
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 600 }}>Title</h1>
      <p style={{ fontSize: '14px', lineHeight: 1.6 }}>Content</p>
      <small style={{ fontSize: '12px' }}>Small text</small>
    </div>
  );
};
```

### ✅ Solution: Typography Tokens
```tsx
// Correct: Use typography tokens
const GoodTypography = () => {
  return (
    <div>
      <h1 style={{ 
        fontSize: 'var(--font-h2)', 
        fontWeight: 'var(--font-weight-semibold)' 
      }}>
        Title
      </h1>
      <p style={{ 
        fontSize: 'var(--font-small)', 
        lineHeight: 1.5 
      }}>
        Content
      </p>
      <small style={{ fontSize: 'var(--font-caption)' }}>Small text</small>
    </div>
  );
};

// Better: Use semantic HTML
const BestTypography = () => {
  return (
    <div>
      <h1>Title</h1>
      <p>Content</p>
      <small>Small text</small>
    </div>
  );
};
```

### ❌ Inconsistent Typography Hierarchy
```tsx
// Anti-Pattern: No clear hierarchy
const BadHierarchy = () => {
  return (
    <div>
      <div style={{ fontSize: '18px', fontWeight: 500 }}>Section Title</div>
      <div style={{ fontSize: '16px', fontWeight: 400 }}>Content</div>
      <div style={{ fontSize: '14px', fontWeight: 600 }}>Small Title</div>
      <div style={{ fontSize: '12px', fontWeight: 400 }}>Small content</div>
    </div>
  );
};
```

### ✅ Solution: Clear Hierarchy
```tsx
// Correct: Clear visual hierarchy
const GoodHierarchy = () => {
  return (
    <div>
      <h3 style={{ fontSize: 'var(--font-h4)', fontWeight: 'var(--font-weight-medium)' }}>
        Section Title
      </h3>
      <p style={{ fontSize: 'var(--font-body)', fontWeight: 'var(--font-weight-normal)' }}>
        Content
      </p>
      <h4 style={{ fontSize: 'var(--font-small)', fontWeight: 'var(--font-weight-medium)' }}>
        Small Title
      </h4>
      <p style={{ fontSize: 'var(--font-caption)', fontWeight: 'var(--font-weight-normal)' }}>
        Small content
      </p>
    </div>
  );
};
```

## Component Anti-Patterns

### ❌ One-off Components
```tsx
// Anti-Pattern: Creating similar components separately
const ArticleCard = ({ article }) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '24px'
    }}>
      <h3>{article.title}</h3>
      <p>{article.excerpt}</p>
      <button style={{
        backgroundColor: '#217CEB',
        color: 'white',
        padding: '8px 16px'
      }}>
        Read More
      </button>
    </div>
  );
};

const ProductCard = ({ product }) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '24px'
    }}>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <button style={{
        backgroundColor: '#217CEB',
        color: 'white',
        padding: '8px 16px'
      }}>
        Buy Now
      </button>
    </div>
  );
};
```

### ✅ Solution: Reusable Components
```tsx
// Correct: Create reusable base component
const Card = ({ title, children, actions }) => {
  return (
    <div style={{
      backgroundColor: 'var(--color-background-primary)',
      border: '1px solid var(--color-border-light)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-lg)'
    }}>
      {title && <h3>{title}</h3>}
      <div>{children}</div>
      {actions && <div>{actions}</div>}
    </div>
  );
};

// Use the reusable component
const ArticleCard = ({ article }) => {
  return (
    <Card 
      title={article.title}
      actions={<Button variant="primary">Read More</Button>}
    >
      <p>{article.excerpt}</p>
    </Card>
  );
};

const ProductCard = ({ product }) => {
  return (
    <Card 
      title={product.name}
      actions={<Button variant="primary">Buy Now</Button>}
    >
      <p>{product.description}</p>
    </Card>
  );
};
```

### ❌ Inline Styles in Components
```tsx
// Anti-Pattern: Heavy use of inline styles
const BadComponent = ({ variant, size }) => {
  const styles = {
    primary: {
      backgroundColor: '#217CEB',
      color: '#ffffff',
      padding: size === 'large' ? '16px 32px' : '8px 16px'
    },
    secondary: {
      backgroundColor: '#f4f4f6',
      color: '#2c2c2e',
      padding: size === 'large' ? '16px 32px' : '8px 16px'
    }
  };

  return (
    <button style={styles[variant]}>
      Click me
    </button>
  );
};
```

### ✅ Solution: CSS Classes and Design Tokens
```tsx
// Correct: Use CSS classes and design tokens
const GoodComponent = ({ variant, size }) => {
  return (
    <button className={`btn btn-${variant} btn-${size}`}>
      Click me
    </button>
  );
};

// CSS file
.btn {
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--color-primary-blue);
  color: var(--color-background-primary);
}

.btn-secondary {
  background-color: var(--color-background-secondary);
  color: var(--color-text-primary);
}

.btn-large {
  padding: var(--spacing-md) var(--spacing-xl);
}

.btn-medium {
  padding: var(--spacing-sm) var(--spacing-md);
}
```

## Layout Anti-Patterns

### ❌ Fixed Layouts
```tsx
// Anti-Pattern: Fixed width and height
const BadLayout = () => {
  return (
    <div style={{ width: '1200px', height: '800px' }}>
      <div style={{ width: '300px', float: 'left' }}>
        Sidebar
      </div>
      <div style={{ width: '900px', float: 'left' }}>
        Main Content
      </div>
    </div>
  );
};
```

### ✅ Solution: Flexible Layouts
```tsx
// Correct: Use flexible layouts
const GoodLayout = () => {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <aside style={{ 
        width: '300px', 
        flexShrink: 0,
        padding: 'var(--spacing-lg)'
      }}>
        Sidebar
      </aside>
      <main style={{ 
        flex: 1,
        padding: 'var(--spacing-lg)',
        overflow: 'auto'
      }}>
        Main Content
      </main>
    </div>
  );
};

// Better: Use responsive layout components
const BestLayout = () => {
  return (
    <ResponsiveLayout
      sidebar={<Sidebar />}
      maxWidth="1200px"
    >
      <MainContent />
    </ResponsiveLayout>
  );
};
```

### ❌ Magic Numbers
```tsx
// Anti-Pattern: Magic numbers in layouts
const BadGrid = () => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px',
      padding: '30px'
    }}>
      {items.map(item => (
        <div key={item.id} style={{ padding: '15px' }}>
          {item.content}
        </div>
      ))}
    </div>
  );
};
```

### ✅ Solution: Design Tokens
```tsx
// Correct: Use design tokens
const GoodGrid = () => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 'var(--spacing-lg)',
      padding: 'var(--spacing-xl)'
    }}>
      {items.map(item => (
        <div key={item.id} style={{ padding: 'var(--spacing-md)' }}>
          {item.content}
        </div>
      ))}
    </div>
  );
};

// Better: Use layout components
const BestGrid = () => {
  return (
    <Grid columns={3} gap="lg" padding="xl">
      {items.map(item => (
        <Card key={item.id}>
          {item.content}
        </Card>
      ))}
    </Grid>
  );
};
```

## Animation Anti-Patterns

### ❌ Custom Animations
```tsx
// Anti-Pattern: Complex custom animations
const BadAnimation = () => {
  return (
    <div style={{
      animation: 'bounce 1s ease-in-out infinite',
      transition: 'all 0.3s ease'
    }}>
      Bouncing element
    </div>
  );
};

// CSS
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
```

### ✅ Solution: Standard Transitions
```tsx
// Correct: Use standard transitions
const GoodAnimation = () => {
  return (
    <div style={{
      transition: 'transform 0.2s ease',
      ':hover': {
        transform: 'translateY(-2px)'
      }
    }}>
      Hover element
    </div>
  );
};

// Better: Use transition utilities
const BestAnimation = () => {
  return (
    <InteractiveCard>
      Hover element
    </InteractiveCard>
  );
};
```

## Accessibility Anti-Patterns

### ❌ Missing Semantic HTML
```tsx
// Anti-Pattern: Generic div elements
const BadAccessibility = () => {
  return (
    <div onClick={handleClick}>
      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
        Title
      </div>
      <div>
        Content
      </div>
      <div>
        <button>Action</button>
      </div>
    </div>
  );
};
```

### ✅ Solution: Semantic HTML
```tsx
// Correct: Use semantic elements
const GoodAccessibility = () => {
  return (
    <article onClick={handleClick}>
      <header>
        <h1>Title</h1>
      </header>
      <main>
        Content
      </main>
      <footer>
        <button>Action</button>
      </footer>
    </article>
  );
};
```

### ❌ Missing ARIA Attributes
```tsx
// Anti-Pattern: No accessibility attributes
const BadProgress = ({ value }) => {
  return (
    <div style={{ width: '100%', height: '8px' }}>
      <div style={{ width: `${value}%`, height: '100%' }} />
    </div>
  );
};
```

### ✅ Solution: ARIA Attributes
```tsx
// Correct: Include ARIA attributes
const GoodProgress = ({ value }) => {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progress indicator"
      style={{ width: '100%', height: '8px' }}
    >
      <div style={{ width: `${value}%`, height: '100%' }} />
    </div>
  );
};

// Better: Use accessible component
const BestProgress = ({ value }) => {
  return (
    <ProgressBar value={value} aria-label="Progress indicator" />
  );
};
```

## Performance Anti-Patterns

### ❌ Expensive CSS Properties
```tsx
// Anti-Pattern: Expensive properties
const BadPerformance = () => {
  return (
    <div style={{
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      ':hover': {
        boxShadow: '0 8px 12px rgba(0, 0, 0, 0.15)',
        transform: 'translateY(-2px)'
      }
    }}>
      Expensive hover
    </div>
  );
};
```

### ✅ Solution: Optimized Properties
```tsx
// Correct: Use performant properties
const GoodPerformance = () => {
  return (
    <div style={{
      boxShadow: 'var(--shadow-sm)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      ':hover': {
        boxShadow: 'var(--shadow-md)',
        transform: 'translateY(-1px)'
      }
    }}>
      Optimized hover
    </div>
  );
};
```

### ❌ Unnecessary Re-renders
```tsx
// Anti-Pattern: Unnecessary re-renders
const BadComponent = ({ items }) => {
  const [filtered, setFiltered] = useState([]);
  
  useEffect(() => {
    // This runs on every render
    setFiltered(items.filter(item => item.active));
  });
  
  return (
    <div>
      {filtered.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};
```

### ✅ Solution: Optimized Rendering
```tsx
// Correct: Use useMemo for expensive operations
const GoodComponent = ({ items }) => {
  const filtered = useMemo(() => {
    return items.filter(item => item.active);
  }, [items]);
  
  return (
    <div>
      {filtered.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};

// Better: Use React.memo for components
const BestComponent = React.memo(({ items }) => {
  const filtered = useMemo(() => {
    return items.filter(item => item.active);
  }, [items]);
  
  return (
    <div>
      {filtered.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
});
```

## Testing Anti-Patterns

### ❌ No Accessibility Testing
```tsx
// Anti-Pattern: No accessibility tests
describe('Button', () => {
  it('should render', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### ✅ Solution: Comprehensive Testing
```tsx
// Correct: Include accessibility tests
describe('Button', () => {
  it('should render', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('should be accessible', () => {
    render(<Button aria-label="Submit form">Submit</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-label', 'Submit form');
    expect(button).toBeEnabled();
  });
  
  it('should handle keyboard navigation', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');
    
    button.focus();
    expect(button).toHaveFocus();
    
    fireEvent.keyPress(button, { key: 'Enter' });
    // Test keyboard interaction
  });
});
```

## Migration Guide

### Step 1: Identify Anti-Patterns
```bash
# Use automated tools to find issues
npm run lint:design-system
npm run validate-design-tokens
npm run test:accessibility
```

### Step 2: Prioritize Fixes
1. **High Priority**: Hard-coded colors, inline styles, accessibility issues
2. **Medium Priority**: Arbitrary spacing, custom animations
3. **Low Priority**: Performance optimizations, code organization

### Step 3: Apply Fixes Systematically
```tsx
// Before: Multiple anti-patterns
const OldComponent = ({ data }) => {
  return (
    <div style={{ 
      backgroundColor: '#ffffff',
      padding: '20px',
      borderRadius: '8px'
    }}>
      <h2 style={{ 
        fontSize: '24px',
        color: '#2c2c2e',
        marginBottom: '16px'
      }}>
        {data.title}
      </h2>
      <p style={{ 
        fontSize: '14px',
        color: '#6b7280',
        lineHeight: 1.6
      }}>
        {data.description}
      </p>
      <button style={{
        backgroundColor: '#217CEB',
        color: '#ffffff',
        padding: '8px 16px',
        borderRadius: '4px'
      }}>
        Action
      </button>
    </div>
  );
};

// After: Design system compliant
const NewComponent = ({ data }) => {
  return (
    <Card>
      <h2>{data.title}</h2>
      <p>{data.description}</p>
      <Button variant="primary">Action</Button>
    </Card>
  );
};
```

## Checklist

### ✅ Compliance Checklist
- [ ] No hard-coded colors (#hex values)
- [ ] No arbitrary spacing (px values)
- [ ] No custom font sizes
- [ ] No inline styles in components
- [ ] Semantic HTML elements used
- [ ] ARIA attributes present
- [ ] Reusable components created
- [ ] Standard transitions used
- [ ] Performance optimized
- [ ] Accessibility tested

### ✅ Review Process
1. **Code Review**: Check for anti-patterns in pull requests
2. **Automated Tools**: Run compliance checking tools
3. **Manual Review**: Visual inspection for consistency
4. **Testing**: Verify accessibility and performance
5. **Documentation**: Update examples and guidelines

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
