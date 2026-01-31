import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { toggleFeatureFlag } from '@/lib/utils/feature-flags'
import { FEATURE_FLAG_KEYS } from '@/lib/types/feature-flag'
import { NextResponse } from 'next/server'

/**
 * POST /api/admin/feature-flags/toggle
 * 
 * Admin endpoint to toggle feature flags
 * 
 * Request Body:
 * - flagKey: string (required) - Feature flag key to toggle
 * - enabled: boolean (required) - Desired state
 * 
 * Response (Success - 200):
 * - success: boolean
 * - flag: FeatureFlag object
 * - message: string
 * 
 * Response (Error - 401):
 * - error: "Authentication required"
 * 
 * Response (Error - 403):
 * - error: "Admin access required"
 * 
 * Response (Error - 400):
 * - error: string - Validation error message
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin permissions (owner role can manage feature flags)
    if (!currentUser.organizations?.role || currentUser.organizations.role !== 'owner') {
      return NextResponse.json(
        { error: 'Admin access required - owner role only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { flagKey, enabled } = body

    // Validate inputs
    if (!flagKey || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'flagKey and enabled are required' },
        { status: 400 }
      )
    }

    // Validate flag key
    if (!Object.values(FEATURE_FLAG_KEYS).includes(flagKey)) {
      return NextResponse.json(
        { error: 'Invalid feature flag key' },
        { status: 400 }
      )
    }

    // Toggle the feature flag
    const flag = await toggleFeatureFlag(
      currentUser.org_id,
      flagKey,
      enabled,
      currentUser.id
    )

    return NextResponse.json({
      success: true,
      flag,
      message: `Feature flag ${flagKey} ${enabled ? 'enabled' : 'disabled'} successfully`
    })

  } catch (error: any) {
    console.error('Feature flag toggle error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to toggle feature flag',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/feature-flags
 * 
 * Get current feature flag states for organization
 * 
 * Response (Success - 200):
 * - success: boolean
 * - flags: FeatureFlag[]
 */
export async function GET(request: Request) {
  try {
    // Authenticate user
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin permissions (owner role can manage feature flags)
    if (!currentUser.organizations?.role || currentUser.organizations.role !== 'owner') {
      return NextResponse.json(
        { error: 'Admin access required - owner role only' },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    
    // Get all feature flags for organization
    const { data: flags, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('organization_id', currentUser.org_id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      flags: flags || []
    })

  } catch (error: any) {
    console.error('Get feature flags error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get feature flags',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
