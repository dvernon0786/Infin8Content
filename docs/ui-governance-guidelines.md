# UI Governance Guidelines

## 🎯 Purpose

This document establishes governance rules for UI development in Infin8Content, ensuring consistency, maintainability, and brand compliance across all components.

## 🏛️ Governance Principles

### 1. Canonical System First
- All UI components must use established canonical patterns
- No ad-hoc styling or arbitrary values
- Consistent token usage across all interfaces

### 2. Brand Compliance
- Single brand identity source
- Consistent color token application
- Typography system adherence

### 3. Developer Experience
- Clear, predictable patterns
- Comprehensive documentation
- Automated validation where possible

## 🎨 Color Governance

### Primary Color Tokens
```css
:root {
  --color-primary-blue: #217CEB;
  --color-primary-purple: #4A42CC;
}
```

### Usage Rules

#### ✅ Approved Patterns
```tsx
// Primary backgrounds
className="bg-primary-blue"
className="bg-primary-purple"

// Hover states
className="hover:text-primary"
className="hover:bg-primary-blue/90"

// Focus states
className="focus:ring-2 focus:ring-primary/50"
```

#### ❌ Forbidden Patterns
```tsx
// Arbitrary CSS variables
className="bg-[--color-primary-blue]"
className="hover:text-[--color-primary-blue]"

// Hard-coded colors
className="bg-[#217CEB]"
className="text-[#217CEB]"

// Mixed tokens
className="hover:text-[--brand-electric-blue]"
```

### Color Token Hierarchy
1. **Primary**: `--color-primary-blue` (for all UI interactions)
2. **Secondary**: `--color-primary-purple` (for alternative actions)
3. **Brand**: `--brand-electric-blue` (for brand elements only)
4. **Neutral**: `neutral-*` scale (for text, borders, backgrounds)

## 📝 Typography Governance

### Font System
```tsx
// Headings
className="font-poppins text-h2-desktop"

// Body text
className="font-lato text-body"

// UI elements
className="font-lato text-small"
```

### Usage Rules
- **Always specify font family explicitly**
- **Use semantic sizing tokens**
- **Never rely on browser defaults**

## 🎯 Component Governance

### Button System

#### Canonical Variants
```tsx
// Primary actions
<Button variant="primary">Main Action</Button>

// Secondary actions
<Button variant="secondary">Alternative Action</Button>

// Tertiary actions
<Button variant="outline">Secondary Action</Button>

// Minimal actions
<Button variant="ghost">Tertiary Action</Button>
```

#### Mobile Components
```tsx
// Mobile-optimized
<TouchTarget variant="primary" size="large">Mobile Action</TouchTarget>
```

### Card System

#### Canonical Structure
```tsx
<Card className="bg-white border-neutral-200">
  <CardHeader>
    <CardTitle className="font-poppins text-h3-desktop">Title</CardTitle>
    <CardDescription className="font-lato text-body">Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

## 🔧 Development Governance

### File Organization

#### Component Structure
```
components/
├── ui/                    # Base UI components (shadcn/ui)
├── dashboard/            # Dashboard-specific components
├── mobile/              # Mobile-specific components
└── articles/            # Domain-specific components
```

#### Styling Organization
```
app/
├── globals.css          # Global styles and utilities
├── layout.tsx           # Root layout
└── (auth)/layout.tsx    # Route group layouts
```

### Code Review Checklist

#### Before Commit
- [ ] No arbitrary CSS variable classes
- [ ] Consistent color token usage
- [ ] Explicit font family specification
- [ ] Proper variant usage
- [ ] Mobile responsiveness verified

#### During Review
- [ ] Brand compliance check
- [ ] Accessibility verification
- [ ] Performance impact assessment
- [ ] Documentation updates

#### After Merge
- [ ] Visual regression testing
- [ ] Cross-browser verification
- [ ] Mobile device testing

## 🚫 Forbidden Patterns

### CSS Classes
```css
/* ❌ Never create custom utilities like this */
.custom-hover-blue:hover {
  color: var(--color-primary-blue);
}

/* ❌ Never use arbitrary values */
.bg-[#217CEB] {
  background-color: #217CEB;
}
```

### Inline Styles
```tsx
// ❌ Never use inline styles
<div style={{ backgroundColor: '#217CEB' }}>

// ❌ Never use style props
<Button style={{ color: '#217CEB' }}>
```

### Hard-coded Values
```tsx
// ❌ Never hard-code colors
className="text-blue-500"
className="bg-blue-600"

