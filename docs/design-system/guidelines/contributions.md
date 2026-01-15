# Design System Contributions & Onboarding

## Overview

This guide helps new developers understand and contribute to the Infin8Content Design System. It covers everything from basic concepts to advanced contribution patterns.

## Getting Started

### Prerequisites
- Familiarity with React and TypeScript
- Understanding of CSS and design tokens
- Knowledge of accessibility best practices
- Experience with component libraries

### Required Reading
1. [Design System Overview](../README.md)
2. [Design Token Documentation](../tokens/)
3. [Component Library Documentation](../components/)
4. [Compliance Requirements](./compliance.md)

## Design System Fundamentals

### What are Design Tokens?
Design tokens are the single source of truth for all design decisions. They are implemented as CSS variables and provide:
- **Consistency**: Same values across all components
- **Maintainability**: Update once, apply everywhere
- **Scalability**: Easy to extend and modify
- **Theming**: Foundation for future theme support

### Token Categories
```css
/* Colors */
--color-primary-blue: #217CEB;
--color-text-primary: #2C2C2E;
--color-background-primary: #FFFFFF;

/* Spacing */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;

/* Typography */
--font-h1: 44-48px;
--font-body: 16px;
--font-weight-medium: 500;

/* Effects */
--radius-md: 6px;
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
```

## Component Development

### Before You Start
1. **Check Existing Components**: Search the component library first
2. **Review Design Tokens**: Ensure needed tokens exist
3. **Understand Patterns**: Follow established patterns
4. **Plan Accessibility**: Include accessibility from the start

### Creating a New Component

#### 1. Component Structure
```tsx
// infin8content/components/ui/NewComponent.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface NewComponentProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NewComponent = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: NewComponentProps) => {
  return (
    <div
      className={cn(
        'new-component',
        `new-component--${variant}`,
        `new-component--${size}`,
        className
      )}
      style={{
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: variant === 'primary' 
          ? 'var(--color-primary-blue)' 
          : 'var(--color-background-secondary)'
      }}
      {...props}
    >
      {children}
    </div>
  );
};
```

#### 2. CSS Classes (if needed)
```css
/* infin8content/components/ui/NewComponent.css */
.new-component {
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.new-component--sm {
  padding: var(--spacing-sm);
  font-size: var(--font-small);
}

.new-component--md {
  padding: var(--spacing-md);
  font-size: var(--font-body);
}

.new-component--lg {
  padding: var(--spacing-lg);
  font-size: var(--font-h4);
}
```

#### 3. Component Tests
```tsx
// infin8content/__tests__/components/NewComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { NewComponent } from '@/components/ui/NewComponent';

describe('NewComponent', () => {
  it('renders with default props', () => {
    render(<NewComponent>Test Content</NewComponent>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies variant styles correctly', () => {
    render(<NewComponent variant="secondary">Test</NewComponent>);
    const component = screen.getByText('Test');
    expect(component).toHaveStyle({
      backgroundColor: 'var(--color-background-secondary)'
    });
  });

  it('uses design tokens', () => {
    render(<NewComponent>Test</NewComponent>);
    const component = screen.getByText('Test');
    expect(component).toHaveStyle({
      padding: 'var(--spacing-md)',
      borderRadius: 'var(--radius-md)'
    });
  });
});
```

#### 4. Component Documentation
```markdown
<!-- infin8content/components/ui/NewComponent.md -->
# NewComponent

## Description
Brief description of what this component does and when to use it.

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | React.ReactNode | - | Content to render inside |
| variant | 'primary' \| 'secondary' | 'primary' | Visual style variant |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Component size |
| className | string | - | Additional CSS classes |

## Design Tokens Used
- `--spacing-md` for internal padding
- `--radius-md` for border radius
- `--color-primary-blue` for primary variant
- `--color-background-secondary` for secondary variant

## Usage Examples
```tsx
// Basic usage
<NewComponent>Content</NewComponent>

// With variant
<NewComponent variant="secondary">Content</NewComponent>

// With size
<NewComponent size="lg">Large Content</NewComponent>
```

## Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

## Anti-Patterns
❌ Don't use hard-coded colors
❌ Don't override with inline styles
❌ Don't create one-off variants

✅ Use design tokens
✅ Follow semantic naming
✅ Reuse existing components
```

### Component Patterns

