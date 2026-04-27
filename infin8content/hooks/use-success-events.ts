'use client'

// Epic 12: Story 12-6 — Client hook for success events
// Fetches completed onboarding success events for the current user's org

import { useEffect, useState } from 'react'
import { SUCCESS_EVENTS, type SuccessEventType } from '@/lib/services/onboarding/user-success-tracker'

interface UseSuccessEventsResult {
  completed: Set<SuccessEventType>
  isLoading: boolean
  recordEvent: (event: SuccessEventType) => Promise<void>
  refetch: () => void
}

export function useSuccessEvents(): UseSuccessEventsResult {
  const [completed, setCompleted] = useState<Set<SuccessEventType>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetch('/api/onboarding/success-events')
      .then((r) => r.ok ? r.json() : { events: [] })
      .then((data) => {
        if (!cancelled) {
          setCompleted(new Set(data.events as SuccessEventType[]))
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [tick])

  const recordEvent = async (event: SuccessEventType) => {
    await fetch('/api/onboarding/success-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
    })
    setTick((t) => t + 1)
  }

  return { completed, isLoading, recordEvent, refetch: () => setTick((t) => t + 1) }
}

export { SUCCESS_EVENTS }
