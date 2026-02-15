'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import KeywordReviewPage from './KeywordReviewPage'

interface Step3SeedsFormProps {
  workflowId: string
}

export function Step3SeedsForm({ workflowId }: Step3SeedsFormProps) {
  const router = useRouter()
  const [keywords, setKeywords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load keywords on mount
  useEffect(() => {
    loadKeywords()
  }, [workflowId])

  async function loadKeywords() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(
        `/api/intent/workflows/${workflowId}/steps/seed-extract?page=1&limit=50`
      )

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to load keywords')
      }

      const data = await res.json()
      setKeywords(data.data?.keywords || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleKeyword(keywordId: string, selected: boolean) {
    // This would call the bulk selection endpoint
    // For now, we'll handle this optimistically
    setKeywords(prev => prev.map(k => 
      k.id === keywordId ? { ...k, user_selected: selected } : k
    ))
  }

  async function handleBulkAction(action: string, keywordIds?: string[]) {
    // This would call bulk action endpoints
    console.log('Bulk action:', action, keywordIds)
  }

  async function handleContinue(selectedIds: string[]) {
    try {
      const res = await fetch(
        `/api/intent/workflows/${workflowId}/steps/seed-extract`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedKeywordIds: selectedIds })
        }
      )

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to save selection')
      }

      // Redirect to next step or show success
      router.push(`/workflows/${workflowId}/steps/4`)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading keywords...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={loadKeywords}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <KeywordReviewPage
      keywords={keywords}
      onContinue={handleContinue}
      onToggleKeyword={handleToggleKeyword}
      onBulkAction={handleBulkAction}
      loading={loading}
    />
  )
}