#### 1. Composition Pattern
```tsx
// Compose smaller components into larger ones
const Card = ({ children, ...props }) => (
  <div className="card" {...props}>{children}</div>
);

const CardHeader = ({ children, ...props }) => (
  <div className="card-header" {...props}>{children}</div>
);

const CardContent = ({ children, ...props }) => (
  <div className="card-content" {...props}>{children}</div>;

// Usage
<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

#### 2. Variant Pattern
```tsx
const Button = ({ variant = 'primary', size = 'md', ...props }) => {
  const baseStyles = {
    padding: 'var(--spacing-md)',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: 'pointer'
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary-blue)',
      color: 'var(--color-background-primary)'
    },
    secondary: {
      backgroundColor: 'var(--color-background-secondary)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border-medium)'
    }
  };

  const sizes = {
    sm: { padding: 'var(--spacing-xs) var(--spacing-sm)' },
    md: { padding: 'var(--spacing-sm) var(--spacing-md)' },
    lg: { padding: 'var(--spacing-md) var(--spacing-lg)' }
  };

  return (
    <button
      style={{ ...baseStyles, ...variants[variant], ...sizes[size] }}
      {...props}
    />
  );
};
```

#### 3. State Pattern
```tsx
const InteractiveComponent = () => {
  const [state, setState] = useState('idle');
  
  const handleClick = () => {
    setState(state === 'idle' ? 'active' : 'idle');
  };

  const stateStyles = {
    idle: { backgroundColor: 'var(--color-background-secondary)' },
    active: { backgroundColor: 'var(--color-primary-blue)' },
    disabled: { backgroundColor: 'var(--color-background-accent)' }
  };

  return (
    <button
      style={stateStyles[state]}
      onClick={handleClick}
      disabled={state === 'disabled'}
    >
      State: {state}
    </button>
  );
};
```

## Design Token Usage

### Color Tokens
```tsx
// ✅ Correct: Semantic color usage
<div style={{
  color: 'var(--color-text-primary)',
  backgroundColor: 'var(--color-background-primary)',
  borderColor: 'var(--color-border-medium)'
}}>

// ❌ Incorrect: Hard-coded colors
<div style={{
  color: '#2C2C2E',
  backgroundColor: '#FFFFFF',
  borderColor: '#D1D5DB'
}}>
```

### Spacing Tokens
```tsx
// ✅ Correct: Spacing tokens
<div style={{
  padding: 'var(--spacing-md)',
  margin: 'var(--spacing-lg)',
  gap: 'var(--spacing-sm)'
}}>

// ❌ Incorrect: Arbitrary spacing
<div style={{
  padding: '16px',
  margin: '24px',
  gap: '8px'
}}>
```

### Typography Tokens
```tsx
// ✅ Correct: Typography tokens
<h1 style={{
  fontSize: 'var(--font-h1)',
  fontWeight: 'var(--font-weight-semibold)',
  lineHeight: 1.2
}}>

// ❌ Incorrect: Arbitrary typography
<h1 style={{
  fontSize: '48px',
  fontWeight: '600',
  lineHeight: '1.2'
}}>
```

## Accessibility Guidelines

### Semantic HTML
```tsx
// ✅ Correct: Semantic elements
<article>
  <header>
    <h1>Article Title</h1>
  </header>
  <main>
    <p>Article content...</p>
  </main>
</article>

// ❌ Incorrect: Div soup
<div>
  <div>
    <div>Article Title</div>
  </div>
  <div>
    <div>Article content...</div>
  </div>
</div>
```

### ARIA Attributes
```tsx
// ✅ Correct: Proper ARIA usage
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  aria-controls="dialog-panel"
  onClick={handleClose}
>
  ×
</button>

// ❌ Incorrect: Missing ARIA
<button onClick={handleClose}>
  ×
</button>
```

### Keyboard Navigation
```tsx
// ✅ Correct: Keyboard support
const InteractiveComponent = () => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      tabIndex={0}
      role="button"
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      Interactive Content
    </div>
  );
};
```

## Testing Requirements

### Unit Tests
```tsx
describe('ComponentName', () => {
  // Test basic rendering
  it('renders without crashing', () => {
    render(<ComponentName />);
  });

  // Test props
  it('applies variant correctly', () => {
    render(<ComponentName variant="secondary" />);
    // Assert variant-specific styles or behavior
  });

  // Test accessibility
  it('has proper ARIA attributes', () => {
    render(<ComponentName />);
    // Assert accessibility attributes
  });

  // Test design token usage
  it('uses design tokens', () => {
    render(<ComponentName />);
    const element = screen.getByRole('button');
    expect(element).toHaveStyle({
      padding: 'var(--spacing-md)'
    });
  });
});
```

### Accessibility Tests
```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

