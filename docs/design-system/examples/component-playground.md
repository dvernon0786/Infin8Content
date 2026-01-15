# Component Playground

## Overview

The component playground provides interactive examples of design system components. It's a living documentation tool that demonstrates proper usage patterns, variations, and best practices.

## Getting Started

### Access the Playground
```bash
# Start the development server
npm run dev

# Navigate to the playground
http://localhost:3000/playground
```

### Playground Structure
```
playground/
├── components/          # Interactive component examples
├── patterns/           # Usage pattern demonstrations
├── tokens/            # Design token visualizations
├── accessibility/     # Accessibility testing tools
└── compliance/        # Compliance checking examples
```

## Interactive Components

### Button Playground
```tsx
// playground/components/ButtonPlayground.tsx
import { useState } from 'react';
import { Button } from '@/components/ui';

export const ButtonPlayground = () => {
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const handleLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2 style={{ fontSize: 'var(--font-h2)', marginBottom: 'var(--spacing-lg)' }}>
        Button Components
      </h2>
      
      {/* Variants */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Variants
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Sizes
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </section>

      {/* States */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          States
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary" loading={loading}>
            {loading ? 'Loading...' : 'Loading State'}
          </Button>
          <Button variant="primary" onClick={handleLoading}>
            Trigger Loading
          </Button>
        </div>
      </section>

      {/* With Icons */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          With Icons
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <Button variant="primary" icon={<Icon name="plus" />}>
            Add Item
          </Button>
          <Button variant="secondary" icon={<Icon name="edit" />} iconPosition="right">
            Edit
          </Button>
          <Button variant="ghost" icon={<Icon name="trash" />}>
            Delete
          </Button>
        </div>
      </section>

      {/* Button Group */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Button Group
        </h3>
        <ButtonGroup>
          <Button variant="secondary">Left</Button>
          <Button variant="secondary">Middle</Button>
          <Button variant="secondary">Right</Button>
        </ButtonGroup>
      </section>
    </div>
  );
};
```

### Card Playground
```tsx
// playground/components/CardPlayground.tsx
import { Card, Button, Badge } from '@/components/ui';

export const CardPlayground = () => {
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2 style={{ fontSize: 'var(--font-h2)', marginBottom: 'var(--spacing-lg)' }}>
        Card Components
      </h2>
      
      {/* Basic Card */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Basic Card
        </h3>
        <Card>
          <h4 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-sm)' }}>
            Card Title
          </h4>
          <p style={{ fontSize: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
            This is a basic card with title and content. Cards are flexible containers for grouped information.
          </p>
        </Card>
      </section>

      {/* Card with Actions */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Card with Actions
        </h3>
        <Card 
          title="Article Title"
          subtitle="Published 2 hours ago"
          actions={
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <Button variant="ghost" size="sm">Edit</Button>
              <Button variant="primary" size="sm">Publish</Button>
            </div>
          }
        >
          <p style={{ fontSize: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
            Article content goes here. This card demonstrates how to use actions and metadata.
          </p>
        </Card>
      </section>

      {/* Card with Status */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Card with Status
        </h3>
        <Card 
          title="Processing Article"
          actions={<Badge variant="info">Processing</Badge>}
        >
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <ProgressBar value={65} variant="brand" showLabel />
          </div>
          <p style={{ fontSize: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
            Article generation is in progress. 65% complete.
          </p>
        </Card>
      </section>

      {/* Interactive Card */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Interactive Card
        </h3>
        <InteractiveCard onClick={() => alert('Card clicked!')}>
          <h4 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-sm)' }}>
            Clickable Card
          </h4>
          <p style={{ fontSize: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
            This card has hover effects and click handlers. Try hovering and clicking!
          </p>
        </InteractiveCard>
      </section>
    </div>
  );
};
```

### Badge Playground
```tsx
// playground/components/BadgePlayground.tsx
import { Badge } from '@/components/ui';

export const BadgePlayground = () => {
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2 style={{ fontSize: 'var(--font-h2)', marginBottom: 'var(--spacing-lg)' }}>
        Badge Components
      </h2>
      
      {/* Status Badges */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Status Badges
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <Badge variant="success">Completed</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="error">Failed</Badge>
          <Badge variant="info">Processing</Badge>
        </div>
      </section>

      {/* Confidence Badges */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Confidence Badges
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <ConfidenceBadge level="high" score={0.95} showScore />
          <ConfidenceBadge level="medium" score={0.75} showScore />
          <ConfidenceBadge level="low" score={0.45} showScore />
        </div>
      </section>

      {/* Category Badges */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Category Badges
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <Badge variant="primary">Technology</Badge>
          <Badge variant="secondary">Business</Badge>
          <Badge variant="outline">Marketing</Badge>
        </div>
      </section>

      {/* Removable Badges */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Removable Badges
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <Badge variant="outline" removable onRemove={() => alert('Removed!')}>
            Filter 1
          </Badge>
          <Badge variant="outline" removable onRemove={() => alert('Removed!')}>
            Filter 2
          </Badge>
          <Badge variant="outline" removable onRemove={() => alert('Removed!')}>
            Filter 3
          </Badge>
        </div>
      </section>

      {/* Badge Sizes */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Badge Sizes
        </h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          <Badge variant="primary" size="sm">Small</Badge>
          <Badge variant="primary" size="md">Medium</Badge>
          <Badge variant="primary" size="lg">Large</Badge>
        </div>
      </section>
    </div>
  );
};
```

