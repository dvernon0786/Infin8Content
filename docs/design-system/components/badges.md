# Badge Components

## Overview

Badge components are small, informative elements that display status, categories, or metadata. They provide consistent visual indicators for various states and classifications throughout the application.

## Component Variants

### Status Badges
```tsx
<Badge variant="success">Completed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="info">Processing</Badge>
```

**Use Cases:**
- Article generation status
- Payment status indicators
- System health indicators
- Process state notifications

**Design Tokens Used:**
- `--color-success`, `--color-warning`, `--color-error`, `--color-info`
- `--color-text-primary` for contrast
- `--spacing-xs` for padding
- `--radius-full` for pill shape

### Confidence Level Badges
```tsx
<Badge variant="confidence-high">High Confidence</Badge>
<Badge variant="confidence-medium">Medium Confidence</Badge>
<Badge variant="confidence-low">Low Confidence</Badge>
```

**Use Cases:**
- AI content confidence scores
- Data accuracy indicators
- Quality assessment levels
- Reliability metrics

**Design Tokens Used:**
- `--color-success` for high confidence
- `--color-warning` for medium confidence
- `--color-error` for low confidence
- `--font-caption` for text size

### Category Badges
```tsx
<Badge variant="primary">Technology</Badge>
<Badge variant="secondary">Business</Badge>
<Badge variant="outline">Marketing</Badge>
```

**Use Cases:**
- Article categories
- Content tags
- Feature classifications
- Topic indicators

**Design Tokens Used:**
- `--color-primary-blue` for primary categories
- `--color-text-secondary` for secondary categories
- `--color-border-medium` for outline variants

### Count Badges
```tsx
<Badge variant="count">5</Badge>
<Badge variant="count">99+</Badge>
<Badge variant="count">New</Badge>
```

**Use Cases:**
- Notification counts
- Unread message indicators
- Item quantities
- Status counts

**Design Tokens Used:**
- `--color-error` for notification emphasis
- `--color-background-primary` for text
- `--radius-full` for circular shape

## Size Variants

### Small Badge
```tsx
<Badge variant="success" size="sm">Small</Badge>
```

**Design Tokens:**
- `--spacing-xs` for padding
- `--font-caption` for text size
- `--height: 20px`

### Medium Badge (Default)
```tsx
<Badge variant="success" size="md">Medium</Badge>
```

**Design Tokens:**
- `--spacing-xs` for padding
- `--font-small` for text size
- `--height: 24px`

### Large Badge
```tsx
<Badge variant="success" size="lg">Large</Badge>
```

**Design Tokens:**
- `--spacing-sm` for padding
- `--font-body` for text size
- `--height: 32px`

## Implementation Examples

### Complete Badge Component
```tsx
interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 
           'confidence-high' | 'confidence-medium' | 'confidence-low' |
           'primary' | 'secondary' | 'outline' | 'count';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  icon?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  removable = false,
  onRemove,
  icon
}) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    fontWeight: 'var(--font-weight-medium)',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease'
  };

  const sizeStyles = {
    sm: {
      padding: '2px var(--spacing-xs)',
      fontSize: 'var(--font-caption)',
      lineHeight: 1.3,
      minHeight: '20px',
      borderRadius: 'var(--radius-full)'
    },
    md: {
      padding: '4px var(--spacing-xs)',
      fontSize: 'var(--font-small)',
      lineHeight: 1.4,
      minHeight: '24px',
      borderRadius: 'var(--radius-full)'
    },
    lg: {
      padding: 'var(--spacing-xs) var(--spacing-sm)',
      fontSize: 'var(--font-body)',
      lineHeight: 1.5,
      minHeight: '32px',
      borderRadius: 'var(--radius-full)'
    }
  };

  const variantStyles = {
    // Status variants
    success: {
      backgroundColor: 'var(--color-success)',
      color: 'var(--color-background-primary)'
    },
    warning: {
      backgroundColor: 'var(--color-warning)',
      color: 'var(--color-background-primary)'
    },
    error: {
      backgroundColor: 'var(--color-error)',
      color: 'var(--color-background-primary)'
    },
    info: {
      backgroundColor: 'var(--color-info)',
      color: 'var(--color-background-primary)'
    },
    
    // Confidence variants
    'confidence-high': {
      backgroundColor: 'var(--color-success)',
      color: 'var(--color-background-primary)'
    },
    'confidence-medium': {
      backgroundColor: 'var(--color-warning)',
      color: 'var(--color-background-primary)'
    },
    'confidence-low': {
      backgroundColor: 'var(--color-error)',
      color: 'var(--color-background-primary)'
    },
    
    // Category variants
    primary: {
      backgroundColor: 'var(--color-primary-blue)',
      color: 'var(--color-background-primary)'
    },
    secondary: {
      backgroundColor: 'var(--color-background-secondary)',
      color: 'var(--color-text-primary)'
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border-medium)'
    },
    
    // Count variant
    count: {
      backgroundColor: 'var(--color-error)',
      color: 'var(--color-background-primary)',
      padding: '2px 6px',
      fontSize: 'var(--font-caption)',
      fontWeight: 'var(--font-weight-bold)',
      borderRadius: 'var(--radius-full)'
    }
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant]
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    return (
      <span style={{ 
        display: 'flex',
        alignItems: 'center',
        fontSize: '0.875em'
      }}>
        {icon}
      </span>
    );
  };

  const renderRemoveButton = () => {
    if (!removable) return null;
    
    return (
      <button
        onClick={onRemove}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
          color: 'inherit',
          opacity: 0.7,
          fontSize: '0.875em',
          borderRadius: 'var(--radius-full)',
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7';
        }}
        aria-label="Remove badge"
      >
        ×
      </button>
    );
  };

  return (
    <span style={combinedStyles}>
      {renderIcon()}
      <span>{children}</span>
      {renderRemoveButton()}
    </span>
  );
};
```

