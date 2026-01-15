# Progress Components

## Overview

Progress components provide visual feedback for ongoing processes, showing completion status, loading states, and step-by-step progression. They ensure consistent visual representation of progress throughout the application.

## Component Variants

### Linear Progress Bar
```tsx
<ProgressBar value={75} max={100} variant="default" />
<ProgressBar value={60} max={100} variant="brand" />
<ProgressBar value={30} max={100} variant="success" />
<ProgressBar value={90} max={100} variant="warning" />
<ProgressBar value={15} max={100} variant="error" />
```

**Use Cases:**
- Article generation progress
- File upload progress
- Form completion status
- Loading indicators

**Design Tokens Used:**
- `--spacing-sm` for height
- `--radius-full` for border radius
- `--color-primary-blue` for brand variant
- `--gradient-brand` for gradient fills

### Circular Progress
```tsx
<CircularProgress value={75} size="md" variant="default" />
<CircularProgress value={60} size="lg" variant="brand" />
<CircularProgress value={100} size="sm" variant="success" />
```

**Use Cases:**
- Loading spinners with progress
- Completion indicators
- Status displays
- Performance metrics

**Design Tokens Used:**
- `--spacing-md` for medium size
- `--spacing-lg` for large size
- `--spacing-sm` for small size
- `--color-text-primary` for text color

### Step Progress
```tsx
<StepProgress 
  steps={['Research', 'Generate', 'Review', 'Publish']}
  currentStep={2}
  variant="default"
/>
```

**Use Cases:**
- Multi-step forms
- Workflow progress
- Onboarding flows
- Process tracking

**Design Tokens Used:**
- `--spacing-md` for step spacing
- `--color-primary-blue` for active steps
- `--color-text-muted` for inactive steps

### Section Progress
```tsx
<SectionProgress 
  sections={[
    { title: 'Introduction', completed: true },
    { title: 'Research', completed: true },
    { title: 'Content', completed: false, progress: 60 },
    { title: 'Conclusion', completed: false }
  ]}
/>
```

**Use Cases:**
- Article section progress
- Course completion
- Document generation progress
- Multi-part tasks

**Design Tokens Used:**
- `--spacing-lg` for section spacing
- `--color-success` for completed sections
- `--color-primary-blue` for active sections

## Size Variants

### Small Progress
```tsx
<ProgressBar value={50} size="sm" />
<CircularProgress value={50} size="sm" />
```

**Design Tokens:**
- Height: `--spacing-xs` (4px)
- Font size: `--font-caption`
- Spacing: `--spacing-xs`

### Medium Progress (Default)
```tsx
<ProgressBar value={50} size="md" />
<CircularProgress value={50} size="md" />
```

**Design Tokens:**
- Height: `--spacing-sm` (8px)
- Font size: `--font-small`
- Spacing: `--spacing-sm`

### Large Progress
```tsx
<ProgressBar value={50} size="lg" />
<CircularProgress value={50} size="lg" />
```

**Design Tokens:**
- Height: `--spacing-md` (16px)
- Font size: `--font-body`
- Spacing: `--spacing-md`

## Implementation Examples

