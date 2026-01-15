# Typography Design Tokens

## Overview

Typography tokens provide a systematic approach to text styling, ensuring consistent hierarchy, readability, and visual harmony across all components and content.

## Typography Scale

### Font Sizes
```css
--font-h1: 44-48px;     /* Hero headings - largest, most prominent */
--font-h2: 32-36px;     /* Page headings - major sections */
--font-h3: 24-28px;     /* Section headings - subsections */
--font-h4: 20-22px;     /* Component headings - cards, widgets */
--font-body: 16px;      /* Body text - main content */
--font-small: 14px;     /* Small text - metadata, captions */
--font-caption: 12px;    /* Caption text - labels, helpers */
```

### Font Weights
```css
--font-weight-light: 300;    /* Light weight - subtle emphasis */
--font-weight-normal: 400;   /* Normal weight - body text */
--font-weight-medium: 500;   /* Medium weight - emphasis */
--font-weight-semibold: 600; /* Semibold weight - headings */
--font-weight-bold: 700;      /* Bold weight - strong emphasis */
```

### Font Size Rationale
- **Modular Scale**: Each step reduces by approximately 1.25x
- **Responsive Range**: 44px to 12px covers all use cases
- **Readability**: 16px base ensures comfortable reading
- **Hierarchy**: Clear visual distinction between levels

## Typography Hierarchy

### Level 1: Hero Headings (H1)
```css
.hero-heading {
  font-size: var(--font-h1);
  font-weight: var(--font-weight-bold);
  line-height: 1.1;
  letter-spacing: -0.02em;
}
```

#### Use Cases
- Page titles and hero sections
- Main marketing headlines
- Feature announcements
- Dashboard main headings

#### Examples
```tsx
<h1 className="hero-heading">
  Transform Your Content Strategy
</h1>

<h1 className="hero-heading">
  Article Generation Dashboard
</h1>
```

### Level 2: Page Headings (H2)
```css
.page-heading {
  font-size: var(--font-h2);
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
  letter-spacing: -0.01em;
}
```

#### Use Cases
- Major section titles
- Page subtitles
- Feature section headings
- Category titles

#### Examples
```tsx
<h2 className="page-heading">
  Content Generation Tools
</h2>

<h2 className="page-heading">
  Recent Articles
</h2>
```

### Level 3: Section Headings (H3)
```css
.section-heading {
  font-size: var(--font-h3);
  font-weight: var(--font-weight-medium);
  line-height: 1.3;
  letter-spacing: 0;
}
```

#### Use Cases
- Subsection titles
- Card headings
- Form section titles
- Modal titles

#### Examples
```tsx
<h3 className="section-heading">
  Article Settings
</h3>

<h3 className="section-heading">
  Generation Progress
</h3>
```

### Level 4: Component Headings (H4)
```css
.component-heading {
  font-size: var(--font-h4);
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
  letter-spacing: 0;
}
```

#### Use Cases
- Card titles
- Widget headings
- Small section titles
- List headings

#### Examples
```tsx
<h4 className="component-heading">
  Article Status
</h4>

<h4 className="component-heading">
  Quick Actions
</h4>
```

### Level 5: Body Text
```css
.body-text {
  font-size: var(--font-body);
  font-weight: var(--font-weight-normal);
  line-height: 1.5;
  letter-spacing: 0;
}
```

#### Use Cases
- Main content paragraphs
- Descriptions and explanations
- Form labels and descriptions
- Article content

#### Examples
```tsx
<p className="body-text">
  Generate high-quality content using our AI-powered tools. 
  Customize tone, style, and length to match your needs.
</p>

<label className="body-text">
  Article Topic
</label>
```

### Level 6: Small Text
```css
.small-text {
  font-size: var(--font-small);
  font-weight: var(--font-weight-normal);
  line-height: 1.4;
  letter-spacing: 0;
}
```

#### Use Cases
- Metadata and timestamps
- Helper text
- Secondary information
- Status indicators

#### Examples
```tsx
<span className="small-text">
  Last updated 2 hours ago
</span>

<p className="small-text">
  Choose a tone that matches your audience
</p>
```

