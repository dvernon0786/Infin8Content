import { NextResponse } from 'next/server'
import { z } from 'zod'

// Test imports one by one
// import { createServiceRoleClient } from '@/lib/supabase/server'
// import { validateOnboarding } from '@/lib/onboarding/onboarding-validator'
// import { getCurrentUser } from '@/lib/supabase/get-current-user'

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
  competitors: z.array(
    z.object({
      name: z.string().min(1),
      url: z.string().url(),
      description: z.string().optional()
    })
  ).optional()
}).refine(data => Object.keys(data).length > 0, { message: "At least one field must be provided" })

export async function POST(request: Request) {
  console.log('[Debug Persist] POST request received')
  
  try {
    const body = onboardingSchema.parse(await request.json())
    console.log('[Debug Persist] Body parsed successfully:', body)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Debug persist working with Zod',
      received: body 
    })
  } catch (error: any) {
    console.error('[Debug Persist] Error:', error)
    return NextResponse.json(
      { error: 'Debug persist error', details: error.message },
      { status: 500 }
    )
  }
}
