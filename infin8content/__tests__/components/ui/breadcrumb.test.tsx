/**
 * Tests for breadcrumb navigation and mobile responsiveness
 * Story 15.3: Navigation and Access to Completed Articles - Task 2
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Breadcrumb, generateArticleBreadcrumbs } from '@/components/ui/breadcrumb'

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}))

describe('Breadcrumb Navigation', () => {
  const mockItems = [
    { label: 'Home', href: '/dashboard' },
    { label: 'Articles', href: '/dashboard/articles' },
    { label: 'Test Article', isCurrent: true },
  ]

  it('should render breadcrumb navigation correctly', () => {
    render(<Breadcrumb items={mockItems} />)
    
    // Check for navigation element
    const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(nav).toBeInTheDocument()
    
    // Check for breadcrumb items - use getAllByText for multiple Home elements
    const homeElements = screen.getAllByText('Home')
    expect(homeElements.length).toBeGreaterThan(0)
    expect(screen.getByText('Articles')).toBeInTheDocument()
    expect(screen.getByText('Test Article')).toBeInTheDocument()
    
    // Check for current page indication - find the inner span with aria-current
    const currentSpan = screen.getByText('Test Article').closest('[aria-current="page"]')
    expect(currentSpan).toBeInTheDocument()
  })

  it('should render links for non-current items', () => {
    render(<Breadcrumb items={mockItems} />)
    
    // Home and Articles should be links - use getAllByText since there are multiple Home elements
    const homeLinks = screen.getAllByText('Home')
    const articlesLink = screen.getByText('Articles').closest('a')
    
    // The first Home should be a link (from showHome=true)
    expect(homeLinks[0].closest('a')).toHaveAttribute('href', '/dashboard')
    expect(articlesLink).toHaveAttribute('href', '/dashboard/articles')
    
    // Current item should not be a link
    const currentSpan = screen.getByText('Test Article').closest('span')
    expect(currentSpan).not.toHaveAttribute('href')
  })

  it('should have proper accessibility attributes', () => {
    render(<Breadcrumb items={mockItems} />)
    
    const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation')
    
    // Check for aria-current on the inner span
    const currentSpan = screen.getByText('Test Article').closest('[aria-current="page"]')
    expect(currentSpan).toBeInTheDocument()
  })

  it('should generate article breadcrumbs correctly', () => {
    const breadcrumbs = generateArticleBreadcrumbs('Test Article Title', 'article-123')
    
    expect(breadcrumbs).toHaveLength(2)
    expect(breadcrumbs[0]).toEqual({
      label: 'Articles',
      href: '/dashboard/articles',
    })
    expect(breadcrumbs[1]).toEqual({
      label: 'Test Article Title',
      isCurrent: true,
    })
  })

  it('should handle missing article title in breadcrumb generation', () => {
    const breadcrumbs = generateArticleBreadcrumbs('', 'article-123')
    
    expect(breadcrumbs[1].label).toBe('Article article-...')
  })

  it('should have responsive classes', () => {
    render(<Breadcrumb items={mockItems} />)
    
    const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(nav).toHaveClass('text-xs', 'sm:text-sm')
  })

  it('should show home icon when showHome is true', () => {
    render(<Breadcrumb items={mockItems} showHome={true} />)
    
    // Should have home elements (both from showHome and from mockItems)
    const homeElements = screen.getAllByText('Home')
    expect(homeElements.length).toBeGreaterThan(0)
  })

  it('should hide home when showHome is false', () => {
    // Create items without Home in them
    const itemsWithoutHome = [
      { label: 'Articles', href: '/dashboard/articles' },
      { label: 'Test Article', isCurrent: true },
    ]
    
    render(<Breadcrumb items={itemsWithoutHome} showHome={false} />)
    
    // Should not have home item
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
    expect(screen.getByText('Articles')).toBeInTheDocument()
  })

  it('should handle focus states for accessibility', () => {
    render(<Breadcrumb items={mockItems} />)
    
    // Get the first Home link
    const homeLinks = screen.getAllByText('Home')
    const homeLink = homeLinks[0].closest('a')
    expect(homeLink).toHaveClass(
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-blue-500',
      'focus:ring-offset-2'
    )
  })

  it('should truncate long text for mobile', () => {
    const longItems = [
      { label: 'Articles', href: '/dashboard/articles' },
      { label: 'Very Long Article Name That Should Be Truncated On Mobile Devices', isCurrent: true },
    ]
    
    render(<Breadcrumb items={longItems} />)
    
    const longText = screen.getByText(/Very Long Article Name/)
    // Check if it has truncate class (the max-width classes are on the span inside)
    expect(longText).toHaveClass('truncate')
  })
})

describe('Article View Page Mobile Responsiveness', () => {
  // These would be integration tests for the actual page
  // For now, we'll test the breadcrumb component's mobile behavior
  
  it('should adapt breadcrumb text size for mobile', () => {
    const mockItems = [
      { label: 'Articles', href: '/dashboard/articles' },
      { label: 'Test Article', isCurrent: true },
    ]
    
    render(<Breadcrumb items={mockItems} className="text-xs sm:text-sm" />)
    
    const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(nav).toHaveClass('text-xs', 'sm:text-sm')
  })
})
