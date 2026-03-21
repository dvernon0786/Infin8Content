/**
 * AI Autocomplete API Endpoint
 * Story A-5: Onboarding Agent AI Autocomplete
 * 
 * Provides REST API endpoint for AI-powered autocomplete suggestions
 * with authentication, rate limiting, and privacy protection.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateAutocompleteSuggestions } from '@/lib/services/ai-autocomplete'
import type { AutocompleteRequest } from '@/types/autocomplete'

export async function POST(request: NextRequest) {
  try {
    // 🛡️ HARD GUARD: Do NOT run AI during onboarding
    const user = await getCurrentUser()
    
    if (!user?.org_id) {
      return NextResponse.json({ suggestions: [] })
    }
    
    // Check onboarding status using service role client
    const adminSupabase = createServiceRoleClient()
    const { data: org } = await adminSupabase
      .from('organizations')
      .select('onboarding_completed')
      .eq('id', user.org_id)
      .single() as any
    
    // Do NOT run AI during onboarding - this prevents crashes that break navigation
    if (!org?.onboarding_completed) {
      console.log('[AI Autocomplete] Onboarding incomplete - returning empty suggestions')
      return NextResponse.json({ suggestions: [] })
    }
    
    // Parse request body
    const body: AutocompleteRequest = await request.json()
    
    // Validate required fields
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    if (!body.context || !['competitors', 'business', 'blog'].includes(body.context)) {
      return NextResponse.json(
        { error: 'Context is required and must be: competitors, business, or blog' },
        { status: 400 }
      )
    }

    // Validate optional fields
    if (body.limit && (typeof body.limit !== 'number' || body.limit < 1 || body.limit > 10)) {
      return NextResponse.json(
        { error: 'Limit must be a number between 1 and 10' },
        { status: 400 }
      )
    }

    // Generate suggestions
    const result = await generateAutocompleteSuggestions(body)

    // Return response
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    // 🚫 AI FAILURE MUST NEVER THROW - return empty suggestions to prevent breaking navigation
    console.error('[AI Autocomplete] Non-fatal error:', error)
    return NextResponse.json({ suggestions: [] })
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
