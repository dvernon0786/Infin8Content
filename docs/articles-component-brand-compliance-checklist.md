# Articles Component Brand Compliance Checklist

## Overview

This checklist ensures all Articles domain components maintain brand compliance and production standards. Use this guide for development, code review, and quality assurance.

## Typography Requirements

### Headings (Poppins)
- [ ] **Page Titles**: `font-poppins text-neutral-900 text-h2-desktop`
- [ ] **Section Headers**: `font-poppins text-neutral-900 text-h3-desktop`
- [ ] **Card Titles**: `font-poppins text-neutral-900 text-small font-semibold`
- [ ] **Error Titles**: `font-poppins text-neutral-900 text-h3-desktop`

### Body/UI Text (Lato)
- [ ] **Descriptions**: `font-lato text-neutral-600 text-body`
- [ ] **Labels**: `font-lato text-neutral-900 text-small font-medium`
- [ ] **Values**: `font-lato text-neutral-600 text-small`
- [ ] **Metadata**: `font-lato text-small text-neutral-500`
- [ ] **Helper Text**: `font-lato text-neutral-600 text-body`
- [ ] **Status Text**: `font-lato text-small`

### Explicit Font Usage
- [ ] No implicit font inheritance
- [ ] Always specify `font-poppins` or `font-lato`
- [ ] Use semantic sizing tokens (`text-h2-desktop`, `text-h3-desktop`, `text-body`, `text-small`)

## Color Requirements

### Allowed Colors
- [ ] **Primary Accent**: `--brand-electric-blue` (CTAs and progress only)
- [ ] **Neutral Scale**: `neutral-900`, `neutral-600`, `neutral-500`, `neutral-200`, `neutral-100`
- [ ] **Backgrounds**: `bg-white`
- [ ] **Borders**: `border-neutral-200`

### Forbidden Colors
- [ ] No `blue-*` Tailwind utilities (except brand tokens)
- [ ] No `gray-*` Tailwind utilities (use neutral scale)
- [ ] No `destructive` colors for non-error contexts
- [ ] No red/green/yellow for status indicators
- [ ] No hard-coded hex values

### Color Usage Rules
- [ ] Electric Blue only for CTAs and progress bars
- [ ] Neutral colors for all other elements
- [ ] Status meaning from labels, not colors
- [ ] Error borders can be destructive, text should be neutral

## Component Specific Guidelines

### Articles List Page
- [ ] Header: Poppins title, Lato description
- [ ] CTA: Electric Blue background, Lato text
- [ ] Mobile: Visual parity with desktop
- [ ] No competing CTAs in same viewport

### Article Detail Page
- [ ] Title: Poppins with semantic sizing
- [ ] Back navigation: Neutral with Electric Blue hover
- [ ] Field labels: Lato neutral-900
- [ ] Field values: Lato neutral-600
- [ ] Error states: Calm, neutral text

### Articles Client Component
- [ ] Error state: Poppins title, Lato body
- [ ] Loading state: Lato neutral-600 text-small
- [ ] Empty states: Brand-compliant typography
- [ ] Generate button: Ghost variant, neutral colors
- [ ] Icons: neutral color scheme

### Virtualized Article List
- [ ] Article titles: Poppins neutral-900
- [ ] Keywords: Lato neutral-500
- [ ] Metadata: Lato neutral-500
- [ ] View button: Neutral, informational
- [ ] Card hover: Subtle background change only
- [ ] Selection: Electric Blue ring
- [ ] Progress: Electric Blue on neutral background

### Article Status Monitor
- [ ] Badge: Neutral background and border
- [ ] Badge text: Lato neutral-700
- [ ] Status icons: Neutral colors only
- [ ] Live updates: Neutral typography
- [ ] No semantic badge variants

## Visual Hierarchy Rules

### Primary Actions
- [ ] Single primary CTA per page
- [ ] Electric Blue background for primary CTAs
- [ ] Lato font for button text
- [ ] Clear visual distinction from secondary actions

### Secondary Actions
- [ ] Ghost variant with neutral colors
- [ ] Electric Blue hover only
- [ ] No competing emphasis
- [ ] Informational, not promotional

