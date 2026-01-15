# Troubleshooting and FAQ

## Overview

This document provides solutions to common issues, answers to frequently asked questions, and guidance for troubleshooting design system problems.

## Frequently Asked Questions

### General Questions

#### Q: What is the design system?
**A:** The Infin8Content Design System is a comprehensive set of guidelines, components, and tools that ensure consistency, accessibility, and maintainability across all our products. It includes design tokens, reusable components, usage patterns, and development tools.

#### Q: Why should I use the design system?
**A:** Using the design system provides several benefits:
- **Consistency**: Unified look and feel across all applications
- **Efficiency**: Reusable components save development time
- **Accessibility**: Built-in accessibility compliance
- **Maintainability**: Centralized updates and improvements
- **Performance**: Optimized components and animations

#### Q: How do I get started with the design system?
**A:** Follow our onboarding guide:
1. Read the [Onboarding Guide](./onboarding-guide.md)
2. Explore the [Interactive Playground](./interactive-playground.md)
3. Practice with the [Component Library](../components/)
4. Join our training sessions

### Design Token Questions

#### Q: What are design tokens?
**A:** Design tokens are the smallest building blocks of our design system. They're CSS custom properties that define visual attributes like colors, spacing, typography, and effects.

#### Q: How do I use design tokens?
**A:** Use CSS custom properties in your styles:
```css
.component {
  background-color: var(--color-primary-blue);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
}
```

#### Q: Can I create new design tokens?
**A:** Yes, but follow our token creation guidelines:
1. Check if existing tokens meet your needs
2. Follow naming conventions
3. Use semantic names
4. Document the new tokens
5. Get design system team approval

#### Q: What if I need a color that doesn't exist?
**A:** First check if semantic colors meet your needs. If not, create a new token following our guidelines and submit it for review.

### Component Questions

#### Q: How do I use components?
**A:** Import components from the component library:
```tsx
import { Button, Card, Badge } from '@/components/ui';

const MyComponent = () => {
  return (
    <Card>
      <Button variant="primary">Click me</Button>
      <Badge variant="success">New</Badge>
    </Card>
  );
};
```

#### Q: Can I customize components?
**A:** Yes, components are designed to be customizable:
- Use variants for different styles
- Use props for configuration
- Extend components with composition
- Override styles carefully

#### Q: How do I create a new component?
**A:** Follow our component creation guidelines:
1. Check if existing components meet your needs
2. Design the component first
3. Implement with design tokens
4. Add accessibility features
5. Write tests
6. Document the component
7. Get review and approval

#### Q: What if a component doesn't work as expected?
**A:** Check our troubleshooting guide below or contact the design system team.

### Compliance Questions

#### Q: What is design system compliance?
**A:** Compliance means following our design system standards:
- No hard-coded colors
- No arbitrary spacing values
- No inline styles
- Semantic HTML elements
- Design token usage

#### Q: How do I check compliance?
**A:** Use our compliance checker:
```bash
npm run compliance:check
```

#### Q: What if I have compliance issues?
**A:** Fix common issues:
- Replace hard-coded colors with tokens
- Use spacing tokens instead of arbitrary values
- Remove inline styles
- Use semantic HTML elements

### Accessibility Questions

#### Q: How do I make components accessible?
**A:** Follow our accessibility guidelines:
- Use semantic HTML elements
- Add ARIA attributes where needed
- Ensure keyboard navigation
- Test with screen readers
- Maintain color contrast

#### Q: What ARIA attributes should I use?
**A:** Common ARIA attributes:
- `aria-label`: Descriptive labels
- `aria-describedby`: Additional description
- `aria-expanded`: State information
- `role`: Element role
- `aria-hidden`: Hide from screen readers

#### Q: How do I test accessibility?
**A:** Use our accessibility testing tools:
```bash
npm run test:accessibility
```

## Troubleshooting Guide

### 1. Common Issues

#### Issue: Components not rendering correctly
**Symptoms:**
- Components appear broken or unstyled
- Layout issues
- Missing visual elements

**Solutions:**
1. **Check imports**: Ensure correct import paths
```tsx
// Correct
import { Button } from '@/components/ui';

// Incorrect
import { Button } from './Button';
```

2. **Check design tokens**: Verify token usage
```css
/* Correct */
background-color: var(--color-primary-blue);

/* Incorrect */
background-color: #217CEB;
```

3. **Check CSS specificity**: Use LayoutDiagnostic
```tsx
import LayoutDiagnostic from '@/components/layout-diagnostic';

// Add to component to debug
<div>
  <LayoutDiagnostic />
  {/* Your component */}
</div>
```

4. **Check browser console**: Look for errors or warnings

#### Issue: Compliance checker errors
**Symptoms:**
- Hard-coded color errors
- Arbitrary spacing errors
- Inline style errors

**Solutions:**
1. **Hard-coded colors**: Replace with tokens
```tsx
// Before
<div style={{ backgroundColor: '#217CEB' }}>

// After
<div style={{ backgroundColor: 'var(--color-primary-blue)' }}>
```

