# Design System Usage Guidelines

## Overview

These guidelines provide comprehensive instructions for using the design system effectively. They ensure consistency, maintainability, and proper implementation across all components and features.

## Getting Started

### 1. Import Design Tokens
```css
/* In your CSS/SCSS files */
@import './globals.css'; /* Contains all design tokens */

/* Or use CSS variables directly */
.component {
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

### 2. Use Component Library
```tsx
// Import components
import { Button, Card, Badge } from '@/components/ui';

// Use components with design tokens
const MyComponent = () => {
  return (
    <Card>
      <Button variant="primary" size="md">
        Action
      </Button>
      <Badge variant="success">Completed</Badge>
    </Card>
  );
};
```

### 3. Follow Component Patterns
```tsx
// Use established patterns
const PageLayout = ({ children }) => {
  return (
    <Stack spacing="xl">
      <Header />
      <main>{children}</main>
      <Footer />
    </Stack>
  );
};
```

## Design Token Usage

### Color Tokens
```css
/* ✅ Correct: Use semantic color tokens */
.header {
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  border-color: var(--color-border-light);
}

.status-success {
  color: var(--color-success);
  background-color: var(--color-success);
  background-color: var(--color-success);
  opacity: 0.1;
}

/* ❌ Incorrect: Hard-coded colors */
.header {
  background-color: #ffffff;
  color: #2c2c2e;
  border-color: #e5e7eb;
}
```

### Spacing Tokens
```css
/* ✅ Correct: Use spacing tokens */
.card {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-sm);
}

.button {
  padding: var(--spacing-sm) var(--spacing-md);
}

/* ❌ Incorrect: Arbitrary spacing values */
.card {
  padding: 24px;
  margin-bottom: 16px;
  gap: 8px;
}
```

### Typography Tokens
```css
/* ✅ Correct: Use typography tokens */
.heading {
  font-size: var(--font-h2);
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
}

.body-text {
  font-size: var(--font-body);
  font-weight: var(--font-weight-normal);
  line-height: 1.5;
}

/* ❌ Incorrect: Hard-coded typography */
.heading {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
}
```

### Effects Tokens
```css
/* ✅ Correct: Use effects tokens */
.card {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border-light);
}

.button:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-1px);
}

/* ❌ Incorrect: Custom effects */
.card {
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}
```

## Component Usage

### Button Components
```tsx
// ✅ Correct: Use button variants
<Button variant="primary" size="md" onClick={handleClick}>
  Primary Action
</Button>

<Button variant="secondary" size="sm" disabled>
  Disabled Button
</Button>

// ❌ Incorrect: Custom button styling
<div 
  onClick={handleClick}
  style={{ 
    backgroundColor: '#217CEB',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '6px'
  }}
>
  Custom Button
</div>
```

### Card Components
```tsx
// ✅ Correct: Use card component
<Card title="Article Title" actions={<Button>Action</Button>}>
  <p>Article content goes here.</p>
</Card>

// ❌ Incorrect: Custom card styling
<div style={{
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '24px'
}}>
  <h3>Article Title</h3>
  <p>Article content goes here.</p>
</div>
```

### Badge Components
```tsx
// ✅ Correct: Use badge variants
<Badge variant="success">Completed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="outline">Category</Badge>

// ❌ Incorrect: Custom badge styling
<span style={{
  backgroundColor: '#10B981',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px'
}}>
  Custom Badge
</span>
```

## Layout Guidelines

### Responsive Design
```css
/* ✅ Correct: Mobile-first responsive design */
.container {
  padding: var(--spacing-md);
  
  @media (min-width: 768px) {
    padding: var(--spacing-lg);
  }
  
  @media (min-width: 1024px) {
    padding: var(--spacing-xl);
  }
}