// ❌ Never hard-code sizes
className="w-64 h-32"
```

## ✅ Required Patterns

### Button Implementation
```tsx
// ✅ Always use variants
<Button variant="primary">Action</Button>

// ✅ Use explicit utilities when needed
<div className="bg-primary-blue text-white">Custom Element</div>
```

### Typography Implementation
```tsx
// ✅ Always specify font and size
<h1 className="font-poppins text-h2-desktop">Title</h1>
<p className="font-lato text-body">Content</p>
```

### Responsive Implementation
```tsx
// ✅ Use responsive prefixes
<div className="hidden sm:block">Desktop Only</div>
<div className="block sm:hidden">Mobile Only</div>
```

## 🔍 Automated Validation

### ESLint Rules (Recommended)
```json
{
  "rules": {
    "tailwindcss/no-custom-classname": "error",
    "tailwindcss/no-contradicting-classnames": "error",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

### Build-time Checks
```bash
# Find arbitrary values
npm run lint:css-arbitrary

# Find brand token misuse
npm run lint:brand-tokens

# Verify button system
npm run test:button-system
```

### Pre-commit Hooks
```bash
#!/bin/sh
# .husky/pre-commit

# Check for arbitrary CSS values
if grep -r "bg-\[" app components; then
  echo "❌ Arbitrary CSS values found"
  exit 1
fi

# Check for brand token misuse
if grep -r "brand-electric-blue" app components --exclude-dir=node_modules; then
  echo "❌ Brand token misuse detected"
  exit 1
fi
```

## 📚 Documentation Requirements

### Component Documentation
Every component must include:
1. **Purpose statement**
2. **Props interface**
3. **Usage examples**
4. **Accessibility notes**
5. **Design system compliance**

### Pattern Documentation
Every UI pattern must include:
1. **When to use**
2. **When not to use**
3. **Implementation guidelines**
4. **Accessibility requirements**
5. **Visual examples**

## 🧪 Testing Requirements

### Unit Tests
- Component rendering
- Props validation
- State changes
- Event handling

### Integration Tests
- User workflows
- Cross-component interactions
- Responsive behavior
- Accessibility compliance

### Visual Tests
- Screenshot comparison
- Cross-browser testing
- Mobile device testing
- Dark mode compatibility

## 🔄 Migration Governance

### Breaking Changes
- **SemVer compliance** required
- **Migration guide** mandatory
- **Backward compatibility** preferred
- **Communication plan** required

### Deprecation Process
1. **Announce deprecation** with timeline
2. **Provide migration path**
3. **Update documentation**
4. **Remove in next major version**

## 🚀 Performance Governance

### Bundle Size
- **CSS optimization** required
- **Tree shaking** enabled
- **Code splitting** implemented
- **Asset optimization** applied

### Runtime Performance
- **React optimization** patterns
- **Memoization** where appropriate
- **Event handler optimization**
- **Render optimization**

## 📊 Compliance Monitoring

### Metrics to Track
1. **Design system adoption rate**
2. **Brand compliance score**
3. **Accessibility compliance**
4. **Performance benchmarks**
5. **Developer satisfaction**

### Reporting
- **Weekly compliance reports**
- **Monthly design system health**
- **Quarterly governance review**
- **Annual strategy assessment**

## 🎯 Enforcement

### Code Review Authority
- **Senior developers** can block non-compliant code
- **Design system team** has final say on brand compliance
- **Accessibility team** can block accessibility violations

### Automated Enforcement
- **CI/CD pipeline** blocks violations
- **Pre-commit hooks** prevent bad patterns
- **Automated testing** validates compliance

### Manual Review
- **Design review** for major components
- **Accessibility audit** quarterly
- **Performance review** monthly

---

## 📋 Quick Reference

### Do's ✅
- Use `bg-primary-blue` for primary backgrounds
- Use `hover:text-primary` for hover states
- Specify `font-poppins` or `font-lato` explicitly
- Use Button variants for semantic meaning
- Test on mobile devices

### Don'ts ❌
- Use `bg-[--color-primary-blue]`
- Create custom hover utilities
- Hard-code colors or sizes
- Use inline styles
- Ignore accessibility requirements

---

**Status**: ✅ Active  
**Version**: 1.0.0  
**Last Updated**: January 21, 2026  
**Maintainer**: UI Governance Committee
