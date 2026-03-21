import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { createServiceRoleClient } from "@/lib/supabase/server"

/**
 * GET /api/onboarding/status
 * 
 * Returns current onboarding status for the authenticated user's organization
 * Used by E2E tests to verify onboarding completion
 */
export async function GET(request: Request) {
  try {
    // Authenticate user
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Use service role client to bypass RLS and get accurate status
    const adminSupabase = createServiceRoleClient()

    const { data: org, error } = await adminSupabase
      .from('organizations')
      .select('onboarding_completed, onboarding_completed_at')
      .eq('id', currentUser.org_id)
      .single() as any

    if (error || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      onboarding_completed: org.onboarding_completed,
      onboarding_completed_at: org.onboarding_completed_at,
      org_id: currentUser.org_id
    })

  } catch (error) {
    console.error('[Onboarding Status] Error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
