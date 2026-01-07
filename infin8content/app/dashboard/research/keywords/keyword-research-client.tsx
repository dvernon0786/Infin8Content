'use client'

import { useState } from 'react'
import { KeywordResearchForm } from '@/components/research/keyword-research-form'
import { KeywordResultsTable, type KeywordResult } from '@/components/research/keyword-results-table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'

interface KeywordResearchResponse {
  success: boolean
  data?: {
    keyword: string
    results: KeywordResult[]
    apiCost: number
    cached: boolean
    usage: {
      current: number
      limit: number | null
    }
  }
  error?: string
  details?: {
    code?: string
    usageLimitExceeded?: boolean
    currentUsage?: number
    limit?: number
  }
}

export function KeywordResearchPageClient() {
  const [results, setResults] = useState<KeywordResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usageInfo, setUsageInfo] = useState<{ current: number; limit: number | null } | null>(null)
  const [apiCost, setApiCost] = useState<number | null>(null)
  const [isCached, setIsCached] = useState(false)

  const handleResearch = async (keyword: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/research/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword }),
      })

      const data: KeywordResearchResponse = await response.json()

      if (!response.ok || !data.success) {
        // Handle usage limit exceeded
        if (data.details?.usageLimitExceeded) {
          setError(data.error || "You've reached your keyword research limit for this month")
          setUsageInfo({
            current: data.details.currentUsage || 0,
            limit: data.details.limit || null,
          })
          setResults([])
          return
        }

        // Handle other errors
        setError(data.error || 'Keyword research failed. Please try again.')
        setResults([])
        return
      }

      // Success - update results
      if (data.data) {
        setResults(data.data.results)
        setUsageInfo(data.data.usage)
        setApiCost(data.data.apiCost)
        setIsCached(data.data.cached)
        setError(null)
      }
    } catch (err) {
      console.error('Keyword research error:', err)
      setError('Keyword research failed. Please try again.')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    if (results.length > 0) {
      // Retry with the last keyword
      const lastKeyword = results[0].keyword
      handleResearch(lastKeyword)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Research Form */}
      <Card>
        <CardHeader>
          <CardTitle>Research Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <KeywordResearchForm
            onResearch={handleResearch}
            isLoading={isLoading}
            error={error}
          />
        </CardContent>
      </Card>

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
                <Button variant="outline" size="sm">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State with Retry */}
      {error && !usageInfo && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={handleRetry} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Cost Info */}
      {apiCost !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">API Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Cost: ${apiCost.toFixed(4)}
              </span>
              {isCached && (
                <Badge variant="secondary">Cached</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Table */}
      <KeywordResultsTable results={results} isLoading={isLoading} />
    </div>
  )
}

