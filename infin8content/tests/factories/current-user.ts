/**
 * Shared factory for CurrentUser test mocks
 * 
 * This ensures all tests use the same mock structure and stay in sync
 * with the actual CurrentUser type contract.
 */

import type { CurrentUser } from '@/lib/supabase/get-current-user'

export function mockCurrentUser(
  overrides: Partial<CurrentUser> = {}
): CurrentUser {
  return {
    id: 'user_1',
    user: { id: 'user_1', email: 'test@test.com' },
    email: 'test@test.com',
    first_name: 'Test',
    role: 'admin',
    org_id: 'org_1',
    organizations: null,
    ...overrides,
  }
}
