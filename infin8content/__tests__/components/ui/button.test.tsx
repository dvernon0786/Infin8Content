import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    mockOnClick.mockClear()
  })

  describe('Basic Rendering', () => {
    it('renders button with text content', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Click me')
    })

    it('applies default variant styling', () => {
      render(<Button>Default Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')
    })

    it('accepts custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Variants', () => {
    it('renders primary variant with correct styling', () => {
      render(<Button variant="primary">Primary Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-[--color-primary-blue]')
      expect(button).toHaveAttribute('data-variant', 'primary')
    })

    it('renders secondary variant with correct styling', () => {
      render(<Button variant="secondary">Secondary Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-[--color-primary-purple]')
      expect(button).toHaveAttribute('data-variant', 'secondary')
    })

    it('renders ghost variant with correct styling', () => {
      render(<Button variant="ghost">Ghost Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('hover:bg-accent')
      expect(button).toHaveAttribute('data-variant', 'ghost')
    })

    it('renders destructive variant with correct styling', () => {
      render(<Button variant="destructive">Destructive Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive')
      expect(button).toHaveAttribute('data-variant', 'destructive')
    })
  })

  describe('States', () => {
    it('handles disabled state correctly', () => {
      render(<Button disabled>Disabled Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('shows loading spinner when loading', () => {
      render(<Button loading>Loading Button</Button>)
      const button = screen.getByRole('button')
      const spinner = button.querySelector('svg.animate-spin')
      
      expect(button).toBeDisabled()
      expect(spinner).toBeInTheDocument()
      expect(button).toHaveAttribute('data-state', 'loading')
    })

    it('overrides manual state when loading is true', () => {
      render(<Button loading state="hover">Loading Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-state', 'loading')
      expect(button).toBeDisabled()
    })
  })

  describe('Sizes', () => {
    it('renders default size', () => {
      render(<Button>Default Size</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-4', 'py-2')
      expect(button).toHaveAttribute('data-size', 'default')
    })

    it('renders small size', () => {
      render(<Button size="sm">Small Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-8', 'px-3')
      expect(button).toHaveAttribute('data-size', 'sm')
    })

    it('renders large size', () => {
      render(<Button size="lg">Large Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'px-6')
      expect(button).toHaveAttribute('data-size', 'lg')
    })

    it('renders icon size', () => {
      render(<Button size="icon"><span>Icon</span></Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('size-9')
      expect(button).toHaveAttribute('data-size', 'icon')
    })
  })

  describe('Interactions', () => {
    it('calls onClick handler when clicked', () => {
      render(<Button onClick={mockOnClick}>Click me</Button>)
      const button = screen.getByRole('button')
      
      fireEvent.click(button)
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', () => {
      render(<Button onClick={mockOnClick} disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      
      fireEvent.click(button)
      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('does not call onClick when loading', () => {
      render(<Button onClick={mockOnClick} loading>Loading</Button>)
      const button = screen.getByRole('button')
      
      fireEvent.click(button)
      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper button role', () => {
      render(<Button>Accessible Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('supports ARIA attributes', () => {
      render(
        <Button aria-label="Custom label" aria-describedby="description">
          Button
        </Button>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Custom label')
      expect(button).toHaveAttribute('aria-describedby', 'description')
    })

    it('shows focus-visible styles on focus', () => {
      render(<Button>Focus Button</Button>)
      const button = screen.getByRole('button')
      
      button.focus()
      expect(button).toHaveClass('focus-visible:border-ring', 'focus-visible:ring-ring/50')
    })
  })

  describe('Design Token Integration', () => {
    it('uses CSS custom properties for brand colors', () => {
      const { container } = render(<Button variant="primary">Primary</Button>)
      const button = screen.getByRole('button')
      
      // Check that CSS custom properties are applied
      expect(button).toHaveClass('bg-[--color-primary-blue]')
      
      // Verify the button element exists and has the correct class
      expect(button).toBeInTheDocument()
    })
  })

  describe('Data Attributes', () => {
    it('sets data attributes for testing and styling', () => {
      render(<Button variant="primary" size="lg">Test Button</Button>)
      const button = screen.getByRole('button')
      
      expect(button).toHaveAttribute('data-slot', 'button')
      expect(button).toHaveAttribute('data-variant', 'primary')
      expect(button).toHaveAttribute('data-size', 'lg')
    })
  })
})
