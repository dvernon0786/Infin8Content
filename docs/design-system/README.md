# Infin8Content Design System

## Overview

The Infin8Content Design System is a comprehensive set of guidelines, components, and tools that ensure visual consistency, brand coherence, and development efficiency across all products and platforms.

## Getting Started

### Quick Start

1. **Install Dependencies**: Ensure all design system packages are installed
2. **Import Tokens**: Use CSS variables from `globals.css`
3. **Use Components**: Import components from the component library
4. **Follow Guidelines**: Refer to component documentation for proper usage

### Design Tokens

Design tokens are the single source of truth for all design decisions. They are implemented as CSS variables and available globally throughout the application.

```css
/* Example: Using design tokens */
.component {
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

### Component Usage

All components should use design tokens and follow established patterns:

```tsx
// ✅ Correct: Using design tokens
<Button variant="primary" size="md">
  Primary Action
</Button>

// ❌ Incorrect: Hard-coded values
<div style={{ backgroundColor: '#217CEB', padding: '16px' }}>
  Custom Button
</div>
```

## Design System Structure

```
docs/design-system/
├── tokens/           # Design token documentation
├── components/       # Component usage guidelines
├── guidelines/       # Usage and compliance rules
└── examples/         # Interactive examples and patterns
```

## Key Principles

### 1. Token-First Design
- All styling uses design tokens
- No hard-coded values in components
- Consistent spacing, colors, and typography

### 2. Semantic Naming
- Colors use semantic names (primary, secondary, success)
- Not literal names (blue, red, green)
- Context-aware naming (text-primary, background-secondary)

### 3. Component Reusability
- Build reusable components, not one-offs
- Use established patterns
- Follow component composition principles

### 4. Accessibility First
- WCAG 2.1 AA compliance mandatory
- Proper color contrast ratios
- Screen reader compatibility

### 5. Performance Conscious
- Efficient CSS usage
- Optimized component rendering
- Minimal bundle impact

## Compliance Requirements

### Automated Checks
- ESLint rules for design token usage
- Pre-commit hooks for validation
- CI/CD compliance checks

### Manual Review
- Design system review for new components
- Code review for compliance
- Documentation updates required

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **CSS Variables**: Full support in all modern browsers
- **CSS Grid**: Supported in all target browsers
- **Flexbox**: Full support with fallbacks

## Contributing

### Before You Start
1. Read all design system documentation
2. Check existing components before creating new ones
3. Understand the compliance requirements

### Making Changes
1. Use design tokens for all styling
2. Update documentation for any changes
3. Add tests for new components
4. Follow the established patterns

### Review Process
1. Automated compliance checks
2. Design system review
3. Code review
4. Documentation validation

## Getting Help

### Documentation
- **Component Library**: `/components/`
- **Design Tokens**: `/tokens/`
- **Usage Guidelines**: `/guidelines/`
- **Examples**: `/examples/`

### Support
- **Design System Team**: Contact for questions and guidance
- **Component Playground**: Interactive experimentation
- **FAQ**: Common questions and solutions

## Version History

### v1.0.0 (Current)
- Complete design token system
- Enhanced component library
- Compliance checking system
- Comprehensive documentation

### Previous Versions
- Legacy components and patterns
- Migration guidelines available
- Deprecation notices

## Resources

### External References
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Variables Specification](https://www.w3.org/TR/css-variables/)

### Internal Resources
- **Story 30.1**: CSS Design Tokens Implementation
- **Story 30.2**: Component Library Development
- **Architecture Documentation**: Technical specifications
- **Component Tests**: Test coverage and examples

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Maintainers**: Design System Team
