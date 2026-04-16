'use client'

// Epic 12: Story 12-8 — Announcement Banner
// Dismissible top-of-dashboard banner for feature announcements.
// Gated by ENABLE_FEATURE_ANNOUNCEMENTS feature flag (checked server-side by parent).

import { useEffect, useState } from 'react'
import { X, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Announcement {
  id: string
  title: string
  body: string
  cta_url?: string | null
  cta_label?: string | null
}

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/announcements')
      .then((r) => (r.ok ? r.json() : { announcements: [] }))
      .then((data) => {
        const list: Announcement[] = data.announcements ?? []
        if (list.length > 0) setAnnouncement(list[0]) // Show most recent unread
      })
      .catch(() => {/* silently ignore — non-critical UI */})
  }, [])

  const dismiss = async () => {
    setDismissed(true)
    if (announcement) {
      await fetch(`/api/announcements/${announcement.id}/read`, { method: 'POST' })
    }
  }

  if (!announcement || dismissed) return null

  return (
    <div className="flex items-center gap-3 bg-[--brand-electric-blue] text-white px-4 py-2.5 text-sm font-lato">
      <Megaphone className="h-4 w-4 shrink-0 opacity-80" />
      <p className="flex-1 leading-snug">
        <strong className="font-semibold">{announcement.title}: </strong>
        {announcement.body}
        {announcement.cta_url && (
          <>
            {' '}
            <a
              href={announcement.cta_url}
              className="underline font-semibold hover:opacity-80 transition-opacity"
            >
              {announcement.cta_label ?? 'Learn more'} →
            </a>
          </>
        )}
      </p>
      <Button
        variant="ghost"
        size="icon"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="h-6 w-6 text-white hover:bg-white/20 shrink-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
