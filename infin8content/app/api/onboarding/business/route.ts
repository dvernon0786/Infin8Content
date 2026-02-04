import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { businessSchema } from '@/lib/validation/onboarding-schema'
import { NextResponse } from 'next/server'

/**
 * POST /api/onboarding/business
 * 
 * Saves business information during onboarding process.
 * Updates organization record with website URL, business description, and target audiences.
 * 
 * Request Body:
 * - website_url?: string (valid URL, max 255 chars)
 * - business_description?: string (10-500 chars)
 * - target_audiences?: string[] (2-50 chars each, max 10 items)
 * 
 * Response (Success - 200):
 * - success: true
 * - organization: { id, website_url?, business_description?, target_audiences? }
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
 * - error: "Failed to save business information"
 */
export async function POST(request: Request) {
  console.log('[Onboarding Business] API route called')
  
  try {
    // Parse and validate request body
    const body = await request.json()
    console.log('[Onboarding Business] Request body parsed:', body)
    
    const validated = businessSchema.parse(body)
    console.log('[Onboarding Business] Request validated successfully')
    
    // Authenticate user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const organizationId = currentUser.org_id
    console.log('[Onboarding Business] Authenticated user for organization:', organizationId)
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Update organization with business information
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update({
        website_url: validated.website_url,
        business_description: validated.business_description,
        target_audiences: validated.target_audiences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .select('id, website_url, business_description, target_audiences')
      .single()
    
    if (updateError) {
      console.error('[Onboarding Business] Failed to update organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to save business information' },
        { status: 500 }
      )
    }
    
    if (!organization) {
      console.error('[Onboarding Business] Organization not found after update')
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }
    
    console.log('[Onboarding Business] Business information saved successfully')
    
    return NextResponse.json({
      success: true,
      organization,
    })
    
  } catch (error: any) {
    console.error('[Onboarding Business] Error occurred:', {
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
