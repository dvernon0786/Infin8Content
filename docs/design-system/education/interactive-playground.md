# Interactive Component Playground

## Overview

The interactive component playground is a hands-on learning environment where you can experiment with design system components, see live examples, and understand how to use them correctly.

## Getting Started

### 1. Access the Playground
```bash
# Start the development server
npm run dev

# Navigate to the playground
http://localhost:3000/playground
```

### 2. Playground Structure
```
playground/
├── components/          # Interactive component examples
├── patterns/           # Usage pattern demonstrations
├── tokens/            # Design token visualizations
├── accessibility/     # Accessibility testing tools
└── compliance/        # Compliance checking examples
```

## Component Playground

### 1. Button Playground
#### 🎯 Learning Objectives
- Understand button variants and sizes
- Learn about interaction states
- Practice accessibility patterns
- See hover, focus, and active states

#### 🧮 Interactive Examples
```tsx
// Try different button configurations
const ButtonPlayground = () => {
  const [variant, setVariant] = useState('primary');
  const [size, setSize] = useState('md');
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2>Button Component</h2>
      
      {/* Controls */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label>Variant:</label>
        <select value={variant} onChange={(e) => setVariant(e.target.value)}>
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="ghost">Ghost</option>
          <option value="destructive">Destructive</option>
        </select>
        
        <label>Size:</label>
        <select value={size} onChange={(e) => setSize(e.target.value)}>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
        
        <label>
          <input 
            type="checkbox" 
            checked={disabled} 
            onChange={(e) => setDisabled(e.target.checked)}
          />
          Disabled
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={loading} 
            onChange={(e) => setLoading(e.target.checked)}
          />
          Loading
        </label>
      </div>
      
      {/* Live Preview */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3>Live Preview</h3>
        <Button 
          variant={variant}
          size={size}
          disabled={disabled}
          loading={loading}
          onClick={() => alert('Button clicked!')}
        >
          {loading ? 'Loading...' : 'Click me'}
        </Button>
      </div>
      
      {/* Code Example */}
      <div>
        <h3>Code Example</h3>
        <pre style={{ 
          backgroundColor: 'var(--color-background-secondary)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto'
        }}>
{`<Button 
  variant="${variant}"
  size="${size}"
  disabled={${disabled}}
  loading={${loading}}
  onClick={handleClick}
>
  ${loading ? 'Loading...' : 'Click me'}
</Button>`}
        </pre>
      </div>
    </div>
  );
};
```

### 2. Card Playground
#### 🎯 Learning Objectives
- Understand card composition patterns
- Learn about card variants and states
- Practice content organization
- See hover and interaction effects

#### 🧮 Interactive Examples
```tsx
const CardPlayground = () => {
  const [hasTitle, setHasTitle] = useState(true);
  const [hasActions, setHasActions] = useState(true);
  const [interactive, setInteractive] = useState(false);
  const [variant, setVariant] = useState('default');
  
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2>Card Component</h2>
      
      {/* Controls */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label>
          <input 
            type="checkbox" 
            checked={hasTitle} 
            onChange={(e) => setHasTitle(e.target.checked)}
          />
          Has Title
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={hasActions} 
            onChange={(e) => setHasActions(e.target.checked)}
          />
          Has Actions
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={interactive} 
            onChange={(e) => setInteractive(e.target.checked)}
          />
          Interactive
        </label>
        
        <label>Variant:</label>
        <select value={variant} onChange={(e) => setVariant(e.target.value)}>
          <option value="default">Default</option>
          <option value="elevated">Elevated</option>
          <option value="outlined">Outlined</option>
        </select>
      </div>
      
      {/* Live Preview */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3>Live Preview</h3>
        <InteractiveCard 
          variant={variant}
          hasTitle={hasTitle}
          hasActions={hasActions}
          onClick={interactive ? () => alert('Card clicked!') : undefined}
        />
      </div>
      
      {/* Code Example */}
      <div>
        <h3>Code Example</h3>
        <pre style={{ 
          backgroundColor: 'var(--color-background-secondary)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto'
        }}>
{`<Card variant="${variant}"${interactive ? ' onClick={handleClick}' : ''}>
  ${hasTitle ? '<h3>Card Title</h3>' : ''}
  <p>Card content goes here.</p>
  ${hasActions ? '<Button>Action</Button>' : ''}
