import { createClient } from '@/lib/supabase/server'
import { validateSupabaseEnv } from '@/lib/supabase/env'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100, 'Organization name must be less than 100 characters'),
})

export async function POST(request: Request) {
  try {
    validateSupabaseEnv()
    
    const body = await request.json()
    const { name } = updateOrganizationSchema.parse(body)

    const supabase = await createClient()
    
    // Get current user from session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user record with organization
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, org_id, role')
      .eq('auth_user_id', authUser.id)
      .single()

    if (userError || !userRecord || !userRecord.org_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Verify user is organization owner
    if (userRecord.role !== 'owner') {
      return NextResponse.json(
        { error: 'You don\'t have permission to update this organization' },
        { status: 403 }
      )
    }

    // Check for duplicate organization name (application-level check)
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', name)
      .neq('id', userRecord.org_id)
      .single()

    if (existingOrg) {
      return NextResponse.json(
        { error: 'An organization with this name already exists' },
        { status: 400 }
      )
    }

    // Update organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .update({ name })
      .eq('id', userRecord.org_id)
      .select()
      .single()

    if (orgError || !organization) {
      // Check for duplicate name error (database-level check as fallback)
      if (orgError?.code === '23505') { // PostgreSQL unique violation
        return NextResponse.json(
          { error: 'An organization with this name already exists' },
          { status: 400 }
        )
      }
      
      console.error('Failed to update organization:', orgError)
      return NextResponse.json(
        { error: 'Failed to update organization. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        plan: organization.plan,
        created_at: organization.created_at,
        updated_at: organization.updated_at,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors?.[0] || error.issues?.[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation error' },
        { status: 400 }
      )
    }
    
    console.error('Organization update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

