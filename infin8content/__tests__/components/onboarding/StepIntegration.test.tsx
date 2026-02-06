import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepIntegration } from '@/components/onboarding/StepIntegration'

describe('StepIntegration', () => {
  it('should render integration platform selection', () => {
    render(<StepIntegration />)
    
    expect(screen.getByDisplayValue('WordPress')).toBeInTheDocument() // platform
    expect(screen.getByText(/integration setup/i)).toBeInTheDocument()
  })

  it('should show informational context panel', () => {
    render(<StepIntegration />)
    
    expect(screen.getByText(/connect your platforms/i)).toBeInTheDocument()
    expect(screen.getByText(/install our wordpress plugin/i)).toBeInTheDocument()
  })

  it('should handle platform selection', async () => {
    const user = userEvent.setup()
    render(<StepIntegration />)
    
    const platformSelect = screen.getByDisplayValue('WordPress')
    
    await user.selectOptions(platformSelect, 'Custom')
    
    expect(platformSelect).toHaveValue('custom')
  })

  it('should validate webhook URL for WordPress', async () => {
    const user = userEvent.setup()
    render(<StepIntegration />)
    
    const webhookInput = screen.getByPlaceholderText(/webhook url/i)
    const submitButton = screen.getByRole('button', { name: /complete setup/i })
    
    await user.type(webhookInput, 'invalid-url')
    await user.click(submitButton)
    
    expect(screen.getByText(/webhook url must be a valid https url/i)).toBeInTheDocument()
  })

  it('should have primary and secondary CTAs', () => {
    render(<StepIntegration />)
    
    expect(screen.getByRole('button', { name: /connect platform/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip & add later/i })).toBeInTheDocument()
  })

  it('should be responsive on mobile', () => {
    render(<StepIntegration />)
    
    const card = screen.getByRole('main')
    expect(card).toHaveClass('w-full')
  })
})