</Card>`}
        </pre>
      </div>
    </div>
  );
};
```

## Pattern Playground

### 1. Form Patterns
#### 🎯 Learning Objectives
- Understand form composition patterns
- Learn about form validation
- Practice accessibility patterns
- See different form layouts

#### 🧮 Interactive Examples
```tsx
const FormPlayground = () => {
  const [layout, setLayout] = useState('vertical');
  const [hasValidation, setHasValidation] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2>Form Patterns</h2>
      
      {/* Controls */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label>Layout:</label>
        <select value={layout} onChange={(e) => setLayout(e.target.value)}>
          <option value="vertical">Vertical</option>
          <option value="horizontal">Horizontal</option>
          <option value="inline">Inline</option>
        </select>
        
        <label>
          <input 
            type="checkbox" 
            checked={hasValidation} 
            onChange={(e) => setHasValidation(e.target.checked)}
          />
          Has Validation
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={hasErrors} 
            onChange={(e) => setHasErrors(e.target.checked)}
          />
          Show Errors
        </label>
      </div>
      
      {/* Live Preview */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3>Live Preview</h3>
        <FormExample 
          layout={layout}
          hasValidation={hasValidation}
          hasErrors={hasErrors}
        />
      </div>
      
      {/* Code Example */}
      <div>
        <h3>Code Example</h3>
        <pre style={{ 
          backgroundColor: 'var(--color-background-secondary)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto'
        }}>
{`<Form layout="${layout}">
  <FormField label="Name" error={${hasErrors} ? 'Required' : undefined}>
    <Input placeholder="Enter your name" />
  </FormField>
  
  ${hasValidation ? `
  <FormField label="Email" error={hasErrors ? 'Invalid email' : undefined}>
    <Input type="email" placeholder="Enter your email" />
  </FormField>
  ` : ''}
  
  <Button type="submit">Submit</Button>
</Form>`}
        </pre>
      </div>
    </div>
  );
};
```

### 2. Layout Patterns
#### 🎯 Learning Objectives
- Understand layout composition
- Learn about responsive patterns
- Practice spacing and alignment
- See different layout techniques

#### 🧮 Interactive Examples
```tsx
const LayoutPlayground = () => {
  const [pattern, setPattern] = useState('stack');
  const [spacing, setSpacing] = useState('md');
  const [alignment, setAlignment] = useState('start');
  
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2>Layout Patterns</h2>
      
      {/* Controls */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label>Pattern:</label>
        <select value={pattern} onChange={(e) => setPattern(e.target.value)}>
          <option value="stack">Stack</option>
          <option value="grid">Grid</option>
          <option value="flex">Flex</option>
          <option value="sidebar">Sidebar</option>
        </select>
        
        <label>Spacing:</label>
        <select value={spacing} onChange={(e) => setSpacing(e.target.value)}>
          <option value="xs">Extra Small</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
          <option value="xl">Extra Large</option>
        </select>
        
        <label>Alignment:</label>
        <select value={alignment} onChange={(e) => setAlignment(e.target.value)}>
          <option value="start">Start</option>
          <option value="center">Center</option>
          <option value="end">End</option>
          <option value="stretch">Stretch</option>
        </select>
      </div>
      
      {/* Live Preview */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3>Live Preview</h3>
        <LayoutExample 
          pattern={pattern}
          spacing={spacing}
          alignment={alignment}
        />
      </div>
      
      {/* Code Example */}
      <div>
        <h3>Code Example</h3>
        <pre style={{ 
          backgroundColor: 'var(--color-background-secondary)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto'
        }}>
{`<${pattern.charAt(0).toUpperCase() + pattern.slice(1)} 
  spacing="${spacing}" 
  alignment="${alignment}"
>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</${pattern}>`}
        </pre>
      </div>
    </div>
  );
};
```

## Token Playground

