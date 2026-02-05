import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StepContentDefaults } from '@/components/onboarding/StepContentDefaults'

describe('StepContentDefaults', () => {
  it('should render content defaults inputs', () => {
    render(<StepContentDefaults />)
    
    expect(screen.getByDisplayValue('English')).toBeInTheDocument() // language
    expect(screen.getByDisplayValue('Professional')).toBeInTheDocument() // tone
    expect(screen.getByDisplayValue('800')).toBeInTheDocument() // min word count
    expect(screen.getByDisplayValue('2000')).toBeInTheDocument() // max word count
  })

  it('should show informational context panel', () => {
    render(<StepContentDefaults />)
    
    expect(screen.getByText(/content defaults/i)).toBeInTheDocument()
    expect(screen.getByText(/language determines the primary language/i)).toBeInTheDocument()
  })

  it('should handle language and tone changes', async () => {
    const user = userEvent.setup()
    render(<StepContentDefaults />)
    
    const languageSelect = screen.getByDisplayValue('English')
    const toneSelect = screen.getByDisplayValue('Professional')
    
    await user.selectOptions(languageSelect, 'Spanish')
    await user.selectOptions(toneSelect, 'Casual')
    
    expect(languageSelect).toHaveValue('es')
    expect(toneSelect).toHaveValue('casual')
  })

  it('should handle publishing rules changes', async () => {
    const user = userEvent.setup()
    render(<StepContentDefaults />)
    
    const minWordCount = screen.getByDisplayValue('800')
    const maxWordCount = screen.getByDisplayValue('2000')
    
    await user.clear(minWordCount)
    await user.type(minWordCount, '1000')
    
    expect(minWordCount).toHaveValue(1000)
  })

  it('should have primary and secondary CTAs', () => {
    render(<StepContentDefaults />)
    
    expect(screen.getByRole('button', { name: /next step/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip & add later/i })).toBeInTheDocument()
  })

  it('should be responsive on mobile', () => {
    render(<StepContentDefaults />)
    
    const card = screen.getByRole('main')
    expect(card).toHaveClass('w-full')
  })
})