### Confidence Badge with Visual Indicator
```tsx
interface ConfidenceBadgeProps {
  level: 'high' | 'medium' | 'low';
  score?: number;
  showScore?: boolean;
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  level,
  score,
  showScore = false
}) => {
  const variantMap = {
    high: 'confidence-high' as const,
    medium: 'confidence-medium' as const,
    low: 'confidence-low' as const
  };

  const levelColors = {
    high: 'var(--color-success)',
    medium: 'var(--color-warning)',
    low: 'var(--color-error)'
  };

  const levelText = {
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  };

  return (
    <div style={{ 
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-xs)'
    }}>
      <Badge variant={variantMap[level]}>
        {levelText[level]} Confidence
        {showScore && score && (
          <span style={{ 
            marginLeft: 'var(--spacing-xs)',
            opacity: 0.8,
            fontSize: '0.875em'
          }}>
            ({Math.round(score * 100)}%)
          </span>
        )}
      </Badge>
      
      {/* Visual indicator */}
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: levelColors[level],
        boxShadow: `0 0 0 2px ${levelColors[level]}20`
      }} />
    </div>
  );
};
```

### Status Badge with Progress
```tsx
interface StatusBadgeProps {
  status: 'generating' | 'completed' | 'failed' | 'pending';
  progress?: number;
  showProgress?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  progress,
  showProgress = false
}) => {
  const variantMap = {
    generating: 'info' as const,
    completed: 'success' as const,
    failed: 'error' as const,
    pending: 'warning' as const
  };

  const statusText = {
    generating: 'Generating',
    completed: 'Completed',
    failed: 'Failed',
    pending: 'Pending'
  };

  return (
    <div style={{ 
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-xs)'
    }}>
      <Badge variant={variantMap[status]}>
        {statusText[status]}
      </Badge>
      
      {showProgress && progress !== undefined && status === 'generating' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
          fontSize: 'var(--font-caption)',
          color: 'var(--color-text-secondary)'
        }}>
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: 'var(--color-border-light)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: 'var(--color-info)',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
};
```

## Usage Patterns

### Article Status Display
```tsx
const ArticleStatus = ({ article }) => {
  return (
    <div style={{ 
      display: 'flex',
      gap: 'var(--spacing-sm)',
      alignItems: 'center'
    }}>
      <StatusBadge 
        status={article.status}
        showProgress={article.status === 'generating'}
        progress={article.progress}
      />
      
      {article.confidence && (
        <ConfidenceBadge 
          level={article.confidence.level}
          score={article.confidence.score}
          showScore
        />
      )}
      
      {article.category && (
        <Badge variant="outline">
          {article.category}
        </Badge>
      )}
    </div>
  );
};
```

