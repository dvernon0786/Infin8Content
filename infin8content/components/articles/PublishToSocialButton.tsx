'use client'

/**
 * components/articles/PublishToSocialButton.tsx
 *
 * Self-contained trigger button that opens <SocialPublishModal>.
 * Drop it next to <PublishToCmsButton> on the article detail page.
 *
 * Props:
 *   articleId      — UUID of the article
 *   articleTitle   — title string for the modal header
 *   articleStatus  — from articles.status; button disabled unless "completed"
 *   cmsStatus      — from articles.cms_status; shows "Published" badge when "published"
 */

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SocialPublishModal } from './SocialPublishModal'

interface PublishToSocialButtonProps {
  articleId: string
  articleTitle: string
  articleStatus: string
  cmsStatus?: string | null
}

export function PublishToSocialButton({
  articleId,
  articleTitle,
  articleStatus,
  cmsStatus,
}: PublishToSocialButtonProps) {
  const [open, setOpen] = useState(false)
  const [wasPublished, setWasPublished] = useState(cmsStatus === 'published')

  const canPublish = articleStatus === 'completed'

  if (!canPublish) return null

  return (
    <>
      <div className="flex items-center gap-3">
        {wasPublished && (
          <Badge variant="success" className="text-xs">
            ✓ Published to social
          </Badge>
        )}
        <Button
          variant={wasPublished ? 'outline' : 'secondary'}
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          {wasPublished ? 'Republish' : 'Publish to Social'}
        </Button>
      </div>

      <SocialPublishModal
        articleId={articleId}
        articleTitle={articleTitle}
        open={open}
        onOpenChange={setOpen}
        onPublished={() => setWasPublished(true)}
      />
    </>
  )
}
