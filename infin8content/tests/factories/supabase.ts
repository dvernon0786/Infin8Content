/**
 * Shared factory for Supabase client test mocks
 * 
 * This provides a consistent way to mock Supabase in tests.
 * The cast is intentional - tests don't need Supabase internals,
 * only the ability to mock service boundaries.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export function mockSupabase(): SupabaseClient {
  return {} as unknown as SupabaseClient
}
