'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArticleGenerationForm } from '@/components/articles/article-generation-form'
import { AlertCircle } from 'lucide-react'

interface ArticleGenerationPageClientProps {
  organizationId: string
}

export function ArticleGenerationPageClient({ organizationId }: ArticleGenerationPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [initialKeyword, setInitialKeyword] = useState<string>('')
  const [initialArticleType, setInitialArticleType] = useState<import('@/types/article').ArticleType>('standard')

  // Read keyword and type from URL params
  useEffect(() => {
    const keywordParam = searchParams.get('keyword')
    if (keywordParam) {
      setInitialKeyword(decodeURIComponent(keywordParam))
    }
    const typeParam = searchParams.get('type')
    const typeMap: Record<string, import('@/types/article').ArticleType> = {
      seo: 'standard',
      news: 'news',
      youtube: 'video_conversion',
      listicle: 'listicle_comparison',
    }
    if (typeParam && typeMap[typeParam]) {
      setInitialArticleType(typeMap[typeParam])
    }
  }, [searchParams])
  const [error, setError] = useState<string | null>(null)
  const [usageInfo, setUsageInfo] = useState<{ current: number; limit: number | null; plan?: string; remaining?: number | null } | null>(null)

  // Fetch usage information on component mount
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/articles/usage')
        if (response.ok) {
          const data = await response.json()
          setUsageInfo({
            current: data.currentUsage,
            limit: data.limit,
            plan: data.plan,
            remaining: data.remaining,
          })
        }
      } catch (err) {
        console.error('Failed to fetch usage information:', err)
        // Don't show error - usage display is nice-to-have
      }
    }
    fetchUsage()
  }, [])

  const handleGenerate = async (data: {
    keyword: string
    targetWordCount: number
    writingStyle: string
    targetAudience: string
    customInstructions?: string
    articleType?: import('@/types/article').ArticleType
    language?: string
    articleTypeConfig?: Record<string, any>
  }) => {
    setIsLoading(true)
    setError(null)
    setUsageInfo(null)

    try {
      // Step 1: Create the article record and get its ID
      const createResponse = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: data.keyword,
          targetWordCount: data.targetWordCount,
          writingStyle: data.writingStyle,
          targetAudience: data.targetAudience,
          customInstructions: data.customInstructions,
          articleType: data.articleType,
          language: data.language,
          articleTypeConfig: data.articleTypeConfig,
        }),
      })

      const createResult = await createResponse.json()

      if (!createResponse.ok) {
        setError(createResult.error || 'Failed to create article')
        return
      }

      const { articleId } = createResult

      // Step 2: Trigger generation with the new articleId
      const generateResponse = await fetch('/api/articles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      })

      const generateResult = await generateResponse.json()

      if (!generateResponse.ok) {
        // Handle usage limit error
        if (generateResult.details?.usageLimitExceeded) {
          setUsageInfo({
            current: generateResult.details.currentUsage,
            limit: generateResult.details.limit,
          })
        }
        setError(generateResult.error || 'Failed to start generation')
        return
      }

      // Success - redirect to articles dashboard to see progress
      router.push('/dashboard/articles')
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
            initialArticleType={initialArticleType}
          />
        </CardContent>
      </Card>

      {/* Usage Display */}
      {usageInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Article Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {usageInfo.limit !== null ? (
                    <>
                      <span className="font-medium">{usageInfo.current}</span> / {usageInfo.limit} articles used this month
                      {usageInfo.remaining !== null && usageInfo.remaining !== undefined && (
                        <span className="ml-2 text-muted-foreground">
                          ({usageInfo.remaining} remaining)
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{usageInfo.current}</span> articles generated this month (unlimited)
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Plan: {usageInfo.plan ? usageInfo.plan.charAt(0).toUpperCase() + usageInfo.plan.slice(1) : 'Starter'}
                </p>
              </div>
              {usageInfo.limit !== null && usageInfo.remaining !== null && usageInfo.remaining !== undefined && usageInfo.remaining <= 3 && usageInfo.remaining > 0 && (
                <button
                  onClick={() => router.push('/dashboard/settings')}
                  className="text-sm px-4 py-2 border border-input rounded-md hover:bg-accent"
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}


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

