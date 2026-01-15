# Spacing Design Tokens

## Overview

Spacing tokens provide a systematic approach to spatial relationships in the design system. They ensure consistent layouts, proper visual hierarchy, and responsive design across all components.

## Spacing Scale

### Base Scale (4px Grid System)
```css
--spacing-xs: 4px;     /* 0.25rem - Micro spacing */
--spacing-sm: 8px;     /* 0.5rem - Small spacing */
--spacing-md: 16px;    /* 1rem - Medium spacing */
--spacing-lg: 24px;    /* 1.5rem - Large spacing */
--spacing-xl: 32px;    /* 2rem - Extra large */
--spacing-2xl: 48px;   /* 3rem - Double extra large */
--spacing-3xl: 64px;   /* 4rem - Triple extra large */
--spacing-4xl: 96px;   /* 6rem - Quadruple extra large */
```

### Scale Rationale
- **4px Base**: Aligns with standard pixel density and grid systems
- **Modular Scale**: Each step increases by 4px or 8px increments
- **Consistent Ratios**: 1x, 2x, 3x, 4x, 6x relationships
- **Responsive**: Works well across different screen sizes

## Usage Categories

### Micro Spacing (4px-8px)
```css
--spacing-xs: 4px;  /* Tight relationships */
--spacing-sm: 8px;  /* Small gaps */
```

#### Use Cases
- Icon to text spacing
- Button padding (small buttons)
- Tight list items
- Form field spacing
- Border radius for small elements

#### Examples
```tsx
// Icon with text
<Icon style={{ marginRight: 'var(--spacing-xs)' }} />
<Text>Label</Text>

// Small button padding
<Button size="sm" style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>
  Small
</Button>

// Tight list
<List style={{ gap: 'var(--spacing-xs)' }}>
  <ListItem>Item 1</ListItem>
  <ListItem>Item 2</ListItem>
</List>
```

### Component Spacing (16px-24px)
```css
--spacing-md: 16px;  /* Standard component spacing */
--spacing-lg: 24px;  /* Section spacing */
```

#### Use Cases
- Standard button padding
- Card padding
- Form field margins
- Component gutters
- Section breaks

#### Examples
```tsx
// Standard button
<Button style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
  Standard Button
</Button>

// Card padding
<Card style={{ padding: 'var(--spacing-lg)' }}>
  <CardContent>Card content</CardContent>
</Card>

// Form field spacing
<FormField style={{ marginBottom: 'var(--spacing-md)' }}>
  <Label>Field Label</Label>
  <Input />
</FormField>
```

### Layout Spacing (32px-96px)
```css
--spacing-xl: 32px;   /* Large section spacing */
--spacing-2xl: 48px;  /* Page margins */
--spacing-3xl: 64px;  /* Hero spacing */
--spacing-4xl: 96px;  /* Full section spacing */
```

#### Use Cases
- Page margins
- Section spacing
- Hero section padding
- Large container gaps
- Footer spacing

#### Examples
```tsx
// Page container
<Page style={{ padding: 'var(--spacing-2xl)' }}>
  <PageContent>Content</PageContent>
</Page>

// Hero section
<Hero style={{ padding: 'var(--spacing-3xl) var(--spacing-2xl)' }}>
  <HeroTitle>Hero Title</HeroTitle>
  <HeroDescription>Description</HeroDescription>
</Hero>

// Section spacing
<Section style={{ marginBottom: 'var(--spacing-4xl)' }}>
  <SectionTitle>Section Title</SectionTitle>
  <SectionContent>Content</SectionContent>
</Section>
```

## Spacing Patterns

### Component Internal Spacing
```css
.component {
  /* Internal padding */
  padding: var(--spacing-lg);
  
  /* Element spacing */
  gap: var(--spacing-md);
  
  /* Border radius */
  border-radius: var(--radius-md);
}
```

### Layout Spacing
```css
.layout {
  /* Container margins */
  margin: var(--spacing-2xl);
  
  /* Section spacing */
  > section {
    margin-bottom: var(--spacing-4xl);
  }
  
  /* Grid gutters */
  display: grid;
  gap: var(--spacing-lg);
}
```