describe('ComponentName Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<ComponentName />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Visual Tests
```tsx
import { matchSnapshot } from 'jest-image-snapshot';

describe('ComponentName Visual', () => {
  it('matches snapshot', () => {
    render(<ComponentName />);
    expect(screen.getByRole('button')).toMatchSnapshot();
  });
});
```

## Contribution Workflow

### 1. Development Setup
```bash
# Clone repository
git clone <repository-url>
cd infin8content

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

### 2. Create Feature Branch
```bash
# Create feature branch
git checkout -b feature/new-component

# Make changes
# ... develop component ...

# Run tests
npm test

# Run compliance checks
npm run lint:design-system
```

### 3. Submit Pull Request
```markdown
## Description
Brief description of the component or changes.

## Changes Made
- [ ] Added new component
- [ ] Updated documentation
- [ ] Added tests
- [ ] Verified accessibility
- [ ] Checked compliance

## Testing
- [ ] Unit tests pass
- [ ] Accessibility tests pass
- [ ] Visual tests pass
- [ ] Manual testing completed

## Design System Compliance
- [ ] Uses design tokens
- [ ] No inline styles
- [ ] Semantic HTML
- [ ] Proper ARIA attributes
- [ ] Keyboard navigation

## Screenshots
[Include screenshots if applicable]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] Ready for review
```

### 4. Code Review Process

#### Reviewer Checklist
```markdown
## Design System Compliance Review

### ✅ Token Usage
- [ ] No hard-coded colors
- [ ] No arbitrary spacing
- [ ] No custom font sizes
- [ ] Semantic color usage

### ✅ Component Standards
- [ ] Reusable component design
- [ ] Proper TypeScript types
- [ ] Consistent naming
- [ ] Documentation complete

### ✅ Accessibility
- [ ] Semantic HTML
- [ ] ARIA attributes
- [ ] Keyboard navigation
- [ ] Color contrast

### ✅ Testing
- [ ] Unit tests cover functionality
- [ ] Accessibility tests pass
- [ ] Visual tests included
- [ ] Edge cases handled

### ✅ Code Quality
- [ ] Clean, readable code
- [ ] No console errors
- [ ] Performance considered
- [ ] Bundle size impact minimal
```

## Common Pitfalls

### 1. Hard-coded Values
```tsx
// ❌ Avoid this
<div style={{ color: '#217CEB', padding: '16px' }}>

// ✅ Do this instead
<div style={{ 
  color: 'var(--color-primary-blue)', 
  padding: 'var(--spacing-md)' 
}}>
```

### 2. Inline Styles
```tsx
// ❌ Avoid this
<div style={{ backgroundColor: 'var(--color-background-primary)' }}>

// ✅ Use CSS classes instead
<div className="component-class">
```

### 3. One-off Components
```tsx
// ❌ Avoid this
const ArticleCard = ({ article }) => (
  <div className="article-card">
    <h3>{article.title}</h3>
    <p>{article.excerpt}</p>
  </div>
);

const ProductCard = ({ product }) => (
  <div className="product-card">
    <h3>{product.name}</h3>
    <p>{product.description}</p>
  </div>
);

// ✅ Use reusable components
const Card = ({ title, children }) => (
  <div className="card">
    <h3>{title}</h3>
    <div>{children}</div>
  </div>
);
```

### 4. Missing Accessibility
```tsx
// ❌ Avoid this
<button onClick={handleClick}>
  <Icon />
  Click me
</button>

// ✅ Add accessibility
<button 
  onClick={handleClick}
  aria-label="Click to perform action"
  onKeyDown={handleKeyDown}
>
  <Icon aria-hidden="true" />
  Click me
</button>
```

## Resources

### Documentation
- [Design System Overview](../README.md)
- [Design Tokens](../tokens/)
- [Component Library](../components/)
- [Compliance Guidelines](./compliance.md)
- [CSS Crisis Resolution](../../CSS-specificity-crisis-resolution.md)

### Tools
- [Component Playground](../examples/component-playground.md)
- [Accessibility Checker](../examples/accessibility-testing.md)
- [Compliance Reporter](../../../tools/compliance-reporter/)
- [Design Token Validator](../../../tools/validate-design-tokens/)

### Support
- **Design System Team**: design-system@company.com
- **Accessibility Help**: accessibility@company.com
- **Technical Support**: tech-support@company.com
- **Slack Channel**: #design-system

### Training
- **Weekly Office Hours**: Tuesdays 2-3 PM
- **Monthly Workshops**: First Thursday of each month
- **Onboarding Sessions**: By appointment
- **Code Review Clinics**: Fridays 10-11 AM

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
