/**
 * Component Style Utilities
 * Shared styling utilities for design system components
 */

export const designTokens = {
  colors: {
    primaryBlue: '#217CEB',
    primaryPurple: '#4A42CC',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  gradient: {
    brand: 'linear-gradient(90deg, #217CEB 0%, #4A42CC 100%)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  typography: {
    body: '16px',
    small: '14px',
    caption: '12px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
}

export const confidenceLevels = {
  high: { color: designTokens.colors.success, label: 'High' },
  medium: { color: designTokens.colors.warning, label: 'Medium' },
  low: { color: designTokens.colors.warning, label: 'Low' },
  veryLow: { color: designTokens.colors.error, label: 'Very Low' },
}

export const articleStates = {
  draft: { color: designTokens.colors.info, label: 'Draft' },
  inReview: { color: designTokens.colors.warning, label: 'In Review' },
  approved: { color: designTokens.colors.success, label: 'Approved' },
  published: { color: designTokens.colors.success, label: 'Published' },
}

export const buttonVariants = {
  primary: 'bg-[--color-primary-blue] text-white hover:bg-[--color-primary-blue]/90',
  secondary: 'bg-[--color-primary-purple] text-white hover:bg-[--color-primary-purple]/90',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-[--color-error] text-white hover:bg-[--color-error]/90',
}

export const badgeVariants = {
  confidence: {
    high: 'bg-[--color-success] text-white',
    medium: 'bg-[--color-warning] text-white',
    low: 'bg-[--color-warning] text-white',
    veryLow: 'bg-[--color-error] text-white',
  },
  articleState: {
    draft: 'bg-[--color-info] text-white',
    inReview: 'bg-[--color-warning] text-white',
    approved: 'bg-[--color-success] text-white',
    published: 'bg-[--color-success] text-white',
  },
}

export const progressStyles = {
  brandGradient: 'bg-[--gradient-brand]',
  transition: 'transition-all duration-300 ease-in-out',
}

export const animationStyles = {
  fadeIn: 'animate-in fade-in duration-200',
  slideUp: 'animate-in slide-in-from-bottom duration-300',
  pulse: 'animate-pulse',
}

export const accessibilityProps = {
  'aria-live': 'polite',
  'role': 'status',
}

export const componentTestIds = {
  button: 'component-button',
  progressBar: 'progress-bar',
  sectionProgress: 'section-progress',
  confidenceBadge: 'confidence-badge',
  articleStateBadge: 'article-state-badge',
}