/* ❌ Incorrect: Desktop-first or fixed layouts */
.container {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}
```

### Component Composition
```tsx
// ✅ Correct: Use composition patterns
const ArticleCard = ({ article }) => {
  return (
    <Card>
      <Stack spacing="md">
        <h3>{article.title}</h3>
        <p>{article.excerpt}</p>
        <Stack direction="horizontal" justify="space-between">
          <Badge variant="outline">{article.category}</Badge>
          <Button variant="ghost" size="sm">
            Read More
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};

// ❌ Incorrect: Complex nested divs
const ArticleCard = ({ article }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3>{article.title}</h3>
      </div>
      <div className="card-body">
        <p>{article.excerpt}</p>
      </div>
      <div className="card-footer">
        <div className="badge">{article.category}</div>
        <button className="button">Read More</button>
      </div>
    </div>
  );
};
```

## State Management

### Loading States
```tsx
// ✅ Correct: Use loading patterns
const ArticleList = ({ articles, loading }) => {
  return (
    <LoadingState isLoading={loading}>
      {articles.length > 0 ? (
        <List items={articles} renderItem={renderArticle} />
      ) : (
        <EmptyState
          title="No articles"
          description="Start by creating your first article."
        />
      )}
    </LoadingState>
  );
};

// ❌ Incorrect: Manual loading handling
const ArticleList = ({ articles, loading }) => {
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (articles.length === 0) {
    return <div>No articles found</div>;
  }
  
  return (
    <div>
      {articles.map(article => (
        <div key={article.id}>{article.title}</div>
      ))}
    </div>
  );
};
```

### Error States
```tsx
// ✅ Correct: Use error patterns
const ArticleForm = () => {
  const { data, error, loading } = useArticleData();
  
  if (error) {
    return (
      <ErrorState
        title="Failed to load article"
        description="Please try again later."
        error={error.message}
        action={
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
      />
    );
  }
  
  return <Form data={data} />;
};
```

## Accessibility Guidelines

### Semantic HTML
```tsx
// ✅ Correct: Use semantic elements
const ArticlePage = ({ article }) => {
  return (
    <article>
      <header>
        <h1>{article.title}</h1>
        <p>By {article.author}</p>
      </header>
      
      <main>
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </main>
      
      <footer>
        <nav aria-label="Article navigation">
          <Button variant="ghost">Previous</Button>
          <Button variant="ghost">Next</Button>
        </nav>
      </footer>
    </article>
  );
};

// ❌ Incorrect: Generic div elements
const ArticlePage = ({ article }) => {
  return (
    <div>
      <div>
        <h1>{article.title}</h1>
        <p>By {article.author}</p>
      </div>
      
      <div>
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>
      
      <div>
        <div>
          <Button variant="ghost">Previous</Button>
          <Button variant="ghost">Next</Button>
        </div>
      </div>
    </div>
  );
};
```

### ARIA Attributes
```tsx
// ✅ Correct: Use ARIA attributes
const ProgressBar = ({ value, max, label }) => {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      style={{ width: '100%', height: '8px' }}
    >
      <div style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
};

// ✅ Correct: Use proper button markup
const Button = ({ children, ...props }) => {
  return (
    <button
      aria-label={props.ariaLabel}
      aria-describedby={props.ariaDescribedBy}
      {...props}
    >
      {children}
    </button>
  );
};
```

## Performance Guidelines

### CSS Optimization
```css
/* ✅ Correct: Efficient CSS */
.component {
  /* Use CSS custom properties */
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  
  /* Use efficient properties for animations */
  transform: translateY(0);
  transition: transform 0.2s ease;
}

.component:hover {
  transform: translateY(-2px);
}

/* ❌ Incorrect: Expensive CSS */
.component {
  /* Avoid expensive properties */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.component:hover {
  /* Avoid layout changes */
  margin-top: -2px;
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}
```

### React Optimization
```tsx
// ✅ Correct: Use React.memo for expensive components
const ExpensiveCard = React.memo(({ article }) => {
  return (
    <Card>
      <h3>{article.title}</h3>
      <p>{article.excerpt}</p>
    </Card>
  );
});

// ✅ Correct: Use useMemo for expensive calculations
const ArticleList = ({ articles }) => {
  const sortedArticles = useMemo(() => {
    return articles.sort((a, b) => b.createdAt - a.createdAt);
  }, [articles]);
  
  return (
    <List items={sortedArticles} renderItem={renderArticle} />
  );
};

// ❌ Incorrect: Unnecessary re-renders
const ArticleList = ({ articles }) => {
  const sortedArticles = articles.sort((a, b) => b.createdAt - a.createdAt);
  
  return (
    <List items={sortedArticles} renderItem={renderArticle} />
  );
};
```

## Testing Guidelines

### Component Testing
```tsx
// ✅ Correct: Test component behavior
describe('Button Component', () => {
  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
  
  it('should apply correct styles based on variant', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveStyle({
      backgroundColor: 'var(--color-primary-blue)'
    });
  });
});

// ✅ Correct: Test accessibility
describe('Accessibility', () => {
  it('should have proper ARIA attributes', () => {
    render(
      <ProgressBar value={50} aria-label="Upload progress" />
    );
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'Upload progress');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });
});
```

## Migration Guidelines

### From Custom Styles
```tsx
// Before: Custom styling
const CustomButton = ({ children }) => {
  return (
    <button style={{
      backgroundColor: '#217CEB',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '6px',
      border: 'none',
      fontWeight: '500'
    }}>
      {children}
    </button>
  );
};

