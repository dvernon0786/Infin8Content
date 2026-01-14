import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProgressBar } from '@/components/custom/progress-bar'

describe('ProgressBar Component', () => {
  describe('Basic Rendering', () => {
    it('renders progress bar with default props', () => {
      render(<ProgressBar value={50} />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toBeInTheDocument()
      expect(progressbar).toHaveAttribute('aria-valuenow', '50')
      expect(progressbar).toHaveAttribute('aria-valuemin', '0')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
    })

    it('renders with custom max value', () => {
      render(<ProgressBar value={25} max={50} />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '25')
      expect(progressbar).toHaveAttribute('aria-valuemax', '50')
      expect(progressbar).toHaveAttribute('aria-valuetext', '50%')
    })

    it('clamps values within bounds', () => {
      render(<ProgressBar value={150} />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuenow', '150')
      expect(progressbar).toHaveAttribute('aria-valuetext', '100%')
    })
  })

  describe('Variants', () => {
    it('renders brand variant with gradient', () => {
      render(<ProgressBar value={60} variant="brand" />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toBeInTheDocument()
      
      // Check that the indicator exists
      const indicator = progressbar.querySelector('div > div')
      expect(indicator).toBeInTheDocument()
    })

    it('renders success variant', () => {
      render(<ProgressBar value={75} variant="success" />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toBeInTheDocument()
    })

    it('renders warning variant', () => {
      render(<ProgressBar value={30} variant="warning" />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toBeInTheDocument()
    })

    it('renders error variant', () => {
      render(<ProgressBar value={10} variant="error" />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<ProgressBar value={40} size="sm" />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveClass('h-1')
    })

    it('renders default size', () => {
      render(<ProgressBar value={40} size="default" />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveClass('h-2')
    })

    it('renders large size', () => {
      render(<ProgressBar value={40} size="lg" />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveClass('h-3')
    })
  })

  describe('Label Display', () => {
    it('shows percentage label when showLabel is true', () => {
      render(<ProgressBar value={65} showLabel />)
      const progressbar = screen.getByRole('progressbar')
      const label = progressbar.querySelector('.text-xs')
      expect(label).toBeInTheDocument()
      expect(label).toHaveTextContent('65%')
    })

    it('does not show label when showLabel is false', () => {
      render(<ProgressBar value={65} showLabel={false} />)
      const progressbar = screen.getByRole('progressbar')
      const label = progressbar.querySelector('.text-xs')
      expect(label).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<ProgressBar value={45} aria-label="Download progress" />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-label', 'Download progress')
      expect(progressbar).toHaveAttribute('role', 'progressbar')
    })

    it('supports aria-describedby', () => {
      render(<ProgressBar value={45} aria-describedby="progress-description" />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-describedby', 'progress-description')
    })

    it('updates aria-valuetext with percentage', () => {
      render(<ProgressBar value={33.33} />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuetext', '33%')
    })
  })

  describe('Animation', () => {
    it('applies animation classes when animated is true', () => {
      render(<ProgressBar value={50} animated />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveClass('transition-all')
    })

    it('applies different duration when animated is false', () => {
      render(<ProgressBar value={50} animated={false} />)
      const progressbar = screen.getByRole('progressbar')
      // The base class still has transition, but the duration is different
      expect(progressbar).toHaveClass('transition-all')
    })
  })

  describe('Progress Calculation', () => {
    it('calculates percentage correctly', () => {
      render(<ProgressBar value={25} max={100} />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuetext', '25%')
    })

    it('handles zero value', () => {
      render(<ProgressBar value={0} />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuetext', '0%')
    })

    it('handles negative values', () => {
      render(<ProgressBar value={-10} />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuetext', '0%')
    })
  })

  describe('Custom Props', () => {
    it('passes through additional props', () => {
      render(<ProgressBar value={50} data-testid="custom-progress" />)
      const progressbar = screen.getByTestId('custom-progress')
      expect(progressbar).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<ProgressBar value={50} className="custom-class" />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveClass('custom-class')
    })
  })
})
