import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { onboardingProfileSchema } from '@/lib/validation/onboarding-profile-schema'
import { z, ZodError } from 'zod'
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
    
    // Create business-specific schema that includes website URL
    const businessStepSchema = z.object({
      website_url: z.string().url("Please enter a valid URL").max(255, "URL must be 255 characters or fewer"),
      business_description: z.string().min(20, "Business description is too short").max(500, "Business description must be 500 characters or fewer"),
      target_audiences: z.array(z.string().min(10, "Audience description is too short").max(80, "Each audience must be 80 characters or fewer")).min(1, "At least one target audience is required").max(5, "You can add up to 5 target audiences only").refine(
        (audiences) =>
          audiences.every(
            (a) =>
              !/^(everyone|anyone|all businesses|general public|people|users|customers)$/i.test(a.trim())
          ),
        {
          message: "Target audiences must be specific (e.g. role + context, not 'everyone')",
        }
      )
    })
    
    const validated = businessStepSchema.parse(body)
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
    if (error instanceof ZodError) {
      const first = error.issues[0]
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: {
            field: first.path.join('.') || 'unknown',
            message: first.message
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