### Responsive Spacing
```css
.responsive-component {
  /* Mobile-first spacing */
  padding: var(--spacing-md);
  gap: var(--spacing-sm);
  
  /* Tablet spacing */
  @media (min-width: 768px) {
    padding: var(--spacing-lg);
    gap: var(--spacing-md);
  }
  
  /* Desktop spacing */
  @media (min-width: 1024px) {
    padding: var(--spacing-xl);
    gap: var(--spacing-lg);
  }
}
```

## Common Spacing Combinations

### Button Spacing Patterns
```css
/* Small button */
.button-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  gap: var(--spacing-xs);
}

/* Medium button */
.button-md {
  padding: var(--spacing-sm) var(--spacing-md);
  gap: var(--spacing-sm);
}

/* Large button */
.button-lg {
  padding: var(--spacing-md) var(--spacing-lg);
  gap: var(--spacing-md);
}
```

### Card Spacing Patterns
```css
/* Card container */
.card {
  padding: var(--spacing-lg);
  gap: var(--spacing-md);
}

/* Card header */
.card-header {
  padding-bottom: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

/* Card content */
.card-content {
  line-height: 1.5;
  margin-bottom: var(--spacing-lg);
}
```

### Form Spacing Patterns
```css
/* Form container */
.form {
  gap: var(--spacing-lg);
}

/* Form field */
.form-field {
  margin-bottom: var(--spacing-md);
}

/* Field label and input */
.form-field label {
  margin-bottom: var(--spacing-xs);
}

/* Form actions */
.form-actions {
  margin-top: var(--spacing-xl);
  gap: var(--spacing-md);
}
```

## Implementation Examples

### React Component with Spacing Tokens
```tsx
const Card = ({ children, title, actions }) => {
  return (
    <div 
      className="card"
      style={{
        padding: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--color-background-primary)',
        border: `1px solid var(--color-border-light)`
      }}
    >
      {title && (
        <div 
          className="card-header"
          style={{
            marginBottom: 'var(--spacing-md)',
            paddingBottom: 'var(--spacing-md)',
            borderBottom: `1px solid var(--color-border-light)`
          }}
        >
          <h3 style={{ 
            margin: 0,
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-h4)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            {title}
          </h3>
        </div>
      )}
      
      <div 
        className="card-content"
        style={{
          marginBottom: 'var(--spacing-lg)',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6
        }}
      >
        {children}
      </div>
      
      {actions && (
        <div 
          className="card-actions"
          style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            justifyContent: 'flex-end'
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
};
```

### Responsive Layout with Spacing
```tsx
const ResponsiveLayout = ({ children, sidebar }) => {
  return (
    <div 
      className="layout"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 'var(--spacing-lg)',
        padding: 'var(--spacing-md)',
        
        /* Tablet breakpoint */
        '@media (min-width: 768px)': {
          gridTemplateColumns: '250px 1fr',
          padding: 'var(--spacing-lg)',
          gap: 'var(--spacing-xl)'
        },
        
        /* Desktop breakpoint */
        '@media (min-width: 1024px)': {
          gridTemplateColumns: '300px 1fr',
          padding: 'var(--spacing-xl)',
          gap: 'var(--spacing-2xl)'
        }
      }}
    >
      {sidebar && (
        <aside 
          className="sidebar"
          style={{
            padding: 'var(--spacing-lg)',
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          {sidebar}
        </aside>
      )}
      
      <main 
        className="main-content"
        style={{
          padding: 'var(--spacing-lg)',
          backgroundColor: 'var(--color-background-primary)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {children}
      </main>
    </div>
  );
};
```

## Spacing in CSS Grid and Flexbox

### Grid Spacing
```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg); /* Replaces margin between items */
  padding: var(--spacing-xl);
}

.grid-item {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

### Flexbox Spacing
```css
.flex-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md); /* Replaces margin between items */
  padding: var(--spacing-lg);
}

.flex-horizontal {
  flex-direction: row;
  gap: var(--spacing-sm);
  align-items: center;
}
```

## Anti-Patterns

### ❌ What Not to Do
```tsx
// Don't use arbitrary pixel values
<div style={{ padding: '12px', margin: '27px' }}>Content</div>

// Don't use inconsistent spacing
<div style={{ padding: '8px 16px 12px 20px' }}>Inconsistent</div>

