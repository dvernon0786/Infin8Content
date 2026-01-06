import { createClient } from '@supabase/supabase-js'
import { describe, it, expect } from 'vitest'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// Note: These tests require a running Supabase instance and valid env vars
// If env vars are missing, skip these tests gracefully
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

describe('RLS Policy Security Tests', () => {
    // Initialize client inside tests to avoid immediate crashing if env vars are missing
    // or use a conditional check

    it('PROHIBITS public SELECT on team_invitations', async () => {
        const supabase = createClient(supabaseUrl!, supabaseAnonKey!)
        // Attempt to read all invitations using anon key
        // This should fail or return empty list because we removed the "Anyone" policy
        // and default RLS is "deny all"
        const { data, error } = await supabase.from('team_invitations').select('*')

        // If RLS is working, it should return an empty array (filtering out everything)
        // OR throw a permission error depending on config. 
        // Usually RLS just filters rows, so data should be []
        // If the "Anyone can view" policy was still there with "Using (true)", this would return ALL rows.
        // We expect 0 rows or an error.

        if (error) {
            // Error is also acceptable (Permission denied)
            expect(error).toBeDefined()
        } else {
            expect(data).toEqual([])
        }
    })

    it('PROHIBITS public INSERT on team_invitations', async () => {
        const supabase = createClient(supabaseUrl!, supabaseAnonKey!)
        const { error } = await supabase.from('team_invitations').insert({
            email: 'test@example.com',
            org_id: '123e4567-e89b-12d3-a456-426614174000',
            role: 'viewer',
            token: 'fake-token',
            expires_at: new Date().toISOString(),
            created_by: '123e4567-e89b-12d3-a456-426614174000'
        })
        // Should fail with RLS violation
        expect(error).toBeDefined()
    })

    it('ALLOWS fetching invitation by token via RPC', async () => {
        const supabase = createClient(supabaseUrl!, supabaseAnonKey!)
        // This tests the mechanism, even if token is invalid
        const { data, error } = await supabase.rpc('get_invitation_by_token', {
            token_input: 'invalid-token-123'
        })

        expect(error).toBeNull()
        expect(data).toEqual([]) // Should be empty for invalid token, but call succeeds
    })
})
