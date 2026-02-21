'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertCircle, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
  const [approvals, setApprovals] = useState<Record<string, SubtopicApproval>>({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchKeywordsWithSubtopics()
    fetchApprovalStatus()
  }, [workflowId])

  async function fetchKeywordsWithSubtopics() {
    try {
      setLoading(true)
      setError(null)

      // ✅ CORRECTED: Workflow-scoped, longtail-only query
      const { data, error } = await supabase
        .from('keywords')
        .select('id, keyword, subtopics, subtopics_status, article_status')
        .eq('workflow_id', workflowId) // ✅ Workflow scoping
        .is('parent_seed_keyword_id', 'not null') // ✅ Longtail keywords only
        .eq('subtopics_status', 'completed')
        .order('keyword')

      if (error) throw error

      // Type guard to ensure data is the correct type
      if (Array.isArray(data) && data.length > 0) {
        setKeywords(data as unknown as KeywordWithSubtopics[])
      } else {
        setKeywords([])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchApprovalStatus() {
    try {
      const { data, error } = await supabase
        .from('intent_approvals')
        .select('id, entity_id, decision, approver_id, feedback, created_at')
        .eq('workflow_id', workflowId)
        .eq('entity_type', 'keyword')
        .eq('approval_type', 'subtopics')

      if (error) throw error

      // Type guard to ensure data is the correct type
      if (Array.isArray(data)) {
        // Map approvals by keyword ID for quick lookup
        const approvalMap: Record<string, SubtopicApproval> = {}
        data.forEach(approval => {
          const approvalRecord = approval as any
          approvalMap[approvalRecord.entity_id] = approvalRecord
        })
        setApprovals(approvalMap)
      } else {
        setApprovals({})
      }
    } catch (err: any) {
      console.warn('Failed to fetch approval status:', err.message)
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

      // Refresh approval status
      await fetchApprovalStatus()

      setSuccess(`Subtopics for keyword ${keywords.find(k => k.id === keywordId)?.keyword} ${decision}`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(null)
    }
  }

  function getApprovalStatus(keywordId: string): 'approved' | 'rejected' | 'pending' {
    const approval = approvals[keywordId]
    return approval ? approval.decision : 'pending'
  }

  function getTypeColor(type: string) {
    switch (type) {
      case 'informational': return 'bg-blue-100 text-blue-800'
      case 'commercial': return 'bg-green-100 text-green-800'
      case 'transactional': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // ✅ FSM STATE GUARD: Only allow approval when workflow is ready
  if (workflowState && workflowState !== 'step_8_subtopics') {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Step 8 Not Available</h3>
        <p className="text-muted-foreground">
          {workflowState === 'step_8_subtopics_running' 
            ? 'Subtopics are currently being generated. Please wait for completion.'
            : 'Please complete previous steps before accessing subtopic approval.'
          }
        </p>
      </div>
    )
  }

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
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No subtopics ready for review yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Subtopics will appear here once Step 8 generation is complete.
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
          const approvalStatus = getApprovalStatus(keyword.id)
          const approval = approvals[keyword.id]
          
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
                      ? `Subtopics approved by ${approval?.approver_id} on ${new Date(approval?.created_at || '').toLocaleDateString()}`
                      : `Subtopics rejected${approval?.feedback ? ` with feedback: "${approval.feedback}"` : ''}`
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
    </div>
  )
}
