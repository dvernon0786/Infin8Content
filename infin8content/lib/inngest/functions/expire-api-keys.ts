/**
 * lib/inngest/functions/expire-api-keys.ts
 * Epic 11, Story 11.1 — Daily cron to expire API keys past their expiry date.
 *
 * Registered in: app/api/inngest/route.ts
 */

import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const expireApiKeys = inngest.createFunction(
  {
    id: 'expire-api-keys',
    name: 'Expire API Keys',
    // Runs once a day at 02:00 UTC
    concurrency: { limit: 1 },
  },
  { cron: '0 2 * * *' },
  async ({ logger }) => {
    const db = createServiceRoleClient()

    const { data, error } = await (db
      .from('api_keys')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .not('expires_at', 'is', null)
      .select('id') as any)

    if (error) {
      logger.error('Failed to expire API keys', { error })
      throw new Error('Failed to expire API keys')
    }

    const count = data?.length ?? 0
    logger.info(`Expired ${count} API keys`)
    return { expired: count }
  }
)