### Level 7: Caption Text
```css
.caption-text {
  font-size: var(--font-caption);
  font-weight: var(--font-weight-normal);
  line-height: 1.3;
  letter-spacing: 0.02em;
}
```

#### Use Cases
- Form field labels
- Button labels
- Table headers
- Icon labels

#### Examples
```tsx
<label className="caption-text">
  Email Address
</label>

<button className="caption-text">
  Save Draft
</button>
```

## Typography Patterns

### Heading Hierarchy
```tsx
const TypographyExample = () => {
  return (
    <div>
      <h1 style={{ 
        fontSize: 'var(--font-h1)', 
        fontWeight: 'var(--font-weight-bold)',
        lineHeight: 1.1,
        color: 'var(--color-text-primary)'
      }}>
        Main Page Title
      </h1>
      
      <h2 style={{ 
        fontSize: 'var(--font-h2)', 
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: 1.2,
        color: 'var(--color-text-primary)',
        marginTop: 'var(--spacing-2xl)'
      }}>
        Section Title
      </h2>
      
      <h3 style={{ 
        fontSize: 'var(--font-h3)', 
        fontWeight: 'var(--font-weight-medium)',
        lineHeight: 1.3,
        color: 'var(--color-text-primary)',
        marginTop: 'var(--spacing-xl)'
      }}>
        Subsection Title
      </h3>
      
      <p style={{ 
        fontSize: 'var(--font-body)', 
        fontWeight: 'var(--font-weight-normal)',
        lineHeight: 1.5,
        color: 'var(--color-text-secondary)',
        marginTop: 'var(--spacing-md)'
      }}>
        Body text content with proper hierarchy and spacing.
      </p>
    </div>
  );
};
```

### Component Typography
```tsx
const Card = ({ title, subtitle, content, metadata }) => {
  return (
    <div style={{ 
      padding: 'var(--spacing-lg)',
      backgroundColor: 'var(--color-background-primary)',
      borderRadius: 'var(--radius-lg)',
      border: `1px solid var(--color-border-light)`
    }}>
      {/* Card Title */}
      <h3 style={{ 
        fontSize: 'var(--font-h4)', 
        fontWeight: 'var(--font-weight-medium)',
        lineHeight: 1.4,
        color: 'var(--color-text-primary)',
        margin: '0 0 var(--spacing-sm) 0'
      }}>
        {title}
      </h3>
      
      {/* Card Subtitle */}
      {subtitle && (
        <p style={{ 
          fontSize: 'var(--font-small)', 
          fontWeight: 'var(--font-weight-normal)',
          lineHeight: 1.4,
          color: 'var(--color-text-secondary)',
          margin: '0 0 var(--spacing-md) 0'
        }}>
          {subtitle}
        </p>
      )}
      
      {/* Card Content */}
      <div style={{ 
        fontSize: 'var(--font-body)', 
        fontWeight: 'var(--font-weight-normal)',
        lineHeight: 1.5,
        color: 'var(--color-text-primary)',
        marginBottom: 'var(--spacing-md)'
      }}>
        {content}
      </div>
      
      {/* Card Metadata */}
      {metadata && (
        <div style={{ 
          fontSize: 'var(--font-caption)', 
          fontWeight: 'var(--font-weight-normal)',
          lineHeight: 1.3,
          color: 'var(--color-text-muted)',
          letterSpacing: '0.02em'
        }}>
          {metadata}
        </div>
      )}
    </div>
  );
};
```

