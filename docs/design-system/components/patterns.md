# Component Patterns

## Overview

Component patterns provide established solutions for common UI challenges. They ensure consistency, reusability, and maintainability across the application while following design system principles.

## Layout Patterns

### Card Pattern
```tsx
const Card = ({ title, subtitle, actions, children, variant = 'default' }) => {
  return (
    <div style={{
      backgroundColor: 'var(--color-background-primary)',
      border: '1px solid var(--color-border-light)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-lg)',
      boxShadow: 'var(--shadow-sm)',
      transition: 'all 0.2s ease'
    }}>
      {title && (
        <div style={{
          marginBottom: 'var(--spacing-md)',
          paddingBottom: 'var(--spacing-md)',
          borderBottom: '1px solid var(--color-border-light)'
        }}>
          <h3 style={{
            fontSize: 'var(--font-h4)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-primary)',
            margin: 0
          }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{
              fontSize: 'var(--font-small)',
              color: 'var(--color-text-secondary)',
              margin: 'var(--spacing-xs) 0 0 0'
            }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <div style={{
        fontSize: 'var(--font-body)',
        color: 'var(--color-text-primary)',
        lineHeight: 1.6
      }}>
        {children}
      </div>
      
      {actions && (
        <div style={{
          marginTop: 'var(--spacing-lg)',
          paddingTop: 'var(--spacing-md)',
          borderTop: '1px solid var(--color-border-light)',
          display: 'flex',
          gap: 'var(--spacing-md)',
          justifyContent: 'flex-end'
        }}>
          {actions}
        </div>
      )}
    </div>
  );
};
```

**Use Cases:**
- Article summaries
- Dashboard widgets
- Form containers
- Content sections

**Design Tokens Used:**
- `--color-background-primary` for card background
- `--color-border-light` for borders
- `--radius-lg` for corner radius
- `--shadow-sm` for elevation
- `--spacing-lg` for padding

### Stack Pattern
```tsx
const Stack = ({ 
  children, 
  direction = 'vertical', 
  spacing = 'md', 
  align = 'stretch' 
}) => {
  const spacingMap = {
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)'
  };

  const styles = {
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'column' : 'row',
    gap: spacingMap[spacing],
    alignItems: align === 'stretch' ? 'stretch' : 
             align === 'start' ? 'flex-start' :
             align === 'center' ? 'center' : 'flex-end',
    width: '100%'
  };

  return <div style={styles}>{children}</div>;
};
```

**Use Cases:**
- Form layouts
- Navigation menus
- Content organization
- Component composition

### Grid Pattern
```tsx
const Grid = ({ 
  children, 
  columns = 'auto-fit', 
  minColumnWidth = '300px', 
  gap = 'lg' 
}) => {
  const gapMap = {
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)'
  };

  const styles = {
    display: 'grid',
    gridTemplateColumns: columns === 'auto-fit' 
      ? `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`
      : `repeat(${columns}, 1fr)`,
    gap: gapMap[gap],
    width: '100%'
  };

  return <div style={styles}>{children}</div>;
};
```

**Use Cases:**
- Article grids
- Dashboard layouts
- Image galleries
- Card collections

## Interaction Patterns

### Hover State Pattern
```tsx
const InteractiveCard = ({ children, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles = {
    backgroundColor: 'var(--color-background-primary)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const hoverStyles = isHovered ? {
    boxShadow: 'var(--shadow-md)',
    transform: 'translateY(-2px)',
    borderColor: 'var(--color-primary-blue)'
  } : {};

  return (
    <div
      style={{ ...baseStyles, ...hoverStyles }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
```

### Loading State Pattern
```tsx
const LoadingState = ({ isLoading, children, fallback }) => {
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-xl)',
        color: 'var(--color-text-secondary)'
      }}>
        <CircularProgress size="md" variant="brand" />
        <span style={{ marginLeft: 'var(--spacing-md)' }}>
          Loading...
        </span>
      </div>
    );
  }

  return children || fallback;
};
```