### 1. Color Tokens
#### 🎯 Learning Objectives
- Understand color token structure
- Learn semantic color usage
- Practice color combinations
- See color accessibility

#### 🧮 Interactive Examples
```tsx
const ColorPlayground = () => {
  const [selectedColor, setSelectedColor] = useState('primary-blue');
  const [showContrast, setShowContrast] = useState(false);
  
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2>Color Tokens</h2>
      
      {/* Color Selector */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label>Select Color:</label>
        <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
          <option value="primary-blue">Primary Blue</option>
          <option value="primary-purple">Primary Purple</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="info">Info</option>
        </select>
        
        <label>
          <input 
            type="checkbox" 
            checked={showContrast} 
            onChange={(e) => setShowContrast(e.target.checked)}
          />
          Show Contrast
        </label>
      </div>
      
      {/* Color Display */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3>Color Display</h3>
        <ColorDisplay 
          color={selectedColor}
          showContrast={showContrast}
        />
      </div>
      
      {/* Usage Examples */}
      <div>
        <h3>Usage Examples</h3>
        <pre style={{ 
          backgroundColor: 'var(--color-background-secondary)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto'
        }}>
{`/* CSS Usage */
.element {
  color: var(--color-${selectedColor});
  background-color: var(--color-${selectedColor});
  border-color: var(--color-${selectedColor});
}

/* React Usage */
<div style={{ 
  color: 'var(--color-${selectedColor})' 
}}>
  Colored text
</div>`}
        </pre>
      </div>
    </div>
  );
};
```

### 2. Spacing Tokens
#### 🎯 Learning Objectives
- Understand spacing scale
- Learn spacing token usage
- Practice spacing combinations
- See responsive spacing

#### 🧮 Interactive Examples
```tsx
const SpacingPlayground = () => {
  const [selectedSpacing, setSelectedSpacing] = useState('md');
  const [direction, setDirection] = useState('all');
  const [showVisual, setShowVisual] = useState(true);
  
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2>Spacing Tokens</h2>
      
      {/* Controls */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label>Spacing:</label>
        <select value={selectedSpacing} onChange={(e) => setSelectedSpacing(e.target.value)}>
          <option value="xs">Extra Small (4px)</option>
          <option value="sm">Small (8px)</option>
          <option value="md">Medium (16px)</option>
          <option value="lg">Large (24px)</option>
          <option value="xl">Extra Large (32px)</option>
          <option value="2xl">2X Large (48px)</option>
        </select>
        
        <label>Direction:</label>
        <select value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="all">All</option>
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
        
        <label>
          <input 
            type="checkbox" 
            checked={showVisual} 
            onChange={(e) => setShowVisual(e.target.checked)}
          />
          Show Visual
        </label>
      </div>
      
      {/* Visual Display */}
      {showVisual && (
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h3>Visual Display</h3>
          <SpacingDisplay 
            spacing={selectedSpacing}
            direction={direction}
          />
        </div>
      )}
      
      {/* Usage Examples */}
      <div>
        <h3>Usage Examples</h3>
        <pre style={{ 
          backgroundColor: 'var(--color-background-secondary)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto'
        }}>
{`/* CSS Usage */
.element {
  padding: var(--spacing-${selectedSpacing});
  margin: var(--spacing-${selectedSpacing});
  gap: var(--spacing-${selectedSpacing});
}

/* React Usage */
<div style={{ 
  padding: 'var(--spacing-${selectedSpacing})',
  margin: 'var(--spacing-${selectedSpacing})'
}}>
  Spaced element
</div>`}
        </pre>
      </div>
    </div>
  );
};
```

## Accessibility Playground

### 1. Accessibility Testing
#### 🎯 Learning Objectives
- Understand accessibility requirements
- Learn ARIA attribute usage
- Practice keyboard navigation
- See screen reader behavior

