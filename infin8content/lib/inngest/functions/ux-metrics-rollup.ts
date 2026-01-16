import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { computeUXMetricsRollup } from '@/lib/services/ux-metrics-rollup'

/**
 * Weekly UX metrics rollup job
 * Runs every Sunday at 02:00 UTC to compute the prior week's metrics
 * and stores them in ux_metrics_weekly_rollups
 */
export const uxMetricsRollup = inngest.createFunction(
  {
    id: 'ux-metrics/weekly-rollup',
    concurrency: { limit: 1 }, // Only one rollup at a time
  },
  { cron: '0 2 * * 0' }, // Every Sunday at 02:00 UTC
  async ({ step }: any) => {
    const supabase = createServiceRoleClient()

    return await step.run('compute-weekly-rollups', async () => {
      // Calculate the week start date for the prior week
      const now = new Date()
      const currentDayOfWeek = now.getUTCDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysSinceSunday = currentDayOfWeek
      const priorSunday = new Date(now)
      priorSunday.setUTCDate(now.getUTCDate() - daysSinceSunday - 7)
      priorSunday.setUTCHours(0, 0, 0)
      const weekStart = priorSunday.toISOString().split('T')[0] // YYYY-MM-DD

      console.log(`[UX Metrics Rollup] Computing rollups for week starting: ${weekStart}`)

      // Get all organizations that had activity in the prior week
      const { data: activeOrgs, error: orgsError } = await (supabase
        .from('ux_metrics_events' as any)
        .select('org_id')
        .gte('created_at', priorSunday.toISOString())
        .lt('created_at', new Date(priorSunday.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()) as unknown as Promise<{
          data: Array<{ org_id: string }> | null
          error: any
        }>)

      if (orgsError) {
        console.error('[UX Metrics Rollup] Failed to fetch active organizations:', orgsError)
        return { success: false, error: orgsError.message }
      }

      if (!activeOrgs || activeOrgs.length === 0) {
        console.log('[UX Metrics Rollup] No active organizations found for the week')
        return { success: true, processed: 0, message: 'No active organizations' }
      }

      const uniqueOrgIds = Array.from(new Set(activeOrgs.map(o => o.org_id)))
      console.log(`[UX Metrics Rollup] Processing ${uniqueOrgIds.length} organizations`)

      let processed = 0
      let errors = 0

      for (const orgId of uniqueOrgIds) {
        try {
          const metrics = await computeUXMetricsRollup(orgId, weekStart)

          const { error: insertError } = await (supabase
            .from('ux_metrics_weekly_rollups' as any)
            .upsert({
              org_id: orgId,
              week_start: weekStart,
              metrics,
              created_at: new Date().toISOString(),
            }, {
              onConflict: 'org_id,week_start',
            }) as unknown as Promise<{ error: any }>)

          if (insertError) {
            console.error(`[UX Metrics Rollup] Failed to upsert rollup for org ${orgId}:`, insertError)
            errors += 1
          } else {
            processed += 1
            console.log(`[UX Metrics Rollup] Processed rollup for org ${orgId}`)
          }
        } catch (orgError) {
          console.error(`[UX Metrics Rollup] Error processing org ${orgId}:`, orgError)
          errors += 1
        }
      }

      console.log(`[UX Metrics Rollup] Completed: ${processed} processed, ${errors} errors`)

      return {
        success: true,
        week_start: weekStart,
        processed,
        errors,
        total_orgs: uniqueOrgIds.length,
      }
    })
  }
)
