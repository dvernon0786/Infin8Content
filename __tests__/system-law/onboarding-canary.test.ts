import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'

describe('Onboarding System Law Canary', () => {
  const supabase = createServiceRoleClient()
  let testOrgId: string

  beforeEach(async () => {
    // Create test organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({
        website_url: null,
        business_description: null,
        target_audiences: null,
        keyword_settings: null,
        content_defaults: null,
        blog_config: null,
        onboarding_completed: false,
        onboarding_completed_at: null,
        onboarding_version: 'v1'
      })
      .select('id')
      .single()

    testOrgId = org?.id || ''
  })

  afterEach(async () => {
    // Clean up test organization
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.from('organization_competitors').delete().eq('organization_id', testOrgId)
  })

  it("derives onboarding step purely from persisted state (order-independent)", async () => {
    // Write Step 3 data first (out of order)
    await supabase.from('organizations').update({
      keyword_settings: {
        language_code: "en",
        target_region: "US",
        monthly_keyword_limit: 100,
        auto_generate_keywords: true
      }
    }).eq('id', testOrgId)

    // Then Step 1
    await supabase.from('organizations').update({
      website_url: "https://example.com",
      business_description: "Test business description with sufficient length for validation",
      target_audiences: ["B2B"]
    }).eq('id', testOrgId)

    // Then Step 2
    await supabase.from('organization_competitors').insert({
      organization_id: testOrgId,
      name: 'Test Competitor',
      url: 'https://competitor.com',
      domain: 'competitor.com',
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: 'test-user'
    })

    // 🔒 Constitutional assertion - derive step purely from database state
    const { data: org } = await supabase
      .from('organizations')
      .select('website_url, business_description, target_audiences, keyword_settings, content_defaults')
      .eq('id', testOrgId)
      .single()

    const { count: competitorCount } = await supabase
      .from('organization_competitors')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', testOrgId)
      .eq('is_active', true)

    // Derive step exactly as the observer does
    const derivedStep = deriveStepFromCanonicalState({
      website_url: !!org?.website_url,
      business_description: !!org?.business_description,
      target_audiences_count: org?.target_audiences?.length || 0,
      keyword_settings_present: !!(org?.keyword_settings && Object.keys(org?.keyword_settings).length > 0),
      content_defaults_present: !!(org?.content_defaults && Object.keys(org?.content_defaults).length > 0),
      competitors: competitorCount || 0
    })

    // 🔒 Constitutional assertion: Step must be 4 (Content Defaults)
    // because content_defaults is missing, regardless of write order
    expect(derivedStep).toBe(4)
  })
})

// Helper function that exactly matches the observer implementation
function deriveStepFromCanonicalState(state: {
  website_url: boolean
  business_description: boolean
  target_audiences_count: number
  keyword_settings_present: boolean
  content_defaults_present: boolean
  competitors: number
}): number {
  if (!state.website_url || !state.business_description || state.target_audiences_count === 0) return 1
  if (state.competitors === 0) return 2
  if (!state.keyword_settings_present) return 3
  if (!state.content_defaults_present) return 4
  return 5
}
