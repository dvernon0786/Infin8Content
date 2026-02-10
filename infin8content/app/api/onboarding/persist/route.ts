import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { validateOnboarding } from '@/lib/onboarding/onboarding-validator'
import { getCurrentUser } from '@/lib/supabase/get-current-user'

const onboardingSchema = z.object({
  website_url: z.string().url().optional(),
  business_description: z.string().min(20).optional(),
  target_audiences: z.array(z.string().min(2)).optional(),
  keyword_settings: z.object({
    target_region: z.string().min(2),
    language_code: z.string().min(2),
    auto_generate_keywords: z.boolean(),
    monthly_keyword_limit: z.number().min(1).max(1000)
  }).optional(),
  content_defaults: z.object({
    language: z.string().min(2),
    tone: z.enum(['professional', 'casual', 'formal', 'friendly']),
    style: z.enum(['informative', 'persuasive', 'educational']),
    target_word_count: z.number().min(500).max(10000),
    auto_publish: z.boolean()
  }).optional(),
  integration: z.object({
    type: z.enum(['wordpress']),
    site_url: z.string().url(),
    username: z.string().min(1),
    application_password: z.string().min(1)
  }).optional(),
  competitors: z.array(
    z.object({
      name: z.string().min(1),
      url: z.string().url(),
      description: z.string().optional()
    })
  ).min(1).optional()
}).refine(data => {
  // At least one field must be provided
  return Object.keys(data).length > 0
}, {
  message: "At least one field must be provided"
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
  console.log('[Persist API] before getCurrentUser')
  
  try {
    const user = await getCurrentUser()
    console.log('[Persist API] getCurrentUser success:', user?.id)

    if (!user?.org_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1️⃣ Parse and validate full onboarding payload
    const body = onboardingSchema.parse(await req.json())
    console.log('[Persist API] Received payload:', body)
  
  const supabase = createServiceRoleClient()

  try {
    // 2️⃣ Persist data to canonical fields (only update provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    // Only add fields that are provided
    if (body.website_url !== undefined) updateData.website_url = body.website_url
    if (body.business_description !== undefined) updateData.business_description = body.business_description
    if (body.target_audiences !== undefined) updateData.target_audiences = body.target_audiences
    if (body.keyword_settings !== undefined) updateData.keyword_settings = body.keyword_settings
    if (body.content_defaults !== undefined) updateData.content_defaults = body.content_defaults
    if (body.integration !== undefined) updateData.integration = body.integration
    
    console.log('[Persist API] Update data:', updateData)

    console.log('[Persist API] About to update organizations table...')
    await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', user.org_id)
    
    console.log('[Persist API] Organizations table updated successfully')

    // 3️⃣ Replace competitors deterministically (delete then insert)
    if (body.competitors && body.competitors.length > 0) {
      // Delete existing competitors first
      await supabase
        .from('organization_competitors')
        .delete()
        .eq('organization_id', user.org_id)

      // Insert new competitors
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

    console.log('[Persist API] About to call validateOnboarding...')
    // 4️⃣ Validate onboarding truth (DERIVE completion)
    const validation = await validateOnboarding(user.org_id)
    console.log('[Persist API] Validation completed:', validation)

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
    console.error('[Onboarding Persist] Error stack:', error.stack)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: error.issues },
        { status: 400 }
      )
    }

    // Safely extract error details
    const errorMessage = error?.message || String(error)
    const errorStack = error?.stack || ''

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', details: errorMessage, stack: errorStack },
      { status: 500 }
    )
  }
  } catch (error: any) {
    console.error('[Onboarding Persist] Error:', error)
    console.error('[Onboarding Persist] Error stack:', error.stack)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: error.issues },
        { status: 400 }
      )
    }

    // Safely extract error details
    const errorMessage = error?.message || String(error)
    const errorStack = error?.stack || ''

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', details: errorMessage, stack: errorStack },
      { status: 500 }
    )
  }
}
