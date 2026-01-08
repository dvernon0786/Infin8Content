/**
 * Article Generation Form Component Tests
 * Story 4a-1: Article Generation Initiation and Queue Setup
 * 
 * Tests form validation, submission, and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArticleGenerationForm } from '@/components/articles/article-generation-form'

describe('ArticleGenerationForm', () => {
  const mockOnGenerate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all form fields', () => {
    render(<ArticleGenerationForm onGenerate={mockOnGenerate} isLoading={false} />)

    expect(screen.getByLabelText(/keyword/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/article length/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/writing style/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/target audience/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/custom instructions/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate article/i })).toBeInTheDocument()
  })

  it('should pre-fill keyword from initialKeyword prop', () => {
    render(
      <ArticleGenerationForm 
        onGenerate={mockOnGenerate} 
        isLoading={false} 
        initialKeyword="test keyword"
      />
    )

    const keywordInput = screen.getByLabelText(/keyword/i) as HTMLInputElement
    expect(keywordInput.value).toBe('test keyword')
  })

  it('should validate empty keyword', async () => {
    const user = userEvent.setup()
    render(<ArticleGenerationForm onGenerate={mockOnGenerate} isLoading={false} />)

    const submitButton = screen.getByRole('button', { name: /generate article/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a keyword/i)).toBeInTheDocument()
    })
    expect(mockOnGenerate).not.toHaveBeenCalled()
  })

  it('should validate keyword max length', async () => {
    const user = userEvent.setup()
    render(<ArticleGenerationForm onGenerate={mockOnGenerate} isLoading={false} />)

    const keywordInput = screen.getByLabelText(/keyword/i)
    const longKeyword = 'a'.repeat(201) // Exceeds 200 char limit
    await user.type(keywordInput, longKeyword)

    const submitButton = screen.getByRole('button', { name: /generate article/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/keyword must be less than 200 characters/i)).toBeInTheDocument()
    })
    expect(mockOnGenerate).not.toHaveBeenCalled()
  })

  it('should validate custom word count range', async () => {
    const user = userEvent.setup()
    render(<ArticleGenerationForm onGenerate={mockOnGenerate} isLoading={false} />)

    // Select custom word count
    const customRadio = screen.getByLabelText(/custom/i)
    await user.click(customRadio)

    const customInput = screen.getByPlaceholderText(/enter word count/i)
    await user.type(customInput, '100') // Below minimum

    const submitButton = screen.getByRole('button', { name: /generate article/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/custom word count must be between 500 and 10,000/i)).toBeInTheDocument()
    })
    expect(mockOnGenerate).not.toHaveBeenCalled()
  })

  it('should validate custom instructions max length', async () => {
    const user = userEvent.setup()
    render(<ArticleGenerationForm onGenerate={mockOnGenerate} isLoading={false} />)

    const keywordInput = screen.getByLabelText(/keyword/i)
    await user.type(keywordInput, 'test keyword')

    const instructionsInput = screen.getByLabelText(/custom instructions/i)
    const longInstructions = 'a'.repeat(2001) // Exceeds 2000 char limit
    await user.type(instructionsInput, longInstructions)

    const submitButton = screen.getByRole('button', { name: /generate article/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/custom instructions must be less than 2000 characters/i)).toBeInTheDocument()
    })
    expect(mockOnGenerate).not.toHaveBeenCalled()
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    render(<ArticleGenerationForm onGenerate={mockOnGenerate} isLoading={false} />)

    const keywordInput = screen.getByLabelText(/keyword/i)
    await user.type(keywordInput, 'test keyword')

    const submitButton = screen.getByRole('button', { name: /generate article/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith({
        keyword: 'test keyword',
        targetWordCount: 2000, // Default
        writingStyle: 'Professional', // Default
        targetAudience: 'General', // Default
        customInstructions: undefined,
      })
    })
  })

  it('should submit with custom word count', async () => {
    const user = userEvent.setup()
    render(<ArticleGenerationForm onGenerate={mockOnGenerate} isLoading={false} />)

    const keywordInput = screen.getByLabelText(/keyword/i)
    await user.type(keywordInput, 'test keyword')

    // Select custom word count
    const customRadio = screen.getByLabelText(/custom/i)
    await user.click(customRadio)

    const customInput = screen.getByPlaceholderText(/enter word count/i)
    await user.type(customInput, '5000')

    const submitButton = screen.getByRole('button', { name: /generate article/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          targetWordCount: 5000,
        })
      )
    })
  })

  it('should disable form when loading', () => {
    render(<ArticleGenerationForm onGenerate={mockOnGenerate} isLoading={true} />)

    const keywordInput = screen.getByLabelText(/keyword/i)
    const submitButton = screen.getByRole('button', { name: /generate article/i })

    expect(keywordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
    expect(screen.getByText(/generating/i)).toBeInTheDocument()
  })

  it('should display error message', () => {
    render(
      <ArticleGenerationForm 
        onGenerate={mockOnGenerate} 
        isLoading={false} 
        error="Test error message"
      />
    )

    expect(screen.getByText(/test error message/i)).toBeInTheDocument()
  })

  it('should trim keyword and custom instructions', async () => {
    const user = userEvent.setup()
    render(<ArticleGenerationForm onGenerate={mockOnGenerate} isLoading={false} />)

    const keywordInput = screen.getByLabelText(/keyword/i)
    await user.type(keywordInput, '  test keyword  ')

    const instructionsInput = screen.getByLabelText(/custom instructions/i)
    await user.type(instructionsInput, '  test instructions  ')

    const submitButton = screen.getByRole('button', { name: /generate article/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          keyword: 'test keyword', // Trimmed
          customInstructions: 'test instructions', // Trimmed
        })
      )
    })
  })
})

