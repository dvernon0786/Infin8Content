/**
 * GET /api/v1/social/accounts
 *
 * Returns the active social accounts connected to the user's organization.
 * Used by SocialPublishModal to show which networks the post will go to.
 *
 * Returns: { accounts: SocialAccount[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RLS scopes this to the user's org
  const { data: accounts, error } = await (supabase as any)
    .from('org_social_accounts')
    .select('outstand_account_id, network, username, is_active')
    .eq('is_active', true)
    .order('network')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }

  return NextResponse.json({ accounts: accounts ?? [] })
}
