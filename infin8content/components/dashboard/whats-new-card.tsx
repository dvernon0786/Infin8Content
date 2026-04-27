'use client'

// Epic 12: Story 12-2 — What's New Card
// Dismissible card surfacing the latest feature highlight.
// Dismiss state lives in localStorage to avoid extra DB calls.

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Sparkles } from 'lucide-react'

const STORAGE_KEY = 'infin8_whats_new_dismissed_v1'

export function WhatsNewCard() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <Card className="border-[--brand-infinite-purple]/20 bg-linear-to-r from-[--brand-infinite-purple]/5 to-white relative overflow-hidden">
      <CardContent className="p-4">
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[--brand-infinite-purple]/10 shrink-0">
            <Sparkles className="h-4 w-4 text-[--brand-infinite-purple]" />
          </div>
          <div className="min-w-0">
            <p className="font-poppins font-semibold text-sm text-neutral-900">
              What&apos;s new: Full Workflow Engine
            </p>
            <p className="font-lato text-xs text-neutral-500 mt-0.5 leading-relaxed">
              Create end-to-end content strategies — from ICP to published articles — with the new Workflow feature.
            </p>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-xs text-[--brand-infinite-purple] mt-1"
              asChild
            >
              <a href="/dashboard/workflows">Try Workflows →</a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
