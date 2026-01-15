# Component Creation and Modification Guidelines

## Overview

These guidelines ensure consistent, maintainable, and compliant component development across the Infin8Content design system. All components must follow these standards for creation, modification, and maintenance.

## Component Creation Guidelines

### 1. Requirements Analysis

Before creating a new component, answer these questions:

#### ✅ Checklist
- [ ] **Is this component truly needed?** Can an existing component be extended or composed?
- [ ] **Does this solve a recurring problem?** Will this be used in 3+ places?
- [ ] **Is this a primitive or composite?** Should this be a base component or composed of existing ones?
- [ ] **What are the accessibility requirements?** What ARIA attributes and keyboard support are needed?
- [ ] **What are the responsive requirements?** How should this behave on different screen sizes?
- [ ] **What are the performance requirements?** Is this performance-critical?

#### 📋 Component Proposal Template
```markdown
## Component Proposal: [Component Name]

### Problem Statement
What problem does this component solve?

### Use Cases
List 3-5 specific use cases where this component will be used.

### Requirements
- Functional requirements
- Accessibility requirements
- Performance requirements
- Responsive requirements

### Design Specifications
- Visual design references
- Interaction patterns
- State variations

### Technical Approach
- Component composition strategy
- API design
- Dependencies

### Success Criteria
How will we know this component is successful?
```

### 2. Design System Compliance

#### ✅ Design Token Usage
```tsx
// ✅ Correct: Use design tokens
const Component = () => {
  return (
    <div style={{
      backgroundColor: 'var(--color-background-primary)',
      color: 'var(--color-text-primary)',
      padding: 'var(--spacing-md)',
      borderRadius: 'var(--radius-md)'
    }}>
      Content
    </div>
  );
};

// ❌ Incorrect: Hard-coded values
const Component = () => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      color: '#2c2c2e',
      padding: '16px',
      borderRadius: '6px'
    }}>
      Content
    </div>
  );
};
```

#### ✅ Semantic HTML
```tsx
// ✅ Correct: Semantic elements
const ArticleCard = ({ article }) => {
  return (
    <article>
      <header>
        <h2>{article.title}</h2>
        <time dateTime={article.publishedAt}>
          {formatDate(article.publishedAt)}
        </time>
      </header>
      <main>
        <p>{article.excerpt}</p>
      </main>
      <footer>
        <Button variant="primary">Read More</Button>
      </footer>
    </article>
  );
};

// ❌ Incorrect: Generic div elements
const ArticleCard = ({ article }) => {
  return (
    <div>
      <div>
        <h2>{article.title}</h2>
        <span>{formatDate(article.publishedAt)}</span>
      </div>
      <div>
        <p>{article.excerpt}</p>
      </div>
      <div>
        <Button variant="primary">Read More</Button>
      </div>
    </div>
  );
};
```

### 3. Component Architecture

#### ✅ Single Responsibility Principle
```tsx
// ✅ Good: Component has single responsibility
const Avatar = ({ src, alt, size }) => {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: size === 'sm' ? '32px' : size === 'md' ? '48px' : '64px',
        height: size === 'sm' ? '32px' : size === 'md' ? '48px' : '64px',
        borderRadius: 'var(--radius-full)',
        objectFit: 'cover'
      }}
    />
  );
};

// ❌ Bad: Component handles multiple concerns
const UserCard = ({ user, onFollow, onMessage }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
      <img
        src={user.avatar}
        alt={user.name}
        style={{ width: '48px', height: '48px', borderRadius: '50%' }}
      />
      <div>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          {user.name}
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          {user.email}
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button onClick={() => onFollow(user.id)}>Follow</button>
          <button onClick={() => onMessage(user.id)}>Message</button>
        </div>
      </div>
    </div>
  );
};
```

