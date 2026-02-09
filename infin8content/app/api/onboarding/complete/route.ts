import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { completeSchema } from '@/lib/validation/onboarding-schema'
import { NextResponse } from 'next/server'

/**
 * POST /api/onboarding/complete
 * 
 * Marks onboarding as completed for the organization.
 * Sets onboarding_completed flag to true and records completion timestamp.
 * 
 * Request Body: {} (empty object)
 * 
 * Response (Success - 200):
 * - success: true
 * - organization: { 
 *     id, 
 *     onboarding_completed: true, 
 *     onboarding_completed_at: string 
 *   }
 * - redirectTo: '/dashboard'
 * 
 * Response (Error - 401):
 * - error: "Authentication required"
 * 
 * Response (Error - 404):
 * - error: "Organization not found"
 * 
 * Response (Error - 500):
 * - error: "Failed to complete onboarding"
 */
export async function POST(request: Request) {
  console.log('[Onboarding Complete] API route called')
  
  try {
    // Parse and validate request body (should be empty)
    const body = await request.json()
    console.log('[Onboarding Complete] Request body parsed:', body)
    
    const validated = completeSchema.parse(body)
    console.log('[Onboarding Complete] Request validated successfully')
    
    // Authenticate user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const organizationId = currentUser.org_id
    console.log('[Onboarding Complete] Authenticated user for organization:', organizationId)
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Update organization to mark onboarding as completed
    const completedAt = new Date().toISOString()
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: completedAt,
        updated_at: completedAt,
      })
      .eq('id', organizationId)
      .select('id, onboarding_completed, onboarding_completed_at')
      .single() as any
    
    if (updateError) {
      console.error('[Onboarding Complete] Failed to update organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete onboarding' },
        { status: 500 }
      )
    }
    
    if (!organization) {
      console.error('[Onboarding Complete] Organization not found after update')
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Auto-enable Intent Engine feature flag for new organizations
    try {
      const { error: flagError } = await supabase
        .from('feature_flags')
        .upsert(
          {
            organization_id: organizationId,
            flag_key: 'ENABLE_INTENT_ENGINE',
            enabled: true,
          },
          { onConflict: 'organization_id,flag_key' }
        )

      if (flagError) {
        console.warn('[Onboarding Complete] Failed to enable Intent Engine flag:', flagError)
        // Don't fail onboarding - just log the error
      } else {
        console.log('[Onboarding Complete] Intent Engine feature flag enabled automatically')
      }
    } catch (error) {
      console.warn('[Onboarding Complete] Error enabling Intent Engine flag:', error)
      // Don't fail onboarding - just log the error
    }
    
    console.log('[Onboarding Complete] Onboarding completed successfully')
    
    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        onboarding_completed: organization.onboarding_completed,
        onboarding_completed_at: organization.onboarding_completed_at,
      },
      redirectTo: '/dashboard',
    })
    
  } catch (error: any) {
    console.error('[Onboarding Complete] Error occurred:', {
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    
    // Handle Zod validation errors (shouldn't occur with empty schema, but just in case)
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
