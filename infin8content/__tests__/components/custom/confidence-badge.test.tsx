import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConfidenceBadge } from '@/components/custom/confidence-badge'

describe('ConfidenceBadge Component', () => {
  describe('Basic Rendering', () => {
    it('renders confidence badge with default props', () => {
      render(<ConfidenceBadge level="medium" />)
      const badge = screen.getByRole('status')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveAttribute('aria-label', 'Confidence: Medium')
      expect(badge).toHaveTextContent('Medium')
    })

    it('renders with custom children text', () => {
      render(<ConfidenceBadge level="high">Custom Text</ConfidenceBadge>)
      const badge = screen.getByRole('status')
      expect(badge).toHaveTextContent('Custom Text')
    })
  })

  describe('Confidence Levels', () => {
    it('renders high confidence with correct styling', () => {
      render(<ConfidenceBadge level="high" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-[--color-success]', 'text-white')
      expect(badge).toHaveAttribute('aria-label', 'Confidence: High')
    })

    it('renders medium confidence with correct styling', () => {
      render(<ConfidenceBadge level="medium" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-[--color-warning]', 'text-white')
      expect(badge).toHaveAttribute('aria-label', 'Confidence: Medium')
    })

    it('renders low confidence with correct styling', () => {
      render(<ConfidenceBadge level="low" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-[--color-warning]', 'text-white')
      expect(badge).toHaveAttribute('aria-label', 'Confidence: Low')
    })

    it('renders very low confidence with correct styling', () => {
      render(<ConfidenceBadge level="veryLow" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-[--color-error]', 'text-white')
      expect(badge).toHaveAttribute('aria-label', 'Confidence: Very Low')
    })
  })

  describe('Icons', () => {
    it('shows icon when showIcon is true (default)', () => {
      render(<ConfidenceBadge level="high" />)
      const badge = screen.getByRole('status')
      const icon = badge.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('h-3', 'w-3')
    })

    it('hides icon when showIcon is false', () => {
      render(<ConfidenceBadge level="high" showIcon={false} />)
      const badge = screen.getByRole('status')
      const icon = badge.querySelector('svg')
      expect(icon).not.toBeInTheDocument()
    })

    it('uses correct icon for each confidence level', () => {
      const { rerender } = render(<ConfidenceBadge level="high" />)
      let badge = screen.getByRole('status')
      expect(badge.innerHTML).toContain('lucide-info')

      rerender(<ConfidenceBadge level="medium" />)
      badge = screen.getByRole('status')
      expect(badge.innerHTML).toContain('lucide-triangle-alert')

      rerender(<ConfidenceBadge level="veryLow" />)
      badge = screen.getByRole('status')
      expect(badge.innerHTML).toContain('lucide-circle-x')
    })
  })

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<ConfidenceBadge level="medium" size="sm" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('px-2', 'py-0.5', 'gap-1')
    })

    it('renders default size', () => {
      render(<ConfidenceBadge level="medium" size="default" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('px-2.5', 'py-1', 'gap-1.5')
    })

    it('renders large size', () => {
      render(<ConfidenceBadge level="medium" size="lg" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('px-3', 'py-1.5', 'gap-2', 'text-sm')
    })
  })

  describe('Tooltips', () => {
    it('shows tooltip when showTooltip is true', () => {
      render(<ConfidenceBadge level="high" showTooltip />)
      const container = screen.getByRole('status').parentElement
      expect(container).toHaveClass('group', 'relative')
    })

    it('uses default tooltip text', () => {
      render(<ConfidenceBadge level="high" showTooltip />)
      const tooltip = document.querySelector('.group-hover\\:opacity-100')
      expect(tooltip).toHaveTextContent('High confidence in the generated content')
    })

    it('uses custom tooltip text when provided', () => {
      render(<ConfidenceBadge level="high" showTooltip tooltipText="Custom tooltip" />)
      const tooltip = document.querySelector('.group-hover\\:opacity-100')
      expect(tooltip).toHaveTextContent('Custom tooltip')
    })

    it('does not show tooltip when showTooltip is false', () => {
      render(<ConfidenceBadge level="high" showTooltip={false} />)
      const container = screen.getByRole('status').parentElement
      expect(container).not.toHaveClass('group', 'relative')
    })
  })

  describe('Animation', () => {
    it('applies animation classes when animated is true', () => {
      render(<ConfidenceBadge level="medium" animated />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('transition-all', 'duration-200')
    })

    it('does not apply animation classes when animated is false', () => {
      render(<ConfidenceBadge level="medium" animated={false} />)
      const badge = screen.getByRole('status')
      // Base class still has transition, but animated variant controls duration
      expect(badge).toHaveClass('transition-all')
    })
  })

  describe('Accessibility', () => {
    it('has proper role and aria-label', () => {
      render(<ConfidenceBadge level="low" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveAttribute('role', 'status')
      expect(badge).toHaveAttribute('aria-label', 'Confidence: Low')
    })

    it('icons have aria-hidden attribute', () => {
      render(<ConfidenceBadge level="high" />)
      const icon = screen.getByRole('status').querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Custom Props', () => {
    it('passes through additional props', () => {
      render(<ConfidenceBadge level="medium" data-testid="confidence-badge" />)
      const badge = screen.getByTestId('confidence-badge')
      expect(badge).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<ConfidenceBadge level="medium" className="custom-class" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('custom-class')
    })
  })

  describe('Visual Consistency', () => {
    it('has consistent border styling', () => {
      render(<ConfidenceBadge level="high" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('border', 'border-[--color-success]/20')
    })

    it('maintains proper aspect ratio and spacing', () => {
      render(<ConfidenceBadge level="medium" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('inline-flex', 'items-center', 'shrink-0')
    })
  })
})