### Empty State Pattern
```tsx
const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-3xl)',
      textAlign: 'center',
      color: 'var(--color-text-secondary)'
    }}>
      {icon && (
        <div style={{
          fontSize: 'var(--spacing-2xl)',
          marginBottom: 'var(--spacing-lg)',
          opacity: 0.5
        }}>
          {icon}
        </div>
      )}
      
      <h3 style={{
        fontSize: 'var(--font-h4)',
        fontWeight: 'var(--font-weight-medium)',
        color: 'var(--color-text-primary)',
        marginBottom: 'var(--spacing-sm)'
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: 'var(--font-body)',
        lineHeight: 1.6,
        marginBottom: 'var(--spacing-lg)',
        maxWidth: '400px'
      }}>
        {description}
      </p>
      
      {action}
    </div>
  );
};
```

### Error State Pattern
```tsx
const ErrorState = ({ 
  title, 
  description, 
  error, 
  action 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'var(--spacing-xl)',
      backgroundColor: 'var(--color-error)',
      backgroundColor: 'var(--color-error)',
      backgroundColor: 'var(--color-error)',
      opacity: 0.1,
      border: '1px solid var(--color-error)',
      borderRadius: 'var(--radius-lg)'
    }}>
      <div style={{
        color: 'var(--color-error)',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: 'var(--font-h4)',
          fontWeight: 'var(--font-weight-medium)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          {title}
        </h3>
        
        <p style={{
          fontSize: 'var(--font-body)',
          lineHeight: 1.6,
          marginBottom: 'var(--spacing-md)'
        }}>
          {description}
        </p>
        
        {error && (
          <details style={{
            marginBottom: 'var(--spacing-lg)',
            textAlign: 'left'
          }}>
            <summary style={{ 
              cursor: 'pointer',
              fontSize: 'var(--font-small)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Error Details
            </summary>
            <pre style={{
              fontSize: 'var(--font-caption)',
              marginTop: 'var(--spacing-sm)',
              padding: 'var(--spacing-sm)',
              backgroundColor: 'var(--color-background-secondary)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'auto'
            }}>
              {error}
            </pre>
          </details>
        )}
        
        {action}
      </div>
    </div>
  );
};
```

## Form Patterns

### Form Field Pattern
```tsx
const FormField = ({ 
  label, 
  hint, 
  error, 
  required, 
  children 
}) => {
  return (
    <div style={{ marginBottom: 'var(--spacing-md)' }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 'var(--font-caption)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-text-primary)',
          marginBottom: 'var(--spacing-xs)'
        }}>
          {label}
          {required && (
            <span style={{ color: 'var(--color-error)' }}> *</span>
          )}
        </label>
      )}
      
      {children}
      
      {hint && !error && (
        <p style={{
          fontSize: 'var(--font-caption)',
          color: 'var(--color-text-muted)',
          marginTop: 'var(--spacing-xs)',
          margin: 'var(--spacing-xs) 0 0 0'
        }}>
          {hint}
        </p>
      )}
      
      {error && (
        <p style={{
          fontSize: 'var(--font-caption)',
          color: 'var(--color-error)',
          marginTop: 'var(--spacing-xs)',
          margin: 'var(--spacing-xs) 0 0 0'
        }}>
          {error}
        </p>
      )}
    </div>
  );
};
```

### Form Actions Pattern
```tsx
const FormActions = ({ 
  primaryAction, 
  secondaryAction, 
  align = 'right' 
}) => {
  const alignmentStyles = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
    spaceBetween: 'space-between'
  };

  return (
    <div style={{
      display: 'flex',
      gap: 'var(--spacing-md)',
      justifyContent: alignmentStyles[align],
      marginTop: 'var(--spacing-xl)',
      paddingTop: 'var(--spacing-lg)',
      borderTop: '1px solid var(--color-border-light)'
    }}>
      {align === 'spaceBetween' ? (
        <>
          <div>{secondaryAction}</div>
          <div>{primaryAction}</div>
        </>
      ) : (
        <>
          {secondaryAction}
          {primaryAction}
        </>
      )}
    </div>
  );
};
```