## Pattern Demonstrations

### Form Patterns
```tsx
// playground/patterns/FormPatterns.tsx
export const FormPatterns = () => {
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2 style={{ fontSize: 'var(--font-h2)', marginBottom: 'var(--spacing-lg)' }}>
        Form Patterns
      </h2>
      
      {/* Standard Form */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Standard Form
        </h3>
        <Card>
          <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <FormField label="Article Title" hint="Enter a descriptive title">
              <Input placeholder="My Article" />
            </FormField>
            
            <FormField label="Category" hint="Choose a category for your article">
              <Select>
                <option value="">Select category</option>
                <option value="tech">Technology</option>
                <option value="business">Business</option>
                <option value="marketing">Marketing</option>
              </Select>
            </FormField>
            
            <FormField label="Content" hint="Write your article content">
              <Textarea rows={6} placeholder="Start writing..." />
            </FormField>
            
            <FormActions
              primaryAction={<Button variant="primary">Publish Article</Button>}
              secondaryAction={<Button variant="secondary">Save Draft</Button>}
            />
          </form>
        </Card>
      </section>

      {/* Multi-Step Form */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Multi-Step Form
        </h3>
        <Card>
          <StepProgress 
            steps={['Basic Info', 'Content', 'Settings', 'Review']}
            currentStep={1}
          />
          
          <div style={{ marginTop: 'var(--spacing-lg)' }}>
            <h4 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-md)' }}>
              Step 2: Content
            </h4>
            <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <FormField label="Article Content">
                <Textarea rows={8} placeholder="Write your article..." />
              </FormField>
              
              <FormActions
                primaryAction={<Button variant="primary">Next Step</Button>}
                secondaryAction={<Button variant="ghost">Previous</Button>}
                align="spaceBetween"
              />
            </form>
          </div>
        </Card>
      </section>
    </div>
  );
};
```

### Layout Patterns
```tsx
// playground/patterns/LayoutPatterns.tsx
export const LayoutPatterns = () => {
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2 style={{ fontSize: 'var(--font-h2)', marginBottom: 'var(--spacing-lg)' }}>
        Layout Patterns
      </h2>
      
      {/* Stack Pattern */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Stack Pattern
        </h3>
        <Card>
          <h4 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-sm)' }}>
            Vertical Stack
          </h4>
          <Stack spacing="md">
            <div style={{ 
              padding: 'var(--spacing-sm)', 
              backgroundColor: 'var(--color-background-accent)',
              borderRadius: 'var(--radius-md)'
            }}>
              Item 1
            </div>
            <div style={{ 
              padding: 'var(--spacing-sm)', 
              backgroundColor: 'var(--color-background-accent)',
              borderRadius: 'var(--radius-md)'
            }}>
              Item 2
            </div>
            <div style={{ 
              padding: 'var(--spacing-sm)', 
              backgroundColor: 'var(--color-background-accent)',
              borderRadius: 'var(--radius-md)'
            }}>
              Item 3
            </div>
          </Stack>
        </Card>
      </section>

      {/* Grid Pattern */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Grid Pattern
        </h3>
        <Card>
          <h4 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-sm)' }}>
            Responsive Grid
          </h4>
          <ResponsiveGrid>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-background-accent)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                Grid Item {i}
              </div>
            ))}
          </ResponsiveGrid>
        </Card>
      </section>

      {/* Sidebar Layout */}
      <section style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
          Sidebar Layout
        </h3>
        <ResponsiveLayout
          sidebar={
            <div style={{ padding: 'var(--spacing-md)' }}>
              <h4 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-md)' }}>
                Navigation
              </h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                <Button variant="ghost" size="sm">Dashboard</Button>
                <Button variant="ghost" size="sm">Articles</Button>
                <Button variant="ghost" size="sm">Settings</Button>
              </nav>
            </div>
          }
        >
          <div style={{ padding: 'var(--spacing-md)' }}>
            <h4 style={{ fontSize: 'var(--font-h4)', marginBottom: 'var(--spacing-md)' }}>
              Main Content
            </h4>
            <p style={{ fontSize: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
              This is the main content area with a sidebar navigation.
            </p>
          </div>
        </ResponsiveLayout>
      </section>
    </div>
  );
};
```