#### 🧮 Interactive Examples
```tsx
const AccessibilityPlayground = () => {
  const [showARIA, setShowARIA] = useState(true);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [showScreenReader, setShowScreenReader] = useState(false);
  
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2>Accessibility Testing</h2>
      
      {/* Controls */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <label>
          <input 
            type="checkbox" 
            checked={showARIA} 
            onChange={(e) => setShowARIA(e.target.checked)}
          />
          Show ARIA Labels
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={showKeyboard} 
            onChange={(e) => setShowKeyboard(e.target.checked)}
          />
          Enable Keyboard Navigation
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={showScreenReader} 
            onChange={(e) => setShowScreenReader(e.target.checked)}
          />
          Screen Reader Mode
        </label>
      </div>
      
      {/* Accessible Component */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3>Accessible Component</h3>
        <AccessibleButton 
          showARIA={showARIA}
          showKeyboard={showKeyboard}
          showScreenReader={showScreenReader}
        />
      </div>
      
      {/* Accessibility Info */}
      <div>
        <h3>Accessibility Information</h3>
        <AccessibilityInfo 
          showARIA={showARIA}
          showKeyboard={showKeyboard}
          showScreenReader={showScreenReader}
        />
      </div>
    </div>
  );
};
```

## Compliance Playground

### 1. Compliance Checking
#### 🎯 Learning Objectives
- Understand compliance rules
- Learn to identify violations
- Practice fixing issues
- See compliance scoring

