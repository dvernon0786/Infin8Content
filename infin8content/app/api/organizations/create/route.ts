import { createClient } from '@/lib/supabase/server'
import { validateSupabaseEnv } from '@/lib/supabase/env'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100, 'Organization name must be less than 100 characters'),
})

export async function POST(request: Request) {
  try {
    validateSupabaseEnv()
    
    const body = await request.json()
    const { name } = createOrganizationSchema.parse(body)

    const supabase = await createClient()
    
    // Get current user from session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user record
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, org_id, role')
      .eq('auth_user_id', authUser.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json(
        { error: 'User record not found' },
        { status: 404 }
      )
    }

    // Check if user already has an organization
    if (userRecord.org_id) {
      return NextResponse.json(
        { error: 'You already have an organization. Upgrade to Agency plan to create multiple organizations (future feature).' },
        { status: 400 }
      )
    }

    // Check for duplicate organization name (application-level check)
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', name)
      .single()

    if (existingOrg) {
      return NextResponse.json(
        { error: 'An organization with this name already exists' },
        { status: 400 }
      )
    }

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        plan: 'starter', // Default plan
        payment_status: 'pending_payment', // Default payment status (Story 1.7)
        white_label_settings: {},
      })
      .select()
      .single()

    if (orgError || !organization) {
      // Check for duplicate name error (application-level check)
      // Note: Organization name uniqueness is enforced at application level, not database level
      // If duplicate name exists, PostgreSQL may return error code '23505' (unique violation)
      // However, since no database UNIQUE constraint exists, this check is primarily for future-proofing
      if (orgError?.code === '23505') { // PostgreSQL unique violation (if constraint added later)
        return NextResponse.json(
          { error: 'An organization with this name already exists' },
          { status: 400 }
        )
      }
      
      console.error('Failed to create organization:', orgError)
      return NextResponse.json(
        { error: 'Failed to create organization. Please try again.' },
        { status: 500 }
      )
    }

    // Update user record: link to organization and ensure role is 'owner'
    const { error: updateError } = await supabase
      .from('users')
      .update({
        org_id: organization.id,
        role: 'owner', // Ensure role is owner
      })
      .eq('id', userRecord.id)

    if (updateError) {
      // Rollback: delete organization if user update fails
      await supabase.from('organizations').delete().eq('id', organization.id)
      
      console.error('Failed to link user to organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to create organization. Please try again.' },
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
      },
      redirectTo: '/dashboard', // Will be updated in Story 1.7 to check payment status
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0]
      return NextResponse.json(
        { error: firstError?.message || 'Validation error' },
        { status: 400 }
      )
    }
    
    console.error('Organization creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

