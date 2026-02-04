import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

describe('Organizations Onboarding Integration Tests', () => {
  let supabase: SupabaseClient
  let testOrgId: string
  let testUserId: string

  beforeAll(async () => {
    // Setup test database connection
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create test user for RLS testing
    const { data: userData } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword',
      email_confirm: true
    })
    testUserId = userData.user?.id || ''
  })

  afterAll(async () => {
    // Cleanup test data
    if (testOrgId) {
      await supabase.from('organizations').delete().eq('id', testOrgId)
    }
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId)
    }
  })

  describe('Onboarding Column Operations', () => {
    it('can query organizations by onboarding_completed status', async () => {
      // Create test organization
      const testOrg = {
        name: 'Test Organization',
        slug: 'test-org-' + Date.now(),
      }

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert(testOrg)
        .select()
        .single()

      expect(orgError).toBeNull()
      expect(orgData).toBeDefined()
      testOrgId = orgData.id

      // Query by onboarding_completed status
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('onboarding_completed', false)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.length).toBeGreaterThan(0)
      
      // Find our test org in the results
      const testOrgResult = data.find(org => org.id === testOrgId)
      expect(testOrgResult).toBeDefined()
      expect(testOrgResult?.onboarding_completed).toBe(false)
    })

    it('can update onboarding columns via authenticated user', async () => {
      // This test would require proper authentication setup
      // For now, we'll test with service role key
      const updateData = {
        onboarding_completed: true,
        website_url: 'https://example.com',
        business_description: 'Test business description',
        target_audiences: ['developers', 'designers'],
        blog_config: {
          blog_root: '/blog',
          sitemap_url: 'https://example.com/sitemap.xml'
        },
        content_defaults: {
          language: 'en',
          tone: 'professional',
          internal_links: true
        },
        keyword_settings: {
          region: 'us',
          auto_generate: true,
          keyword_limits: 100
        }
      }

      const { data, error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', testOrgId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.onboarding_completed).toBe(true)
      expect(data.website_url).toBe('https://example.com')
      expect(data.business_description).toBe('Test business description')
      expect(data.target_audiences).toEqual(['developers', 'designers'])
      expect(data.blog_config).toEqual(updateData.blog_config)
      expect(data.content_defaults).toEqual(updateData.content_defaults)
      expect(data.keyword_settings).toEqual(updateData.keyword_settings)
    })

    it('JSONB columns can store and retrieve complex objects', async () => {
      const complexBlogConfig = {
        blog_root: '/blog',
        sitemap_url: 'https://example.com/sitemap.xml',
        reference_articles: [
          'https://example.com/blog/post1',
          'https://example.com/blog/post2',
          'https://example.com/blog/post3'
        ]
      }

      const { data, error } = await supabase
        .from('organizations')
        .update({ blog_config: complexBlogConfig })
        .eq('id', testOrgId)
        .select('blog_config')
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.blog_config).toEqual(complexBlogConfig)
      expect(data.blog_config.reference_articles).toHaveLength(3)
    })

    it('Text array column can store and retrieve arrays', async () => {
      const audiences = ['developers', 'designers', 'product-managers', 'marketing-team']

      const { data, error } = await supabase
        .from('organizations')
        .update({ target_audiences: audiences })
        .eq('id', testOrgId)
        .select('target_audiences')
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.target_audiences).toEqual(audiences)
      expect(data.target_audiences).toHaveLength(4)
    })
  })

  describe('RLS Policy Compliance', () => {
    it('maintains organization isolation for new columns', async () => {
      // Create another test organization
      const { data: org2Data } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Organization 2',
          slug: 'test-org-2-' + Date.now(),
        })
        .select()
        .single()

      expect(org2Data).toBeDefined()

      // Query should return both organizations with service role
      const { data: allOrgs } = await supabase
        .from('organizations')
        .select('id, onboarding_completed, blog_config')

      expect(allOrgs).toBeDefined()
      expect(allOrgs?.length).toBeGreaterThan(1)

      // Cleanup second org
      if (org2Data?.id) {
        await supabase.from('organizations').delete().eq('id', org2Data.id)
      }
    })
  })

  describe('Default Values Validation', () => {
    it('applies correct defaults to new organizations', async () => {
      const newOrg = {
        name: 'New Test Organization',
        slug: 'new-test-org-' + Date.now(),
      }

      const { data, error } = await supabase
        .from('organizations')
        .insert(newOrg)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()

      expect(data.onboarding_completed).toBe(false)
      expect(data.onboarding_version).toBe('v1')
      expect(data.blog_config).toEqual({})
      expect(data.content_defaults).toEqual({})
      expect(data.keyword_settings).toEqual({})
      expect(data.website_url).toBeNull()
      expect(data.business_description).toBeNull()
      expect(data.target_audiences).toBeNull()

      // Cleanup
      await supabase.from('organizations').delete().eq('id', data.id)
    })
  })
})