#### 🧮 Interactive Examples
```tsx
const CompliancePlayground = () => {
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
    const foundViolations = [];
    
    // Check for hard-coded colors
    if (code.includes('#217CEB')) {
      foundViolations.push({
        type: 'hardcoded-color',
        line: 4,
        message: 'Hard-coded color found: #217CEB'
      });
    }
    
    // Check for inline styles
    if (code.includes('style={')) {
      foundViolations.push({
        type: 'inline-style',
        line: 4,
        message: 'Inline style found'
      });
    }
    
    // Check for arbitrary spacing
    if (code.includes('padding: 12px 24px')) {
      foundViolations.push({
        type: 'arbitrary-spacing',
        line: 5,
        message: 'Arbitrary spacing found: padding: 12px 24px'
      });
    }
    
    setViolations(foundViolations);
  };
  
  return (
    <div style={{ padding: 'var(--spacing-xl)' }}>
      <h2>Compliance Checking</h2>
      
      {/* Code Editor */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3>Code Editor</h3>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{
            width: '100%',
            height: '200px',
            fontFamily: 'monospace',
            fontSize: 'var(--font-small)',
            padding: 'var(--spacing-sm)',
            backgroundColor: 'var(--color-background-secondary)',
            border: '1px solid var(--color-border-medium)',
            borderRadius: 'var(--radius-md)'
          }}
        />
        
        <button 
          onClick={checkCompliance}
          style={{
            marginTop: 'var(--spacing-sm)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: 'var(--color-primary-blue)',
            color: 'var(--color-background-primary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer'
          }}
        >
          Check Compliance
        </button>
      </div>
      
      {/* Violations Display */}
      <div>
        <h3>Violations Found</h3>
        {violations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {violations.map((violation, index) => (
              <div
                key={index}
                style={{
                  padding: 'var(--spacing-sm)',
                  backgroundColor: 'var(--color-error)',
                  backgroundColor: 'var(--color-error)',
                  backgroundColor: 'var(--color-error)',
                  opacity: 0.1,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-error)'
                }}
              >
                <div style={{ fontSize: 'var(--font-small)', fontWeight: 'var(--font-weight-medium)' }}>
                  {violation.type} - Line {violation.line}
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
            No violations found! Great job!
          </div>
        )}
      </div>
      
      {/* Compliance Score */}
      <div>
        <h3>Compliance Score</h3>
        <div style={{
          width: '100%',
          height: '20px',
          backgroundColor: 'var(--color-border-light)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.max(0, 100 - violations.length * 25)}%`,
            height: '100%',
            backgroundColor: violations.length === 0 ? 'var(--color-success)' : 
                           violations.length <= 2 ? 'var(--color-warning)' : 'var(--color-error)',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <p style={{ fontSize: 'var(--font-small)', marginTop: 'var(--spacing-xs)' }}>
          Score: {Math.max(0, 100 - violations.length * 25)}%
        </p>
      </div>
    </div>
  );
};
```

## Learning Paths

### 1. Beginner Path
#### 🎯 Objectives
- Understand basic component usage
- Learn design token fundamentals
- Practice simple patterns
- Build confidence with the system

#### 📋 Steps
1. **Start with Tokens**: Learn colors, spacing, typography
2. **Basic Components**: Master Button, Card, Badge
3. **Simple Patterns**: Forms, layouts, navigation
4. **Accessibility Basics**: ARIA labels, keyboard navigation
5. **Compliance**: Understand and fix common issues

### 2. Intermediate Path
#### 🎯 Objectives
- Master component composition
- Learn complex patterns
- Understand responsive design
- Practice advanced accessibility

#### 📋 Steps
1. **Component Composition**: Build complex components
2. **Advanced Patterns**: Modals, dropdowns, tables
3. **Responsive Design**: Mobile-first approach
4. **Advanced Accessibility**: Screen readers, focus management
5. **Performance**: Optimization techniques

### 3. Advanced Path
#### 🎯 Objectives
- Contribute to the design system
- Create new components
- Understand system architecture
- Mentor other developers

#### 📋 Steps
1. **Component Creation**: Design and build new components
2. **System Architecture**: Understand token system and tools
3. **Contribution**: Submit components and improvements
4. **Mentorship**: Help others learn the system
5. **Leadership**: Drive design system improvements

## Challenges and Exercises

### 1. Component Challenges
#### 🎯 Challenge: Build a Form
Create a complete form component with:
- Multiple input types
- Validation states
- Accessibility features
- Responsive design
- Error handling

#### 🎯 Challenge: Create a Modal
Build a modal component with:
- Overlay backdrop
- Focus management
- Keyboard navigation
- Animation effects
- Accessibility compliance

#### 🎯 Challenge: Design a Dashboard
Create a dashboard layout with:
- Responsive grid
- Multiple card types
- Interactive elements
- Loading states
- Error boundaries

### 2. Pattern Challenges
#### 🎯 Challenge: Navigation System
Build a navigation system with:
- Multiple levels
- Mobile menu
- Breadcrumb trail
- Search functionality
- Accessibility features

#### 🎯 Challenge: Data Display
Create a data display component with:
- Table layout
- Sorting and filtering
- Pagination
- Loading states
- Empty states

### 3. Accessibility Challenges
#### 🎯 Challenge: Fully Accessible Component
Create a component that is:
- Screen reader friendly
- Keyboard navigable
- High contrast compliant
- Motion respecting
- Error tolerant

## Assessment and Feedback

### 1. Self-Assessment
#### ✅ Skills Checklist
- [ ] Can use all basic components correctly?
- [ ] Can identify and fix compliance issues?
- [ ] Can build accessible components?
- [ ] Can create responsive layouts?
- [ ] Can contribute to the design system?

### 2. Project Assessment
#### 🎯 Project Ideas
- **Component Library**: Build a small component library
- **Pattern Library**: Create common UI patterns
- **Design System**: Create a mini design system
- **Accessibility Audit**: Audit existing components
- **Performance Optimization**: Optimize component performance

### 3. Feedback System
#### 💬 Getting Feedback
- **Code Review**: Submit components for review
- **Peer Review**: Review other developers' work
- **Design Review**: Get feedback from designers
- **User Testing**: Test with real users

## Resources

### 📚 Documentation
- [Component Library](../components/)
- [Design Tokens](../tokens/)
- [Usage Guidelines](../guidelines/usage.md)
- [Best Practices](../examples/best-practices.md)

### 🛠 Tools
- [Compliance Checker](../../tools/compliance-check.js)
- [Layout Diagnostic](../../components/layout-diagnostic.tsx)
- [Accessibility Tester](../../tools/accessibility-test.js)

### 📞 Support
- **Design System Team**: design-system@company.com
- **Slack Channel**: #design-system-playground
- **Office Hours**: Wednesday 3-5 PM
- **Mentorship**: Request a playground mentor

---

**Happy Learning!** The interactive playground is designed to help you learn by doing. Experiment, make mistakes, and learn from them. That's the best way to master the design system!

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
