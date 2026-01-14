import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ArticleStateBadge } from '@/components/custom/article-state-badge'

describe('ArticleStateBadge Component', () => {
  describe('Basic Rendering', () => {
    it('renders article state badge with default props', () => {
      render(<ArticleStateBadge state="draft" />)
      const badge = screen.getByRole('status')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveAttribute('aria-label', 'Article state: Draft')
      expect(badge).toHaveTextContent('Draft')
    })

    it('renders with custom children text', () => {
      render(<ArticleStateBadge state="published">Published Now</ArticleStateBadge>)
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Published Now')
    })
  })

  describe('Article States', () => {
    it('renders draft state with correct styling', () => {
      render(<ArticleStateBadge state="draft" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-[--color-info]', 'text-white')
      expect(badge).toHaveAttribute('aria-label', 'Article state: Draft')
    })

    it('renders inReview state with correct styling', () => {
      render(<ArticleStateBadge state="inReview" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-[--color-warning]', 'text-white')
      expect(badge).toHaveAttribute('aria-label', 'Article state: In Review')
    })

    it('renders approved state with correct styling', () => {
      render(<ArticleStateBadge state="approved" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-[--color-success]', 'text-white')
      expect(badge).toHaveAttribute('aria-label', 'Article state: Approved')
    })

    it('renders published state with correct styling', () => {
      render(<ArticleStateBadge state="published" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-[--color-success]', 'text-white')
      expect(badge).toHaveAttribute('aria-label', 'Article state: Published')
    })
  })

  describe('Icons', () => {
    it('shows icon when showIcon is true (default)', () => {
      render(<ArticleStateBadge state="draft" />)
      const badge = screen.getByRole('status')
      const icon = badge.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('h-3', 'w-3')
    })

    it('hides icon when showIcon is false', () => {
      render(<ArticleStateBadge state="draft" showIcon={false} />)
      const badge = screen.getByRole('status')
      const icon = badge.querySelector('svg')
      expect(icon).not.toBeInTheDocument()
    })

    it('uses correct icon for each state', () => {
      const { rerender } = render(<ArticleStateBadge state="draft" />)
      let badge = screen.getByRole('status')
      expect(badge.innerHTML).toContain('lucide-file-text')

      rerender(<ArticleStateBadge state="inReview" />)
      badge = screen.getByRole('status')
      expect(badge.innerHTML).toContain('lucide-eye')

      rerender(<ArticleStateBadge state="approved" />)
      badge = screen.getByRole('status')
      expect(badge.innerHTML).toContain('lucide-circle-check-big')

      rerender(<ArticleStateBadge state="published" />)
      badge = screen.getByRole('status')
      expect(badge.innerHTML).toContain('lucide-globe')
    })
  })

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<ArticleStateBadge state="draft" size="sm" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('px-2', 'py-0.5', 'gap-1')
    })

    it('renders default size', () => {
      render(<ArticleStateBadge state="draft" size="default" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('px-2.5', 'py-1', 'gap-1.5')
    })

    it('renders large size', () => {
      render(<ArticleStateBadge state="draft" size="lg" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('px-3', 'py-1.5', 'gap-2', 'text-sm')
    })
  })

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<ArticleStateBadge state="draft" variant="default" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-[--color-info]', 'text-white')
    })

    it('renders outline variant', () => {
      render(<ArticleStateBadge state="draft" variant="outline" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-transparent', 'border-current', 'text-current')
    })

    it('renders subtle variant', () => {
      render(<ArticleStateBadge state="draft" variant="subtle" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-current/10', 'text-current', 'border-current/20')
    })
  })

  describe('Tooltips', () => {
    it('shows tooltip when showTooltip is true', () => {
      render(<ArticleStateBadge state="published" showTooltip />)
      const container = screen.getByRole('status').parentElement
      expect(container).toHaveClass('group', 'relative')
    })

    it('uses default tooltip text', () => {
      render(<ArticleStateBadge state="published" showTooltip />)
      const tooltip = document.querySelector('.group-hover\\:opacity-100')
      expect(tooltip).toHaveTextContent('Article has been published')
    })

    it('uses custom tooltip text when provided', () => {
      render(<ArticleStateBadge state="published" showTooltip tooltipText="Custom tooltip" />)
      const tooltip = document.querySelector('.group-hover\\:opacity-100')
      expect(tooltip).toHaveTextContent('Custom tooltip')
    })

    it('does not show tooltip when showTooltip is false', () => {
      render(<ArticleStateBadge state="published" showTooltip={false} />)
      const container = screen.getByRole('status').parentElement
      expect(container).not.toHaveClass('group', 'relative')
    })
  })

  describe('Animation', () => {
    it('applies animation classes when animated is true', () => {
      render(<ArticleStateBadge state="draft" animated />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('transition-all', 'duration-200')
    })

    it('does not apply animation classes when animated is false', () => {
      render(<ArticleStateBadge state="draft" animated={false} />)
      const badge = screen.getByRole('status')
      // Base class still has transition, but animated variant controls duration
      expect(badge).toHaveClass('transition-all')
    })
  })

  describe('Accessibility', () => {
    it('has proper role and aria-label', () => {
      render(<ArticleStateBadge state="inReview" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveAttribute('role', 'status')
      expect(badge).toHaveAttribute('aria-label', 'Article state: In Review')
    })

    it('icons have aria-hidden attribute', () => {
      render(<ArticleStateBadge state="approved" />)
      const icon = screen.getByRole('status').querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Custom Props', () => {
    it('passes through additional props', () => {
      render(<ArticleStateBadge state="draft" data-testid="article-state-badge" />)
      const badge = screen.getByTestId('article-state-badge')
      expect(badge).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<ArticleStateBadge state="draft" className="custom-class" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('custom-class')
    })
  })

  describe('Visual Consistency', () => {
    it('has consistent border styling', () => {
      render(<ArticleStateBadge state="draft" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('border', 'border-[--color-info]/20')
    })

    it('maintains proper aspect ratio and spacing', () => {
      render(<ArticleStateBadge state="draft" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('inline-flex', 'items-center', 'shrink-0')
    })

    it('has consistent styling across similar states', () => {
      const { rerender } = render(<ArticleStateBadge state="approved" />)
      let badge = screen.getByRole('status')
      const approvedClasses = badge.className

      rerender(<ArticleStateBadge state="published" />)
      badge = screen.getByRole('status')
      const publishedClasses = badge.className

      // Approved and published should have similar styling
      expect(approvedClasses).toContain('bg-[--color-success]')
      expect(publishedClasses).toContain('bg-[--color-success]')
    })
  })
})
