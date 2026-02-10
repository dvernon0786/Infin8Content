import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateOnboarding } from '@/lib/onboarding/onboarding-validator'
import { getCurrentUser } from '@/lib/supabase/get-current-user'

const onboardingSchema = z.object({
  website_url: z.string().url(),
  business_description: z.string().min(20),
  target_audiences: z.array(z.string().min(2)),
  keyword_settings: z.object({
    target_region: z.string().min(2),
    language_code: z.string().min(2),
    auto_generate_keywords: z.boolean(),
    monthly_keyword_limit: z.number().min(1).max(1000)
  }),
  content_defaults: z.object({
    language: z.string().min(2),
    tone: z.enum(['professional', 'casual', 'formal', 'friendly']),
    style: z.enum(['informative', 'persuasive', 'educational']),
    target_word_count: z.number().min(500).max(10000),
    auto_publish: z.boolean()
  }),
  competitors: z.array(
    z.object({
      name: z.string().min(1),
      url: z.string().url(),
      description: z.string().optional()
    })
  ).min(1)
})

/**
 * POST /api/onboarding/persist
 * 
 * AUTHORITATIVE onboarding persistence endpoint
 * 
 * This endpoint PERSISTS data, it does not "decide" completion
 * Completion is DERIVED from data via validateOnboarding()
 * 
 * Flow: Validate → Persist → Re-validate → Return truth
 */
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user?.org_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1️⃣ Parse and validate full onboarding payload
  const body = onboardingSchema.parse(await req.json())
  const supabase = createServiceRoleClient()

  try {
    // 2️⃣ Persist data to canonical fields (NO JSON dumping)
    await supabase
      .from('organizations')
      .update({
        website_url: body.website_url,
        business_description: body.business_description,
        target_audiences: body.target_audiences,
        keyword_settings: body.keyword_settings,
        content_defaults: body.content_defaults,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.org_id)

    // 3️⃣ Replace competitors deterministically (delete then insert)
    await supabase
      .from('organization_competitors')
      .delete()
      .eq('organization_id', user.org_id)

    if (body.competitors.length > 0) {
      await supabase
        .from('organization_competitors')
        .insert(
          body.competitors.map(c => ({
            organization_id: user.org_id,
            name: c.name,
            url: c.url,
            domain: new URL(c.url).hostname,
            description: c.description || null,
            is_active: true,
            created_at: new Date().toISOString(),
            created_by: user.id
          }))
        )
    }

    // 4️⃣ Validate onboarding truth (DERIVE completion)
    const validation = await validateOnboarding(user.org_id)

    // 5️⃣ Set completion flag ONLY if validation passes (cache the derived truth)
    const completedAt = new Date().toISOString()
    if (validation.valid) {
      await supabase
        .from('organizations')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: completedAt,
          onboarding_version: 'v2-authoritative',
          updated_at: completedAt
        })
        .eq('id', user.org_id)
    } else {
      // Ensure flag is false if validation fails
      await supabase
        .from('organizations')
        .update({
          onboarding_completed: false,
          onboarding_completed_at: null,
          updated_at: completedAt
        })
        .eq('id', user.org_id)
    }

    // 6️⃣ Auto-enable Intent Engine feature flag if onboarding complete
    if (validation.valid) {
      await supabase
        .from('feature_flags')
        .upsert(
          {
            organization_id: user.org_id,
            flag_key: 'ENABLE_INTENT_ENGINE',
            enabled: true,
          },
          { onConflict: 'organization_id,flag_key' }
        )
    }

    return NextResponse.json({ 
      success: true,
      onboarding_completed: validation.valid,
      onboarding_completed_at: validation.valid ? completedAt : null,
      validation: validation
    })

  } catch (error: any) {
    console.error('[Onboarding Persist] Error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', details: error.message },
      { status: 500 }
    )
  }
}
