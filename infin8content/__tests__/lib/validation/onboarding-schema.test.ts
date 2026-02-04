import { describe, it, expect } from 'vitest'
import { 
  businessSchema, 
  competitorsSchema, 
  blogSchema, 
  contentDefaultsSchema, 
  keywordSettingsSchema, 
  integrationSchema, 
  completeSchema 
} from '@/lib/validation/onboarding-schema'

describe('Onboarding Validation Schemas', () => {
  describe('businessSchema', () => {
    it('should accept valid business data', () => {
      const validData = {
        website_url: 'https://example.com',
        business_description: 'A great business that does amazing things',
        target_audiences: ['developers', 'designers', 'marketers']
      }
      
      expect(() => businessSchema.parse(validData)).not.toThrow()
    })

    it('should accept partial business data', () => {
      const partialData = {
        business_description: 'A great business'
      }
      
      expect(() => businessSchema.parse(partialData)).not.toThrow()
    })

    it('should reject invalid URL', () => {
      const invalidData = {
        website_url: 'not-a-url'
      }
      
      expect(() => businessSchema.parse(invalidData)).toThrow('Invalid URL format')
    })

    it('should reject short business description', () => {
      const invalidData = {
        business_description: 'Too short'
      }
      
      expect(() => businessSchema.parse(invalidData)).toThrow('Business description must be at least 10 characters')
    })

    it('should reject too many target audiences', () => {
      const invalidData = {
        target_audiences: Array(11).fill('audience')
      }
      
      expect(() => businessSchema.parse(invalidData)).toThrow('Maximum 10 audiences allowed')
    })
  })

  describe('competitorsSchema', () => {
    it('should accept valid competitors data', () => {
      const validData = {
        competitors: [
          {
            name: 'Competitor One',
            url: 'https://competitor1.com',
            description: 'A major competitor'
          },
          {
            name: 'Competitor Two',
            url: 'https://competitor2.com'
          }
        ]
      }
      
      expect(() => competitorsSchema.parse(validData)).not.toThrow()
    })

    it('should reject empty competitors array', () => {
      const invalidData = {
        competitors: []
      }
      
      expect(() => competitorsSchema.parse(invalidData)).toThrow('At least one competitor is required')
    })

    it('should reject invalid competitor URL', () => {
      const invalidData = {
        competitors: [
          {
            name: 'Competitor One',
            url: 'not-a-url'
          }
        ]
      }
      
      expect(() => competitorsSchema.parse(invalidData)).toThrow('Invalid competitor URL format')
    })

    it('should reject too many competitors', () => {
      const invalidData = {
        competitors: Array(11).fill(null).map((_, i) => ({
          name: `Competitor ${i}`,
          url: `https://competitor${i}.com`
        }))
      }
      
      expect(() => competitorsSchema.parse(invalidData)).toThrow('Maximum 10 competitors allowed')
    })
  })

  describe('blogSchema', () => {
    it('should accept valid blog data', () => {
      const validData = {
        blog_name: 'Tech Blog',
        blog_description: 'A blog about technology and innovation',
        blog_category: 'Technology',
        post_frequency: 'weekly' as const
      }
      
      expect(() => blogSchema.parse(validData)).not.toThrow()
    })

    it('should reject invalid post frequency', () => {
      const invalidData = {
        blog_name: 'Tech Blog',
        blog_description: 'A blog about technology',
        blog_category: 'Technology',
        post_frequency: 'invalid'
      }
      
      expect(() => blogSchema.parse(invalidData)).toThrow('Post frequency must be one of: daily, weekly, monthly')
    })

    it('should reject short blog name', () => {
      const invalidData = {
        blog_name: 'AB',
        blog_description: 'A blog about technology',
        blog_category: 'Technology',
        post_frequency: 'weekly' as const
      }
      
      expect(() => blogSchema.parse(invalidData)).toThrow('Blog name must be at least 3 characters')
    })
  })

  describe('contentDefaultsSchema', () => {
    it('should accept valid content defaults', () => {
      const validData = {
        language: 'en',
        tone: 'professional' as const,
        style: 'informative' as const,
        target_word_count: 1500,
        auto_publish: false
      }
      
      expect(() => contentDefaultsSchema.parse(validData)).not.toThrow()
    })

    it('should reject invalid tone', () => {
      const invalidData = {
        language: 'en',
        tone: 'invalid',
        style: 'informative' as const,
        target_word_count: 1500,
        auto_publish: false
      }
      
      expect(() => contentDefaultsSchema.parse(invalidData)).toThrow('Tone must be one of: professional, casual, formal, friendly')
    })

    it('should reject word count below minimum', () => {
      const invalidData = {
        language: 'en',
        tone: 'professional' as const,
        style: 'informative' as const,
        target_word_count: 400,
        auto_publish: false
      }
      
      expect(() => contentDefaultsSchema.parse(invalidData)).toThrow('Word count must be at least 500')
    })
  })

  describe('keywordSettingsSchema', () => {
    it('should accept valid keyword settings', () => {
      const validData = {
        target_region: 'United States',
        language_code: 'en',
        auto_generate_keywords: true,
        monthly_keyword_limit: 100
      }
      
      expect(() => keywordSettingsSchema.parse(validData)).not.toThrow()
    })

    it('should reject keyword limit below minimum', () => {
      const invalidData = {
        target_region: 'United States',
        language_code: 'en',
        auto_generate_keywords: true,
        monthly_keyword_limit: 0
      }
      
      expect(() => keywordSettingsSchema.parse(invalidData)).toThrow('Monthly keyword limit must be at least 1')
    })
  })

  describe('integrationSchema', () => {
    it('should accept valid integration data', () => {
      const validData = {
        wordpress_url: 'https://example.com/wp-json',
        wordpress_username: 'admin',
        webflow_url: 'https://example.webflow.com',
        other_integrations: {
          github: 'enabled',
          slack: 'disabled'
        }
      }
      
      expect(() => integrationSchema.parse(validData)).not.toThrow()
    })

    it('should accept empty integration data', () => {
      const emptyData = {}
      
      expect(() => integrationSchema.parse(emptyData)).not.toThrow()
    })

    it('should reject invalid WordPress URL', () => {
      const invalidData = {
        wordpress_url: 'not-a-url'
      }
      
      expect(() => integrationSchema.parse(invalidData)).toThrow('Invalid WordPress URL format')
    })
  })

  describe('completeSchema', () => {
    it('should accept empty object', () => {
      const emptyData = {}
      
      expect(() => completeSchema.parse(emptyData)).not.toThrow()
    })

    it('should accept any object (but ignore additional properties)', () => {
      const dataWithExtras = {
        extra: 'property',
        another: 'value'
      }
      
      expect(() => completeSchema.parse(dataWithExtras)).not.toThrow()
    })
  })
})