#### ✅ Composition Over Inheritance
```tsx
// ✅ Good: Composable components
const Card = ({ children, ...props }) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-background-primary)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children }) => (
  <div style={{ marginBottom: 'var(--spacing-md)' }}>
    {children}
  </div>
);

const CardContent = ({ children }) => (
  <div style={{ marginBottom: 'var(--spacing-md)' }}>
    {children}
  </div>
);

const CardActions = ({ children }) => (
  <div style={{ 
    display: 'flex', 
    gap: 'var(--spacing-sm)', 
    justifyContent: 'flex-end' 
  }}>
    {children}
  </div>
);

// Usage
const ArticleCard = ({ article }) => (
  <Card>
    <CardHeader>
      <h3>{article.title}</h3>
    </CardHeader>
    <CardContent>
      <p>{article.excerpt}</p>
    </CardContent>
    <CardActions>
      <Button variant="primary">Read More</Button>
    </CardActions>
  </Card>
);
```

### 4. API Design

#### ✅ Props Interface
```tsx
// ✅ Good: Clear, typed interfaces
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
  className?: string;
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
  onClick,
  className
}) => {
  // Implementation
};

// ❌ Bad: Unclear props
const BadButton = (props) => {
  const {
    type,
    big,
    isDisabled,
    isLoading,
    hasIcon,
    iconOnRight,
    wide,
    ...rest
  } = props;
  
  // Implementation with unclear prop names
};
```

#### ✅ Default Values and Variants
```tsx
// ✅ Good: Clear defaults and variants
const Button = ({ variant = 'primary', size = 'md', ...props }) => {
  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary-blue)',
      color: 'var(--color-background-primary)'
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
      fontSize: 'var(--font-body)'
    }
  };

  return (
    <button
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: 'var(--radius-md)',
        fontWeight: 'var(--font-weight-medium)',
        transition: 'all 0.2s ease'
      }}
      {...props}
    />
  );
};
```

## Component Modification Guidelines

### 1. Breaking Changes

#### ✅ Breaking Change Checklist
- [ ] **Is this change necessary?** Can the functionality be added without breaking changes?
- [ ] **What components are affected?** List all components that use this component
- [ ] **What are the migration steps?** Provide clear migration instructions
- [ ] **Is backward compatibility maintained?** Can old props still work with deprecation warnings?
- [ ] **Are tests updated?** Update all tests to reflect the changes
- [ ] **Is documentation updated?** Update all documentation and examples

#### 📋 Breaking Change Template
```markdown
## Breaking Change: [Component Name] v[Old Version] → v[New Version]

### Summary
Brief description of what changed and why.

### Changes
- What changed
- Why it changed
- Impact on users

### Migration Guide
Step-by-step instructions for migrating from old to new API.

### Deprecation Timeline
- [ ] Version X.Y: Deprecation warning added
- [ ] Version X.Z: Old API removed
- [ ] Version X.W: Full migration expected

### Affected Components
List of components that use this component and need updates.
```

### 2. Version Management

#### ✅ Semantic Versioning
```tsx
// package.json version guidelines
{
  "version": "1.2.3"
  // MAJOR.MINOR.PATCH
  // MAJOR: Breaking changes
  // MINOR: New features, backward compatible
  // PATCH: Bug fixes, backward compatible
}
```

#### ✅ Change Types
- **PATCH (0.0.X)**: Bug fixes, documentation updates, performance improvements
- **MINOR (0.X.0)**: New features, new props, new variants (backward compatible)
- **MAJOR (X.0.0)**: Breaking changes, removed props, API changes

### 3. Testing Requirements

#### ✅ Test Coverage
```tsx
// ✅ Comprehensive test coverage
describe('Button Component', () => {
  // Render tests
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  // Variant tests
  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveStyle({
      backgroundColor: 'var(--color-primary-blue)'
    });

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveStyle({
      backgroundColor: 'var(--color-background-secondary)'
    });
  });

  // Interaction tests
  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  // Accessibility tests
  it('should be accessible', () => {
    render(<Button aria-label="Submit form">Submit</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-label', 'Submit form');
    expect(button).toBeEnabled();
  });

  // State tests
  it('should handle disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveStyle({ opacity: 0.5 });
  });
});
```

### 4. Documentation Updates

#### ✅ Documentation Checklist
- [ ] **Component documentation updated** with new props and examples
- [ ] **Storybook stories updated** with new variants and states
- [ ] **API reference updated** with prop types and descriptions
- [ ] **Usage examples updated** with best practices
- [ ] **Migration guide created** if breaking changes
- [ ] **Changelog updated** with version notes

