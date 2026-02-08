import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { z, ZodError } from "zod"
import { testWordPressConnection } from "@/lib/services/wordpress/test-connection"
import { encrypt } from "@/lib/security/encryption"
import { normalizeWordPressUrl } from "@/lib/services/wordpress/url-normalizer"

/**
 * POST /api/onboarding/integration
 * 
 * WordPress-only integration setup with encrypted credential storage
 * and connection testing before saving.
 * 
 * Request Body:
 * {
 *   wordpress: {
 *     url: string (valid URL)
 *     username: string (min 2 chars)
 *     application_password: string (min 8 chars)
 *   }
 * }
 * 
 * Response (Success - 200):
 * { success: true }
 * 
 * Response (Error - 400):
 * { error: string, details?: { field: string, message: string } }
 * 
 * Response (Error - 401):
 * { error: "Authentication required" }
 */
const schema = z.object({
  wordpress: z.object({
    url: z.string().url("Invalid WordPress URL"),
    username: z.string().min(2, "Username must be at least 2 characters"),
    application_password: z.string().min(8, "Application password must be at least 8 characters")
  })
})

export async function POST(request: Request) {
  console.log('[WordPress Integration] API route called')
  
  try {
    // Parse and validate request body
    const body = await request.json()
    console.log('[WordPress Integration] Request body parsed')
    
    const validated = schema.parse(body)
    console.log('[WordPress Integration] Request validated successfully')
    
    // Normalize WordPress URL to prevent subtle bugs
    validated.wordpress.url = normalizeWordPressUrl(validated.wordpress.url)
    console.log('[WordPress Integration] URL normalized:', validated.wordpress.url)
    
    // Authenticate user
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    console.log('[WordPress Integration] Authenticated user for organization:', currentUser.org_id)
    
    // 🔐 Test connection BEFORE saving credentials
    console.log('[WordPress Integration] Testing connection...')
    const connectionResult = await testWordPressConnection(validated.wordpress)
    
    if (!connectionResult.success) {
      return NextResponse.json(
        { 
          error: "Connection test failed",
          details: { field: "connection", message: connectionResult.message }
        },
        { status: 400 }
      )
    }
    
    console.log('[WordPress Integration] Connection test passed')
    
    // 🔐 Encrypt credentials before storage
    const encryptedPassword = encrypt(validated.wordpress.application_password)
    console.log('[WordPress Integration] Credentials encrypted')
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Get current blog_config to merge with WordPress settings
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('blog_config')
      .eq('id', currentUser.org_id)
      .single() as any
    
    const currentBlogConfig = currentOrg?.blog_config || {}
    
    // Preserve existing integrations and add WordPress
    const existingIntegrations = currentBlogConfig.integrations || {}
    
    // Update organization with WordPress integration
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update({
        blog_config: {
          ...currentBlogConfig,
          integrations: {
            ...existingIntegrations,
            wordpress: {
              url: validated.wordpress.url,
              username: validated.wordpress.username,
              application_password: encryptedPassword,
              connected_at: new Date().toISOString(),
              last_validated_at: new Date().toISOString(),
              site_name: connectionResult.site?.name,
              user_name: connectionResult.user?.name
            }
          }
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentUser.org_id)
      .select('id, blog_config')
      .single() as any
    
    if (updateError) {
      console.error('[WordPress Integration] Failed to update organization:', updateError)
      return NextResponse.json(
        { error: "Failed to save WordPress integration" },
        { status: 500 }
      )
    }
    
    if (!organization) {
      console.error('[WordPress Integration] Organization not found after update')
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }
    
    console.log('[WordPress Integration] Integration saved successfully')
    
    // 🎉 Mark onboarding as completed in database using SERVICE ROLE
    console.log('[Integration API] Writing onboarding_completed (service role)')
    const adminSupabase = createServiceRoleClient()

    const { error: completionError } = await adminSupabase
      .from('organizations')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentUser.org_id)

    if (completionError) {
      console.error('[Integration API] Failed to mark onboarding completed:', completionError)
      throw new Error(`Failed to mark onboarding completed: ${completionError.message}`)
    }

    // 🔍 VERIFY the write was successful
    const { data: verify } = await adminSupabase
      .from('organizations')
      .select('onboarding_completed')
      .eq('id', currentUser.org_id)
      .single() as any

    console.log('[Integration API] VERIFY onboarding_completed:', verify?.onboarding_completed)

    if (!verify?.onboarding_completed) {
      throw new Error('Onboarding completion write failed - verification failed')
    }

    console.log('[Integration API] Onboarding marked complete in DB (service role)')
    
    const response = NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        blog_config: organization.blog_config || {},
        onboarding_completed: verify?.onboarding_completed,
        onboarding_completed_at: new Date().toISOString(),
      },
    })
    
    // ⏱️ One-time onboarding completion signal to bridge Edge replica lag
    response.cookies.set('onboarding_just_completed', 'true', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 10, // seconds - very short-lived
    })
    
    console.log('[Integration API] Set cookie onboarding_just_completed', {
      name: 'onboarding_just_completed',
      value: 'true',
      path: '/',
      maxAge: 10,
    })
    
    console.log('[Integration API] Response headers:', {
      setCookie: response.headers.get('set-cookie'),
    })
    
    return response
    
  } catch (error: any) {
    console.error('[WordPress Integration] Error occurred:', {
      error: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const first = error.issues[0]
      return NextResponse.json(
        { 
          error: "Invalid input",
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
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }
    
    // Handle database errors
    if (error?.code === 'PGRST' || error?.message?.includes('supabase')) {
      return NextResponse.json(
        { error: "Database connection error", details: 'Please try again later' },
        { status: 503 }
      )
    }
    
    // Generic error
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error?.message : 'Something went wrong'
      },
      { status: 500 }
    )
  }
}