### Linear Progress Bar Component
```tsx
interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  striped?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  animated = false,
  striped = false
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeStyles = {
    sm: {
      height: 'var(--spacing-xs)',
      fontSize: 'var(--font-caption)'
    },
    md: {
      height: 'var(--spacing-sm)',
      fontSize: 'var(--font-small)'
    },
    lg: {
      height: 'var(--spacing-md)',
      fontSize: 'var(--font-body)'
    }
  };

  const variantStyles = {
    default: {
      backgroundColor: 'var(--color-border-light)',
      '--progress-color': 'var(--color-primary-blue)'
    },
    brand: {
      backgroundColor: 'var(--color-border-light)',
      '--progress-color': 'var(--color-primary-blue)',
      '--progress-gradient': 'var(--gradient-brand)'
    },
    success: {
      backgroundColor: 'var(--color-border-light)',
      '--progress-color': 'var(--color-success)'
    },
    warning: {
      backgroundColor: 'var(--color-border-light)',
      '--progress-color': 'var(--color-warning)'
    },
    error: {
      backgroundColor: 'var(--color-border-light)',
      '--progress-color': 'var(--color-error)'
    }
  };

  const containerStyles = {
    ...sizeStyles[size],
    ...variantStyles[variant],
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'var(--color-border-light)'
  };

  const progressStyles = {
    width: `${percentage}%`,
    height: '100%',
    borderRadius: 'var(--radius-full)',
    transition: 'width 0.3s ease',
    backgroundColor: 'var(--progress-color)',
    backgroundImage: variant === 'brand' ? 'var(--progress-gradient)' : 'none',
    backgroundSize: '100% 100%',
    position: 'relative',
    overflow: 'hidden'
  };

  const stripedStyles = striped ? {
    backgroundImage: `
      linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.15) 75%,
        transparent 75%,
        transparent
      )
    `,
    backgroundSize: 'var(--spacing-lg) var(--spacing-lg)'
  } : {};

  const animatedStyles = animated ? {
    animation: 'progress-bar-stripes 1s linear infinite'
  } : {};

  return (
    <div style={containerStyles}>
      <div 
        style={{
          ...progressStyles,
          ...stripedStyles,
          ...animatedStyles
        }}
      />
      
      {showLabel && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: percentage > 50 ? 'var(--color-background-primary)' : 'var(--color-text-primary)',
          fontSize: 'inherit',
          fontWeight: 'var(--font-weight-medium)',
          zIndex: 1
        }}>
          {Math.round(percentage)}%
        </div>
      )}
      
      <style jsx>{`
        @keyframes progress-bar-stripes {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: var(--spacing-lg) 0;
          }
        }
      `}</style>
    </div>
  );
};
```

