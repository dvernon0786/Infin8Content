/**
 * Internal Test Endpoint: Create Workflow
 * Creates a fresh workflow for E2E testing with authentication token
 * 
 * POST /api/internal/test-create-workflow
 * Returns workflow_id and auth token for testing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/client'
import jwt from 'jsonwebtoken'

// Test JWT secret (in production, use proper env var)
const JWT_SECRET = process.env.NEXT_PUBLIC_SUPABASE_JWT_SECRET || 'test-secret'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    let organizationId: string
    let userId: string
    
    // Create test organization if needed
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', 'test-organization')
      .limit(1)

    if (orgError || !org || org.length === 0) {
      // Create test organization
      const { data: newOrg, error: createOrgError } = await supabase
        .from('organizations')
        .insert({
          name: 'test-organization',
          slug: 'test-organization',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (createOrgError) {
        return NextResponse.json(
          { error: 'Failed to create test organization' },
          { status: 500 }
        )
      }
      
      organizationId = (newOrg as any).id
    } else {
      organizationId = (org as any)[0].id
    }

    // Create test user if needed
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', 'test-user@example.com')
      .limit(1)

    if (userError || !user || user.length === 0) {
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: 'test-user@example.com',
        password: 'test-password',
        email_confirm: true,
        user_metadata: {
          role: 'test'
        }
      })

      if (createUserError) {
        return NextResponse.json(
          { error: 'Failed to create test user' },
          { status: 500 }
        )
      }
      
      userId = newUser.user.id
    } else {
      userId = (user as any)[0].id
    }

    // Create workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('intent_workflows')
      .insert({
        name: `test-workflow-${Date.now()}`,
        organization_id: organizationId,
        status: 'step_0_initial',
        current_step: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, organization_id, status, current_step')
      .single()

    if (workflowError) {
      return NextResponse.json(
        { error: 'Failed to create workflow' },
        { status: 500 }
      )
    }

    // Create JWT token for test user
    const token = jwt.sign(
      {
        user_id: userId,
        org_id: organizationId,
        email: 'test-user@example.com',
        role: 'test'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    return NextResponse.json({
      workflow_id: (workflow as any).id,
      organization_id: (workflow as any).organization_id,
      status: (workflow as any).status,
      current_step: (workflow as any).current_step,
      token: token,
      user_id: userId
    })

  } catch (error: any) {
    console.error('[TestCreateWorkflow] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
