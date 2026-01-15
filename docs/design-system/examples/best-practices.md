# Design System Best Practices

## Overview

This document outlines best practices for using the design system effectively. These practices ensure consistency, maintainability, and optimal performance across all implementations.

## Component Design Best Practices

### 1. Single Responsibility Principle
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
const UserCard = ({ user }) => {
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
        <button onClick={() => followUser(user.id)}>
          Follow
        </button>
      </div>
    </div>
  );
};
```

### 2. Composition Over Inheritance
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

### 3. Props Interface Design
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

### 4. Default Props and Variants
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

## State Management Best Practices

### 1. Local State for UI
```tsx
// ✅ Good: Local state for UI interactions
const ToggleButton = ({ children }) => {
  const [isToggled, setIsToggled] = useState(false);

  return (
    <Button
      variant={isToggled ? 'primary' : 'ghost'}
      onClick={() => setIsToggled(!isToggled)}
    >
      {children}
    </Button>
  );
};

// ❌ Bad: Global state for local UI
const ToggleButton = ({ children }) => {
  const [isToggled, setIsToggled] = useGlobalState('toggleState');

  return (
    <Button
      variant={isToggled ? 'primary' : 'ghost'}
      onClick={() => setIsToggled(!isToggled)}
    >
      {children}
    </Button>
  );
};
```

### 2. Derived State
```tsx
// ✅ Good: Compute derived state
const UserList = ({ users, filter }) => {
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [users, filter]);

  return (
    <List items={filteredUsers} renderItem={renderUser} />
  );
};

// ❌ Bad: Duplicate state
const UserList = ({ users, filter }) => {
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    setFilteredUsers(
      users.filter(user => 
        user.name.toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [users, filter]);

  return (
    <List items={filteredUsers} renderItem={renderUser} />
  );
};
```

### 3. State Colocation
```tsx
// ✅ Good: Keep state close to where it's used
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={email}
        onChange={setEmail}
        placeholder="Email"
      />
      <Input
        value={password}
        onChange={setPassword}
        type="password"
        placeholder="Password"
      />
      <Button
        type="submit"
        loading={isLoading}
        disabled={isLoading}
      >
        Login
      </Button>
    </form>
  );
};
```

## Performance Best Practices

### 1. React.memo for Pure Components
```tsx
// ✅ Good: Use React.memo for expensive components
const ExpensiveListItem = React.memo(({ item, onClick }) => {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(item);
  }, [item]);

  return (
    <div onClick={() => onClick(item.id)}>
      {processedData.display}
    </div>
  );
});

// ❌ Bad: Re-render on every parent update
const ExpensiveListItem = ({ item, onClick }) => {
  const processedData = expensiveDataProcessing(item);

  return (
    <div onClick={() => onClick(item.id)}>
      {processedData.display}
    </div>
  );
};
```

### 2. Callback Memoization
```tsx
// ✅ Good: Memoize callbacks
const ParentComponent = ({ items }) => {
  const [selectedId, setSelectedId] = useState(null);

  const handleItemClick = useCallback((id) => {
    setSelectedId(id);
  }, []);

  return (
    <List>
      {items.map(item => (
        <ListItem
          key={item.id}
          item={item}
          isSelected={item.id === selectedId}
          onClick={handleItemClick}
        />
      ))}
    </List>
  );
};