// After: Design system component
const StandardButton = ({ children }) => {
  return (
    <Button variant="primary" size="md">
      {children}
    </Button>
  );
};
```

### From Hard-coded Values
```css
/* Before: Hard-coded values */
.card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
}

/* After: Design tokens */
.card {
  background-color: var(--color-background-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}
```

## Best Practices

### 1. Consistency First
- Always use design tokens over hard-coded values
- Follow established component patterns
- Maintain visual hierarchy across all interfaces

### 2. Accessibility Always
- Use semantic HTML elements
- Provide proper ARIA attributes
- Ensure keyboard navigation support
- Test with screen readers

### 3. Performance Conscious
- Use efficient CSS properties
- Optimize React rendering
- Minimize bundle size
- Test on mobile devices

### 4. Maintainable Code
- Write clear, self-documenting code
- Follow naming conventions
- Use TypeScript for type safety
- Include proper error handling

### 5. Test Everything
- Write unit tests for components
- Test accessibility features
- Verify responsive behavior
- Check performance impact

## Common Mistakes

### ❌ Common Anti-Patterns
1. **Hard-coded Values**: Using specific colors, spacing, or fonts
2. **Inline Styles**: Overriding component styles with inline styles
3. **One-off Components**: Creating unique components instead of reusing
4. **Ignoring Accessibility**: Missing ARIA labels or semantic HTML
5. **Performance Issues**: Using expensive CSS properties or inefficient React patterns

### ✅ Correct Approaches
1. **Design Tokens**: Always use CSS custom properties
2. **Component Variants**: Use built-in variants for different styles
3. **Reusable Components**: Build composable, reusable components
4. **Accessibility First**: Include accessibility from the start
5. **Performance Optimized**: Use efficient patterns and test performance

## Resources

### Documentation
- [Design Tokens Reference](../tokens/)
- [Component Library](../components/)
- [Accessibility Guidelines](./compliance.md)
- [Testing Standards](../testing/)

### Tools
- [LayoutDiagnostic](../../../components/layout-diagnostic.tsx) - CSS debugging
- [Compliance Checker](../../../tools/compliance-checker/) - Automated validation
- [Component Playground](../examples/component-playground.md) - Interactive testing

### Support
- Design System Team: design-system@company.com
- Slack Channel: #design-system
- Office Hours: Tuesday 2-4 PM

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
