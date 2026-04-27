import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { NextResponse } from 'next/server'

/**
 * GET /api/articles/usage
 * Returns article generation usage for the authenticated org.
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const org = currentUser.organizations as any
    const currentUsage: number = org?.article_usage ?? 0
    const limit: number | null = org?.article_limit ?? null
    const plan: string = org?.plan ?? 'starter'
    const remaining: number | null = limit !== null ? Math.max(0, limit - currentUsage) : null

    return NextResponse.json({ currentUsage, limit, plan, remaining })
  } catch (err) {
    console.error('[GET /api/articles/usage] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
