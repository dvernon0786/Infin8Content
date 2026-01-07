'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search } from 'lucide-react'

interface KeywordResearchFormProps {
  onResearch: (keyword: string) => Promise<void>
  isLoading: boolean
  error?: string | null
}

export function KeywordResearchForm({ onResearch, isLoading, error }: KeywordResearchFormProps) {
  const [keyword, setKeyword] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setValidationError(null)

    const trimmedKeyword = keyword.trim()
    
    if (!trimmedKeyword) {
      setValidationError('Please enter a keyword to research')
      return
    }

    if (trimmedKeyword.length > 200) {
      setValidationError('Keyword must be less than 200 characters')
      return
    }

    await onResearch(trimmedKeyword)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      e.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Enter a keyword (e.g., 'best running shoes')"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setValidationError(null)
            }}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            aria-invalid={!!(validationError || error)}
            aria-describedby={validationError || error ? 'keyword-error' : undefined}
            className="w-full"
            data-testid="keyword-input"
          />
          {(validationError || error) && (
            <p 
              id="keyword-error" 
              className="mt-1 text-sm text-destructive"
              role="alert"
            >
              {validationError || error}
            </p>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={isLoading || !keyword.trim()}
          data-testid="research-button"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Researching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Research
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