2. **Arbitrary spacing**: Use spacing tokens
```tsx
// Before
<div style={{ padding: '16px', margin: '8px' }}>

// After
<div style={{ padding: 'var(--spacing-md)', margin: 'var(--spacing-sm)' }}>
```

3. **Inline styles**: Use CSS classes
```tsx
// Before
<div style={{ backgroundColor: 'var(--color-primary-blue)' }}>

// After
<div className="bg-primary-blue">
```

#### Issue: Accessibility issues
**Symptoms:**
- Keyboard navigation not working
- Screen reader not reading content
- Color contrast issues
- Focus indicators missing

**Solutions:**
1. **Keyboard navigation**: Add focus handling
```tsx
const Button = ({ children, ...props }) => {
  return (
    <button
      {...props}
      onFocus={(e) => e.target.focus()}
      onBlur={(e) => e.target.blur()}
    >
      {children}
    </button>
  );
};
```

2. **Screen reader support**: Add ARIA labels
```tsx
const Button = ({ children, ariaLabel, ...props }) => {
  return (
    <button aria-label={ariaLabel} {...props}>
      {children}
    </button>
  );
};
```

3. **Color contrast**: Use semantic colors
```css
/* Good contrast */
.text-primary {
  color: var(--color-text-primary);
  background-color: var(--color-background-primary);
}

/* Poor contrast */
.text-muted {
  color: #999;
  background-color: #fff;
}
```

4. **Focus indicators**: Add focus styles
```css
button:focus {
  outline: 2px solid var(--color-primary-blue);
  outline-offset: 2px;
}
```

#### Issue: Performance problems
**Symptoms:**
- Slow rendering
- High memory usage
- Jank animations
- Large bundle size

**Solutions:**
1. **Optimize rendering**: Use React.memo
```tsx
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

2. **Use efficient CSS properties**: Use transform and opacity
```css
/* Good: GPU-accelerated */
.animated {
  transform: translateY(0);
  opacity: 1;
  transition: all 0.2s ease;
}

/* Bad: Layout-triggering */
.animated {
  width: 100px;
  height: 100px;
  margin: 10px;
}
```

3. **Lazy load components**: Use dynamic imports
```tsx
const LazyComponent = lazy(() => import('./LazyComponent'));

// Usage
<Suspense fallback={<div>Loading...</div>}>
  <LazyComponent />
</Suspense>
```

### 2. Debugging Tools

#### Layout Diagnostic
```tsx
import LayoutDiagnostic from '@/components/layout-diagnostic';

// Add to any component to debug layout issues
const MyComponent = () => {
  return (
    <div>
      <LayoutDiagnostic />
      {/* Your component content */}
    </div>
  );
};
```

#### Compliance Checker
```bash
# Check compliance
npm run compliance:check

# Generate report
npm run compliance:report

# Fix common issues
npm run compliance:fix
```

#### Performance Monitor
```bash
# Check performance
npm run test:performance

# Profile components
npm run profile:components
```

#### Accessibility Tester
```bash
# Test accessibility
npm run test:accessibility

# Check color contrast
npm run test:contrast
```

### 3. Environment Issues

#### Issue: Development server not starting
**Solutions:**
1. **Check dependencies**: Install missing packages
```bash
npm install
```

2. **Clear cache**: Clear build cache
```bash
npm run clean
npm run dev
```

3. **Check Node version**: Ensure compatible version
```bash
node --version  # Should be 18+
```

4. **Check environment variables**: Verify .env file
```bash
# Check .env.example
cat .env.example

# Copy to .env
cp .env.example .env
```

#### Issue: Build errors
**Solutions:**
1. **Check TypeScript errors**: Fix type issues
```bash
npm run type-check
```

2. **Check ESLint errors**: Fix linting issues
```bash
npm run lint
```

3. **Check compliance**: Fix design system issues
```bash
npm run compliance:check
```

4. **Check dependencies**: Update outdated packages
```bash
npm outdated
npm update
```

## Error Messages

### 1. Design Token Errors

#### Error: "Unknown design token"
**Cause:** Using non-existent design token
**Solution:** Check token name and spelling
```css
/* Correct */
background-color: var(--color-primary-blue);

/* Incorrect */
background-color: var(--color-primary-bluee);
```

#### Error: "Invalid CSS custom property"
**Cause:** Invalid CSS custom property syntax
**Solution:** Use correct syntax
```css
/* Correct */
--color-primary-blue: #217CEB;

/* Incorrect */
--color-primary-blue: #217CEB;
```

### 2. Component Errors

#### Error: "Component not found"
**Cause:** Incorrect import path
**Solution:** Check import path
```tsx
/* Correct */
import { Button } from '@/components/ui';

/* Incorrect */
import { Button } from './Button';
```

#### Error: "Invalid prop type"
**Cause:** Wrong prop type or missing prop
**Solution:** Check component props
```tsx
// Check ButtonProps interface
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

### 3. Compliance Errors

