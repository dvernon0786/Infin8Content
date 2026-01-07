/**
 * Keyword Research Form Component Tests
 * 
 * Component tests for keyword research form
 * Story 3.1: Keyword Research Interface and DataForSEO Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/react'
import { KeywordResearchForm } from '@/components/research/keyword-research-form'

describe('KeywordResearchForm', () => {
  const mockOnResearch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form with input and button', () => {
    render(<KeywordResearchForm onResearch={mockOnResearch} isLoading={false} />)

    expect(screen.getByTestId('keyword-input')).toBeInTheDocument()
    expect(screen.getByTestId('research-button')).toBeInTheDocument()
  })

  it('should call onResearch when form is submitted with valid keyword', async () => {
    const user = userEvent.setup()
    mockOnResearch.mockResolvedValue(undefined)

    render(<KeywordResearchForm onResearch={mockOnResearch} isLoading={false} />)

    const input = screen.getByTestId('keyword-input')
    const button = screen.getByTestId('research-button')

    await user.type(input, 'best running shoes')
    await user.click(button)

    await waitFor(() => {
      expect(mockOnResearch).toHaveBeenCalledWith('best running shoes')
    })
  })

  it('should call onResearch when Enter key is pressed', async () => {
    const user = userEvent.setup()
    mockOnResearch.mockResolvedValue(undefined)

    render(<KeywordResearchForm onResearch={mockOnResearch} isLoading={false} />)

    const input = screen.getByTestId('keyword-input')

    await user.type(input, 'test keyword{Enter}')

    await waitFor(() => {
      expect(mockOnResearch).toHaveBeenCalledWith('test keyword')
    })
  })

  it('should show validation error for empty keyword', async () => {
    render(<KeywordResearchForm onResearch={mockOnResearch} isLoading={false} />)

    const form = screen.getByTestId('keyword-input').closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(screen.getByText('Please enter a keyword to research')).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(mockOnResearch).not.toHaveBeenCalled()
  })

  it('should show validation error for keyword too long', async () => {
    const user = userEvent.setup()
    const longKeyword = 'a'.repeat(201)

    render(<KeywordResearchForm onResearch={mockOnResearch} isLoading={false} />)

    const input = screen.getByTestId('keyword-input')
    const button = screen.getByTestId('research-button')

    await user.type(input, longKeyword)
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText(/less than 200 characters/)).toBeInTheDocument()
    })

    expect(mockOnResearch).not.toHaveBeenCalled()
  })

  it('should display error message when error prop is provided', () => {
    render(
      <KeywordResearchForm
        onResearch={mockOnResearch}
        isLoading={false}
        error="API error occurred"
      />
    )

    expect(screen.getByText('API error occurred')).toBeInTheDocument()
  })

  it('should disable input and button when loading', () => {
    render(<KeywordResearchForm onResearch={mockOnResearch} isLoading={true} />)

    const input = screen.getByTestId('keyword-input')
    const button = screen.getByTestId('research-button')

    expect(input).toBeDisabled()
    expect(button).toBeDisabled()
    expect(screen.getByText('Researching...')).toBeInTheDocument()
  })

  it('should clear validation error when user types', async () => {
    const user = userEvent.setup()

    render(<KeywordResearchForm onResearch={mockOnResearch} isLoading={false} />)

    // Trigger validation error first
    const form = screen.getByTestId('keyword-input').closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(screen.getByText('Please enter a keyword to research')).toBeInTheDocument()
    }, { timeout: 3000 })

    const input = screen.getByTestId('keyword-input')
    await user.type(input, 'test')

    await waitFor(() => {
      expect(screen.queryByText('Please enter a keyword to research')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should trim whitespace from keyword before submitting', async () => {
    const user = userEvent.setup()
    mockOnResearch.mockResolvedValue(undefined)

    render(<KeywordResearchForm onResearch={mockOnResearch} isLoading={false} />)

    const input = screen.getByTestId('keyword-input')
    const button = screen.getByTestId('research-button')

    await user.type(input, '  test keyword  ')
    await user.click(button)

    await waitFor(() => {
      expect(mockOnResearch).toHaveBeenCalledWith('test keyword')
    })
  })
})

