import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { deriveOnboardingState } from '@/lib/onboarding/onboarding-validator'

describe('Onboarding Completion Invariant', () => {
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
        integration: null,
        blog_config: null,
        onboarding_completed: false,
        onboarding_completed_at: null,
        onboarding_version: 'v1'
      })
      .select('id')
      .single() as { data: { id: string } | null, error: any }

    testOrgId = org?.id || ''
  })

  afterEach(async () => {
    // Clean up test organization
    await supabase.from('organizations').delete().eq('id', testOrgId)
    await supabase.from('organization_competitors').delete().eq('organization_id', testOrgId)
  })

  it('only completes onboarding when all canonical data exists', async () => {
    // Step 1: Business
    await supabase.from('organizations').update({
      website_url: 'https://example.com',
      business_description: 'Test business description with sufficient length for validation',
      target_audiences: ['Test Audience']
    }).eq('id', testOrgId)

    // ❌ Missing competitors, blog, content defaults, integration
    await deriveOnboardingState(testOrgId)
    let { data: org } = await supabase
      .from('organizations')
      .select('onboarding_completed')
      .eq('id', testOrgId)
      .single() as { data: { onboarding_completed: boolean } | null, error: any }

    expect(org?.onboarding_completed).toBe(false)

    // Step 2: Competitors
    await supabase.from('organization_competitors').insert({
      organization_id: testOrgId,
      name: 'Test Competitor',
      url: 'https://competitor.com',
      domain: 'competitor.com',
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: 'test-user'
    })

    // ❌ Missing blog, content defaults, integration
    await deriveOnboardingState(testOrgId)
    const orgResult = await supabase
      .from('organizations')
      .select('onboarding_completed')
      .eq('id', testOrgId)
      .single() as { data: { onboarding_completed: boolean } | null, error: any }
    org = orgResult.data

    expect(org?.onboarding_completed).toBe(false)

    // Step 3: Blog (keyword_settings)
    await supabase.from('organizations').update({
      keyword_settings: {
        target_region: 'United States',
        language_code: 'en',
        auto_generate_keywords: true,
        monthly_keyword_limit: 100
      }
    }).eq('id', testOrgId)

    // ❌ Missing content defaults, integration
    await deriveOnboardingState(testOrgId)
    const orgResult2 = await supabase
      .from('organizations')
      .select('onboarding_completed')
      .eq('id', testOrgId)
      .single() as { data: { onboarding_completed: boolean } | null, error: any }
    org = orgResult2.data

    expect(org?.onboarding_completed).toBe(false)

    // Step 4: Content Defaults
    await supabase.from('organizations').update({
      content_defaults: {
        language: 'english',
        tone: 'professional',
        style: 'informative',
        target_word_count: 1500,
        auto_publish: false
      }
    }).eq('id', testOrgId)

    // ❌ Missing integration
    await deriveOnboardingState(testOrgId)
    const orgResult3 = await supabase
      .from('organizations')
      .select('onboarding_completed')
      .eq('id', testOrgId)
      .single() as { data: { onboarding_completed: boolean } | null, error: any }
    org = orgResult3.data

    expect(org?.onboarding_completed).toBe(false)

    // Step 5: Integration (final key)
    await supabase.from('organizations').update({
      integration: {
        type: 'wordpress',
        site_url: 'https://example.com',
        username: 'admin',
        application_password: 'test-password'
      }
    }).eq('id', testOrgId)

    // ✅ All data present - should be complete
    await deriveOnboardingState(testOrgId)
    const { data: completedOrg } = await supabase
      .from('organizations')
      .select('onboarding_completed, onboarding_completed_at')
      .eq('id', testOrgId)
      .single() as {
        data: {
          onboarding_completed: boolean
          onboarding_completed_at: string | null
        } | null
        error: any
      }

    expect(completedOrg?.onboarding_completed).toBe(true)
    expect(completedOrg?.onboarding_completed_at).not.toBeNull()
  })

  it('cannot complete onboarding with partial data', async () => {
    // Add all steps except integration
    await supabase.from('organizations').update({
      website_url: 'https://example.com',
      business_description: 'Test business description with sufficient length for validation',
      target_audiences: ['Test Audience'],
      keyword_settings: {
        target_region: 'United States',
        language_code: 'en',
        auto_generate_keywords: true,
        monthly_keyword_limit: 100
      },
      content_defaults: {
        language: 'english',
        tone: 'professional',
        style: 'informative',
        target_word_count: 1500,
        auto_publish: false
      }
    }).eq('id', testOrgId)

    await supabase.from('organization_competitors').insert({
      organization_id: testOrgId,
      name: 'Test Competitor',
      url: 'https://competitor.com',
      domain: 'competitor.com',
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: 'test-user'
    })

    // ❌ Still missing integration
    const { data: org } = await supabase
      .from('organizations')
      .select('onboarding_completed')
      .eq('id', testOrgId)
      .single() as { data: { onboarding_completed: boolean } | null, error: any }

    expect(org?.onboarding_completed).toBe(false)
  })

  it('completion is deterministic and irreversible', async () => {
    // Complete all steps
    await supabase.from('organizations').update({
      website_url: 'https://example.com',
      business_description: 'Test business description with sufficient length for validation',
      target_audiences: ['Test Audience'],
      keyword_settings: {
        target_region: 'United States',
        language_code: 'en',
        auto_generate_keywords: true,
        monthly_keyword_limit: 100
      },
      content_defaults: {
        language: 'english',
        tone: 'professional',
        style: 'informative',
        target_word_count: 1500,
        auto_publish: false
      },
      integration: {
        type: 'wordpress',
        site_url: 'https://example.com',
        username: 'admin',
        application_password: 'test-password'
      }
    }).eq('id', testOrgId)

    await supabase.from('organization_competitors').insert({
      organization_id: testOrgId,
      name: 'Test Competitor',
      url: 'https://competitor.com',
      domain: 'competitor.com',
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: 'test-user'
    })

    // ✅ Should be complete
    const orgResult5 = await supabase
      .from('organizations')
      .select('onboarding_completed')
      .eq('id', testOrgId)
      .single() as { data: { onboarding_completed: boolean } | null, error: any }
    const org = orgResult5.data

    expect(org?.onboarding_completed).toBe(true)

    // Remove integration (break completion)
    await supabase.from('organizations').update({
      integration: null
    }).eq('id', testOrgId)

    // Re-run derivation — should NOT revert completion
    await deriveOnboardingState(testOrgId)

    // ❗ onboarding must remain true (irreversible)
    const { data: finalOrg } = await supabase
      .from('organizations')
      .select('onboarding_completed')
      .eq('id', testOrgId)
      .single() as { data: { onboarding_completed: boolean } | null, error: any }

    expect(finalOrg?.onboarding_completed).toBe(true)
  })
})
