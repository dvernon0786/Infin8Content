import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepBlog } from '@/components/onboarding/StepBlog'

describe('StepBlog', () => {
  it('should render blog configuration inputs', () => {
    render(<StepBlog />)
    
    expect(screen.getByLabelText(/blog root url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sitemap url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/reference posts/i)).toBeInTheDocument()
  })

  it('should show informational context panel', () => {
    render(<StepBlog />)
    
    expect(screen.getByText(/set up your blog foundation/i)).toBeInTheDocument()
    expect(screen.getByText(/blog root url helps us understand/i)).toBeInTheDocument()
  })

  it('should validate required blog root URL', async () => {
    const user = userEvent.setup()
    render(<StepBlog />)
    
    const submitButton = screen.getByRole('button', { name: /next step/i })
    const blogInput = screen.getByLabelText(/blog root url/i)
    
    // Button should be disabled initially
    expect(submitButton).toBeDisabled()
    
    // Enter invalid URL
    await user.type(blogInput, 'invalid-url')
    expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    // Enter valid URL
    await user.clear(blogInput)
    await user.type(blogInput, 'https://example.com/blog')
    expect(screen.queryByText(/please enter a valid url/i)).not.toBeInTheDocument()
  })

  it('should handle reference posts input', async () => {
    const user = userEvent.setup()
    render(<StepBlog />)
    
    const referenceInput = screen.getByLabelText(/reference posts/i)
    
    await user.type(referenceInput, 'https://example.com/post1\nhttps://example.com/post2')
    expect(referenceInput).toHaveValue('https://example.com/post1\nhttps://example.com/post2')
  })

  it('should validate sitemap URL if provided', async () => {
    const user = userEvent.setup()
    render(<StepBlog />)
    
    const blogInput = screen.getByLabelText(/blog root url/i)
    const sitemapInput = screen.getByLabelText(/sitemap url/i)
    
    await user.type(blogInput, 'https://example.com/blog')
    await user.type(sitemapInput, 'invalid-sitemap')
    
    expect(screen.getByText(/please enter a valid sitemap url/i)).toBeInTheDocument()
  })

  it('should have primary and secondary CTAs', () => {
    render(<StepBlog />)
    
    expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip & add later/i })).toBeInTheDocument()
  })

  it('should use brand colors for buttons', () => {
    render(<StepBlog />)
    
    const primaryButton = screen.getByRole('button', { name: /next step/i })
    const secondaryButton = screen.getByRole('button', { name: /skip & add later/i })
    
    expect(primaryButton).toHaveClass('bg-primary-blue')
    expect(secondaryButton).toHaveClass('border')
  })

  it('should be responsive on mobile', () => {
    render(<StepBlog />)
    
    const card = screen.getByRole('main')
    expect(card).toHaveClass('w-full')
  })
})
