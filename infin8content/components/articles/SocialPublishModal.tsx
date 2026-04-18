'use client'

/**
 * components/articles/SocialPublishModal.tsx
 *
 * Modal that:
 *  1. Fetches the AI caption via GET /api/v1/articles/:id/caption on open
 *  2. Lets the user edit the caption inline
 *  3. Shows the org's connected social accounts
 *  4. Triggers POST /api/v1/articles/:id/publish-social on confirm
 *  5. Shows a success/error state
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Share2, CheckCircle, AlertCircle, Twitter, Linkedin, Instagram } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SocialAccount {
  outstand_account_id: string
  network: string
  username: string | null
}

interface SocialPublishModalProps {
  articleId: string
  articleTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful publish so the parent can refresh UI state */
  onPublished?: () => void
}

type ModalState = 'loading' | 'ready' | 'publishing' | 'success' | 'error'

// ── Network icon helper ───────────────────────────────────────────────────────

function NetworkIcon({ network, className }: { network: string; className?: string }) {
  const cls = cn('h-4 w-4 shrink-0', className)
  switch (network.toLowerCase()) {
    case 'twitter':
    case 'x':
      return <Twitter className={cls} />
    case 'linkedin':
      return <Linkedin className={cls} />
    case 'instagram':
      return <Instagram className={cls} />
    default:
      return <Share2 className={cls} />
  }
}

