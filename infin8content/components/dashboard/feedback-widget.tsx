'use client'

// Epic 12: Story 12-9 — User Feedback Widget
// NPS dialog triggered after first article generated.
// Re-trigger prevention via localStorage (30-day cooldown).
// Gated by ENABLE_FEEDBACK_WIDGET feature flag (checked server-side by parent).

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2 } from 'lucide-react'

const STORAGE_KEY = 'infin8_nps_last_shown'
const COOLDOWN_DAYS = 30

function shouldShowFeedback(): boolean {
  const last = localStorage.getItem(STORAGE_KEY)
  if (!last) return true
  const diff = Date.now() - Number(last)
  return diff > COOLDOWN_DAYS * 24 * 60 * 60 * 1000
}

interface FeedbackWidgetProps {
  /** Pass true when the trigger condition is met (e.g., first article generated) */
  triggerShow: boolean
}

export function FeedbackWidget({ triggerShow }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (triggerShow && shouldShowFeedback()) {
      // Slight delay so it doesn't interrupt the success moment
      const t = setTimeout(() => setOpen(true), 1500)
      return () => clearTimeout(t)
    }
  }, [triggerShow])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setOpen(false)
  }

  const submit = async () => {
    if (score === null) return
    setSubmitting(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_type: 'nps',
          nps_score: score,
          body: comment || null,
          trigger_event: 'first_article_generated',
        }),
      })
      localStorage.setItem(STORAGE_KEY, String(Date.now()))
      setSubmitted(true)
      setTimeout(() => setOpen(false), 2000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss() }}>
      <DialogContent className="sm:max-w-sm">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="h-10 w-10 text-[--color-success]" />
            <p className="font-poppins font-semibold text-neutral-900">Thanks for the feedback!</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-poppins text-lg">How are we doing?</DialogTitle>
              <DialogDescription className="font-lato text-sm text-neutral-500">
                On a scale of 0–10, how likely are you to recommend Infin8Content?
              </DialogDescription>
            </DialogHeader>

            {/* NPS Score */}
            <div className="flex gap-1 justify-between mt-1">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setScore(i)}
                  className={`flex-1 py-2 rounded-md text-sm font-lato font-medium transition-colors ${
                    score === i
                      ? 'bg-[--brand-electric-blue] text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400 font-lato -mt-1">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>

            <Textarea
              placeholder="Any comments? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="text-sm font-lato resize-none h-20"
            />

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={dismiss}>
                Skip
              </Button>
              <Button
                size="sm"
                onClick={submit}
                disabled={score === null || submitting}
                className="bg-[--brand-electric-blue] text-white hover:bg-[--brand-electric-blue]/90"
              >
                Submit
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
