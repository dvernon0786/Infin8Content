import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepCompletion } from '@/components/onboarding/StepCompletion'

describe('StepCompletion', () => {
  it('should render completion screen', () => {
    render(<StepCompletion />)
    
    expect(screen.getByText(/setup complete/i)).toBeInTheDocument()
    expect(screen.getByText(/your organization is ready/i)).toBeInTheDocument()
  })

  it('should show success icon', () => {
    render(<StepCompletion />)
    
    const icon = document.querySelector('svg[fill="currentColor"]')
    expect(icon).toBeInTheDocument()
  })

  it('should show next steps information', () => {
    render(<StepCompletion />)
    
    expect(screen.getByText(/what's next/i)).toBeInTheDocument()
    expect(screen.getByText(/explore your dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/set up your keyword research/i)).toBeInTheDocument()
  })

  it('should have start button', () => {
    render(<StepCompletion />)
    
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view tutorial/i })).toBeInTheDocument()
  })

  it('should handle start button click', async () => {
    const mockOnStart = jest.fn()
    render(<StepCompletion onStart={mockOnStart} />)
    
    const startButton = screen.getByRole('button', { name: /go to dashboard/i })
    await userEvent.click(startButton)
    
    expect(mockOnStart).toHaveBeenCalled()
  })

  it('should be responsive on mobile', () => {
    render(<StepCompletion />)
    
    const card = screen.getByRole('main')
    expect(card).toHaveClass('w-full')
  })
})