// ❌ Bad: Create new functions on every render
const ParentComponent = ({ items }) => {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <List>
      {items.map(item => (
        <ListItem
          key={item.id}
          item={item}
          isSelected={item.id === selectedId}
          onClick={() => setSelectedId(item.id)}
        />
      ))}
    </List>
  );
};
```

### 3. CSS Performance
```tsx
// ✅ Good: Use performant CSS properties
const OptimizedCard = ({ isHovered }) => {
  return (
    <div
      style={{
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      Content
    </div>
  );
};

// ❌ Bad: Use expensive CSS properties
const UnoptimizedCard = ({ isHovered }) => {
  return (
    <div
      style={{
        marginTop: isHovered ? '-2px' : '0',
        boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease'
      }}
    >
      Content
    </div>
  );
};
```

## Accessibility Best Practices

### 1. Semantic HTML
```tsx
// ✅ Good: Use semantic elements
const ArticlePage = ({ article }) => {
  return (
    <article>
      <header>
        <h1>{article.title}</h1>
        <time dateTime={article.publishedAt}>
          {formatDate(article.publishedAt)}
        </time>
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

// ❌ Bad: Generic div elements
const ArticlePage = ({ article }) => {
  return (
    <div>
      <div>
        <h1>{article.title}</h1>
        <span>{formatDate(article.publishedAt)}</span>
      </div>
      
      <div>
        <div dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>
      
      <div>
        <Button variant="ghost">Previous</Button>
        <Button variant="ghost">Next</Button>
      </div>
    </div>
  );
};
```

### 2. ARIA Attributes
```tsx
// ✅ Good: Comprehensive ARIA support
const ProgressBar = ({ value, max, label }) => {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      aria-describedby={`${label}-description`}
    >
      <div
        id={`${label}-description`}
        style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        Progress: {Math.round((value / max) * 100)}%
      </div>
      <div style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
};

// ❌ Bad: Missing accessibility attributes
const ProgressBar = ({ value, max }) => {
  return (
    <div>
      <div style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
};
```

### 3. Keyboard Navigation
```tsx
// ✅ Good: Full keyboard support
const SelectableItem = ({ item, isSelected, onSelect }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.focus();
    }
  }, [isSelected]);

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => onSelect(item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item.id);
        }
      }}
      style={{
        padding: 'var(--spacing-sm)',
        backgroundColor: isSelected ? 'var(--color-primary-blue)' : 'var(--color-background-primary)',
        color: isSelected ? 'var(--color-background-primary)' : 'var(--color-text-primary)',
        cursor: 'pointer',
        ':focus': {
          outline: '2px solid var(--color-primary-blue)',
          outlineOffset: '2px'
        }
      }}
    >
      {item.label}
    </div>
  );
};
```

## Testing Best Practices

### 1. Component Testing
```tsx
// ✅ Good: Comprehensive component tests
describe('Button Component', () => {
  it('should render with correct variant styles', () => {
    render(<Button variant="primary">Click me</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveStyle({
      backgroundColor: 'var(--color-primary-blue)',
      color: 'var(--color-background-primary)'
    });
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('should be accessible', () => {
    render(
      <Button aria-label="Submit form" disabled>
        Submit
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
    expect(button).toBeDisabled();
  });

  it('should show loading state', () => {
    render(<Button loading>Submit</Button>);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 2. Integration Testing
```tsx
// ✅ Good: Test component interactions
describe('Form Integration', () => {
  it('should submit form with valid data', async () => {
    const handleSubmit = vi.fn();
    render(<ContactForm onSubmit={handleSubmit} />);
    
    await userEvent.type(screen.getByLabelText('Name'), 'John Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'john@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com'
    });
  });

  it('should show validation errors for invalid data', async () => {
    render(<ContactForm />);
    
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });
});
```

### 3. Accessibility Testing
```tsx
// ✅ Good: Accessibility testing
describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<MyComponent />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });

  it('should support keyboard navigation', async () => {
    render(<MyComponent />);
    
    await userEvent.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    
    await userEvent.keyboard('{Enter}');
    expect(mockFunction).toHaveBeenCalled();
  });
});
```

## Documentation Best Practices

### 1. Component Documentation
```tsx
// ✅ Good: Comprehensive JSDoc
/**
 * Button component for user interactions
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 * 
 * @param props - Button component props
 * @param props.variant - Visual style variant
 * @param props.size - Button size
 * @param props.disabled - Disable the button
 * @param props.loading - Show loading state
 * @param props.children - Button content
 * @param props.onClick - Click handler
 * @returns Styled button element
 */
const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false, 
  children, 
  onClick 
}) => {
  // Implementation
};
```

### 2. Storybook Stories
```tsx
// ✅ Good: Comprehensive Storybook stories
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {
    children: 'Button',
  },
};

export const Variants = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};

export const Sizes = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const States = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </div>
  ),
};
```

## Code Organization Best Practices

### 1. File Structure
```
components/
├── ui/
│   ├── Button/
│   │   ├── Button.tsx          # Main component
│   │   ├── Button.test.tsx     # Tests
│   │   ├── Button.stories.tsx  # Storybook stories
│   │   └── index.ts           # Exports
│   ├── Card/
│   │   ├── Card.tsx
│   │   ├── Card.test.tsx
│   │   ├── Card.stories.tsx
│   │   └── index.ts
│   └── index.ts               # Re-export all components
├── forms/
│   ├── FormField/
│   └── FormActions/
└── layout/
    ├── Header/
    └── Sidebar/
```

### 2. Barrel Exports
```tsx
// components/ui/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Badge } from './Badge';
export { ProgressBar } from './ProgressBar';

// Re-export types
export type { ButtonProps } from './Button';
export type { CardProps } from './Card';
```

### 3. Component Index
```tsx
// components/ui/Button/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';

// Also export sub-components if any
export { ButtonGroup } from './ButtonGroup';
```

## Error Handling Best Practices

### 1. Error Boundaries
```tsx
// ✅ Good: Error boundary for components
const ComponentErrorBoundary = ({ children, fallback }) => {
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <Card>
            <h3>Something went wrong</h3>
            <p>Please try refreshing the page.</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </Card>
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
};

// Usage
const App = () => {
  return (
    <ComponentErrorBoundary>
      <MyApp />
    </ComponentErrorBoundary>
  );
};
```

### 2. Graceful Degradation
```tsx
// ✅ Good: Graceful degradation
const ImageWithFallback = ({ src, alt, ...props }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        style={{
          width: '100%',
          height: '200px',
          backgroundColor: 'var(--color-background-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-md)'
        }}
        {...props}
      >
        <span style={{ color: 'var(--color-text-muted)' }}>
          Image unavailable
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      style={{ width: '100%', height: 'auto', ...props.style }}
      {...props}
    />
  );
};
```

## Security Best Practices

### 1. Input Sanitization
```tsx
// ✅ Good: Sanitize user input
const UserContent = ({ content }) => {
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
      ALLOWED_ATTR: ['href', 'target']
    });
  }, [content]);

  return (
    <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
  );
};

// ❌ Bad: Direct user input rendering
const UserContent = ({ content }) => {
  return (
    <div dangerouslySetInnerHTML={{ __html: content }} />
  );
};
```

### 2. XSS Prevention
```tsx
// ✅ Good: Safe data handling
const SafeComponent = ({ data }) => {
  return (
    <div>
      <h1>{data.title}</h1> {/* Safe: React escapes by default */}
      <p>{data.description}</p>
      <a href={data.url} target="_blank" rel="noopener noreferrer">
        Link
      </a>
    </div>
  );
};
```

## Checklist

### ✅ Development Checklist
- [ ] Components follow single responsibility principle
- [ ] Props are properly typed with interfaces
- [ ] Default values are provided for optional props
- [ ] Components are composable and reusable
- [ ] Performance optimizations applied where needed
- [ ] Accessibility features implemented
- [ ] Error handling is robust
- [ ] Tests cover all functionality
- [ ] Documentation is comprehensive
- [ ] Code follows established patterns

### ✅ Review Checklist
- [ ] No hard-coded values (colors, spacing, fonts)
- [ ] Semantic HTML elements used
- [ ] ARIA attributes present where needed
- [ ] Keyboard navigation supported
- [ ] Color contrast meets WCAG standards
- [ ] Performance impact considered
- [ ] Security vulnerabilities addressed
- [ ] Tests pass and cover edge cases
- [ ] Documentation is up to date
- [ ] Design system compliance verified

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