### Circular Progress Component
```tsx
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  thickness?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  thickness = 4
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeMap = {
    sm: 40,
    md: 60,
    lg: 80
  };

  const radius = (sizeMap[size] - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: 'var(--color-primary-blue)',
    brand: 'var(--color-primary-blue)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)'
  };

  const containerStyles = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${sizeMap[size]}px`,
    height: `${sizeMap[size]}px`
  };

  const svgStyles = {
    transform: 'rotate(-90deg)'
  };

  const backgroundStyles = {
    fill: 'none',
    stroke: 'var(--color-border-light)',
    strokeWidth: `${thickness}px`
  };

  const progressStyles = {
    fill: 'none',
    stroke: variantColors[variant],
    strokeWidth: `${thickness}px`,
    strokeLinecap: 'round',
    transition: 'stroke-dashoffset 0.3s ease',
    strokeDashoffset: `${strokeDashoffset}px`,
    strokeDasharray: `${circumference}px`
  };

  const labelStyles = {
    position: 'absolute',
    fontSize: size === 'sm' ? 'var(--font-caption)' : 
               size === 'md' ? 'var(--font-small)' : 'var(--font-body)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-text-primary)'
  };

  return (
    <div style={containerStyles}>
      <svg
        width={sizeMap[size]}
        height={sizeMap[size]}
        style={svgStyles}
      >
        <circle
          cx={sizeMap[size] / 2}
          cy={sizeMap[size] / 2}
          r={radius}
          style={backgroundStyles}
        />
        <circle
          cx={sizeMap[size] / 2}
          cy={sizeMap[size] / 2}
          r={radius}
          style={progressStyles}
        />
      </svg>
      
      {showLabel && (
        <div style={labelStyles}>
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};
```

### Step Progress Component
```tsx
interface StepProgressProps {
  steps: string[];
  currentStep: number;
  variant?: 'default' | 'brand';
  showLabels?: boolean;
}

const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  variant = 'default',
  showLabels = true
}) => {
  const variantColors = {
    default: {
      active: 'var(--color-primary-blue)',
      completed: 'var(--color-success)',
      inactive: 'var(--color-border-light)'
    },
    brand: {
      active: 'var(--color-primary-blue)',
      completed: 'var(--color-primary-blue)',
      inactive: 'var(--color-border-light)'
    }
  };

  const colors = variantColors[variant];

  const containerStyles = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: 'var(--spacing-md)'
  };

  const stepStyles = (index: number) => ({
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    position: 'relative'
  });

  const connectorStyles = (index: number) => ({
    flex: 1,
    height: '2px',
    backgroundColor: index < currentStep ? colors.completed : colors.inactive,
    margin: '0 var(--spacing-xs)'
  });

  const circleStyles = (index: number) => {
    const isActive = index === currentStep;
    const isCompleted = index < currentStep;
    
    return {
      width: 'var(--spacing-lg)',
      height: 'var(--spacing-lg)',
      borderRadius: 'var(--radius-full)',
      backgroundColor: isActive ? colors.active : 
                       isCompleted ? colors.completed : colors.inactive,
      border: '2px solid',
      borderColor: isActive ? colors.active : colors.inactive,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'var(--font-caption)',
      fontWeight: 'var(--font-weight-medium)',
      color: isActive || isCompleted ? 'var(--color-background-primary)' : 'var(--color-text-muted)',
      transition: 'all 0.2s ease',
      zIndex: 1
    };
  };

  const labelStyles = (index: number) => {
    const isActive = index === currentStep;
    const isCompleted = index < currentStep;
    
    return {
      marginTop: 'var(--spacing-xs)',
      fontSize: 'var(--font-caption)',
      fontWeight: isActive ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
      color: isActive ? colors.active : 
               isCompleted ? colors.completed : 'var(--color-text-muted)',
      textAlign: 'center'
    };
  };

  return (
    <div style={containerStyles}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div style={stepStyles(index)}>
            <div style={circleStyles(index)}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            
            {showLabels && (
              <div style={labelStyles(index)}>
                {step}
              </div>
            )}
          </div>
          
          {index < steps.length - 1 && (
            <div style={connectorStyles(index)} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
```

### Section Progress Component
```tsx
interface Section {
  title: string;
  completed: boolean;
  progress?: number;
}

interface SectionProgressProps {
  sections: Section[];
  variant?: 'default' | 'compact';
}

const SectionProgress: React.FC<SectionProgressProps> = ({
  sections,
  variant = 'default'
}) => {
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-lg)'
  };

  const sectionStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-md)'
  };

  const indicatorStyles = (completed: boolean, progress?: number) => ({
    width: 'var(--spacing-lg)',
    height: 'var(--spacing-lg)',
    borderRadius: 'var(--radius-full)',
    backgroundColor: completed ? 'var(--color-success)' : 
                       progress ? 'var(--color-primary-blue)' : 'var(--color-border-light)',
    border: '2px solid',
    borderColor: completed ? 'var(--color-success)' : 'var(--color-border-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--font-caption)',
    fontWeight: 'var(--font-weight-medium)',
    color: completed ? 'var(--color-background-primary)' : 'var(--color-text-muted)',
    flexShrink: 0
  });

  const contentStyles = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-xs)'
  };

  const titleStyles = (completed: boolean) => ({
    fontSize: 'var(--font-body)',
    fontWeight: completed ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
    color: completed ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
  });

  const progressStyles = (progress?: number) => {
    if (progress === undefined) return null;
    
    return {
      width: '100%',
      height: 'var(--spacing-xs)',
      backgroundColor: 'var(--color-border-light)',
      borderRadius: 'var(--radius-full)',
      overflow: 'hidden'
    };
  };

  const progressBarStyles = (progress: number) => ({
    width: `${progress}%`,
    height: '100%',
    backgroundColor: 'var(--color-primary-blue)',
    borderRadius: 'var(--radius-full)',
    transition: 'width 0.3s ease'
  });

  return (
    <div style={containerStyles}>
      {sections.map((section, index) => (
        <div key={index} style={sectionStyles}>
          <div style={indicatorStyles(section.completed, section.progress)}>
            {section.completed ? '✓' : section.progress ? Math.round(section.progress) : index + 1}
          </div>
          
          <div style={contentStyles}>
            <div style={titleStyles(section.completed)}>
              {section.title}
            </div>
            
            {section.progress !== undefined && (
              <div style={progressStyles(section.progress)}>
                <div style={progressBarStyles(section.progress)} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Usage Patterns

### Article Generation Progress
```tsx
const ArticleGenerationProgress = ({ article }) => {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-lg)'
    }}>
      {/* Overall progress */}
      <div>
        <h4 style={{ 
          fontSize: 'var(--font-body)',
          fontWeight: 'var(--font-weight-medium)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Generation Progress
        </h4>
        <ProgressBar 
          value={article.progress} 
          variant="brand"
          showLabel
          animated
        />
      </div>
      
      {/* Section progress */}
      <SectionProgress 
        sections={[
          { title: 'Research', completed: article.researchCompleted },
          { title: 'Outline', completed: article.outlineCompleted },
          { title: 'Content', completed: false, progress: article.contentProgress },
          { title: 'Review', completed: false }
        ]}
      />
    </div>
  );
};
```

### Multi-Step Form Progress
```tsx
const FormProgress = ({ currentStep }) => {
  const steps = ['Basic Info', 'Content', 'Settings', 'Review'];
  
  return (
    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
      <StepProgress 
        steps={steps}
        currentStep={currentStep}
        variant="brand"
      />
    </div>
  );
};
```

### File Upload Progress
```tsx
const FileUploadProgress = ({ files }) => {
  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-md)'
    }}>
      {files.map((file) => (
        <div key={file.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--color-background-secondary)',
          borderRadius: 'var(--radius-md)'
        }}>
          <Icon name="file" size="sm" />
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontSize: 'var(--font-small)',
              fontWeight: 'var(--font-weight-medium)',
              marginBottom: 'var(--spacing-xs)'
            }}>
              {file.name}
            </div>
            <ProgressBar 
              value={file.progress} 
              size="sm"
              variant={file.error ? 'error' : 'default'}
            />
          </div>
          <CircularProgress 
            value={file.progress} 
            size="sm"
            variant={file.error ? 'error' : 'default'}
            showLabel
          />
        </div>
      ))}
    </div>
  );
};
```

## Accessibility

### ARIA Attributes
```tsx
const AccessibleProgressBar = ({ value, max, label }) => {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <ProgressBar value={value} max={max} />
    </div>
  );
};
```

### Screen Reader Support
```tsx
const ScreenReaderProgress = ({ value, max, children }) => {
  return (
    <div>
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        Progress: {value} of {max} ({Math.round((value / max) * 100)}%)
      </div>
      {children}
    </div>
  );
};
```

### Keyboard Navigation
```css
.progress-bar:focus {
  outline: 2px solid var(--color-primary-blue);
  outline-offset: 2px;
}
```

## Anti-Patterns

### ❌ What Not to Do
```tsx
// Don't create custom progress bars
<div style={{ 
  width: '100%',
  height: '8px',
  backgroundColor: '#e5e7eb',
  borderRadius: '4px'
}}>
  <div style={{ 
    width: '75%',
    height: '100%',
    backgroundColor: '#217CEB',
    borderRadius: '4px'
  }} />
</div>

// Don't use progress without semantic meaning
<ProgressBar value={50} />
<span>Some unrelated content</span>

// Don't override design tokens
<ProgressBar 
  value={50} 
  style={{ 
    backgroundColor: '#custom-color',
    color: '#custom-text' 
  }} 
/>

// Don't use progress for static content
<ProgressBar value={100} variant="success">
  Completed Task
</ProgressBar>
```

### ✅ What to Do Instead
```tsx
// Use progress components
<ProgressBar value={75} variant="brand" />

// Provide context and labels
<div>
  <h4>Upload Progress</h4>
  <ProgressBar value={75} showLabel />
</div>

// Use design tokens
<ProgressBar value={75} variant="brand" />

// Use appropriate status indicators
<Badge variant="success">Completed</Badge>
```

## Testing

### Unit Tests
```typescript
describe('Progress Components', () => {
  it('should render progress bar with correct percentage', () => {
    render(<ProgressBar value={75} max={100} />);
    const progressBar = screen.getByRole('progressbar');
    
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('should handle circular progress correctly', () => {
    render(<CircularProgress value={50} showLabel />);
    const progress = screen.getByText('50%');
    
    expect(progress).toBeInTheDocument();
  });

  it('should render step progress with current step', () => {
    const steps = ['Step 1', 'Step 2', 'Step 3'];
    render(<StepProgress steps={steps} currentStep={1} />);
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(
      <ProgressBar 
        value={50} 
        aria-label="File upload progress"
      />
    );
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'File upload progress');
  });
});
```

### Visual Testing Checklist
- [ ] Progress bars fill correctly
- [ ] Circular progress renders properly
- [ ] Step progress shows current step
- [ ] Colors match variants
- [ ] Animations work smoothly
- [ ] Labels are readable
- [ ] Focus states are visible
- [ ] Responsive design works

## Performance Considerations

### Animation Performance
- Use `transform` and `opacity` for animations
- Avoid layout thrashing during progress updates
- Use `requestAnimationFrame` for smooth animations

### Rendering Optimization
- Debounce rapid progress updates
- Use CSS transitions instead of JavaScript animations
- Minimize DOM updates during progress changes

### Memory Management
- Clean up animation frames on unmount
- Avoid memory leaks with event listeners
- Use efficient data structures for progress tracking

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
