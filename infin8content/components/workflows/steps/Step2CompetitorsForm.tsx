'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, X } from 'lucide-react'

interface Competitor {
  id: string
  url: string
  domain: string
  is_active: boolean
}

interface Step2CompetitorsFormProps {
  workflowId: string
}

export function Step2CompetitorsForm({ workflowId }: Step2CompetitorsFormProps) {
  const [state, setState] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [newCompetitor, setNewCompetitor] = useState('')
  const [additionalCompetitors, setAdditionalCompetitors] = useState<string[]>([])

  // Note: Removed broken API call to /api/organizations/competitors (returns 404)
  // Backend handles competitor validation during analysis

  async function runStep() {
    try {
      setState('running')
      setError(null)

      ;(window as any)?.analytics?.track('workflow_step_started', {
        workflow_id: workflowId,
        step: 2,
      })

      const res = await fetch(
        `/api/intent/workflows/${workflowId}/steps/competitor-analyze`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            additionalCompetitors: additionalCompetitors  // Only send NEW competitors
          })
        }
      )

      if (!res.ok) {
        const body = await res.json()
        
        // Handle NO_KEYWORDS_FOUND specifically for UX
        if (body.error === 'NO_KEYWORDS_FOUND') {
          setState('error')
          setError('No keywords found from provided competitors. Try adding competitors with stronger SEO presence.')
          return
        }
        
        throw new Error(body.error || 'Step failed')
      }

      // Success - show success state and redirect
      setState('success')
      setError(null)
      
      // Optional: Redirect to next step after successful completion
      setTimeout(() => {
        window.location.href = `/workflows/${workflowId}/steps/3`
      }, 1000)

      ;(window as any)?.analytics?.track('workflow_step_completed', {
        workflow_id: workflowId,
        step: 2,
      })
    } catch (err: any) {
      setState('error')
      setError(err.message)

      ;(window as any)?.analytics?.track('workflow_step_failed', {
        workflow_id: workflowId,
        step: 2,
        error: err.message
      })
    }
  }

  const addCompetitor = () => {
    if (newCompetitor.trim() && additionalCompetitors.length < 3) {
      const trimmedUrl = newCompetitor.trim()
      
      // Basic URL validation
      if (!trimmedUrl.includes('.') || trimmedUrl.includes(' ')) {
        setError('Please enter a valid URL (e.g., example.com or https://example.com)')
        return
      }
      
      // Normalize URL format
      let normalizedUrl = trimmedUrl
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        normalizedUrl = `https://${trimmedUrl}`
      }
      
      setAdditionalCompetitors([...additionalCompetitors, normalizedUrl])
      setNewCompetitor('')
      setError(null) // Clear any previous error
    }
  }

  const removeAdditionalCompetitor = (index: number) => {
    setAdditionalCompetitors(additionalCompetitors.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Competitor Analysis</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Analyze competitor websites to extract seed keywords for your SEO strategy.
          This step uses DataForSEO to identify high-value keywords from competitor domains.
        </p>
      </div>

      {/* Add Competitors */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Add Competitors (1-3 required)</h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter competitor URL..."
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
            className="flex-1 border p-2 rounded text-sm"
            disabled={additionalCompetitors.length >= 3}
          />
          <Button
            type="button"
            onClick={addCompetitor}
            disabled={!newCompetitor.trim() || additionalCompetitors.length >= 3}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Additional Competitors List */}
        {additionalCompetitors.length > 0 && (
          <div className="space-y-1">
            {additionalCompetitors.map((url, index) => (
              <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                • {url}
                <button
                  onClick={() => removeAdditionalCompetitor(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
          {error}
          {error.includes('No keywords found') && (
            <div className="mt-2 text-xs">
              Consider adding competitors with stronger SEO presence or more established websites.
            </div>
          )}
        </div>
      )}

      {/* Success Display */}
      {state === 'success' && (
        <div className="rounded-md border border-green-600/30 bg-green-50 p-3 text-sm text-green-800">
          ✓ Competitor analysis completed successfully! Redirecting to next step...
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={runStep}
        disabled={state === 'running' || state === 'success' || additionalCompetitors.length < 1}
        className="min-w-[160px]"
      >
        {state === 'running' ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing {additionalCompetitors.length} competitors…
          </>
        ) : state === 'success' ? (
          <>
            ✓ Completed
          </>
        ) : (
          `Analyze ${additionalCompetitors.length} competitor${additionalCompetitors.length !== 1 ? 's' : ''}`
        )}
      </Button>

      {/* Info */}
      {additionalCompetitors.length === 0 && (
        <div className="text-xs text-muted-foreground">
          Add at least one competitor URL to begin analysis.
        </div>
      )}
    </div>
  )
}
