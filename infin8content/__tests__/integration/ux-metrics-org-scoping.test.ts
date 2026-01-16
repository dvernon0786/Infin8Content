/**
 * Integration Tests for UX Metrics Org Scoping and Data Isolation
 * Story 32.1: User Experience Metrics Tracking
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { emitUXMetricsEvent } from '@/lib/services/ux-metrics'
import { computeUXMetricsRollup } from '@/lib/services/ux-metrics-rollup'

// Type declarations for test environment
declare const process: {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: string
    SUPABASE_SERVICE_ROLE_KEY: string
  }
}

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for integration tests')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const serviceRole = createServiceRoleClient()

describe('UX Metrics Org Scoping and Data Isolation', () => {
  const org1Id = 'test-org-1'
  const org2Id = 'test-org-2'
  const user1Id = 'test-user-1'
  const user2Id = 'test-user-2'
  const weekStart = '2025-01-05'

  beforeEach(async () => {
    // Clean up test data
    await supabase
      .from('ux_metrics_events')
      .delete()
      .in('org_id', [org1Id, org2Id])
    await supabase
      .from('ux_metrics_weekly_rollups')
      .delete()
      .in('org_id', [org1Id, org2Id])
  })

  afterEach(async () => {
    // Clean up test data
    await supabase
      .from('ux_metrics_events')
      .delete()
      .in('org_id', [org1Id, org2Id])
    await supabase
      .from('ux_metrics_weekly_rollups')
      .delete()
      .in('org_id', [org1Id, org2Id])
  })

  describe('Event Emission and Org Scoping', () => {
    it('should only return events for the correct organization', async () => {
      // Emit events for both organizations
      await emitUXMetricsEvent({
        orgId: org1Id,
        userId: user1Id,
        eventName: 'article_create_flow.STARTED',
        flowInstanceId: 'flow-1',
        articleId: 'article-1',
      })

      await emitUXMetricsEvent({
        orgId: org2Id,
        userId: user2Id,
        eventName: 'article_create_flow.STARTED',
        flowInstanceId: 'flow-2',
        articleId: 'article-2',
      })

      // Query events for org1
      const { data: org1Events, error: org1Error } = await supabase
        .from('ux_metrics_events')
        .select('*')
        .eq('org_id', org1Id)

      expect(org1Error).toBeNull()
      expect(org1Events).toHaveLength(1)
      expect(org1Events[0].org_id).toBe(org1Id)
      expect(org1Events[0].event_name).toBe('article_create_flow.STARTED')

      // Query events for org2
      const { data: org2Events, error: org2Error } = await supabase
        .from('ux_metrics_events')
        .select('*')
        .eq('org_id', org2Id)

      expect(org2Error).toBeNull()
      expect(org2Events).toHaveLength(1)
      expect(org2Events[0].org_id).toBe(org2Id)
      expect(org2Events[0].event_name).toBe('article_create_flow.STARTED')
    })

    it('should prevent cross-org data leakage in rollups', async () => {
      // Create events for both organizations
      await emitUXMetricsEvent({
        orgId: org1Id,
        userId: user1Id,
        eventName: 'article_create_flow.STARTED',
        flowInstanceId: 'flow-1',
        articleId: 'article-1',
        createdAt: '2025-01-05T10:00:00Z',
      })

      await emitUXMetricsEvent({
        orgId: org1Id,
        userId: user1Id,
        eventName: 'article_create_flow.COMPLETED',
        flowInstanceId: 'flow-1',
        articleId: 'article-1',
        createdAt: '2025-01-05T18:00:00Z',
      })

      await emitUXMetricsEvent({
        orgId: org2Id,
        userId: user2Id,
        eventName: 'article_create_flow.STARTED',
        flowInstanceId: 'flow-2',
        articleId: 'article-2',
        createdAt: '2025-01-06T10:00:00Z',
      })

      // Note: No COMPLETED event for org2, so completion rate should be 0

      // Compute rollups for org1
      const org1Metrics = await computeUXMetricsRollup(org1Id, weekStart)

      // Compute rollups for org2
      const org2Metrics = await computeUXMetricsRollup(org2Id, weekStart)

      // Verify org1 metrics (should have completion rate)
      expect(org1Metrics.article_creation_completion_rate).toBe(1) // 1/1 completed within 24h

      // Verify org2 metrics (should have completion rate of 0)
      expect(org2Metrics.article_creation_completion_rate).toBe(0) // 0/1 completed

      // Verify no cross-contamination
      expect(org1Metrics.collaboration_adoption_rate).toBeNull()
      expect(org2Metrics.collaboration_adoption_rate).toBeNull()
    })
  })

  describe('Flow Instance Idempotency', () => {
    it('should handle duplicate STARTED events gracefully', async () => {
      const flowInstanceId = 'flow-duplicate-test'

      // Emit STARTED event twice
      await emitUXMetricsEvent({
        orgId: org1Id,
        userId: user1Id,
        eventName: 'article_create_flow.STARTED',
        flowInstanceId,
        articleId: 'article-duplicate',
      })

      await emitUXMetricsEvent({
        orgId: org1Id,
        userId: user1Id,
        eventName: 'article_create_flow.STARTED',
        flowInstanceId,
        articleId: 'article-duplicate',
      })

      // Emit COMPLETED event
      await emitUXMetricsEvent({
        orgId: org1Id,
        userId: user1Id,
        eventName: 'article_create_flow.COMPLETED',
        flowInstanceId,
        articleId: 'article-duplicate',
        createdAt: '2025-01-05T18:00:00Z',
      })

      // Compute metrics
      const metrics = await computeUXMetricsRollup(org1Id, weekStart)

      // Should still compute correctly (2 STARTED, 1 COMPLETED = 0.5 completion rate)
      expect(metrics.article_creation_completion_rate).toBe(0.5)
    })

    it('should handle COMPLETED without STARTED gracefully', async () => {
      const flowInstanceId = 'flow-completed-only'

      // Emit COMPLETED event without STARTED
      await emitUXMetricsEvent({
        orgId: org1Id,
        userId: user1Id,
        eventName: 'article_create_flow.COMPLETED',
        flowInstanceId,
        articleId: 'article-completed-only',
        createdAt: '2025-01-05T18:00:00Z',
      })

      // Compute metrics
      const metrics = await computeUXMetricsRollup(org1Id, weekStart)

      // Should handle gracefully (0 completion rate since no STARTED events)
      expect(metrics.article_creation_completion_rate).toBe(0)
    })
  })

  describe('Weekly Rollup Storage', () => {
    it('should store rollups with correct org scoping', async () => {
      // Create some events
      await emitUXMetricsEvent({
        orgId: org1Id,
        userId: user1Id,
        eventName: 'article_create_flow.STARTED',
        flowInstanceId: 'flow-1',
        articleId: 'article-1',
      })

      await emitUXMetricsEvent({
        orgId: org2Id,
        userId: user2Id,
        eventName: 'collaboration_interaction.INVITE_ACCEPTED',
        payload: { invitationId: 'inv-1' },
      })

      // Compute and store rollups
      const org1Metrics = await computeUXMetricsRollup(org1Id, weekStart)
      const org2Metrics = await computeUXMetricsRollup(org2Id, weekStart)

      // Store rollups using service role
      await serviceRole
        .from('ux_metrics_weekly_rollups')
        .upsert({
          org_id: org1Id,
          week_start: weekStart,
          metrics: org1Metrics,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'org_id,week_start',
        })

      await serviceRole
        .from('ux_metrics_weekly_rollups')
        .upsert({
          org_id: org2Id,
          week_start: weekStart,
          metrics: org2Metrics,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'org_id,week_start',
        })

      // Verify org1 rollup
      const { data: org1Rollup, error: org1RollupError } = await supabase
        .from('ux_metrics_weekly_rollups')
        .select('*')
        .eq('org_id', org1Id)
        .eq('week_start', weekStart)
        .single()

      expect(org1RollupError).toBeNull()
      expect(org1Rollup).toBeTruthy()
      expect(org1Rollup.org_id).toBe(org1Id)
      expect(org1Rollup.week_start).toBe(weekStart)
      expect(org1Rollup.metrics).toEqual(org1Metrics)

      // Verify org2 rollup
      const { data: org2Rollup, error: org2RollupError } = await supabase
        .from('ux_metrics_weekly_rollups')
        .select('*')
        .eq('org_id', org2Id)
        .eq('week_start', weekStart)
        .single()

      expect(org2RollupError).toBeNull()
      expect(org2Rollup).toBeTruthy()
      expect(org2Rollup.org_id).toBe(org2Id)
      expect(org2Rollup.week_start).toBe(weekStart)
      expect(org2Rollup.metrics).toEqual(org2Metrics)
    })

    it('should prevent cross-org rollup access', async () => {
      // Store rollup for org1 only
      const metrics = await computeUXMetricsRollup(org1Id, weekStart)
      await serviceRole
        .from('ux_metrics_weekly_rollups')
        .upsert({
          org_id: org1Id,
          week_start: weekStart,
          metrics,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'org_id,week_start',
        })

      // Try to access org1 rollup as org2 (should fail with RLS)
      const { data: crossOrgRollup, error: crossOrgError } = await supabase
        .from('ux_metrics_weekly_rollups')
        .select('*')
        .eq('org_id', org1Id)
        .eq('week_start', weekStart)
        .single()

      // This should fail due to RLS (org2 user trying to access org1 data)
      expect(crossOrgError).toBeTruthy()
      expect(crossOrgRollup).toBeNull()
    })
  })
})
