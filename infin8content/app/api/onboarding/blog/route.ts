import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { blogSchema } from '@/lib/validation/onboarding-schema'
import { NextResponse } from 'next/server'

/**
 * POST /api/onboarding/blog
 * 
 * Saves blog configuration during onboarding process.
 * Stores blog settings in the blog_config JSONB field of the organization.
 * 
 * Request Body:
 * - blog_name: string (3-100 chars)
 * - blog_description: string (10-500 chars)
 * - blog_category: string (2-50 chars)
 * - post_frequency: 'daily' | 'weekly' | 'monthly'
 * 
 * Response (Success - 200):
 * - success: true
 * - organization: { id, blog_config: object }
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
 * - error: "Failed to save blog configuration"
 */
export async function POST(request: Request) {
  console.log('[Onboarding Blog] API route called')
  
  try {
    // Parse request body
    const body = await request.json()
    console.log('[Onboarding Blog] Request body parsed:', body)
    
    // Authenticate user first
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const organizationId = currentUser.org_id
    console.log('[Onboarding Blog] Authenticated user for organization:', organizationId)
    
    // Validate request body
    const validated = blogSchema.parse(body)
    console.log('[Onboarding Blog] Request validated successfully')
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Get current blog_config to merge with blog settings
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('blog_config')
      .eq('id', organizationId)
      .single() as any
    
    const currentBlogConfig = currentOrg?.blog_config || {}
    
    // Update organization with blog configuration in blog_config
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update({
        blog_config: {
          ...currentBlogConfig,
          blog_name: validated.blog_name,
          blog_description: validated.blog_description,
          blog_category: validated.blog_category,
          post_frequency: validated.post_frequency,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .select('id, blog_config')
      .single() as any
    
    if (updateError) {
      console.error('[Onboarding Blog] Failed to update organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to save blog information' },
        { status: 500 }
      )
    }
    
    if (!organization) {
      console.error('[Onboarding Blog] Organization not found after update')
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }
    
    console.log('[Onboarding Blog] Blog configuration saved successfully')
    
    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        blog_config: organization.blog_config,
      },
    })
    
  } catch (error: any) {
    console.error('[Onboarding Blog] Error occurred:', {
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
