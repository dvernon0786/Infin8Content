import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { crawlAndCacheWebsiteLinks } from '@/lib/services/article-generation/internal-linking-service'

/**
 * Triggered by: 'organization/website.url.saved' event
 * Fired from:   app/api/onboarding/business/route.ts (when website_url is saved)
 * Purpose:      Crawl the org's website with DataForSEO and cache the link map.
 *               Never called during article generation — only on org setup/update.
 */
export const crawlWebsiteLinks = inngest.createFunction(
  {
    id: 'website/crawl.links',
    concurrency: { limit: 3, key: 'event.data.orgId' },
    retries: 2,
  },
  { event: 'organization/website.url.saved' },
  async ({ event, step }: any) => {
    const { orgId, websiteUrl } = event.data
    const supabase = createServiceRoleClient()

    const result = await step.run('crawl-and-cache', async () => {
      return await crawlAndCacheWebsiteLinks({ websiteUrl, orgId, supabase })
    })

    return { orgId, ...result, success: result.success }
  }
)
