import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { competitorsSchema } from '@/lib/validation/onboarding-schema'
import { NextResponse } from 'next/server'

/**
 * POST /api/onboarding/competitors
 * 
 * Saves competitor information during onboarding process.
 * Stores competitor data in the blog_config JSONB field of the organization.
 * 
 * Request Body:
 * - competitors: Array<{ name: string, url: string, description?: string }>
 * 
 * Response (Success - 200):
 * - success: true
 * - organization: { id, competitor_data: object }
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
 * - error: "Failed to save competitor information"
 */
export async function POST(request: Request) {
  console.log('[Onboarding Competitors] API route called')
  
  try {
    // Parse request body
    const body = await request.json()
    console.log('[Onboarding Competitors] Request body parsed:', body)
    
    // Authenticate user first
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const organizationId = currentUser.org_id
    console.log('[Onboarding Competitors] Authenticated user for organization:', organizationId)
    
    // Validate request body
    const validated = competitorsSchema.parse(body)
    console.log('[Onboarding Competitors] Request validated successfully')
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Get current blog_config to merge with competitors data
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('blog_config')
      .eq('id', organizationId)
      .single() as any
    
    const currentBlogConfig = currentOrg?.blog_config || {}
    
    // Update organization with competitor information in blog_config
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update({
        blog_config: {
          ...currentBlogConfig,
          competitors: validated.competitors,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .select('id, blog_config')
      .single() as any
    
    if (updateError) {
      console.error('[Onboarding Competitors] Failed to update organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to save competitor information' },
        { status: 500 }
      )
    }
    
    if (!organization) {
      console.error('[Onboarding Competitors] Organization not found after update')
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }
    
    console.log('[Onboarding Competitors] Competitor information saved successfully')
    
    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        blog_config: organization.blog_config || {},
      },
    })
    
  } catch (error: any) {
    console.error('[Onboarding Competitors] Error occurred:', {
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
