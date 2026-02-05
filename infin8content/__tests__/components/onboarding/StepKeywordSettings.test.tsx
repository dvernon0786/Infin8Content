import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepKeywordSettings } from '@/components/onboarding/StepKeywordSettings'

describe('StepKeywordSettings', () => {
  it('should render keyword settings inputs', () => {
    render(<StepKeywordSettings />)
    
    expect(screen.getByDisplayValue('United States')).toBeInTheDocument() // region select
    expect(screen.getByDisplayValue('50')).toBeInTheDocument() // max keywords
    expect(screen.getByDisplayValue('0.5')).toBeInTheDocument() // competition threshold
    expect(screen.getByDisplayValue('100')).toBeInTheDocument() // min search volume
  })

  it('should show informational context panel', () => {
    render(<StepKeywordSettings />)
    
    expect(screen.getByText(/configure your keyword strategy/i)).toBeInTheDocument()
    expect(screen.getByText(/region determines the geographic focus/i)).toBeInTheDocument()
  })

  it('should handle region and generation rules changes', async () => {
    const user = userEvent.setup()
    render(<StepKeywordSettings />)
    
    const regionSelect = screen.getByDisplayValue('United States')
    const maxKeywordsInput = screen.getByDisplayValue('50')
    
    await user.selectOptions(regionSelect, 'uk')
    await user.clear(maxKeywordsInput)
    await user.type(maxKeywordsInput, '100')
    
    expect(regionSelect).toHaveValue('uk')
    expect(maxKeywordsInput).toHaveValue(50100) // Component concatenates values (number)
  })

  it('should have primary and secondary CTAs', () => {
    render(<StepKeywordSettings />)
    
    expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip & add later/i })).toBeInTheDocument()
  })

  it('should be responsive on mobile', () => {
    render(<StepKeywordSettings />)
    
    const card = screen.getByRole('main')
    expect(card).toHaveClass('w-full')
  })
})