## Navigation Patterns

### Breadcrumb Pattern
```tsx
const Breadcrumb = ({ items }) => {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-xs)',
      fontSize: 'var(--font-small)',
      color: 'var(--color-text-secondary)'
    }}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span style={{ opacity: 0.5 }}>›</span>
          )}
          
          {item.href ? (
            <a
              href={item.href}
              style={{
                color: index === items.length - 1 
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontWeight: index === items.length - 1 
                  ? 'var(--font-weight-medium)'
                  : 'var(--font-weight-normal)'
              }}
            >
              {item.label}
            </a>
          ) : (
            <span style={{
              color: 'var(--color-text-primary)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
```

### Tabs Pattern
```tsx
const Tabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div style={{
      borderBottom: '1px solid var(--color-border-light)',
      marginBottom: 'var(--spacing-lg)'
    }}>
      <nav style={{
        display: 'flex',
        gap: 'var(--spacing-lg)'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: 'var(--spacing-sm) 0',
              fontSize: 'var(--font-body)',
              fontWeight: 'var(--font-weight-medium)',
              color: activeTab === tab.id 
                ? 'var(--color-primary-blue)'
                : 'var(--color-text-secondary)',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === tab.id 
                ? '2px solid var(--color-primary-blue)'
                : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
```

## Data Display Patterns

### Table Pattern
```tsx
const Table = ({ columns, data, emptyState }) => {
  if (data.length === 0) {
    return emptyState || (
      <EmptyState
        title="No data available"
        description="There are no items to display."
      />
    );
  }

  return (
    <div style={{
      overflowX: 'auto',
      border: '1px solid var(--color-border-light)',
      borderRadius: 'var(--radius-lg)'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
        <thead>
          <tr style={{
            backgroundColor: 'var(--color-background-secondary)',
            borderBottom: '1px solid var(--color-border-light)'
          }}>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  padding: 'var(--spacing-md)',
                  textAlign: 'left',
                  fontSize: 'var(--font-small)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-primary)'
                }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              style={{
                borderBottom: '1px solid var(--color-border-light)',
                backgroundColor: index % 2 === 0 
                  ? 'var(--color-background-primary)'
                  : 'var(--color-background-accent)'
              }}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    padding: 'var(--spacing-md)',
                    fontSize: 'var(--font-body)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {column.render ? column.render(row[column.key]) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### List Pattern
```tsx
const List = ({ items, renderItem, emptyState }) => {
  if (items.length === 0) {
    return emptyState || (
      <EmptyState
        title="No items"
        description="There are no items to display."
      />
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-sm)'
    }}>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-background-primary)',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
};
```

## Composition Patterns

### Compound Component Pattern
```tsx
const Menu = ({ children }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <MenuContext.Provider value={{ open, setOpen }}>
      <div style={{ position: 'relative' }}>
        {children}
      </div>
    </MenuContext.Provider>
  );
};