### Filter Badges
```tsx
const FilterBadges = ({ filters, onRemove }) => {
  return (
    <div style={{ 
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--spacing-xs)',
      padding: 'var(--spacing-sm)',
      backgroundColor: 'var(--color-background-accent)',
      borderRadius: 'var(--radius-md)'
    }}>
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="outline"
          removable
          onRemove={() => onRemove(filter.id)}
          icon={<Icon name="filter" size="sm" />}
        >
          {filter.label}
        </Badge>
      ))}
    </div>
  );
};
```

### Notification Badge
```tsx
const NotificationBadge = ({ count }) => {
  return (
    <div style={{ position: 'relative' }}>
      <Icon name="bell" size="md" />
      
      {count > 0 && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          zIndex: 1
        }}>
          <Badge variant="count">
            {count > 99 ? '99+' : count}
          </Badge>
        </div>
      )}
    </div>
  );
};
```

## Accessibility

### ARIA Attributes
```tsx
const AccessibleBadge = ({ children, ...props }) => {
  return (
    <span
      role="status"
      aria-label={props.ariaLabel}
      {...props}
    >
      {children}
    </span>
  );
};
```

### Screen Reader Support
```tsx
const ScreenReaderBadge = ({ children, status }) => {
  return (
    <Badge variant={status}>
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
        Status: {status}
      </span>
    </Badge>
  );
};
```

### Color Independence
```tsx
const ColorIndependentBadge = ({ variant, children }) => {
  const variantPatterns = {
    success: '✓',
    warning: '⚠',
    error: '✗',
    info: 'ℹ'
  };

  return (
    <Badge variant={variant}>
      <span aria-hidden="true">{variantPatterns[variant]} </span>
      {children}
    </Badge>
  );
};
```

## Anti-Patterns

### ❌ What Not to Do
```tsx
// Don't create custom badge styles
<span style={{ 
  backgroundColor: '#10B981',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px'
}}>
  Custom Badge
</span>

// Don't use badges for large content
<Badge variant="primary">
  <div className="complex-content">
    <h3>Title</h3>
    <p>Description</p>
  </div>
</Badge>

// Don't override design tokens
<Badge variant="success" style={{ backgroundColor: '#custom-green' }}>
  Custom Color
</Badge>

// Don't use badges without semantic meaning
<Badge variant="primary">
  Just decorative text
</Badge>
```

### ✅ What to Do Instead
```tsx
// Use badge variants
<Badge variant="success">Standard Badge</Badge>

// Keep badge content simple
<Badge variant="primary">Simple text</Badge>

// Use design tokens
<Badge variant="success">Token-based</Badge>

// Use badges with semantic meaning
<Badge variant="success">Status indicator</Badge>
```

## Testing

### Unit Tests
```typescript
describe('Badge Component', () => {
  it('should render with correct variant styles', () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText('Success');
    
    expect(badge).toHaveStyle({
      backgroundColor: 'var(--color-success)',
      color: 'var(--color-background-primary)'
    });
  });

  it('should handle removable functionality', () => {
    const onRemove = vi.fn();
    render(
      <Badge variant="primary" removable onRemove={onRemove}>
        Removable
      </Badge>
    );
    
    const removeButton = screen.getByLabelText('Remove badge');
    fireEvent.click(removeButton);
    
    expect(onRemove).toHaveBeenCalled();
  });

  it('should be accessible', () => {
    render(
      <Badge variant="success" aria-label="Status completed">
        Completed
      </Badge>
    );
    
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Status completed');
  });

  it('should render icons correctly', () => {
    const icon = <Icon name="check" />;
    render(<Badge variant="success" icon={icon}>With Icon</Badge>);
    
    const badge = screen.getByText('With Icon');
    expect(badge).toBeInTheDocument();
  });
});
```

### Visual Testing Checklist
- [ ] All variants render correctly
- [ ] Size variants maintain proportions
- [ ] Icons align properly
- [ ] Remove buttons work
- [ ] Color contrast meets WCAG standards
- [ ] Hover states work (if applicable)
- [ ] Focus states are visible
- [ ] Text fits within badge boundaries

## Performance Considerations

### Rendering Optimization
- Use `span` elements for better performance than `div`
- Avoid complex nesting in badges
- Minimize prop changes to prevent re-renders

### CSS Optimization
- Use CSS custom properties for dynamic values
- Avoid expensive CSS properties in animations
- Use `transform` for any animations

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