#### Error: "Hard-coded color found"
**Cause:** Using hex color instead of token
**Solution:** Replace with design token
```css
/* Before */
background-color: #217CEB;

/* After */
background-color: var(--color-primary-blue);
```

#### Error: "Arbitrary spacing found"
**Cause:** Using pixel values instead of tokens
**Solution:** Replace with spacing token
```css
/* Before */
padding: 16px;

/* After */
padding: var(--spacing-md);
```

#### Error: "Inline style found"
**Cause:** Using inline styles instead of CSS classes
**Solution:** Use CSS classes or design tokens
```css
/* Before */
<div style={{ backgroundColor: 'var(--color-primary-blue)' }}>

/* After */
<div className="bg-primary-blue">
```

## Getting Help

### 1. Self-Help Resources
- [Documentation](../README.md)
- [Component Library](../components/)
- [Design Tokens](../tokens/)
- [Best Practices](../examples/best-practices.md)
- [Anti-Patterns](../examples/anti-patterns.md)

### 2. Community Support
- **Slack Channel**: #design-system
- **Community Forum**: https://community.infin8content.com
- **GitHub Issues**: https://github.com/infin8content/design-system/issues
- **Stack Overflow**: Tag questions with #infin8content-design-system

### 3. Direct Support
- **Design System Team**: design-system@company.com
- **Technical Support**: support@company.com
- **Accessibility Help**: a11y@company.com
- **Performance Help**: performance@company.com

### 4. Office Hours
- **Design System**: Tuesday 2-4 PM
- **Accessibility**: Wednesday 10-12 PM
- **Performance**: Thursday 3-5 PM
- **General Support**: Friday 1-3 PM

## Common Scenarios

### 1. New Project Setup
#### Problem: Setting up a new project with the design system
**Solution:**
1. Install dependencies
```bash
npm install @infin8content/design-system
```

2. Configure build tools
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    require('@infin8content/design-system/plugin')
  ]
};
```

3. Import design tokens
```css
/* globals.css */
@import '@infin8content/design-system/tokens.css';
```

4. Start using components
```tsx
import { Button, Card } from '@infin8content/design-system';
```

### 2. Component Customization
#### Problem: Customizing existing components
**Solution:**
1. Use composition
```tsx
const CustomCard = ({ children, ...props }) => {
  return (
    <Card style={{ border: '2px solid var(--color-primary-blue)' }} {...props}>
      {children}
    </Card>
  );
};
```

2. Extend with styles
```css
.custom-card {
  border: 2px solid var(--color-primary-blue);
  box-shadow: var(--shadow-lg);
}
```

3. Create variants
```tsx
const CustomCard = ({ variant = 'default', ...props }) => {
  const variants = {
    default: 'custom-card',
    elevated: 'custom-card custom-card-elevated'
  };
  
  return (
    <Card className={variants[variant]} {...props}>
      {children}
    </Card>
  );
};
```

### 3. Migration from Old Code
#### Problem: Migrating existing code to design system
**Solution:**
1. Identify hard-coded values
```bash
# Find hard-coded colors
grep -r "#[0-9A-Fa-f]\{6\}" --include="*.tsx" --include="*.css" src/
```

2. Replace with design tokens
```css
/* Before */
background-color: #217CEB;
padding: 16px;
border-radius: 6px;

/* After */
background-color: var(--color-primary-blue);
padding: var(--spacing-md);
border-radius: var(--radius-md);
```

3. Update components
```tsx
// Before
const OldButton = () => (
  <button style={{
    backgroundColor: '#217CEB',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '6px'
  }}>
    Click me
  </button>
);

// After
const NewButton = () => (
  <Button variant="primary">Click me</Button>
);
```

### 4. Performance Optimization
#### Problem: Slow component rendering
**Solution:**
1. Use React.memo
```tsx
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

2. Use useMemo for expensive calculations
```tsx
const Component = ({ items }) => {
  const processedItems = useMemo(() => {
    return items.map(item => expensiveProcessing(item));
  }, [items]);
  
  return <div>{processedItems}</div>;
};
```

3. Use useCallback for event handlers
```tsx
const Component = ({ onItemClick }) => {
  const handleClick = useCallback((item) => {
    onItemClick(item.id);
  }, [onItemClick]);
  
  return <button onClick={handleClick}>Click</button>;
};
```

## Prevention Tips

### 1. Development Practices
- Use design tokens from the start
- Test components regularly
- Run compliance checks
- Follow accessibility guidelines
- Document custom components

### 2. Code Review
- Check for hard-coded values
- Verify design token usage
- Ensure accessibility compliance
- Test performance impact
- Validate documentation

### 3. Testing
- Write comprehensive tests
- Test accessibility
- Test performance
- Test responsive behavior
- Test edge cases

### 4. Documentation
- Keep documentation up to date
- Include usage examples
- Document custom components
- Share best practices
- Provide troubleshooting guides

---

**Need More Help?** If you can't find the answer here, don't hesitate to reach out to our support channels. We're here to help you succeed with the design system!

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Next Review**: March 15, 2026
