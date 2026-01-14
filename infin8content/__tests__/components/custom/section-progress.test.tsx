import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SectionProgress } from '@/components/custom/section-progress'

describe('SectionProgress Component', () => {
  describe('Basic Rendering', () => {
    it('renders section progress with default props', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" />)
      const element = screen.getByRole('status')
      expect(element).toBeInTheDocument()
      expect(element).toHaveAttribute('aria-label', 'Section 1: Introduction')
    })

    it('displays correct section number and name', () => {
      render(<SectionProgress sectionNumber={3} sectionName="Advanced Topics" />)
      expect(screen.getByText('Section 3: Advanced Topics')).toBeInTheDocument()
    })
  })

  describe('Status States', () => {
    it('renders pending state correctly', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" />)
      const element = screen.getByRole('status')
      expect(element).toHaveClass('bg-background', 'border-border')
      expect(screen.getByText('Section 1: Introduction')).toBeInTheDocument()
    })

    it('renders active state correctly', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" isActive />)
      const element = screen.getByRole('status')
      expect(element).toHaveClass('bg-[--gradient-brand]/5', 'border-[--color-primary-blue]/50')
      expect(screen.getByText('Generating Section 1: Introduction')).toBeInTheDocument()
    })

    it('renders completed state correctly', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" isCompleted />)
      const element = screen.getByRole('status')
      expect(element).toHaveClass('bg-[--color-success]/5', 'border-[--color-success]/50')
      expect(screen.getByText('Section 1: Introduction (Completed)')).toBeInTheDocument()
    })

    it('renders error state correctly', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" hasError />)
      const element = screen.getByRole('status')
      expect(element).toHaveClass('bg-[--color-error]/5', 'border-[--color-error]/50')
      expect(screen.getByText('Error in Section 1: Introduction')).toBeInTheDocument()
    })

    it('prioritizes error over other states', () => {
      render(
        <SectionProgress 
          sectionNumber={1} 
          sectionName="Introduction" 
          isActive 
          isCompleted 
          hasError 
        />
      )
      expect(screen.getByText('Error in Section 1: Introduction')).toBeInTheDocument()
      const element = screen.getByRole('status')
      expect(element).toHaveClass('bg-[--color-error]/5')
    })
  })

  describe('Progress Display', () => {
    it('shows progress when active and showProgress is true', () => {
      render(
        <SectionProgress 
          sectionNumber={1} 
          sectionName="Introduction" 
          isActive 
          progress={45}
          showProgress
        />
      )
      expect(screen.getByText('Generating Section 1: Introduction (45%)')).toBeInTheDocument()
    })

    it('does not show progress when showProgress is false', () => {
      render(
        <SectionProgress 
          sectionNumber={1} 
          sectionName="Introduction" 
          isActive 
          progress={45}
          showProgress={false}
        />
      )
      expect(screen.getByText('Generating Section 1: Introduction')).toBeInTheDocument()
      expect(screen.queryByText('(45%)')).not.toBeInTheDocument()
    })

    it('does not show progress when not active', () => {
      render(
        <SectionProgress 
          sectionNumber={1} 
          sectionName="Introduction" 
          progress={45}
          showProgress
        />
      )
      expect(screen.getByText('Section 1: Introduction')).toBeInTheDocument()
      expect(screen.queryByText('(45%)')).not.toBeInTheDocument()
    })
  })

  describe('Icons', () => {
    it('shows clock icon for pending state', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" />)
      const icon = screen.getByRole('status').querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('shows loading spinner for active state', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" isActive />)
      const icon = screen.getByRole('status').querySelector('.animate-spin')
      expect(icon).toBeInTheDocument()
    })

    it('shows check icon for completed state', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" isCompleted />)
      const element = screen.getByRole('status')
      expect(element.innerHTML).toContain('lucide-check')
    })

    it('shows error indicator for error state', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" hasError />)
      const element = screen.getByRole('status')
      expect(element.innerHTML).toContain('!')
    })
  })

  describe('Sizes', () => {
    it('renders small size', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" size="sm" />)
      const element = screen.getByRole('status')
      expect(element).toHaveClass('p-2', 'gap-2')
    })

    it('renders default size', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" size="default" />)
      const element = screen.getByRole('status')
      expect(element).toHaveClass('p-3', 'gap-3')
    })

    it('renders large size', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" size="lg" />)
      const element = screen.getByRole('status')
      expect(element).toHaveClass('p-4', 'gap-4')
    })
  })

  describe('Accessibility', () => {
    it('has proper role attribute', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" />)
      const element = screen.getByRole('status')
      expect(element).toHaveAttribute('role', 'status')
    })

    it('sets aria-live to polite when active', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" isActive />)
      const element = screen.getByRole('status')
      expect(element).toHaveAttribute('aria-live', 'polite')
    })

    it('sets aria-live to off when not active', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" />)
      const element = screen.getByRole('status')
      expect(element).toHaveAttribute('aria-live', 'off')
    })

    it('has descriptive aria-label', () => {
      render(<SectionProgress sectionNumber={2} sectionName="Methods" isActive progress={30} />)
      const element = screen.getByRole('status')
      expect(element).toHaveAttribute('aria-label', 'Generating Section 2: Methods')
    })
  })

  describe('Animation', () => {
    it('applies animation classes when animated is true', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" animated />)
      const element = screen.getByRole('status')
      expect(element).toHaveClass('transition-all')
    })

    it('applies animation classes when animated is false', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" animated={false} />)
      const element = screen.getByRole('status')
      // Base class still has transition, but animated variant controls duration
      expect(element).toHaveClass('transition-all')
    })
  })

  describe('Custom Props', () => {
    it('passes through additional props', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" data-testid="section-progress" />)
      const element = screen.getByTestId('section-progress')
      expect(element).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<SectionProgress sectionNumber={1} sectionName="Introduction" className="custom-class" />)
      const element = screen.getByRole('status')
      expect(element).toHaveClass('custom-class')
    })
  })

  describe('Progress Bar', () => {
    it('shows progress bar when active with progress', () => {
      render(
        <SectionProgress 
          sectionNumber={1} 
          sectionName="Introduction" 
          isActive 
          progress={60}
          showProgress
        />
      )
      const element = screen.getByRole('status')
      const progressBar = element.querySelector('.bg-secondary')
      expect(progressBar).toBeInTheDocument()
    })

    it('does not show progress bar when not active', () => {
      render(
        <SectionProgress 
          sectionNumber={1} 
          sectionName="Introduction" 
          progress={60}
          showProgress
        />
      )
      const element = screen.getByRole('status')
      const progressBar = element.querySelector('.bg-secondary')
      expect(progressBar).not.toBeInTheDocument()
    })
  })
})