#### ✅ Documentation Template
```tsx
/**
 * ComponentName - Brief description
 * 
 * @example
 * ```tsx
 * <ComponentName variant="primary" size="md">
 *   Content
 * </ComponentName>
 * ```
 * 
 * @param props - Component props
 * @param props.variant - Visual style variant
 * @param props.size - Component size
 * @param props.children - Component content
 * @returns Styled component element
 */
const ComponentName = ({ variant, size, children }) => {
  // Implementation
};
```

## Component Maintenance Guidelines

### 1. Regular Reviews

#### ✅ Monthly Review Checklist
- [ ] **Usage analysis**: How many components use this component?
- [ ] **Performance review**: Are there performance issues?
- [ ] **Accessibility audit**: Are there accessibility issues?
- [ ] **Design compliance**: Does this follow current design tokens?
- [ ] **Code quality**: Is the code clean and maintainable?
- [ ] **Test coverage**: Are tests comprehensive and up to date?

### 2. Deprecation Process

#### ✅ Deprecation Timeline
1. **Announcement**: Communicate deprecation to team
2. **Warning Period**: Add deprecation warnings (minimum 2 versions)
3. **Migration Support**: Provide migration tools and documentation
4. **Removal**: Remove deprecated code after migration period

#### ✅ Deprecation Implementation
```tsx
// ✅ Deprecation warning
const Button = ({ variant, size, oldProp, ...props }) => {
  // Show deprecation warning in development
  if (process.env.NODE_ENV === 'development' && oldProp !== undefined) {
    console.warn(
      `Button: 'oldProp' is deprecated and will be removed in v2.0.0. ` +
      `Use 'newProp' instead.`
    );
  }

  // Implementation
};

// ✅ Migration helper
const migrateButtonProps = (props) => {
  if (props.oldProp) {
    console.warn('Button: oldProp is deprecated. Use newProp instead.');
    return { ...props, newProp: props.oldProp, oldProp: undefined };
  }
  return props;
};
```

### 3. Performance Monitoring

#### ✅ Performance Checklist
- [ ] **Render performance**: Component renders efficiently
- [ ] **Bundle size**: Component doesn't significantly increase bundle size
- [ ] **Memory usage**: No memory leaks
- [ ] **Re-render optimization**: Unnecessary re-renders are avoided

#### ✅ Performance Optimization
```tsx
// ✅ Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data]);

  return <div>{processedData.display}</div>;
});

// ✅ Use useCallback for event handlers
const Component = ({ onItemClick }) => {
  const handleClick = useCallback((item) => {
    onItemClick(item.id);
  }, [onItemClick]);

  return <button onClick={handleClick}>Click</button>;
};
```

## Quality Gates

### 1. Pre-commit Checks
- [ ] No hard-coded colors
- [ ] No inline styles
- [ ] Design tokens used correctly
- [ ] Semantic HTML elements
- [ ] Accessibility attributes present
- [ ] Tests pass
- [ ] Documentation updated

### 2. Pull Request Review
- [ ] Design system compliance
- [ ] Code quality standards
- [ ] Test coverage
- [ ] Documentation completeness
- [ ] Performance impact
- [ ] Breaking change assessment

### 3. Release Criteria
- [ ] All tests pass
- [ ] Documentation complete
- [ ] Performance benchmarks met
- [ ] Accessibility compliance verified
- [ ] Design system compliance confirmed

## Resources

### 📚 Documentation
- [Design Token Reference](../tokens/)
- [Component Library](../components/)
- [Accessibility Guidelines](./accessibility.md)
- [Testing Standards](../testing/)

### 🛠 Tools
- [Compliance Checker](../../tools/compliance-check.js)
- [ESLint Configuration](../../.eslintrc.design-system.js)
- [Pre-commit Hooks](../../scripts/pre-commit-check.sh)

### 📞 Support
- Design System Team: design-system@company.com
- Component Review: component-review@company.com
- Accessibility Issues: a11y@company.com

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
