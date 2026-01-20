# Dashboard Brand Compliance Guide

## Overview

This guide establishes the brand compliance rules for all dashboard components, ensuring consistency with the homepage brand system while maintaining the Production Command Center's restrained, functional aesthetic.

## Brand System Rules

### Color Usage

#### Allowed Colors
- **Primary Accent**: `--brand-electric-blue` (use sparingly for CTAs and hover states)
- **Neutral Scale**: `neutral-900`, `neutral-600`, `neutral-500`, `neutral-200`
- **Backgrounds**: `bg-white`
- **Borders**: `border-neutral-200`

#### Forbidden Colors
- ❌ All `blue-*` Tailwind utilities (except brand tokens)
- ❌ All `gray-*` Tailwind utilities (use neutral scale)
- ❌ `destructive` colors for non-error contexts
- ❌ Any hard-coded hex values outside brand tokens

### Typography Rules

#### Headings
- **Font**: `font-poppins`
- **Colors**: `text-neutral-900`
- **Sizing**: Semantic tokens (`text-h2-desktop`, `text-h3-desktop`, `text-h4`)

#### Body & UI Text
- **Font**: `font-lato`
- **Colors**: `text-neutral-600` (primary), `text-neutral-500` (secondary)
- **Sizing**: Semantic tokens (`text-body`, `text-small`)

#### Explicit Usage Required
- ❌ No implicit font inheritance
- ✅ Always specify `font-poppins` or `font-lato`
- ✅ Always specify color and size tokens

## Component Guidelines

### Navigation Components

#### Sidebar Navigation
- **Brand Identity**: Logo only (28px height, proper aspect ratio)
- **Typography**: `font-poppins` for headers, `font-lato` for items
- **Colors**: Neutral with Electric Blue hover
- **No Brand Text**: Never display "Infin8Content" text

#### Top Navigation
- **Brand Elements**: None (utilities only)
- **Typography**: `font-lato` throughout
- **CTAs**: Ghost variant with Electric Blue hover
- **Notifications**: Neutral badges (`bg-neutral-200 text-neutral-700`)

### Page Components

#### Page Headers
```tsx
<h1 className="font-poppins text-neutral-900 text-h2-desktop">
  Page Title
</h1>
<p className="font-lato text-neutral-600 text-body">
  Page description
</p>
```

#### Primary CTAs
```tsx
<Button className="bg-[--brand-electric-blue] text-white hover:bg-[--brand-electric-blue]/90 font-lato">
  CTA Text
</Button>
```

#### Back Navigation
```tsx
<Link href="/dashboard/articles" className="font-lato text-neutral-600 hover:text-[--brand-electric-blue]">
  Back to Articles
</Link>
```

### Card Components

#### Base Card Styling
```tsx
<Card className="bg-white border-neutral-200">
  <CardHeader>
    <CardTitle className="font-poppins text-neutral-900">
      Card Title
    </CardTitle>
  </CardHeader>
</Card>
```

#### Field Labels & Values
```tsx
<p className="font-lato text-neutral-900 text-small font-medium">
  Label
</p>
<p className="font-lato text-neutral-600 text-small">
  Value
</p>
```

### Mobile Components

#### MobileCard
- **Base**: `bg-white border-neutral-200 shadow-sm`
- **Typography**: Poppins titles, Lato body
- **Badges**: `bg-neutral-200 text-neutral-700 font-lato`
- **Selection**: `ring-1 ring-[--brand-electric-blue]/40`

## Visual Hierarchy Rules

### Dashboard vs Homepage
- **Dashboard**: Restrained, functional, production-first
- **Homepage**: Expressive, brand-forward
- **Same Brand**: Same tokens, different expression modes

### CTA Hierarchy
1. **Page Primary CTA**: Electric Blue, prominent but not aggressive
2. **Secondary Actions**: Ghost variant, neutral colors
3. **Navigation Links**: Neutral text with Electric Blue hover
4. **System Messages**: Calm, informative colors

### Competition Prevention
- ❌ No competing CTAs in same viewport
- ❌ No loud elements in top navigation
- ❌ No aggressive colors in non-action contexts
- ✅ Single decision point per page section

## Implementation Checklist

### Before Committing
- [ ] All colors use brand tokens or neutral scale
- [ ] All typography explicitly set (Poppins/Lato)
- [ ] No `blue-*` or `gray-*` Tailwind utilities
- [ ] Electric Blue used only for accents/hovers
- [ ] Component maintains calm, functional aesthetic

### Code Review Points
- [ ] Brand compliance verified
- [ ] Visual hierarchy appropriate
- [ ] Mobile/desktop consistency
- [ ] No architectural changes
- [ ] Production safety maintained

## Common Violations

### Color Issues
- **Hard-coded blues**: Replace with `--brand-electric-blue`
- **Gray utilities**: Replace with neutral scale
- **Destructive overuse**: Reserve for actual errors

### Typography Issues
- **Missing fonts**: Add explicit `font-poppins`/`font-lato`
- **Implicit inheritance**: Specify all typography properties
- **Inconsistent sizing**: Use semantic tokens

### Hierarchy Issues
- **Competing CTAs**: Ensure single primary action
- **Loud navigation**: Demote top nav elements
- **Aggressive badges**: Use neutral styling

## Testing Guidelines

### Visual Testing
- Verify brand consistency across breakpoints
- Check hover states and interactions
- Ensure mobile/desktop parity
- Validate hierarchy and flow

### Automated Testing
- Lint rules for color usage
- Typography compliance checks
- Component prop validation
- Accessibility verification

## Maintenance

### Regular Audits
- Quarterly brand compliance reviews
- Component library updates
- Design system token validation
- User feedback integration

### Documentation Updates
- Keep this guide current with brand changes
- Update component examples
- Maintain violation examples
- Document evolution decisions

## Conclusion

Following these guidelines ensures the dashboard maintains brand consistency while serving its production-focused purpose. The restrained aesthetic supports efficient workflow execution without visual distraction, while the brand system ensures professional, cohesive user experience across all touchpoints.