### Status Information
- [ ] Neutral color palette
- [ ] Meaning from labels, not colors
- [ ] Calm, informational display
- [ ] Subordinate to page content

## Error Handling Standards

### Error States
- [ ] Titles: Poppins neutral-900
- [ ] Body text: Lato neutral-600
- [ ] Icons: neutral colors
- [ ] Borders: Can be destructive for visual indication
- [ ] No aggressive text colors

### Empty States
- [ ] Titles: Poppins neutral-900
- [ ] Descriptions: Lato neutral-600
- [ ] Helper actions: Ghost variant
- [ ] Operational, not promotional tone

## Mobile Requirements

### Responsive Design
- [ ] Touch targets: Minimum 44px
- [ ] Visual parity with desktop
- [ ] Consistent brand experience
- [ ] Performance optimization maintained

### Typography Scaling
- [ ] Appropriate sizing for mobile screens
- [ ] Readability maintained
- [ ] Hierarchy preserved
- [ ] Brand consistency across breakpoints

## Performance Requirements

### Rendering
- [ ] No performance degradation
- [ ] Virtualization preserved
- [ ] Optimized re-rendering
- [ ] Efficient state management

### Real-time Features
- [ ] Connection stability maintained
- [ ] Graceful fallback behavior
- [ ] Clear status indicators
- [ ] Error recovery options

## Accessibility Requirements

### Focus States
- [ ] Electric Blue focus indicators
- [ ] Clear keyboard navigation
- [ ] Proper ARIA labels
- [ ] Focus management

### Screen Readers
- [ ] Semantic HTML structure
- [ ] Descriptive labels
- [ ] Status announcements
- [ ] Contextual information

## Code Quality Standards

### Component Structure
- [ ] No architectural changes
- [ ] Component contracts preserved
- [ ] Props interfaces maintained
- [ ] Backward compatibility

### Styling Patterns
- [ ] Consistent class naming
- [ ] No inline styles
- [ ] Proper Tailwind usage
- [ ] JIT safety maintained

## Testing Requirements

### Visual Testing
- [ ] Brand consistency verification
- [ ] Responsive behavior testing
- [ ] Cross-browser compatibility
- [ ] Mobile experience validation

### Functional Testing
- [ ] Component behavior preserved
- [ ] Error handling verification
- [ ] Real-time functionality testing
- [ ] Performance benchmarking

## Review Checklist

### Before Merge
- [ ] All typography explicitly set
- [ ] No forbidden color classes
- [ ] Visual hierarchy appropriate
- [ ] Mobile/desktop consistency
- [ ] Performance unaffected
- [ ] Accessibility verified

### Code Review Points
- [ ] Brand compliance confirmed
- [ ] Production safety validated
- [ ] Component contracts maintained
- [ ] Error handling appropriate
- [ ] Documentation updated

## Common Violations

### Color Issues
- [ ] Hard-coded blues → Replace with `--brand-electric-blue`
- [ ] Gray utilities → Replace with neutral scale
- [ ] Destructive overuse → Reserve for actual errors
- [ ] Status colors → Use neutral palette

### Typography Issues
- [ ] Missing fonts → Add explicit `font-poppins`/`font-lato`
- [ ] Implicit inheritance → Specify all typography properties
- [ ] Inconsistent sizing → Use semantic tokens

### Hierarchy Issues
- [ ] Competing CTAs → Ensure single primary action
- [ ] Loud navigation → Demote top nav elements
- [ ] Aggressive badges → Use neutral styling

## Maintenance Guidelines

### Regular Audits
- [ ] Quarterly brand compliance reviews
- [ ] Component library updates
- [ ] Design system token validation
- [ ] User feedback integration

### Documentation Updates
- [ ] Keep this checklist current
- [ ] Update component examples
- [ ] Maintain violation examples
- [ ] Document evolution decisions

## Conclusion

Following this checklist ensures the Articles domain maintains brand consistency while serving its production-focused purpose. The restrained aesthetic supports efficient content workflow execution without visual distraction, while the brand system ensures professional, cohesive user experience.

Use this checklist for:
- Development guidance
- Code review validation
- Quality assurance testing
- Brand compliance auditing
