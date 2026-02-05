import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepCompetitors } from '@/components/onboarding/StepCompetitors'

describe('StepCompetitors', () => {
  it('should render competitor inputs', () => {
    render(<StepCompetitors />)
    
    expect(screen.getByPlaceholderText(/competitor 1 url/i)).toBeInTheDocument()
    expect(screen.getByText(/understanding your competition/i)).toBeInTheDocument()
  })

  it('should show informational context panel', () => {
    render(<StepCompetitors />)
    
    expect(screen.getByText(/add 3-7 competitor websites/i)).toBeInTheDocument()
    expect(screen.getByText(/focus on direct competitors/i)).toBeInTheDocument()
  })

  it('should validate minimum 3 competitors', async () => {
    const user = userEvent.setup()
    render(<StepCompetitors />)
    
    const submitButton = screen.getByRole('button', { name: /next step/i })
    
    // Button should be disabled initially
    expect(submitButton).toBeDisabled()
    
    // Add only 2 competitors
    const input1 = screen.getByPlaceholderText(/competitor 1 url/i)
    const input2 = screen.getByPlaceholderText(/competitor 2 url/i)
    
    await user.type(input1, 'https://competitor1.com')
    await user.type(input2, 'https://competitor2.com')
    
    // Should still show error
    expect(screen.getByText(/please add at least 3 competitors/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('should allow adding and removing competitors', async () => {
    const user = userEvent.setup()
    render(<StepCompetitors />)
    
    const addButton = screen.getByRole('button', { name: /\+ add competitor/i })
    
    // Add competitor
    await user.click(addButton)
    expect(screen.getByPlaceholderText(/competitor 3 url/i)).toBeInTheDocument()
    
    // Remove competitor
    const removeButton = screen.getByRole('button', { name: /×/i })
    await user.click(removeButton)
    expect(screen.queryByText(/competitor 3 url/i)).not.toBeInTheDocument()
  })

  it('should validate URLs', async () => {
    const user = userEvent.setup()
    render(<StepCompetitors />)
    
    const input = screen.getByPlaceholderText(/competitor 1 url/i)
    
    await user.type(input, 'invalid-url')
    expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument()
  })

  it('should have primary and secondary CTAs', () => {
    render(<StepCompetitors />)
    
    expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip & add later/i })).toBeInTheDocument()
  })

  it('should use brand colors for buttons', () => {
    render(<StepCompetitors />)
    
    const primaryButton = screen.getByRole('button', { name: /next step/i })
    const secondaryButton = screen.getByRole('button', { name: /skip & add later/i })
    
    expect(primaryButton).toHaveClass('bg-primary-blue')
    expect(secondaryButton).toHaveClass('border')
  })

  it('should be responsive on mobile', () => {
    render(<StepCompetitors />)
    
    const card = screen.getByRole('main')
    expect(card).toHaveClass('w-full')
  })
})
