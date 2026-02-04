import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { contentDefaultsSchema } from '@/lib/validation/onboarding-schema'
import { NextResponse } from 'next/server'

/**
 * POST /api/onboarding/content-defaults
 * 
 * Saves content defaults during onboarding process.
 * Stores content generation settings in the content_defaults JSONB field of the organization.
 * 
 * Request Body:
 * - language: string (2-10 chars)
 * - tone: 'professional' | 'casual' | 'formal' | 'friendly'
 * - style: 'informative' | 'persuasive' | 'educational'
 * - target_word_count: number (500-10000)
 * - auto_publish: boolean
 * 
 * Response (Success - 200):
 * - success: true
 * - organization: { id, content_defaults: object }
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
 * - error: "Failed to save content defaults"
 */
export async function POST(request: Request) {
  console.log('[Onboarding Content Defaults] API route called')
  
  try {
    // Parse request body
    const body = await request.json()
    console.log('[Onboarding Content Defaults] Request body parsed:', body)
    
    // Authenticate user first
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const organizationId = currentUser.org_id
    console.log('[Onboarding Content Defaults] Authenticated user for organization:', organizationId)
    
    // Validate request body
    const validated = contentDefaultsSchema.parse(body)
    console.log('[Onboarding Content Defaults] Request validated successfully')
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Get current content_defaults to merge with new defaults
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('content_defaults')
      .eq('id', organizationId)
      .single() as any
    
    const currentContentDefaults = currentOrg?.content_defaults || {}
    
    // Update organization with content defaults
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update({
        content_defaults: {
          ...currentContentDefaults,
          language: validated.language,
          tone: validated.tone,
          style: validated.style,
          target_word_count: validated.target_word_count,
          auto_publish: validated.auto_publish,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .select('id, content_defaults')
      .single() as any
    
    if (updateError) {
      console.error('[Onboarding Content Defaults] Failed to update organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to save content defaults' },
        { status: 500 }
      )
    }
    
    if (!organization) {
      console.error('[Onboarding Content Defaults] Organization not found after update')
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }
    
    console.log('[Onboarding Content Defaults] Content defaults saved successfully')
    
    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        content_defaults: organization.content_defaults,
      },
    })
    
  } catch (error: any) {
    console.error('[Onboarding Content Defaults] Error occurred:', {
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