function networkIconClass(network: string): string {
  switch (network.toLowerCase()) {
    case 'twitter':
    case 'x':
      return 'text-[--social-twitter]'
    case 'linkedin':
      return 'text-[--social-linkedin]'
    case 'instagram':
      return 'text-[--social-instagram]'
    default:
      return 'text-[--color-primary-blue]'
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SocialPublishModal({
  articleId,
  articleTitle,
  open,
  onOpenChange,
  onPublished,
}: SocialPublishModalProps) {
  const [state, setState] = useState<ModalState>('loading')
  const [caption, setCaption] = useState('')
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [isRegenerating, setIsRegenerating] = useState(false)

  // ── Fetch caption + connected accounts ────────────────────────────────────

  const fetchCaption = useCallback(async () => {
    setIsRegenerating(true)
    try {
      const res = await fetch(`/api/v1/articles/${articleId}/caption`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `Failed to generate caption (${res.status})`)
      }
      const { caption: c } = await res.json()
      setCaption(c)
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Failed to generate caption')
      setState('error')
    } finally {
      setIsRegenerating(false)
    }
  }, [articleId])

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/social/accounts`)
      if (!res.ok) return
      const { accounts: a } = await res.json()
      setAccounts(a ?? [])
    } catch {
      // Non-fatal — show 0 accounts
    }
  }, [])

  // Reset + load when modal opens
  useEffect(() => {
    if (!open) return
    setState('loading')
    setCaption('')
    setErrorMsg('')

    Promise.all([fetchCaption(), fetchAccounts()]).then(() => {
      setState((s) => (s === 'loading' ? 'ready' : s))
    })
  }, [open, fetchCaption, fetchAccounts])

  // ── Publish handler ───────────────────────────────────────────────────────

  const handlePublish = async () => {
    setState('publishing')
    try {
      const res = await fetch(`/api/v1/articles/${articleId}/publish-social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'publish' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `Publish failed (${res.status})`)
      }
      setState('success')
      onPublished?.()
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Publish failed')
      setState('error')
    }
  }

  const charCount = caption.length
  const isOverLimit = charCount > 280

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] border-neutral-200 gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--brand-gradient)' }}
            >
              <Share2 className="h-4.5 w-4.5 text-white" />
            </div>
            <DialogTitle className="font-poppins text-neutral-900 text-lg leading-tight">
              Publish to Social
            </DialogTitle>
          </div>
          <DialogDescription className="font-lato text-neutral-500 text-sm pl-12">
            {articleTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Loading state */}
          {state === 'loading' && (
            <div className="flex flex-col items-center py-10 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-[--color-primary-blue]" />
              <p className="font-lato text-neutral-500 text-sm">Generating caption…</p>
            </div>
          )}

          {/* Success state */}
          {state === 'success' && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-14 h-14 rounded-full bg-[--color-success]/10 flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-[--color-success]" />
              </div>
              <p className="font-poppins text-neutral-900 font-semibold text-base">
                Publish workflow started!
              </p>
              <p className="font-lato text-neutral-500 text-sm text-center max-w-xs">
                Your post is being published across all connected accounts.
                Analytics will sync automatically in ~1 hour.
              </p>
            </div>
          )}

          {/* Error state */}
          {state === 'error' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-[--color-error]/10 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-[--color-error]" />
              </div>
              <p className="font-poppins text-neutral-900 font-semibold text-base">
                Something went wrong
              </p>
              <p className="font-lato text-neutral-500 text-sm text-center max-w-xs">
                {errorMsg}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setErrorMsg('')
                  setState('loading')
                  Promise.all([fetchCaption(), fetchAccounts()]).then(() =>
                    setState((s) => (s === 'loading' ? 'ready' : s)),
                  )
                }}
              >
                Try again
              </Button>
            </div>
          )}

          {/* Ready / publishing state */}
          {(state === 'ready' || state === 'publishing') && (
            <>
              {/* Caption editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-lato text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Caption
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      setState('ready')
                      await fetchCaption()
                    }}
                    disabled={isRegenerating || state === 'publishing'}
                    className="inline-flex items-center gap-1.5 font-lato text-xs text-[--color-primary-blue] hover:text-[--blue-600] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Regenerate caption"
                  >
                    <RefreshCw className={cn('h-3 w-3', isRegenerating && 'animate-spin')} />
                    Regenerate
                  </button>
                </div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={state === 'publishing'}
                  rows={5}
                  className={cn(
                    'w-full resize-none rounded-lg border px-3 py-2.5 font-lato text-sm text-neutral-800 placeholder:text-neutral-400',
                    'focus:outline-none focus:ring-2 focus:ring-[--brand-electric-blue]/40 focus:border-[--color-primary-blue]',
                    'disabled:opacity-60 disabled:bg-neutral-50',
                    isOverLimit ? 'border-[--color-error]' : 'border-neutral-200',
                  )}
                  placeholder="Your social caption will appear here…"
                />
                <div className="flex justify-end">
                  <span
                    className={cn(
                      'font-lato text-xs',
                      isOverLimit ? 'text-[--color-error] font-semibold' : 'text-neutral-400',
                    )}
                  >
                    {charCount}/280
                  </span>
                </div>
              </div>

              {/* Connected accounts */}
              <div className="space-y-2">
                <p className="font-lato text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Publishing to
                </p>
                {accounts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-neutral-200 px-4 py-3 text-center">
                    <p className="font-lato text-sm text-neutral-400">
                      No social accounts connected.{' '}
                      <a
                        href="/dashboard/settings/social"
                        className="text-[--color-primary-blue] hover:underline"
                      >
                        Connect one
                      </a>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {accounts.map((acc) => (
                      <div
                        key={acc.outstand_account_id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1"
                      >
                        <NetworkIcon
                          network={acc.network}
                          className={cn('h-3.5 w-3.5', networkIconClass(acc.network))}
                        />
                        <span className="font-lato text-xs text-neutral-700">
                          {acc.username ?? acc.network}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {(state === 'ready' || state === 'publishing') && (
          <DialogFooter className="px-6 py-4 border-t border-neutral-100 flex flex-row gap-3 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={state === 'publishing'}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePublish}
              disabled={
                state === 'publishing' ||
                isOverLimit ||
                caption.trim().length === 0 ||
                accounts.length === 0
              }
              className="min-w-[120px]"
            >
              {state === 'publishing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  Publish now
                </>
              )}
            </Button>
          </DialogFooter>
        )}

        {state === 'success' && (
          <DialogFooter className="px-6 py-4 border-t border-neutral-100 sm:justify-end">
            <Button variant="primary" size="sm" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
