// Feature Flags API Route
// Story 33-4: Enable Intent Engine Feature Flag
// Task 2: Create API endpoint for feature flag management

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@supabase/supabase-js'
import { checkFeatureFlagRateLimit } from '@/lib/utils/rate-limit'
import { 
  CreateFeatureFlagRequest, 
  FeatureFlagResponse, 
  FeatureFlagError,
  FeatureFlagValidationError 
} from '@/lib/types/feature-flag'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json(
        { error: 'Authentication required' } as FeatureFlagError,
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body: CreateFeatureFlagRequest = await request.json()
    
    const validationErrors: string[] = []
    
    if (!body.organization_id) {
      validationErrors.push('organization_id is required')
    }
    
    if (!body.flag_key) {
      validationErrors.push('flag_key is required')
    }
    
    if (typeof body.enabled !== 'boolean') {
      validationErrors.push('enabled must be a boolean')
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationErrors
        } as FeatureFlagValidationError,
        { status: 400 }
      )
    }

    // Authorization check - user must be admin of the organization
    if (body.organization_id !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin role required.' } as FeatureFlagError,
        { status: 403 }
      )
    }

    // Rate limiting check - prevent abuse of feature flag toggle endpoint
    const rateLimitResult = await checkFeatureFlagRateLimit(body.organization_id)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Too many feature flag changes in a short time.',
          details: [`Retry after ${rateLimitResult.resetAt.toISOString()}`]
        } as FeatureFlagValidationError,
        { status: 429 }
      )
    }

    // Check if user has admin/owner role
    const userRole = currentUser.role
    if (!['admin', 'owner'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin role required.' } as FeatureFlagError,
        { status: 403 }
      )
    }

    // Verify organization exists
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', body.organization_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' } as FeatureFlagError,
        { status: 404 }
      )
    }

    // Upsert feature flag
    const { data, error } = await supabase
      .from('feature_flags')
      .upsert({
        organization_id: body.organization_id,
        flag_key: body.flag_key,
        enabled: body.enabled,
        updated_by: currentUser.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error creating feature flag:', error)
      return NextResponse.json(
        { error: 'Internal server error' } as FeatureFlagError,
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to create feature flag' } as FeatureFlagError,
        { status: 500 }
      )
    }

    // Return response in the expected format
    const response: FeatureFlagResponse = {
      id: data.id,
      organization_id: data.organization_id,
      flag_key: data.flag_key,
      enabled: data.enabled,
      updated_at: data.updated_at
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Feature flag API error:', error)
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: ['Invalid JSON in request body']
        } as FeatureFlagValidationError,
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' } as FeatureFlagError,
      { status: 500 }
    )
  }
}
