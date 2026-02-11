'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface Step1ICPFormProps {
  workflowId: string
}

export function Step1ICPForm({ workflowId }: Step1ICPFormProps) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    organizationName: '',
    organizationUrl: '',
    organizationLinkedInUrl: '',
  })

  const handleSubmit = async () => {
    try {
      setIsRunning(true)
      setError(null)

      // Validate form inputs
      if (!form.organizationName || !form.organizationUrl || !form.organizationLinkedInUrl) {
        setError('All fields are required to generate ICP')
        return
      }

      // Validate URL format
      try {
        new URL(form.organizationUrl)
        new URL(form.organizationLinkedInUrl)
      } catch {
        setError('Please enter valid URLs')
        return
      }

      const res = await fetch(
        `/api/intent/workflows/${workflowId}/step_0_auth`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_name: form.organizationName,
            organization_url: form.organizationUrl,
            organization_linkedin_url: form.organizationLinkedInUrl,
          }),
        }
      )

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to generate ICP')
      }

      // Fire analytics event on success
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('workflow_step_completed', {
          workflow_id: workflowId,
          step: 1,
        })
      }

      // Redirect to next step
      router.push(`/workflows/${workflowId}/steps/2`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      
      // Fire analytics event on failure
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track('workflow_step_failed', {
          workflow_id: workflowId,
          step: 1,
          error: err.message,
        })
      }
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ideal Customer Profile</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Organization Name *
          </label>
          <Input
            placeholder="Enter organization name"
            value={form.organizationName}
            onChange={(e) => setForm(prev => ({
              ...prev,
              organizationName: e.target.value
            }))}
            disabled={isRunning}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Organization Website *
          </label>
          <Input
            type="url"
            placeholder="https://example.com"
            value={form.organizationUrl}
            onChange={(e) => setForm(prev => ({
              ...prev,
              organizationUrl: e.target.value
            }))}
            disabled={isRunning}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Organization LinkedIn *
          </label>
          <Input
            type="url"
            placeholder="https://linkedin.com/company/example"
            value={form.organizationLinkedInUrl}
            onChange={(e) => setForm(prev => ({
              ...prev,
              organizationLinkedInUrl: e.target.value
            }))}
            disabled={isRunning}
            className="w-full"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Button
          className="w-full"
          disabled={isRunning}
          onClick={handleSubmit}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating ICP…
            </>
          ) : (
            'Generate ICP'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