### Form Typography
```tsx
const FormField = ({ label, hint, error, required }) => {
  return (
    <div style={{ marginBottom: 'var(--spacing-md)' }}>
      {/* Field Label */}
      <label style={{ 
        display: 'block',
        fontSize: 'var(--font-caption)', 
        fontWeight: 'var(--font-weight-medium)',
        lineHeight: 1.3,
        color: 'var(--color-text-primary)',
        marginBottom: 'var(--spacing-xs)'
      }}>
        {label}
        {required && (
          <span style={{ color: 'var(--color-error)' }}>*</span>
        )}
      </label>
      
      {/* Field Input */}
      <input 
        style={{
          width: '100%',
          fontSize: 'var(--font-body)',
          fontWeight: 'var(--font-weight-normal)',
          lineHeight: 1.5,
          padding: 'var(--spacing-sm) var(--spacing-md)',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border-medium)'}`,
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-background-primary)',
          color: 'var(--color-text-primary)'
        }}
      />
      
      {/* Field Hint */}
      {hint && (
        <p style={{ 
          fontSize: 'var(--font-caption)', 
          fontWeight: 'var(--font-weight-normal)',
          lineHeight: 1.3,
          color: 'var(--color-text-muted)',
          marginTop: 'var(--spacing-xs)',
          margin: 'var(--spacing-xs) 0 0 0'
        }}>
          {hint}
        </p>
      )}
      
      {/* Field Error */}
      {error && (
        <p style={{ 
          fontSize: 'var(--font-caption)', 
          fontWeight: 'var(--font-weight-normal)',
          lineHeight: 1.3,
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

## Responsive Typography

### Fluid Typography
```css
.responsive-heading {
  /* Fluid font size using clamp() */
  font-size: clamp(
    var(--font-h3),    /* Minimum: 24px */
    4vw,               /* Preferred: 4% of viewport width */
    var(--font-h1)     /* Maximum: 44px */
  );
  
  /* Fluid line height */
  line-height: clamp(
    1.2,   /* Minimum */
    1.3,   /* Preferred */
    1.4    /* Maximum */
  );
}
```

### Breakpoint-Based Typography
```css
.responsive-typography {
  /* Mobile base */
  font-size: var(--font-body);
  
  /* Tablet (768px+) */
  @media (min-width: 768px) {
    font-size: var(--font-h4);
  }
  
  /* Desktop (1024px+) */
  @media (min-width: 1024px) {
    font-size: var(--font-h3);
  }
  
  /* Large desktop (1440px+) */
  @media (min-width: 1440px) {
    font-size: var(--font-h2);
  }
}
```

## Typography Best Practices

### Line Height Guidelines
```css
/* Headings: Tighter line height for better visual rhythm */
.heading {
  line-height: 1.1; /* H1 */
  line-height: 1.2; /* H2 */
  line-height: 1.3; /* H3-H4 */
}

/* Body text: Comfortable reading line height */
.body-text {
  line-height: 1.5; /* Optimal for readability */
}

/* Small text: Slightly tighter to prevent awkward spacing */
.small-text {
  line-height: 1.4;
}
```

### Letter Spacing Guidelines
```css
/* Large headings: Slightly negative for better visual fit */
.large-heading {
  letter-spacing: -0.02em; /* H1 */
  letter-spacing: -0.01em; /* H2 */
}

/* Normal text: No letter spacing adjustment */
.normal-text {
  letter-spacing: 0;
}

/* Small text: Slightly positive for readability */
.small-text {
  letter-spacing: 0.02em; /* Captions, buttons */
}
```

### Color and Contrast
```css
/* Primary text: High contrast */
.text-primary {
  color: var(--color-text-primary); /* #2C2C2E */
}

/* Secondary text: Medium contrast */
.text-secondary {
  color: var(--color-text-secondary); /* #6B7280 */
}

/* Muted text: Low contrast */
.text-muted {
  color: var(--color-text-muted); /* #9CA3AF */
}
```

## Anti-Patterns

### ❌ What Not to Do
```tsx
// Don't use arbitrary font sizes
<h1 style={{ fontSize: '28px', fontWeight: 600 }}>Custom heading</h1>

// Don't mix font sizes without hierarchy
<div style={{ fontSize: '18px', fontWeight: 400 }}>Inconsistent text</div>

// Don't use hard-coded line heights
<p style={{ lineHeight: '1.7' }}>Poor line height</p>

// Don't override design tokens with inline styles
<h2 style={{ fontSize: '32px' }}>Override</h2>
```

### ✅ What to Do Instead
```tsx
// Use typography tokens consistently
<h1 style={{ 
  fontSize: 'var(--font-h1)', 
  fontWeight: 'var(--font-weight-bold)' 
}}>
  Standard heading
</h1>

// Maintain proper hierarchy
<div style={{ 
  fontSize: 'var(--font-body)', 
  fontWeight: 'var(--font-weight-normal)' 
}}>
  Consistent text
</div>

// Use appropriate line heights
<p style={{ lineHeight: 1.5 }}>Optimal readability</p>

// Use typography tokens for all text styling
<h2 style={{ 
  fontSize: 'var(--font-h2)', 
  fontWeight: 'var(--font-weight-semibold)' 
}}>
  Token-based heading
</h2>
```

## Typography Testing

### Automated Tests
```typescript
describe('Typography Token Compliance', () => {
  it('should use typography tokens instead of pixel values', () => {
    const component = render(<TestComponent />);
    const styles = getComputedStyle(component.container);
    
    // Should use typography tokens
    expect(styles.fontSize).toMatch(/var\(--font-\w+\)/);
    expect(styles.fontWeight).toMatch(/var\(--font-weight-\w+\)/);
    
    // Should not contain arbitrary values
    expect(styles.fontSize).not.toMatch(/\d{1,2}px$/);
  });
  
  it('should maintain proper typography hierarchy', () => {
    const headings = component.getAllByRole('heading');
    const fontSizes = headings.map(h => 
      getComputedStyle(h).fontSize
    );
    
    // H1 should be largest, H4 smallest
    expect(fontSizes[0]).toBeGreaterThan(fontSizes[1]);
    expect(fontSizes[1]).toBeGreaterThan(fontSizes[2]);
    expect(fontSizes[2]).toBeGreaterThan(fontSizes[3]);
  });
});
```

### Visual Testing Checklist
- [ ] Typography follows established hierarchy
- [ ] Font sizes use design tokens
- [ ] Font weights are appropriate for context
- [ ] Line heights ensure readability
- [ ] Letter spacing enhances readability
- [ ] Color contrast meets WCAG standards
- [ ] Responsive typography works across breakpoints

## Migration Guide

### From Arbitrary Font Sizes
```tsx
// Before
<h1 style={{ fontSize: '36px', fontWeight: 600 }}>Title</h1>
<p style={{ fontSize: '14px', lineHeight: 1.6 }}>Content</p>

// After
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
```

### From Mixed Typography Systems
```tsx
// Before
<div className="text-xl font-semibold">Mixed system</div>
<div style={{ fontSize: '1.25rem' }}>Inconsistent</div>

// After
<div style={{ 
  fontSize: 'var(--font-h4)', 
  fontWeight: 'var(--font-weight-medium)' 
}}>
  Consistent system
</div>
<div style={{ fontSize: 'var(--font-body)' }}>
  Token-based
</div>
```

## Accessibility Considerations

### Readability
- **Font Size**: Minimum 16px for body text
- **Line Height**: 1.5 for body text, 1.2-1.4 for headings
- **Letter Spacing**: Appropriate for text size and context
- **Color Contrast**: WCAG AA compliance (4.5:1 minimum)

### Screen Reader Optimization
- **Semantic HTML**: Use proper heading hierarchy (h1-h6)
- **ARIA Labels**: Provide context where needed
- **Text Alternatives**: For icons and visual elements
- **Focus Indicators**: Clear focus states for interactive text

### Responsive Typography
- **Mobile Optimization**: Ensure readability on small screens
- **Touch Targets**: Appropriate text size for touch interfaces
- **Zoom Support**: Text scales properly with browser zoom
- **Orientation Changes**: Typography adapts to landscape/portrait

## Performance Considerations

### CSS Custom Properties
- **Browser Optimization**: Efficient variable resolution
- **Inheritance**: Proper cascading and inheritance
- **Caching**: Browser caches computed values
- **Recalculation**: Minimal performance impact

### Font Loading
- **System Fonts**: Fast loading, no network requests
- **Web Fonts**: Proper loading strategies
- **Font Display**: Use font-display: swap
- **Fallbacks**: Appropriate fallback fonts

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
