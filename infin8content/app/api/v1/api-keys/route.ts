/**
 * GET  /api/v1/api-keys   — List all API keys for the org (hashes masked)
 * POST /api/v1/api-keys   — Create a new API key (raw returned ONCE)
 *
 * Plan gate: only Pro and Agency plans can create API keys.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { generateApiKey, API_SCOPES } from '@/lib/api-auth/validate-api-key'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'
import { z, ZodError } from 'zod'

const ALLOWED_PLANS = ['pro', 'agency']

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  scopes: z
    .array(z.enum(API_SCOPES as [string, ...string[]]))
    .min(1)
    .default(['articles:read']),
  expires_at: z.string().datetime().optional(), // ISO 8601
})

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data, error } = await (supabase
      .from('api_keys')
      .select(
        'id, name, description, key_prefix, scopes, status, expires_at, last_used_at, usage_count, created_at'
      )
      .eq('org_id', currentUser.org_id)
      .order('created_at', { ascending: false }) as any)

    if (error) {
      return NextResponse.json({ error: 'Failed to load API keys' }, { status: 500 })
    }

    return NextResponse.json({ keys: data || [] })
  } catch (err) {
    console.error('[api-keys GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Plan gate — API keys are a Pro/Agency feature
    const plan = (currentUser.organizations as any)?.plan?.toLowerCase() || 'starter'
    if (!ALLOWED_PLANS.includes(plan)) {
      return NextResponse.json(
        {
          error: 'API key generation requires a Pro or Agency plan',
          currentPlan: plan,
          requiredPlans: ALLOWED_PLANS,
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createSchema.parse(body)

    const { raw, prefix, hashed } = generateApiKey()

    const supabase = await createClient()
    const { data: newKey, error: insertError } = await (supabase
      .from('api_keys')
      .insert({
        org_id: currentUser.org_id,
        created_by: currentUser.id,
        name: validated.name,
        description: validated.description ?? null,
        key_prefix: prefix,
        hashed_key: hashed,
        scopes: validated.scopes,
        expires_at: validated.expires_at ?? null,
        status: 'active',
      })
      .select('id, name, description, key_prefix, scopes, status, expires_at, created_at')
      .single() as any)

    if (insertError) {
      console.error('[api-keys POST] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    await logActionAsync({
      orgId: currentUser.org_id,
      userId: currentUser.id,
      action: 'api_key.created' as any,
      details: { keyId: newKey.id, name: validated.name, scopes: validated.scopes },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    })

    // Return the raw key ONCE — it will never be retrievable again
    return NextResponse.json(
      {
        success: true,
        key: {
          ...newKey,
          // raw_key is only present on creation response
          raw_key: raw,
        },
        warning: 'This key will only be shown once. Copy it now.',
      },
      { status: 201 }
    )
  } catch (err: any) {
    if (err instanceof ZodError) {
      const first = err.issues[0]
      return NextResponse.json(
        { error: 'Invalid input', details: { field: first.path.join('.'), message: first.message } },
        { status: 400 }
      )
    }
    console.error('[api-keys POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
