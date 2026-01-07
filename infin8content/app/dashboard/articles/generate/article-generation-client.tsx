'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArticleGenerationForm } from '@/components/articles/article-generation-form'
import { ArticleQueueStatus } from '@/components/articles/article-queue-status'
import { AlertCircle } from 'lucide-react'

interface ArticleGenerationPageClientProps {
  organizationId: string
}

export function ArticleGenerationPageClient({ organizationId }: ArticleGenerationPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [initialKeyword, setInitialKeyword] = useState<string>('')

  // Read keyword from URL params (for contextual link from keyword research)
  useEffect(() => {
    const keywordParam = searchParams.get('keyword')
    if (keywordParam) {
      setInitialKeyword(decodeURIComponent(keywordParam))
    }
  }, [searchParams])
  const [error, setError] = useState<string | null>(null)
  const [usageInfo, setUsageInfo] = useState<{ current: number; limit: number | null } | null>(null)

  const handleGenerate = async (data: {
    keyword: string
    targetWordCount: number
    writingStyle: string
    targetAudience: string
    customInstructions?: string
  }) => {
    setIsLoading(true)
    setError(null)
    setUsageInfo(null)

    try {
      const response = await fetch('/api/articles/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: data.keyword,
          targetWordCount: data.targetWordCount,
          writingStyle: data.writingStyle,
          targetAudience: data.targetAudience,
          customInstructions: data.customInstructions,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle usage limit error
        if (result.details?.usageLimitExceeded) {
          setUsageInfo({
            current: result.details.currentUsage,
            limit: result.details.limit,
          })
        }
        setError(result.error || 'Failed to generate article')
        return
      }

      // Success - redirect to article detail page
      router.push(`/dashboard/articles/${result.articleId}`)
    } catch (err) {
      console.error('Article generation error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Article</h1>
        <p className="text-muted-foreground">
          Create long-form content optimized for SEO
        </p>
      </div>

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Article Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <ArticleGenerationForm
            onGenerate={handleGenerate}
            isLoading={isLoading}
            error={error}
            initialKeyword={initialKeyword}
          />
        </CardContent>
      </Card>

      {/* Queue Status */}
      <ArticleQueueStatus organizationId={organizationId} />

      {/* Usage Limit Warning */}
      {error && usageInfo && usageInfo.limit !== null && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Usage Limit Reached
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {error}
              </p>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm font-medium">Current Usage: </span>
                  <span className="text-sm">{usageInfo.current} / {usageInfo.limit}</span>
                </div>
                <button
                  onClick={() => router.push('/dashboard/settings')}
                  className="text-sm px-4 py-2 border border-input rounded-md hover:bg-accent"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !usageInfo && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

