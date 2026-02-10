import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateOnboarding } from '@/lib/onboarding/onboarding-validator'
import { getCurrentUser } from '@/lib/supabase/get-current-user'

/**
 * READ-ONLY onboarding observer
 * 
 * This endpoint ONLY observes and reports onboarding state
 * It NEVER mutates data - that's what /api/onboarding/persist is for
 * 
 * System Law: Tests observe. Endpoints persist. Validators decide. Flags are derived.
 */
export async function GET(request: Request) {
  // 🔒 Get org from auth, not query parameter
  const currentUser = await getCurrentUser()
  
  if (!currentUser || !currentUser.org_id) {
    return NextResponse.json(
      { error: 'User not authenticated or missing organization' },
      { status: 401 }
    )
  }
  
  const orgId = currentUser.org_id

  const supabase = createServiceRoleClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select(
      'id, website_url, business_description, target_audiences, keyword_settings, content_defaults'
    )
    .eq('id', orgId)
    .single()

  if (error || !org) {
    return NextResponse.json(
      { error: 'Organization not found' },
      { status: 404 }
    )
  }

  const { count: competitorCount } = await supabase
    .from('organization_competitors')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('is_active', true)

  const validation = await validateOnboarding(orgId)

  return NextResponse.json({
    orgId,
    canonical_state: {
      website_url: !!(org as any).website_url,
      business_description: !!(org as any).business_description,
      target_audiences_count: (org as any).target_audiences?.length ?? 0,
      keyword_settings_present: !!(org as any).keyword_settings && Object.keys((org as any).keyword_settings).length > 0,
      content_defaults_present: !!(org as any).content_defaults && Object.keys((org as any).content_defaults).length > 0,
      competitors: competitorCount ?? 0
    },
    validation
  })
}
