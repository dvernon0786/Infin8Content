/**
 * POST /api/v1/articles/[id]/publish
 * Epic 11, Story 11.2 — Publish an article to a CMS connection via API key.
 *
 * Body: { cms_connection_id: string, status?: 'draft' | 'publish' }
 * Returns: { publishing_id, status, published_url? }
 */

import { z, ZodError } from 'zod'
import { withApiAuth } from '@/lib/api-auth/with-api-auth'
import { v1Ok, v1Error } from '@/lib/api-auth/v1-response'
import { publishArticle } from '@/lib/services/publishing/wordpress-publisher'

interface RouteParams {
  params: Promise<{ id: string }>
}

const publishSchema = z.object({
  cms_connection_id: z.string().uuid(),
  status: z.enum(['draft', 'publish']).default('publish'),
})

export function POST(request: Request, { params }: RouteParams) {
  return withApiAuth('articles:write', async ({ validated }) => {
    const { id: articleId } = await params

    let body: any
    try {
      body = publishSchema.parse(await request.json())
    } catch (err) {
      if (err instanceof ZodError) {
        return v1Error('VALIDATION_ERROR', err.issues[0].message, 400)
      }
      return v1Error('INVALID_JSON', 'Request body must be valid JSON', 400)
    }

    try {
      const result = await publishArticle({
        articleId,
        organizationId: validated.orgId,
        connectionId: body.cms_connection_id,
      })

      return v1Ok({
        status: 'published',
        published_url: result.url,
        post_id: result.postId,
        already_published: result.alreadyPublished,
      })
    } catch (err: any) {
      return v1Error('PUBLISH_FAILED', err.message || 'Publishing failed', 502)
    }
  })(request, { params })
}
