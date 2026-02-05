import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepBusiness } from '@/components/onboarding/StepBusiness'

describe('StepBusiness', () => {
  it('should render all required inputs', () => {
    render(<StepBusiness />)
    
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/business description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/target audiences/i)).toBeInTheDocument()
  })

  it('should show informational context panel', () => {
    render(<StepBusiness />)
    
    expect(screen.getByText(/help us understand your business/i)).toBeInTheDocument()
    expect(screen.getByText(/website url helps us analyze your online presence/i)).toBeInTheDocument()
  })

  it('should validate required fields in real time', async () => {
    const user = userEvent.setup()
    render(<StepBusiness />)
    
    const websiteInput = screen.getByLabelText(/website url/i)
    const submitButton = screen.getByRole('button', { name: /next step/i })
    
    // Button should be disabled initially
    expect(submitButton).toBeDisabled()
    
    // Enter invalid URL
    await user.type(websiteInput, 'invalid-url')
    expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
    
    // Enter valid URL
    await user.clear(websiteInput)
    await user.type(websiteInput, 'https://example.com')
    expect(screen.queryByText(/please enter a valid url/i)).not.toBeInTheDocument()
  })

  it('should handle target audiences input', async () => {
    const user = userEvent.setup()
    render(<StepBusiness />)
    
    const audiencesInput = screen.getByLabelText(/target audiences/i)
    
    await user.type(audiencesInput, 'Small businesses, Entrepreneurs')
    expect(audiencesInput).toHaveValue('Small businesses, Entrepreneurs')
  })

  it('should have primary and secondary CTAs', () => {
    render(<StepBusiness />)
    
    expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip & add later/i })).toBeInTheDocument()
  })

  it('should use brand colors for buttons', () => {
    render(<StepBusiness />)
    
    const primaryButton = screen.getByRole('button', { name: /next step/i })
    const secondaryButton = screen.getByRole('button', { name: /skip & add later/i })
    
    expect(primaryButton).toHaveClass('bg-primary-blue')
    expect(secondaryButton).toHaveClass('border')
  })

  it('should be responsive on mobile', () => {
    render(<StepBusiness />)
    
    const card = screen.getByRole('main')
    expect(card).toHaveClass('w-full')
  })
})
