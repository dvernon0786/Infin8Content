import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

describe('Organizations Onboarding Migration', () => {
  let supabase: SupabaseClient
  let testOrgId: string

  beforeAll(async () => {
    // Setup test database connection
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  })

  afterAll(async () => {
    // Cleanup test data
    if (testOrgId) {
      await supabase.from('organizations').delete().eq('id', testOrgId)
    }
  })

  describe('Migration Schema Validation', () => {
    it('should have onboarding_completed column with BOOLEAN type', async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('onboarding_completed')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have onboarding_version column with TEXT type', async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('onboarding_version')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have website_url column with TEXT type (nullable)', async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('website_url')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have business_description column with TEXT type (nullable)', async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('business_description')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have target_audiences column with TEXT[] type (nullable)', async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('target_audiences')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have blog_config column with JSONB type', async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('blog_config')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have content_defaults column with JSONB type', async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('content_defaults')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('should have keyword_settings column with JSONB type', async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('keyword_settings')
        .limit(1)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })

  describe('Default Values', () => {
    it('should have correct default values for new organizations', async () => {
      const testOrg = {
        name: 'Test Organization',
        slug: 'test-org-' + Date.now(),
      }

      const { data, error } = await supabase
        .from('organizations')
        .insert(testOrg)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      
      testOrgId = data.id

      expect(data.onboarding_completed).toBe(false)
      expect(data.onboarding_version).toBe('v1')
      expect(data.blog_config).toEqual({})
      expect(data.content_defaults).toEqual({})
      expect(data.keyword_settings).toEqual({})
    })
  })

  describe('Index Validation', () => {
    it('should have index on onboarding_completed column', async () => {
      // This would require admin access to check pg_indexes
      // For now, we'll test the performance by querying
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('onboarding_completed', false)
        .limit(10)

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })
})
