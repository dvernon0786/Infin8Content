'use client'

import React, { useState, FormEvent, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import type { ArticleType } from '@/types/article'

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'it', label: 'Italian' },
  { code: 'nl', label: 'Dutch' },
]

interface ArticleGenerationFormProps {
  onGenerate: (data: {
    keyword: string
    targetWordCount: number
    writingStyle: string
    targetAudience: string
    customInstructions?: string
    // Epic 13: article type fields
    articleType?: ArticleType
    language?: string
    articleTypeConfig?: Record<string, any>
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

  // Epic 13: article type state
  const [articleType, setArticleType] = useState<ArticleType>('standard')
  const [language, setLanguage] = useState('en')
  // News (13-1)
  const [newsTopic, setNewsTopic] = useState('')
  const [newsCountry, setNewsCountry] = useState('US')
  const [newsTimeRange, setNewsTimeRange] = useState<'24h' | '7d' | '30d'>('7d')
  const [newsArticleFocus, setNewsArticleFocus] = useState<'breaking_news' | 'analysis' | 'roundup'>('analysis')
  // Listicle (13-2)
  const [listicleListType, setListicleListType] = useState('Top 10')
  const [listicleComparisonCriteria, setListicleComparisonCriteria] = useState<string[]>(['features', 'pros_cons'])
  const [listicleIncludeTable, setListicleIncludeTable] = useState(true)
  const [listicleEditorsChoice, setListicleEditorsChoice] = useState('')
  // Video (13-3)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoIncludeTimestamps, setVideoIncludeTimestamps] = useState(true)
  const [videoIncludeEmbed, setVideoIncludeEmbed] = useState(true)
  const [videoIncludeTranscript, setVideoIncludeTranscript] = useState(false)

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

    // For video type the keyword is derived from the video title — allow empty keyword
    if (!trimmedKeyword && articleType !== 'video_conversion') {
      setValidationError('Please enter a keyword')
      return
    }

    if (trimmedKeyword.length > 200) {
      setValidationError('Keyword must be less than 200 characters')
      return
    }

    if (articleType === 'video_conversion') {
      if (!videoUrl.trim()) {
        setValidationError('Please enter a YouTube video URL')
        return
      }
      if (!/youtu\.?be/.test(videoUrl)) {
        setValidationError('Please enter a valid YouTube URL')
        return
      }
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

    // Build article_type_config
    let articleTypeConfig: Record<string, any> | undefined
    if (articleType === 'news') {
      articleTypeConfig = {
        topic: newsTopic || trimmedKeyword,
        country: newsCountry,
        time_range: newsTimeRange,
        article_focus: newsArticleFocus,
      }
    } else if (articleType === 'listicle_comparison') {
      articleTypeConfig = {
        list_type: listicleListType,
        topic: trimmedKeyword,
        comparison_criteria: listicleComparisonCriteria,
        include_comparison_table: listicleIncludeTable,
        include_pros_cons: listicleComparisonCriteria.includes('pros_cons'),
        include_pricing: listicleComparisonCriteria.includes('pricing'),
        editors_choice: listicleEditorsChoice || undefined,
      }
    } else if (articleType === 'video_conversion') {
      articleTypeConfig = {
        video_url: videoUrl.trim(),
        include_transcript: videoIncludeTranscript,
        include_timestamps: videoIncludeTimestamps,
        include_embedded_video: videoIncludeEmbed,
        language,
      }
    }

    await onGenerate({
      keyword: trimmedKeyword,
      targetWordCount: finalWordCount,
      writingStyle,
      targetAudience,
      customInstructions: customInstructions.trim() || undefined,
      articleType,
      language,
      articleTypeConfig,
    })
  }

  const toggleCriteria = (c: string) => {
    setListicleComparisonCriteria(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Article Type (Epic 13) */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Article Type</label>
        <div className="flex flex-wrap gap-3">
          {([
            { value: 'standard', label: 'Standard' },
            { value: 'news', label: '📰 News Article' },
            { value: 'listicle_comparison', label: '📋 Listicle + Table' },
            { value: 'video_conversion', label: '▶️ YouTube to Blog' },
          ] as { value: ArticleType; label: string }[]).map(({ value, label }) => (
            <label key={value} className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border text-sm transition-colors ${articleType === value ? 'border-primary bg-primary/5 font-medium' : 'border-input hover:bg-accent/50'}`}>
              <input
                type="radio"
                name="articleType"
                value={value}
                checked={articleType === value}
                onChange={() => setArticleType(value)}
                disabled={isLoading}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Language (13-5 — shown for all types, prominently for non-standard) */}
      <div className="flex flex-col gap-2">
        <label htmlFor="language" className="text-sm font-medium">
          Content Language
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isLoading}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {SUPPORTED_LANGUAGES.map(({ code, label }) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      {/* News-specific fields (13-1) */}
      {articleType === 'news' && (
        <div className="flex flex-col gap-4 p-4 rounded-md border border-input bg-muted/30">
          <p className="text-sm font-medium text-muted-foreground">News Article Settings</p>
          <div className="flex flex-col gap-2">
            <label htmlFor="newsTopic" className="text-sm font-medium">News Topic</label>
            <Input
              id="newsTopic"
              placeholder="e.g. artificial intelligence, e-commerce trends"
              value={newsTopic}
              onChange={(e) => setNewsTopic(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Leave blank to use the keyword above</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="newsTimeRange" className="text-sm font-medium">Time Range</label>
              <select
                id="newsTimeRange"
                value={newsTimeRange}
                onChange={(e) => setNewsTimeRange(e.target.value as any)}
                disabled={isLoading}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none disabled:opacity-50"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="newsCountry" className="text-sm font-medium">Country</label>
              <Input
                id="newsCountry"
                placeholder="US"
                value={newsCountry}
                onChange={(e) => setNewsCountry(e.target.value.toUpperCase().slice(0, 2))}
                disabled={isLoading}
                maxLength={2}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="newsArticleFocus" className="text-sm font-medium">Article Focus</label>
            <select
              id="newsArticleFocus"
              value={newsArticleFocus}
              onChange={(e) => setNewsArticleFocus(e.target.value as any)}
              disabled={isLoading}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none disabled:opacity-50"
            >
              <option value="breaking_news">Breaking News</option>
              <option value="analysis">In-Depth Analysis</option>
              <option value="roundup">Weekly Roundup</option>
            </select>
          </div>
        </div>
      )}

      {/* Listicle-specific fields (13-2) */}
      {articleType === 'listicle_comparison' && (
        <div className="flex flex-col gap-4 p-4 rounded-md border border-input bg-muted/30">
          <p className="text-sm font-medium text-muted-foreground">Listicle Settings</p>
          <div className="flex flex-col gap-2">
            <label htmlFor="listicleListType" className="text-sm font-medium">List Type</label>
            <select
              id="listicleListType"
              value={listicleListType}
              onChange={(e) => setListicleListType(e.target.value)}
              disabled={isLoading}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none disabled:opacity-50"
            >
              <option value="Top 10">Top 10</option>
              <option value="Best 7">Best 7</option>
              <option value="Ultimate 15">Ultimate 15</option>
              <option value="Top 5">Top 5</option>
              <option value="Best 12">Best 12</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Comparison Criteria</label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'features', label: 'Features' },
                { value: 'pros_cons', label: 'Pros & Cons' },
                { value: 'pricing', label: 'Pricing' },
                { value: 'ratings', label: 'Ratings' },
                { value: 'best_for', label: 'Best For' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={listicleComparisonCriteria.includes(value)}
                    onChange={() => toggleCriteria(value)}
                    disabled={isLoading}
                    className="h-4 w-4"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={listicleIncludeTable}
              onChange={(e) => setListicleIncludeTable(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4"
            />
            Include Quick Comparison Table
          </label>
          <div className="flex flex-col gap-2">
            <label htmlFor="listicleEditorsChoice" className="text-sm font-medium">
              Editor's Choice <span className="text-muted-foreground">(Optional)</span>
            </label>
            <Input
              id="listicleEditorsChoice"
              placeholder="e.g. Notion"
              value={listicleEditorsChoice}
              onChange={(e) => setListicleEditorsChoice(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Video-specific fields (13-3) */}
      {articleType === 'video_conversion' && (
        <div className="flex flex-col gap-4 p-4 rounded-md border border-input bg-muted/30">
          <p className="text-sm font-medium text-muted-foreground">YouTube Video Settings</p>
          <div className="flex flex-col gap-2">
            <label htmlFor="videoUrl" className="text-sm font-medium">
              YouTube URL <span className="text-destructive">*</span>
            </label>
            <Input
              id="videoUrl"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => { setVideoUrl(e.target.value); setValidationError(null) }}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-2">
            {[
              { checked: videoIncludeTimestamps, onChange: setVideoIncludeTimestamps, label: 'Include Table of Contents with timestamps' },
              { checked: videoIncludeEmbed, onChange: setVideoIncludeEmbed, label: 'Embed video in article' },
              { checked: videoIncludeTranscript, onChange: setVideoIncludeTranscript, label: 'Include full transcript accordion' },
            ].map(({ checked, onChange, label }) => (
              <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Keyword Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="keyword" className="text-sm font-medium">
          {articleType === 'video_conversion' ? 'Keyword (Optional)' : <>Keyword <span className="text-destructive">*</span></>}
        </label>
        <Input
          id="keyword"
          type="text"
          placeholder={
            articleType === 'video_conversion'
              ? "Leave blank to auto-extract from video title"
              : articleType === 'news'
              ? "e.g. artificial intelligence, e-commerce"
              : "Enter keyword or keyword cluster (e.g., 'best running shoes for marathons')"
          }
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
        className="w-full sm:w-auto font-lato"
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

