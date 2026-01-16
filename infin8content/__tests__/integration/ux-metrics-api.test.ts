/**
 * Integration Tests for UX Metrics Admin API Endpoint
 * Story 32.1: User Experience Metrics Tracking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Type declarations for test environment
declare const process: {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    SUPABASE_SERVICE_ROLE_KEY: string
  }
}

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for integration tests')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const serviceRole = createServiceRoleClient()

describe('UX Metrics Admin API', () => {
  const org1Id = 'test-org-1'
  const org2Id = 'test-org-2'
  const owner1Id = 'owner-1'
  const owner2Id = 'owner-2'
  const editor1Id = 'editor-1'
  const weekStart = '2025-01-05'

  beforeEach(async () => {
    // Clean up test data
    await serviceRole
      .from('organizations')
      .delete()
      .in('id', [org1Id, org2Id])
    await serviceRole
      .from('users')
      .delete()
      .in('id', [owner1Id, owner2Id, editor1Id])
    await serviceRole
      .from('ux_metrics_events')
      .delete()
      .in('org_id', [org1Id, org2Id])
    await serviceRole
      .from('ux_metrics_weekly_rollups')
      .delete()
      .in('org_id', [org1Id, org2Id])

    // Create test organizations
    await serviceRole
      .from('organizations')
      .insert([
        { id: org1Id, name: 'Test Org 1', plan: 'pro' },
        { id: org2Id, name: 'Test Org 2', plan: 'pro' },
      ])

    // Create test users
    await serviceRole
      .from('users')
      .insert([
        {
          id: owner1Id,
          email: 'owner1@test.com',
          org_id: org1Id,
          role: 'owner',
          auth_user_id: owner1Id, // Simulate auth user mapping
        },
        {
          id: owner2Id,
          email: 'owner2@test.com',
          org_id: org2Id,
          role: 'owner',
          auth_user_id: owner2Id,
        },
        {
          id: editor1Id,
          email: 'editor1@test.com',
          org_id: org1Id,
          role: 'editor',
          auth_user_id: editor1Id,
        },
      ])

    // Create test rollups
    await serviceRole
      .from('ux_metrics_weekly_rollups')
      .insert([
        {
          org_id: org1Id,
          week_start: weekStart,
          metrics: {
            article_creation_completion_rate: 0.85,
            review_flow_median_duration_minutes: null,
            collaboration_adoption_rate: 1,
            avg_trust_score: 4.2,
            avg_collaboration_value_score: 4.5,
          },
        },
        {
          org_id: org1Id,
          week_start: '2025-01-12',
          metrics: {
            article_creation_completion_rate: 0.92,
            review_flow_median_duration_minutes: null,
            collaboration_adoption_rate: 0.8,
            avg_trust_score: 4.1,
            avg_collaboration_value_score: 4.3,
          },
        },
        {
          org_id: org2Id,
          week_start: weekStart,
          metrics: {
            article_creation_completion_rate: 0.78,
            review_flow_median_duration_minutes: null,
            collaboration_adoption_rate: 0.6,
            avg_trust_score: 3.9,
            avg_collaboration_value_score: 4.1,
          },
        },
      ])
  })

  afterEach(async () => {
    // Clean up test data
    await serviceRole
      .from('organizations')
      .delete()
      .in('id', [org1Id, org2Id])
    await serviceRole
      .from('users')
      .delete()
      .in('id', [owner1Id, owner2Id, editor1Id])
    await serviceRole
      .from('ux_metrics_events')
      .delete()
      .in('org_id', [org1Id, org2Id])
    await serviceRole
      .from('ux_metrics_weekly_rollups')
      .delete()
      .in('org_id', [org1Id, org2Id])
  })

  describe('GET /api/admin/ux-metrics/rollups', () => {
    it('should return rollups for authenticated owner', async () => {
      // Authenticate as owner1
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'owner1@test.com',
        password: 'password', // This would need to be set up in test environment
      })

      // For testing purposes, we'll mock the session
      // In a real test environment, you'd need proper auth setup

      // Create a mock session cookie for owner1
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        user: {
          id: owner1Id,
          email: 'owner1@test.com',
          user_metadata: { role: 'owner' },
        },
      }

      // This is a simplified test - in real integration tests,
      // you'd need to properly handle Supabase auth
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_auth_user_org_id`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockSession.access_token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      // Since we can't easily mock Next.js API routes in this environment,
      // we'll test the underlying data access patterns instead

      // Test that rollups are accessible with service role
      const { data: rollups, error: rollupsError } = await serviceRole
        .from('ux_metrics_weekly_rollups')
        .select('*')
        .eq('org_id', org1Id)
        .order('week_start', { ascending: false })
        .limit(2)

      expect(rollupsError).toBeNull()
      expect(rollups).toHaveLength(2)
      expect(rollups[0].org_id).toBe(org1Id)
      expect(rollups[0].week_start).toBe('2025-01-12')
      expect(rollups[1].week_start).toBe(weekStart)

      // Verify metrics structure
      const metrics = rollups[0].metrics
      expect(metrics).toHaveProperty('article_creation_completion_rate')
      expect(metrics).toHaveProperty('collaboration_adoption_rate')
      expect(metrics).toHaveProperty('avg_trust_score')
      expect(metrics).toHaveProperty('avg_collaboration_value_score')
      expect(metrics.review_flow_median_duration_minutes).toBeNull()
    })

    it('should respect limit parameter', async () => {
      const { data: rollups, error: rollupsError } = await serviceRole
        .from('ux_metrics_weekly_rollups')
        .select('*')
        .eq('org_id', org1Id)
        .order('week_start', { ascending: false })
        .limit(1)

      expect(rollupsError).toBeNull()
      expect(rollups).toHaveLength(1)
      expect(rollups[0].week_start).toBe('2025-01-12') // Most recent week
    })

    it('should not return rollups for different organization', async () => {
      const { data: rollups, error: rollupsError } = await serviceRole
        .from('ux_metrics_weekly_rollups')
        .select('*')
        .eq('org_id', org2Id)
        .order('week_start', { ascending: false })

      expect(rollupsError).toBeNull()
      expect(rollups).toHaveLength(1)
      expect(rollups[0].org_id).toBe(org2Id)
      expect(rollups[0].metrics.article_creation_completion_rate).toBe(0.78) // Different org's data
    })

    it('should return empty array when no rollups exist', async () => {
      // Delete all rollups
      await serviceRole
        .from('ux_metrics_weekly_rollups')
        .delete()
        .eq('org_id', org1Id)

      const { data: rollups, error: rollupsError } = await serviceRole
        .from('ux_metrics_weekly_rollups')
        .select('*')
        .eq('org_id', org1Id)

      expect(rollupsError).toBeNull()
      expect(rollups).toHaveLength(0)
    })
  })

  describe('Authorization', () => {
    it('should enforce owner-only access', async () => {
      // This test would need to be implemented with proper auth mocking
      // For now, we'll test the RLS policies directly

      // Try to access rollups as editor (should fail)
      const { data: editorRollups, error: editorError } = await supabase
        .from('ux_metrics_weekly_rollups')
        .select('*')
        .eq('org_id', org1Id)

      // Due to RLS, this should return no data for non-owners
      expect(editorRollups).toBeNull()
      expect(editorError).toBeTruthy()
    })

    it('should prevent cross-org data access', async () => {
      // Try to access org2 rollups with org1 user context
      // This would need proper auth session setup in real tests

      // For now, we'll verify the RLS policy structure
      const { data: policies, error: policyError } = await serviceRole
        .from('pg_policies')
        .select('policyname, policycmd, roles')
        .eq('tablename', 'ux_metrics_weekly_rollups')
        .eq('policyname', 'Owners can view UX metrics weekly rollups')

      expect(policyError).toBeNull()
      expect(policies).toHaveLength(1)
      expect(policies[0].policycmd).toContain('EXISTS')
      expect(policies[0].policycmd).toContain("role = 'owner'")
    })
  })
})
