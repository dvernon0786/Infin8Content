'use client'

import React, { useState, FormEvent, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface ArticleGenerationFormProps {
  onGenerate: (data: {
    keyword: string
    targetWordCount: number
    writingStyle: string
    targetAudience: string
    customInstructions?: string
  }) => Promise<void>
  isLoading: boolean
  error?: string | null
  initialKeyword?: string
}

export function ArticleGenerationForm({ onGenerate, isLoading, error, initialKeyword = '' }: ArticleGenerationFormProps) {
  const [keyword, setKeyword] = useState(initialKeyword)
  const [targetWordCount, setTargetWordCount] = useState<number>(2000)
  const [customWordCount, setCustomWordCount] = useState('')
  const [isCustomWordCount, setIsCustomWordCount] = useState(false)
  const [writingStyle, setWritingStyle] = useState('Professional')
  const [targetAudience, setTargetAudience] = useState('General')
  const [customInstructions, setCustomInstructions] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const customWordCountRef = useRef<HTMLInputElement>(null)

  // Auto-focus custom word count input when custom option is selected
  useEffect(() => {
    if (isCustomWordCount && customWordCountRef.current) {
      customWordCountRef.current.focus()
    }
  }, [isCustomWordCount])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setValidationError(null)

    const trimmedKeyword = keyword.trim()
    
    if (!trimmedKeyword) {
      setValidationError('Please enter a keyword')
      return
    }

    if (trimmedKeyword.length > 200) {
      setValidationError('Keyword must be less than 200 characters')
      return
    }

    let finalWordCount = targetWordCount
    if (isCustomWordCount) {
      const customCount = parseInt(customWordCount, 10)
      if (isNaN(customCount) || customCount < 500 || customCount > 10000) {
        setValidationError('Custom word count must be between 500 and 10,000')
        return
      }
      finalWordCount = customCount
    }

    if (customInstructions.length > 2000) {
      setValidationError('Custom instructions must be less than 2000 characters')
      return
    }

    await onGenerate({
      keyword: trimmedKeyword,
      targetWordCount: finalWordCount,
      writingStyle,
      targetAudience,
      customInstructions: customInstructions.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Keyword Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="keyword" className="text-sm font-medium">
          Keyword <span className="text-destructive">*</span>
        </label>
        <Input
          id="keyword"
          type="text"
          placeholder="Enter keyword or keyword cluster (e.g., 'best running shoes for marathons')"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            setValidationError(null)
          }}
          disabled={isLoading}
          aria-invalid={!!(validationError || error)}
          aria-describedby={validationError || error ? 'keyword-error' : undefined}
          className="w-full"
          data-testid="keyword-input"
        />
        {(validationError || error) && (
          <p 
            id="keyword-error" 
            className="text-sm text-destructive"
            role="alert"
          >
            {validationError || error}
          </p>
        )}
      </div>

      {/* Article Length */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Article Length <span className="text-destructive">*</span>
        </label>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-6">
            {[1500, 2000, 3000].map((count) => (
              <label key={count} className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors">
                <input
                  type="radio"
                  name="wordCount"
                  value={count}
                  checked={!isCustomWordCount && targetWordCount === count}
                  onChange={() => {
                    setIsCustomWordCount(false)
                    setTargetWordCount(count)
                  }}
                  disabled={isLoading}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">{count.toLocaleString()} words</span>
              </label>
            ))}
            <label className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors">
              <input
                type="radio"
                name="wordCount"
                value="custom"
                checked={isCustomWordCount}
                onChange={() => setIsCustomWordCount(true)}
                disabled={isLoading}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">Custom</span>
            </label>
          </div>
          {isCustomWordCount && (
            <div className="flex flex-col gap-2">
              <label htmlFor="customWordCount" className="text-sm font-medium text-muted-foreground">
                Custom Word Count
              </label>
              <Input
                id="customWordCount"
                ref={customWordCountRef}
                type="number"
                placeholder="Enter word count (500-10,000)"
                value={customWordCount}
                onChange={(e) => {
                  setCustomWordCount(e.target.value)
                  setValidationError(null)
                }}
                disabled={isLoading}
                min={500}
                max={10000}
                className="w-full"
                data-testid="custom-word-count-input"
              />
              <p className="text-xs text-muted-foreground">
                Enter a value between 500 and 10,000 words
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Writing Style */}
      <div className="flex flex-col gap-2">
        <label htmlFor="writingStyle" className="text-sm font-medium">
          Writing Style
        </label>
        <select
          id="writingStyle"
          value={writingStyle}
          onChange={(e) => setWritingStyle(e.target.value)}
          disabled={isLoading}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="Professional">Professional</option>
          <option value="Conversational">Conversational</option>
          <option value="Technical">Technical</option>
          <option value="Casual">Casual</option>
          <option value="Formal">Formal</option>
        </select>
      </div>

      {/* Target Audience */}
      <div className="flex flex-col gap-2">
        <label htmlFor="targetAudience" className="text-sm font-medium">
          Target Audience
        </label>
        <select
          id="targetAudience"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          disabled={isLoading}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="General">General</option>
          <option value="B2B">B2B</option>
          <option value="B2C">B2C</option>
          <option value="Technical">Technical</option>
          <option value="Consumer">Consumer</option>
        </select>
      </div>

      {/* Custom Instructions */}
      <div className="flex flex-col gap-2">
        <label htmlFor="customInstructions" className="text-sm font-medium">
          Custom Instructions <span className="text-muted-foreground">(Optional)</span>
        </label>
        <textarea
          id="customInstructions"
          placeholder="Any specific requirements or instructions..."
          value={customInstructions}
          onChange={(e) => {
            setCustomInstructions(e.target.value)
            setValidationError(null)
          }}
          disabled={isLoading}
          rows={4}
          maxLength={2000}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {customInstructions.length} / 2000 characters
        </p>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={isLoading || !keyword.trim()}
        data-testid="generate-button"
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Article'
        )}
      </Button>
    </form>
  )
}

