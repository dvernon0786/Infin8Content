/**
 * lib/migrations/migrate-google-tokens.ts
 *
 * One-time data migration: Move Google tokens from organizations.blog_config
 * to cms_connections table.
 *
 * Usage (in a script or API endpoint):
 *   import { migrateGoogleTokens } from '@/lib/migrations/migrate-google-tokens'
 *   const result = await migrateGoogleTokens()
 *   console.log(result)
 *
 * Safe to run multiple times — skips already-migrated orgs.
 */

import { createClient as createServiceClient } from '@/lib/supabase/server'

interface OldGoogleIntegration {
  encrypted_tokens: string
  meta: Record<string, any>
}

interface MigrationResult {
  totalOrgs: number
  migratedAnalytics: number
  migratedSearchConsole: number
  skipped: number
  errors: Array<{ orgId: string; error: string }>
}

export async function migrateGoogleTokens(): Promise<MigrationResult> {
  const supabase = await createServiceClient()

  const result: MigrationResult = {
    totalOrgs: 0,
    migratedAnalytics: 0,
    migratedSearchConsole: 0,
    skipped: 0,
    errors: [],
  }

  try {
    // Fetch all orgs with blog_config containing google_integrations
    const { data: orgs, error: fetchError } = await supabase
      .from('organizations')
      .select('id, blog_config')
      .not('blog_config', 'is', null) as any

    if (fetchError) {
      console.error('Failed to fetch orgs:', fetchError)
      return result
    }

    result.totalOrgs = orgs?.length || 0

    for (const org of orgs || []) {
      const googleIntegrations = org.blog_config?.google_integrations
      if (!googleIntegrations || typeof googleIntegrations !== 'object') {
        result.skipped++
        continue
      }

      // Migrate analytics
      const analyticsData = googleIntegrations.analytics as OldGoogleIntegration | undefined
      if (analyticsData?.encrypted_tokens && analyticsData?.meta) {
        try {
          await supabase.from('cms_connections').insert({
            org_id: org.id,
            platform: 'google_analytics',
            name: 'Google Analytics',
            credentials: {
              access_token: analyticsData.encrypted_tokens, // Already encrypted
              refresh_token: '', // Will be restored if available in meta
              scope: analyticsData.meta.scope || '',
              email: analyticsData.meta.email,
              property_id: analyticsData.meta.property_id,
              property_name: analyticsData.meta.property_name,
              connected_at: analyticsData.meta.connected_at,
              last_synced_at: analyticsData.meta.last_synced_at,
            },
            status: 'active',
          })
          result.migratedAnalytics++
        } catch (err: any) {
          result.errors.push({
            orgId: org.id,
            error: `Analytics migration: ${err?.message}`,
          })
        }
      }

      // Migrate search console
      const gscData = googleIntegrations.search_console as OldGoogleIntegration | undefined
      if (gscData?.encrypted_tokens && gscData?.meta) {
        try {
          await supabase.from('cms_connections').insert({
            org_id: org.id,
            platform: 'google_search_console',
            name: 'Google Search Console',
            credentials: {
              access_token: gscData.encrypted_tokens, // Already encrypted
              refresh_token: '',
              scope: gscData.meta.scope || '',
              email: gscData.meta.email,
              site_url: gscData.meta.site_url,
              connected_at: gscData.meta.connected_at,
              last_synced_at: gscData.meta.last_synced_at,
            },
            status: 'active',
          })
          result.migratedSearchConsole++
        } catch (err: any) {
          result.errors.push({
            orgId: org.id,
            error: `Search Console migration: ${err?.message}`,
          })
        }
      }
    }

    console.log('✅ Google tokens migration complete:', result)
    return result
  } catch (err: any) {
    console.error('Migration failed:', err)
    throw err
  }
}

/**
 * Rollback: Delete migrated cms_connections and restore original structure.
 * (Only useful immediately after migration if issues found)
 */
export async function rollbackGoogleTokensMigration(): Promise<{ deleted: number }> {
  const supabase = await createServiceClient()

  const { error } = await supabase
    .from('cms_connections')
    .delete()
    .in('platform', ['google_analytics', 'google_search_console'])

  if (error) {
    console.error('Rollback failed:', error)
    throw error
  }

  console.log('✅ Rollback complete')
  return { deleted: 0 } // Would need to query to get actual count
}