## Design Token Visualizations

### Color Tokens
```tsx
// playground/tokens/ColorTokens.tsx
export const ColorTokens = () => {
  const colorCategories = [
    {
      title: 'Brand Colors',
      colors: [
        { name: '--color-primary-blue', value: '#217CEB' },
        { name: '--color-primary-purple', value: '#4A42CC' }
      ]
    },
    {
      title: 'Semantic Colors',
      colors: [
        { name: '--color-text-primary', value: '#2C2C2E' },
        { name: '--color-text-secondary', value: '#6B7280' },
        { name: '--color-text-muted', value: '#9CA3AF' },
        { name: '--color-background-primary', value: '#FFFFFF' },
        { name: '--color-background-secondary', value: '#F4F4F6' },
        { name: '--color-background-accent', value: '#F9FAFB' }
      ]
    },
    {
      title: 'Status Colors',
      colors: [
        { name: '--color-success', value: '#10B981' },
        { name: '--color-warning', value: '#F59E0B' },
        { name: '--color-error', value: '#EF4444' },
        { name: '--color-info', value: '#3B82F6' }
      ]
    }
  ];

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2 style={{ fontSize: 'var(--font-h2)', marginBottom: 'var(--spacing-lg)' }}>
        Color Design Tokens
      </h2>
      
      {colorCategories.map(category => (
        <section key={category.title} style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
            {category.title}
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-md)'
          }}>
            {category.colors.map(color => (
              <div key={color.name} style={{
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-background-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-light)'
              }}>
                <div style={{
                  width: '100%',
                  height: '60px',
                  backgroundColor: color.value,
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--spacing-sm)',
                  border: '1px solid var(--color-border-light)'
                }} />
                <div style={{ fontSize: 'var(--font-caption)', color: 'var(--color-text-muted)' }}>
                  {color.name}
                </div>
                <div style={{ fontSize: 'var(--font-small)', color: 'var(--color-text-secondary)' }}>
                  {color.value}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
```

