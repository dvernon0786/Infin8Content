'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export interface CreateWorkflowFormProps {
  isTrial?: boolean
}

export function CreateWorkflowForm({ isTrial = false }: CreateWorkflowFormProps) {
  const router = useRouter()
  const [name, setName] = useState('AI Marketing Strategy')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    try {
      setCreating(true)
      setError(null)

      const res = await fetch('/api/intent/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to create workflow')
      }

      router.push('/dashboard')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Workflow name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={creating}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div>
        {isTrial && (
          <p className="font-lato text-xs text-neutral-500 text-center mb-2">
            Most users generate their first article in under 3 minutes.
          </p>
        )}
        <Button
          type="submit"
          disabled={creating || !name.trim()}
          className="w-full"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating…
            </>
          ) : (
            'Generate Article'
          )}
        </Button>
      </div>
    </form>
  )
}
