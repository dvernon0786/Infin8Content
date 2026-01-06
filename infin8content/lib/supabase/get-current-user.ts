// Reusable helper to get current user with organization data
import { createClient } from './server'
import { cache } from 'react'
import type { Database } from './database.types'

type UserRecord = Database['public']['Tables']['users']['Row']
type OrganizationRecord = Database['public']['Tables']['organizations']['Row']

export interface CurrentUser {
  user: {
    id: string
    email?: string
  }
  id: string
  email: string
  role: string
  org_id: string | null
  organizations?: OrganizationRecord | null
}

/**
 * Get the current authenticated user with their organization data
 * @returns Current user with organization data, or null if not authenticated
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()

  // Get authenticated user from Supabase Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  // Query users table to get user record
  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('id, email, role, org_id')
    .eq('auth_user_id', user.id)
    .single()

  if (userError || !userRecord) {
    console.error('Failed to load user record in getCurrentUser:', userError)
    return null
  }

  // Query organization if org_id exists
  let organization: OrganizationRecord | null = null
  if (userRecord.org_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userRecord.org_id)
      .single()

    organization = orgData || null
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    id: userRecord.id,
    email: userRecord.email,
    role: userRecord.role,
    org_id: userRecord.org_id,
    organizations: organization,
  }
})