### Spacing Tokens
```tsx
// playground/tokens/SpacingTokens.tsx
export const SpacingTokens = () => {
  const spacingTokens = [
    { name: '--spacing-xs', value: '4px', size: 4 },
    { name: '--spacing-sm', value: '8px', size: 8 },
    { name: '--spacing-md', value: '16px', size: 16 },
    { name: '--spacing-lg', value: '24px', size: 24 },
    { name: '--spacing-xl', value: '32px', size: 32 },
    { name: '--spacing-2xl', value: '48px', size: 48 },
    { name: '--spacing-3xl', value: '64px', size: 64 },
    { name: '--spacing-4xl', value: '96px', size: 96 }
  ];

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2 style={{ fontSize: 'var(--font-h2)', marginBottom: 'var(--spacing-lg)' }}>
        Spacing Design Tokens
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {spacingTokens.map(token => (
          <div key={token.name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{
              width: '120px',
              fontSize: 'var(--font-caption)',
              color: 'var(--color-text-muted)',
              textAlign: 'right'
            }}>
              {token.name}
            </div>
            <div style={{
              width: '80px',
              fontSize: 'var(--font-small)',
              color: 'var(--color-text-secondary)',
              textAlign: 'right'
            }}>
              {token.value}
            </div>
            <div style={{
              flex: 1,
              height: `${token.size}px`,
              backgroundColor: 'var(--color-primary-blue)',
              borderRadius: 'var(--radius-sm)'
            }} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Accessibility Testing Tools

### Accessibility Checker
```tsx
// playground/accessibility/AccessibilityChecker.tsx
export const AccessibilityChecker = () => {
  const [results, setResults] = useState(null);

  const runAccessibilityTest = () => {
    // Simulate accessibility testing
    const testResults = {
      overall: 'pass',
      issues: [
        {
          type: 'warning',
          message: 'Button missing aria-label',
          element: 'button#submit',
          severity: 'medium'
        },
        {
          type: 'error',
          message: 'Insufficient color contrast',
          element: '.text-muted',
          severity: 'high'
        }
      ],
      score: 85
    };
    
    setResults(testResults);
  };

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2 style={{ fontSize: 'var(--font-h2)', marginBottom: 'var(--spacing-lg)' }}>
        Accessibility Testing
      </h2>
      
      <Card>
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <Button variant="primary" onClick={runAccessibilityTest}>
            Run Accessibility Test
          </Button>
        </div>
        
        {results && (
          <div>
            <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
              Test Results
            </h3>
            
            <div style={{
              padding: 'var(--spacing-md)',
              backgroundColor: results.overall === 'pass' ? 'var(--color-success)' : 'var(--color-error)',
              backgroundColor: results.overall === 'pass' ? 'var(--color-success)' : 'var(--color-error)',
              backgroundColor: results.overall === 'pass' ? 'var(--color-success)' : 'var(--color-error)',
              opacity: 0.1,
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-md)'
            }}>
              <div style={{ fontSize: 'var(--font-body)', fontWeight: 'var(--font-weight-medium)' }}>
                Overall Score: {results.score}%
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {results.issues.map((issue, index) => (
                <div key={index} style={{
                  padding: 'var(--spacing-sm)',
                  backgroundColor: issue.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                  backgroundColor: issue.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                  opacity: 0.1,
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${issue.type === 'error' ? 'var(--color-error)' : 'var(--color-warning)'}`
                }}>
                  <div style={{ fontSize: 'var(--font-small)', fontWeight: 'var(--font-weight-medium)' }}>
                    {issue.type.toUpperCase()}: {issue.message}
                  </div>
                  <div style={{ fontSize: 'var(--font-caption)', color: 'var(--color-text-muted)' }}>
                    Element: {issue.element} | Severity: {issue.severity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
```

## Compliance Examples

### Compliance Checker
```tsx
// playground/compliance/ComplianceChecker.tsx
export const ComplianceChecker = () => {
  const [code, setCode] = useState(`// Example component
const Button = () => {
  return (
    <button style={{
      backgroundColor: '#217CEB',
      color: 'white',
      padding: '12px 24px'
    }}>
      Click me
    </button>
  );
};`);

  const [violations, setViolations] = useState([]);

  const checkCompliance = () => {
    // Simulate compliance checking
    const foundViolations = [
      {
        type: 'hardcoded-color',
        line: 4,
        message: 'Hard-coded color found: #217CEB. Use design tokens instead.'
      },
      {
        type: 'inline-style',
        line: 3,
        message: 'Inline style found. Use CSS classes or design tokens instead.'
      },
      {
        type: 'arbitrary-spacing',
        line: 6,
        message: 'Arbitrary spacing found: 12px 24px. Use spacing tokens instead.'
      }
    ];
    
    setViolations(foundViolations);
  };

  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2 style={{ fontSize: 'var(--font-h2)', marginBottom: 'var(--spacing-lg)' }}>
        Design System Compliance Checker
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
        <Card>
          <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
            Code Input
          </h3>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              width: '100%',
              height: '300px',
              padding: 'var(--spacing-sm)',
              fontFamily: 'monospace',
              fontSize: 'var(--font-small)',
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border-medium)',
              borderRadius: 'var(--radius-md)'
            }}
          />
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <Button variant="primary" onClick={checkCompliance}>
              Check Compliance
            </Button>
          </div>
        </Card>
        
        <Card>
          <h3 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--spacing-md)' }}>
            Violations
          </h3>
          {violations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {violations.map((violation, index) => (
                <div key={index} style={{
                  padding: 'var(--spacing-sm)',
                  backgroundColor: 'var(--color-error)',
                  backgroundColor: 'var(--color-error)',
                  backgroundColor: 'var(--color-error)',
                  opacity: 0.1,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-error)'
                }}>
                  <div style={{ fontSize: 'var(--font-small)', fontWeight: 'var(--font-weight-medium)' }}>
                    Line {violation.line}: {violation.type}
                  </div>
                  <div style={{ fontSize: 'var(--font-caption)', color: 'var(--color-text-muted)' }}>
                    {violation.message}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: 'var(--spacing-lg)', 
              textAlign: 'center',
              color: 'var(--color-text-muted)'
            }}>
              Run compliance check to see violations
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
```

## Usage Guidelines

### How to Use the Playground
1. **Explore Components**: Browse interactive examples of all components
2. **Test Variations**: Try different variants, sizes, and states
3. **Copy Code**: Get ready-to-use code snippets
4. **Test Accessibility**: Use built-in accessibility testing tools
5. **Check Compliance**: Validate code against design system rules

### Contributing to the Playground
1. **Add New Examples**: Create interactive examples for new components
2. **Update Existing**: Keep examples current with component updates
3. **Test Coverage**: Ensure all component variations are demonstrated
4. **Documentation**: Include clear explanations and usage notes

### Best Practices
1. **Interactive Elements**: Make examples interactive and engaging
2. **Code Snippets**: Provide copy-paste ready code
3. **Real-world Scenarios**: Use practical use cases
4. **Accessibility First**: Ensure all examples are accessible
5. **Compliance Focused**: Demonstrate proper design system usage

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
