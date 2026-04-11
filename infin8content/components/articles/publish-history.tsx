'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Loader2, Globe } from 'lucide-react'
import { CMS_PLATFORM_LABELS } from '@/lib/services/publishing/cms-engine'
import type { CMSPlatform } from '@/lib/services/publishing/cms-engine'

interface PublishRecord {
  id: string
  platform: CMSPlatform
  platform_url: string | null
  platform_post_id: string | null
  published_at: string
  connection_name?: string
}

interface PublishHistoryProps {
  articleId: string
}

export function PublishHistory({ articleId }: PublishHistoryProps) {
  const [records, setRecords] = useState<PublishRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/articles/${articleId}/publish-history`)
      .then(r => r.json())
      .then(data => setRecords(data.records || []))
      .catch(() => setRecords([]))
      .finally(() => setIsLoading(false))
  }, [articleId])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-neutral-400 py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="font-lato text-xs">Loading publish history...</span>
      </div>
    )
  }

  if (records.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="font-lato text-xs font-medium text-neutral-500 uppercase tracking-wide">
        Published to
      </p>
      {records.map(record => (
        <div key={record.id} className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-green-500 shrink-0" />
          <span className="font-lato text-sm text-neutral-700">
            {record.connection_name || CMS_PLATFORM_LABELS[record.platform] || record.platform}
          </span>
          {record.platform_url && (
            <a
              href={record.platform_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-lato text-xs text-blue-600 hover:text-blue-800"
            >
              View
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <span className="font-lato text-xs text-neutral-400 ml-auto">
            {new Date(record.published_at).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  )
}
