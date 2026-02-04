import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { keywordSettingsSchema } from '@/lib/validation/onboarding-schema'
import { NextResponse } from 'next/server'

/**
 * POST /api/onboarding/keyword-settings
 * 
 * Saves keyword settings during onboarding process.
 * Stores keyword research settings in the keyword_settings JSONB field of the organization.
 * 
 * Request Body:
 * - target_region: string (2-50 chars)
 * - language_code: string (2-10 chars)
 * - auto_generate_keywords: boolean
 * - monthly_keyword_limit: number (1-1000)
 * 
 * Response (Success - 200):
 * - success: true
 * - organization: { id, keyword_settings: object }
 * 
 * Response (Error - 400):
 * - error: string
 * - details?: { field: string, message: string }
 * 
 * Response (Error - 401):
 * - error: "Authentication required"
 * 
 * Response (Error - 404):
 * - error: "Organization not found"
 * 
 * Response (Error - 500):
 * - error: "Failed to save keyword settings"
 */
export async function POST(request: Request) {
  console.log('[Onboarding Keyword Settings] API route called')
  
  try {
    // Parse request body
    const body = await request.json()
    console.log('[Onboarding Keyword Settings] Request body parsed:', body)
    
    // Authenticate user first
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const organizationId = currentUser.org_id
    console.log('[Onboarding Keyword Settings] Authenticated user for organization:', organizationId)
    
    // Validate request body
    const validated = keywordSettingsSchema.parse(body)
    console.log('[Onboarding Keyword Settings] Request validated successfully')
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Get current keyword_settings to merge with new settings
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('keyword_settings')
      .eq('id', organizationId)
      .single() as any
    
    const currentKeywordSettings = currentOrg?.keyword_settings || {}
    
    // Update organization with keyword settings
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update({
        keyword_settings: {
          ...currentKeywordSettings,
          target_region: validated.target_region,
          language_code: validated.language_code,
          auto_generate_keywords: validated.auto_generate_keywords,
          monthly_keyword_limit: validated.monthly_keyword_limit,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .select('id, keyword_settings')
      .single() as any
    
    if (updateError) {
      console.error('[Onboarding Keyword Settings] Failed to update organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to save keyword settings' },
        { status: 500 }
      )
    }
    
    if (!organization) {
      console.error('[Onboarding Keyword Settings] Organization not found after update')
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }
    
    console.log('[Onboarding Keyword Settings] Keyword settings saved successfully')
    
    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        keyword_settings: organization.keyword_settings,
      },
    })
    
  } catch (error: any) {
    console.error('[Onboarding Keyword Settings] Error occurred:', {
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    
    // Handle Zod validation errors
    if (error instanceof Error && 'issues' in error) {
      const zodError = error as any
      const firstError = zodError.issues?.[0]
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: {
            field: firstError?.path?.[0] || 'unknown',
            message: firstError?.message || 'Validation error'
          }
        },
        { status: 400 }
      )
    }
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    // Handle database errors
    if (error?.code === 'PGRST' || error?.message?.includes('supabase')) {
      return NextResponse.json(
        { error: 'Database connection error', details: 'Please try again later' },
        { status: 503 }
      )
    }
    
    // Generic error
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : 'Something went wrong'
      },
      { status: 500 }
    )
  }
}
