'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertCircle, Lock } from 'lucide-react'

interface KeywordSubtopic {
  title: string
  type: 'informational' | 'commercial' | 'transactional'
  keywords: string[]
}

interface KeywordWithSubtopics {
  id: string
  keyword: string
  subtopics: KeywordSubtopic[]
  subtopics_status: string
  article_status: string
  approvalStatus: 'approved' | 'rejected' | 'pending'
  approvedBy: string | null
  approvedAt: string | null
  feedback: string | null
}

interface SubtopicApproval {
  id: string
  decision: 'approved' | 'rejected'
  approver_id: string
  feedback?: string
  created_at: string
}

interface Step8SubtopicsFormProps {
  workflowId: string
  workflowState?: string
}

export function Step8SubtopicsForm({ workflowId, workflowState }: Step8SubtopicsFormProps) {
  const [keywords, setKeywords] = useState<KeywordWithSubtopics[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchSubtopicsForReview()
  }, [workflowId])

<<<<<<< Updated upstream
=======
  // ✅ Poll when worker is running (use FSM state, not data length)
  useEffect(() => {
    if (workflowState !== 'step_8_subtopics_running') return

    const interval = setInterval(() => {
      fetchSubtopicsForReview()
    }, 5000)

    return () => clearInterval(interval)
  }, [workflowState, workflowId])

>>>>>>> Stashed changes
  // Helper functions
  function canComplete(): boolean {
    if (keywords.length === 0) return false
    return keywords.every(k => k.approvalStatus === 'approved')
  }

  async function completeStep8() {
    try {
      setProcessing('complete')

      const res = await fetch(
        `/api/workflows/${workflowId}/complete-step-8`,
        { method: 'POST' }
      )

      const body = await res.json()

      if (!res.ok) throw new Error(body.error)

      // Redirect to Step 9
      window.location.href = `/workflows/${workflowId}/steps/9` 

    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(null)
    }
  }

  async function fetchSubtopicsForReview() {
    try {
      setLoading(true)
      setError(null)

      // ✅ ENTERPRISE: Server-driven data fetching
      const response = await fetch(`/api/workflows/${workflowId}/subtopics-for-review`)
      
      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error || 'Failed to fetch subtopics')
      }

      const { data } = await response.json()
      
      // ✅ Use live API state, not stale parent prop
      if (
        data.workflowState !== 'step_8_subtopics' &&
        data.workflowState !== 'step_8_subtopics_running'
      ) {
        setError('Workflow not in Step 8 state')
        return
      }
      
      setKeywords(data.keywords || [])

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleApproval(keywordId: string, decision: 'approved' | 'rejected') {
    try {
      setProcessing(keywordId)
      setError(null)
      setSuccess(null)

      const response = await fetch(
        `/api/keywords/${keywordId}/approve-subtopics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            decision,
            feedback: feedback[keywordId] || '',
          }),
        }
      )

      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error || 'Approval failed')
      }

      // Refresh data after approval
      await fetchSubtopicsForReview()

      setSuccess(`Subtopics for keyword ${keywords.find(k => k.id === keywordId)?.keyword} ${decision}`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(null)
    }
  }

  function getApprovalStatus(keyword: any): 'approved' | 'rejected' | 'pending' {
    return keyword.approvalStatus || 'pending'
  }

  function getTypeColor(type: string) {
    switch (type) {
      case 'informational': return 'bg-blue-100 text-blue-800'
      case 'commercial': return 'bg-green-100 text-green-800'
      case 'transactional': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // ✅ REMOVED: Don't gate on stale parent prop - use live API state instead

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading subtopics...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 text-destructive mr-2" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      </div>
    )
  }

  if (keywords.length === 0) {
<<<<<<< Updated upstream
=======
    if (workflowState === 'step_8_subtopics_running') {
      return (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Generating subtopics… This may take up to 90 seconds.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This page will automatically update when complete.
          </p>
        </div>
      )
    }
    
>>>>>>> Stashed changes
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No subtopics were generated.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Review & Approve Subtopics</h3>
          <p className="text-sm text-muted-foreground">
            Review the generated subtopics for each keyword and approve or reject them.
          </p>
        </div>
        <Badge variant="secondary">
          {keywords.length} keyword{keywords.length !== 1 ? 's' : ''} to review
        </Badge>
      </div>

      {success && (
        <div className="rounded-md border border-green-300/30 bg-green-50 p-3 text-sm">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {keywords.map((keyword) => {
          const approvalStatus = getApprovalStatus(keyword)
          
          return (
            <Card key={keyword.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{keyword.keyword}</CardTitle>
                  <div className="flex items-center gap-2">
                    {approvalStatus === 'approved' && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    )}
                    {approvalStatus === 'rejected' && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                    )}
                    {approvalStatus === 'pending' && (
                      <Badge variant="outline">
                        Pending Review
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {keyword.subtopics.map((subtopic, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{subtopic.title}</h4>
                        <Badge className={getTypeColor(subtopic.type)}>
                          {subtopic.type}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {subtopic.keywords.map((kw, kwIndex) => (
                          <span 
                            key={kwIndex}
                            className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {approvalStatus !== 'pending' ? (
                  <div className="text-sm text-muted-foreground">
                    {approvalStatus === 'approved' 
                      ? `Subtopics approved by ${keyword.approvedBy} on ${new Date(keyword.approvedAt || '').toLocaleDateString()}`
                      : `Subtopics rejected${keyword.feedback ? ` with feedback: "${keyword.feedback}"` : ''}`
                    }
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Optional feedback for the team..."
                      value={feedback[keyword.id] || ''}
                      onChange={(e) => 
                        setFeedback(prev => ({ 
                          ...prev, 
                          [keyword.id]: e.target.value 
                        }))
                      }
                      rows={3}
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproval(keyword.id, 'approved')}
                        disabled={processing === keyword.id}
                        className="min-w-[120px]"
                      >
                        {processing === keyword.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleApproval(keyword.id, 'rejected')}
                        disabled={processing === keyword.id}
                        className="min-w-[120px]"
                      >
                        {processing === keyword.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Complete Step 8 Button */}
      {canComplete() && (
        <div className="pt-6 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Ready to Complete Step 8</h3>
              <p className="text-sm text-muted-foreground">
                All subtopics have been approved. Click to proceed to Step 9 (Article Generation).
              </p>
            </div>
            <Button
              onClick={completeStep8}
              disabled={processing === 'complete'}
              size="lg"
            >
              {processing === 'complete' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing…
                </>
              ) : (
                <>
                  Complete Step 8 →
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
