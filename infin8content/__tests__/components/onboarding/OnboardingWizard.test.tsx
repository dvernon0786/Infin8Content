import { render, screen } from '@testing-library/react'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

describe('OnboardingWizard', () => {
  it('should render the stepper with all 6 steps', () => {
    render(<OnboardingWizard currentStep={1} />)
    
    // Check that all 6 steps are rendered
    expect(screen.getByText('Business')).toBeInTheDocument()
    expect(screen.getByText('Competitors')).toBeInTheDocument()
    expect(screen.getByText('Blog')).toBeInTheDocument()
    expect(screen.getByText('Content Defaults')).toBeInTheDocument()
    expect(screen.getByText('Keyword Settings')).toBeInTheDocument()
    expect(screen.getByText('Integration')).toBeInTheDocument()
  })

  it('should highlight the current step in primary color', () => {
    render(<OnboardingWizard currentStep={3} />)
    
    const currentStep = screen.getByText('Blog')
    expect(currentStep).toHaveClass('text-primary-blue')
  })

  it('should show check indicators for completed steps', () => {
    render(<OnboardingWizard currentStep={3} />)
    
    // Steps 1 and 2 should be completed - look for SVG check icons
    const completedSteps = document.querySelectorAll('svg[aria-hidden="true"]')
    expect(completedSteps).toHaveLength(2)
  })

  it('should show upcoming steps in neutral style', () => {
    render(<OnboardingWizard currentStep={2} />)
    
    const upcomingStep = screen.getByText('Blog')
    expect(upcomingStep).toHaveClass('text-muted-foreground')
  })

  it('should have keyboard navigation support', () => {
    render(<OnboardingWizard currentStep={1} />)
    
    const wizard = screen.getByRole('navigation', { name: /onboarding progress/i })
    expect(wizard).toBeInTheDocument()
  })

  it('should have proper ARIA labels', () => {
    render(<OnboardingWizard currentStep={1} />)
    
    const stepper = screen.getByRole('navigation', { name: /onboarding progress/i })
    expect(stepper).toBeInTheDocument()
    expect(stepper).toHaveAttribute('aria-label', 'Onboarding Progress: Step 1 of 6')
  })

  it('should be responsive on mobile', () => {
    render(<OnboardingWizard currentStep={1} />)
    
    const stepper = screen.getByRole('navigation')
    expect(stepper).toHaveClass('overflow-x-auto')
  })
})