// Don't mix spacing systems
<div style={{ padding: 'var(--spacing-md) 15px' }}>Mixed systems</div>

// Don't use negative margins for spacing
<div style={{ marginTop: '-16px' }}>Negative spacing</div>
```

### ✅ What to Do Instead
```tsx
// Use spacing tokens consistently
<div style={{ padding: 'var(--spacing-sm)', margin: 'var(--spacing-md)' }}>
  Content
</div>

// Use consistent spacing values
<div style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}>
  Consistent
</div>

// Use spacing tokens for all dimensions
<div style={{ padding: 'var(--spacing-md) var(--spacing-sm)' }}>
  Token-based
</div>

// Use gap property for spacing between elements
<div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
  Proper spacing
</div>
```

## Testing Spacing Usage

### Automated Tests
```typescript
describe('Spacing Token Compliance', () => {
  it('should use spacing tokens instead of pixel values', () => {
    const component = render(<TestComponent />);
    const styles = getComputedStyle(component.container);
    
    // Should use spacing tokens
    expect(styles.padding).toMatch(/var\(--spacing-\w+\)/);
    expect(styles.margin).toMatch(/var\(--spacing-\w+\)/);
    
    // Should not contain arbitrary pixel values
    expect(styles.padding).not.toMatch(/\d{1,2}px$/);
  });
  
  it('should maintain consistent spacing rhythm', () => {
    const spacingValues = extractSpacingValues(component);
    const validSpacing = ['4px', '8px', '16px', '24px', '32px', '48px', '64px', '96px'];
    
    spacingValues.forEach(value => {
      expect(validSpacing).toContain(value);
    });
  });
});
```

### Visual Testing Checklist
- [ ] Spacing follows 4px grid system
- [ ] Consistent spacing within components
- [ ] Proper spacing hierarchy (micro, component, layout)
- [ ] Responsive spacing works across breakpoints
- [ ] No arbitrary pixel values present
- [ ] Gap property used where appropriate

## Migration Guide

### From Arbitrary Values
```tsx
// Before
<div style={{ padding: '12px 20px', margin: '15px 0' }}>
  Content
</div>

// After
<div style={{ 
  padding: 'var(--spacing-sm) var(--spacing-md)', 
  margin: 'var(--spacing-md) 0' 
}}>
  Content
</div>
```

### From Margin-Based Spacing
```tsx
// Before
<div className="item" style={{ marginBottom: '16px' }}>Item 1</div>
<div className="item" style={{ marginBottom: '16px' }}>Item 2</div>
<div className="item" style={{ marginBottom: '16px' }}>Item 3</div>

// After
<div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
  <div className="item">Item 1</div>
  <div className="item">Item 2</div>
  <div className="item">Item 3</div>
</div>
```

## Responsive Spacing Strategy

### Mobile-First Approach
```css
.component {
  /* Base (mobile) spacing */
  padding: var(--spacing-sm);
  gap: var(--spacing-xs);
  
  /* Tablet (768px+) */
  @media (min-width: 768px) {
    padding: var(--spacing-md);
    gap: var(--spacing-sm);
  }
  
  /* Desktop (1024px+) */
  @media (min-width: 1024px) {
    padding: var(--spacing-lg);
    gap: var(--spacing-md);
  }
  
  /* Large desktop (1440px+) */
  @media (min-width: 1440px) {
    padding: var(--spacing-xl);
    gap: var(--spacing-lg);
  }
}
```

### Container-Based Spacing
```css
.responsive-container {
  /* Spacing scales with container size */
  padding: clamp(
    var(--spacing-sm),  /* Minimum */
    2vw,               /* Preferred */
    var(--spacing-lg)  /* Maximum */
  );
  
  gap: clamp(
    var(--spacing-xs),
    1vw,
    var(--spacing-md)
  );
}
```

## Performance Considerations

### CSS Custom Properties Performance
- CSS variables are highly performant
- Browser caching optimizes variable resolution
- No runtime JavaScript overhead
- Efficient inheritance and cascading

### Spacing Calculation Optimization
- Use `gap` property instead of margins where possible
- Avoid complex spacing calculations
- Leverage CSS Grid and Flexbox for layout
- Minimize nesting of spacing properties

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