const MenuTrigger = ({ children }) => {
  const { open, setOpen } = useContext(MenuContext);
  
  return (
    <button
      onClick={() => setOpen(!open)}
      style={{
        padding: 'var(--spacing-sm) var(--spacing-md)',
        backgroundColor: 'var(--color-background-secondary)',
        border: '1px solid var(--color-border-medium)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
};

const MenuContent = ({ children }) => {
  const { open } = useContext(MenuContext);
  
  if (!open) return null;
  
  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: 'var(--spacing-xs)',
      backgroundColor: 'var(--color-background-primary)',
      border: '1px solid var(--color-border-medium)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      {children}
    </div>
  );
};

// Usage
<Menu>
  <MenuTrigger>Options</MenuTrigger>
  <MenuContent>
    <MenuItem onClick={handleEdit}>Edit</MenuItem>
    <MenuItem onClick={handleDelete}>Delete</MenuItem>
  </MenuContent>
</Menu>
```

### Render Prop Pattern
```tsx
const DataProvider = ({ url, children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, [url]);

  return children({ data, loading, error });
};

// Usage
<DataProvider url="/api/articles">
  {({ data, loading, error }) => {
    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} />;
    return <ArticleList articles={data} />;
  }}
</DataProvider>
```

## Responsive Patterns

### Responsive Container
```tsx
const ResponsiveContainer = ({ children, maxWidth = '1200px' }) => {
  return (
    <div style={{
      maxWidth,
      margin: '0 auto',
      padding: '0 var(--spacing-md)',
      
      '@media (min-width: 768px)': {
        padding: '0 var(--spacing-lg)'
      },
      
      '@media (min-width: 1024px)': {
        padding: '0 var(--spacing-xl)'
      }
    }}>
      {children}
    </div>
  );
};
```

### Responsive Grid
```tsx
const ResponsiveGrid = ({ children }) => {
  return (
    <div style={{
      display: 'grid',
      gap: 'var(--spacing-md)',
      gridTemplateColumns: '1fr',
      
      '@media (min-width: 768px)': {
        gridTemplateColumns: 'repeat(2, 1fr)'
      },
      
      '@media (min-width: 1024px)': {
        gridTemplateColumns: 'repeat(3, 1fr)'
      },
      
      '@media (min-width: 1440px)': {
        gridTemplateColumns: 'repeat(4, 1fr)'
      }
    }}>
      {children}
    </div>
  );
};
```

## Anti-Patterns

### ❌ What Not to Do
```tsx
// Don't create one-off layouts
<div style={{ 
  display: 'flex', 
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px'
}}>
  Custom Layout
</div>

// Don't mix patterns without consistency
<Stack direction="vertical">
  <Card>
    <Grid>
      <CustomComponent />
    </Grid>
  </Card>
</Stack>

// Don't override design tokens in patterns
<div style={{ 
  padding: '20px', // Not a spacing token
  margin: '12px',  // Not a spacing token
  borderRadius: '10px' // Not a radius token
}}>
  Inconsistent Pattern
</div>

// Don't create complex nested patterns
<div>
  <div>
    <div>
      <div>
        Deeply Nested
      </div>
    </div>
  </div>
</div>
```

### ✅ What to Do Instead
```tsx
// Use established patterns
<Card>
  <Stack spacing="md">
    Content
  </Stack>
</Card>

// Maintain pattern consistency
<Stack direction="vertical" spacing="lg">
  <Card>Content 1</Card>
  <Card>Content 2</Card>
</Stack>

// Use design tokens consistently
<div style={{ 
  padding: 'var(--spacing-lg)',
  margin: 'var(--spacing-md)',
  borderRadius: 'var(--radius-md)'
 }}>
  Consistent Pattern
</div>

// Keep patterns simple and composable
<Stack spacing="md">
  <Card>Simple Content</Card>
</Stack>
```

## Testing Patterns

### Pattern Testing
```typescript
describe('Component Patterns', () => {
  it('should render card pattern correctly', () => {
    render(
      <Card title="Test Card">
        <p>Card content</p>
      </Card>
    );
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should handle stack pattern spacing', () => {
    render(
      <Stack spacing="lg">
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>
    );
    
    const container = screen.getByText('Item 1').parentElement;
    expect(container).toHaveStyle({
      gap: 'var(--spacing-lg)'
    });
  });

  it('should render empty state pattern', () => {
    render(
      <EmptyState
        title="No items"
        description="There are no items to display."
      />
    );
    
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('There are no items to display.')).toBeInTheDocument();
  });
});
```

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
