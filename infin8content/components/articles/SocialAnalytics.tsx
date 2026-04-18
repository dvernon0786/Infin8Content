'use client'

/**
 * components/articles/SocialAnalytics.tsx
 *
 * Inline analytics card shown on the article detail page once the article
 * has been published to social (publish_references.social_status === 'published').
 *
 * Data is fetched from GET /api/v1/articles/:id/social-analytics.
 * Populated by the Inngest fetch-and-store-analytics step ~1h after publish.
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, Heart, MessageCircle, Share2, Eye, Users } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SocialAnalyticsRow {
  network: string
  username: string | null
  likes: number
  comments: number
  shares: number
  views: number
  impressions: number
  reach: number
  engagement_rate: number
  fetched_at: string
}

interface SocialPublishRef {
  outstand_post_id: string
  social_status: 'pending' | 'published' | 'failed'
  social_error: string | null
  analytics_synced_at: string | null
  analytics_data: Record<string, number> | null
}

interface SocialAnalyticsProps {
  articleId: string
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  Icon,
}: {
  label: string
  value: number
  Icon: React.ElementType
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
      <div className="flex items-center gap-1.5 text-neutral-400">
        <Icon className="h-3.5 w-3.5" />
        <span className="font-lato text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-poppins text-neutral-900 text-lg font-semibold leading-tight">
        {value.toLocaleString()}
      </p>
    </div>
  )
}

function networkLabel(network: string) {
  const map: Record<string, string> = {
    twitter: 'X / Twitter',
    x: 'X / Twitter',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    facebook: 'Facebook',
  }
  return map[network.toLowerCase()] ?? network
}

function statusBadge(status: SocialPublishRef['social_status']) {
  switch (status) {
    case 'published':
      return <Badge variant="success">Published</Badge>
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SocialAnalytics({ articleId }: SocialAnalyticsProps) {
  const [ref, setRef] = useState<SocialPublishRef | null>(null)
  const [rows, setRows] = useState<SocialAnalyticsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/v1/articles/${articleId}/social-analytics`)
      .then((r) => r.json())
      .then((data) => {
        setRef(data.publishRef ?? null)
        setRows(data.analytics ?? [])
      })
      .catch(() => setError('Failed to load social analytics'))
      .finally(() => setLoading(false))
  }, [articleId])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 text-neutral-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-lato text-sm">Loading social analytics…</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !ref) return null

  const ag = ref.analytics_data
  const hasSyncedMetrics = !!ref.analytics_synced_at && !!ag

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-poppins text-neutral-900 text-base">
            Social Performance
          </CardTitle>
          {statusBadge(ref.social_status)}
        </div>
        {ref.analytics_synced_at && (
          <p className="font-lato text-xs text-neutral-400 mt-1">
            Last synced{' '}
            {new Date(ref.analytics_synced_at).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Pending analytics notice */}
        {!hasSyncedMetrics && ref.social_status === 'published' && (
          <div className="rounded-lg border border-dashed border-neutral-200 px-4 py-3 text-center">
            <TrendingUp className="h-5 w-5 text-neutral-300 mx-auto mb-2" />
            <p className="font-lato text-sm text-neutral-500">
              Analytics will appear here approximately 1 hour after publishing.
            </p>
          </div>
        )}

        {/* Error from Outstand */}
        {ref.social_status === 'failed' && ref.social_error && (
          <div className="rounded-lg border border-[--color-error]/20 bg-[--color-error]/5 px-4 py-3">
            <p className="font-lato text-sm text-[--color-error]">{ref.social_error}</p>
          </div>
        )}

        {/* Aggregated metrics */}
        {hasSyncedMetrics && ag && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatTile label="Total Views" value={ag.total_views ?? 0} Icon={Eye} />
            <StatTile label="Impressions" value={ag.total_impressions ?? 0} Icon={Users} />
            <StatTile label="Reach" value={ag.total_reach ?? 0} Icon={TrendingUp} />
            <StatTile label="Likes" value={ag.total_likes ?? 0} Icon={Heart} />
            <StatTile label="Comments" value={ag.total_comments ?? 0} Icon={MessageCircle} />
            <StatTile label="Shares" value={ag.total_shares ?? 0} Icon={Share2} />
          </div>
        )}

        {/* Per-account breakdown */}
        {rows.length > 0 && (
          <div className="space-y-3">
            <p className="font-lato text-xs font-medium text-neutral-500 uppercase tracking-wide">
              By account
            </p>
            {rows.map((row) => (
              <div
                key={`${row.network}-${row.username}`}
                className="rounded-lg border border-neutral-100 px-4 py-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-lato text-sm font-medium text-neutral-800">
                    {networkLabel(row.network)}
                    {row.username && (
                      <span className="text-neutral-400 font-normal ml-1">@{row.username}</span>
                    )}
                  </span>
                  {row.engagement_rate > 0 && (
                    <span className="font-poppins text-xs font-semibold text-[--color-primary-blue]">
                      {(row.engagement_rate * 100).toFixed(1)}% eng.
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Likes', val: row.likes },
                    { label: 'Comments', val: row.comments },
                    { label: 'Shares', val: row.shares },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className="font-poppins text-sm font-semibold text-neutral-900">
                        {val.toLocaleString()}
                      </p>
                      <p className="font-lato text-xs text-neutral-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
