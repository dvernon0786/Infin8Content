import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { integrationSchema } from '@/lib/validation/onboarding-schema'
import { NextResponse } from 'next/server'

/**
 * POST /api/onboarding/integration
 * 
 * Saves integration configuration during onboarding process.
 * Stores integration settings in the blog_config JSONB field of the organization.
 * 
 * Request Body:
 * - wordpress_url?: string (valid URL, max 255 chars)
 * - wordpress_username?: string (2-100 chars)
 * - webflow_url?: string (valid URL, max 255 chars)
 * - other_integrations?: object
 * 
 * Response (Success - 200):
 * - success: true
 * - organization: { id, integration_config: object }
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
 * - error: "Failed to save integration configuration"
 */
export async function POST(request: Request) {
  console.log('[Onboarding Integration] API route called')
  
  try {
    // Parse and validate request body
    const body = await request.json()
    console.log('[Onboarding Integration] Request body parsed:', body)
    
    const validated = integrationSchema.parse(body)
    console.log('[Onboarding Integration] Request validated successfully')
    
    // Authenticate user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const organizationId = currentUser.org_id
    console.log('[Onboarding Integration] Authenticated user for organization:', organizationId)
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Get current blog_config to merge with integration settings
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('blog_config')
      .eq('id', organizationId)
      .single() as any
    
    const currentBlogConfig = currentOrg?.blog_config || {}
    
    // Update organization with integration configuration in blog_config
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update({
        blog_config: {
          ...currentBlogConfig,
          integrations: validated
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .select('id, blog_config')
      .single() as any
    
    if (updateError) {
      console.error('[Onboarding Integration] Failed to update organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to save integration information' },
        { status: 500 }
      )
    }
    
    if (!organization) {
      console.error('[Onboarding Integration] Organization not found after update')
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }
    
    console.log('[Onboarding Integration] Integration configuration saved successfully')
    
    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        blog_config: organization.blog_config || {},
      },
    })
    
  } catch (error: any) {
    console.error('[Onboarding Integration] Error occurred:', {
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
