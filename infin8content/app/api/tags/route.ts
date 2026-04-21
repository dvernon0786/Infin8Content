import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * GET /api/tags?q=prefix
 *
 * Returns org tags for the current user's organization.
 * Used by TagInput for autocomplete suggestions.
 *
 * Auth flow:
 *   1. Verify user session via anon client (createClient)
 *   2. Look up their org_id from the users table
 *   3. Query org_tags via service-role client (bypasses RLS)
 *
 * We use service-role for org_tags because the RLS policy uses an
 * auth.uid() subquery that is only reliable in a live request context.
 * Inngest background jobs also write to org_tags using service-role,
 * so this keeps the auth model consistent and avoids silent 0-row returns.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const userClient = await createClient()
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2. Resolve org_id
    const { data: profileRaw, error: profileError } = await userClient
      .from('users')
      .select('org_id')
      .eq('auth_user_id', user.id)
      .single()
    const profile = profileRaw as unknown as { org_id: string } | null
    if (profileError || !profile?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // 3. Query org_tags via service-role (bypasses RLS JWT-claim dependency)
    const serviceClient = createServiceRoleClient()
    const q = request.nextUrl.searchParams.get('q')?.toLowerCase().trim() ?? ''

    let query = serviceClient
      .from('org_tags')
      .select('name')
      .eq('org_id', profile.org_id)
      .order('name', { ascending: true })
      .limit(50)

    if (q.length > 0) {
      query = query.ilike('name', `${q}%`)
    }

    const { data, error } = await query
    if (error) {
      console.error('[GET /api/tags]', error)
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    return NextResponse.json({
      tags: ((data ?? []) as unknown as { name: string }[]).map((row) => row.name),
    })
  } catch (err) {
    console.error('[GET /api/tags] Unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/tags
 *
 * Upserts a tag into org_tags so it appears in future autocomplete suggestions.
 * Called when the user creates a tag manually in the article editor sidebar.
 *
 * Body: { name: string }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const userClient = await createClient()
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2. Resolve org_id
    const { data: profileRaw, error: profileError } = await userClient
      .from('users')
      .select('org_id')
      .eq('auth_user_id', user.id)
      .single()
    const profile = profileRaw as unknown as { org_id: string } | null
    if (profileError || !profile?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // 3. Validate
    const body = await request.json()
    const name = (body?.name ?? '').trim().toLowerCase()
    if (!name || name.length < 1 || name.length > 50) {
      return NextResponse.json(
        { error: 'Tag name must be 1–50 characters' },
        { status: 400 }
      )
    }

    // 4. Upsert via service-role
    const serviceClient = createServiceRoleClient()
    const { error: upsertError } = await serviceClient
      .from('org_tags')
      .upsert(
        { org_id: profile.org_id, name },
        { onConflict: 'org_id,name', ignoreDuplicates: true }
      )
    if (upsertError) {
      console.error('[POST /api/tags]', upsertError)
      return NextResponse.json({ error: 'Failed to save tag' }, { status: 500 })
    }

    return NextResponse.json({ success: true, name })
  } catch (err) {
    console.error('[POST /api/tags] Unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
