// Section Templates System Tests
// Story 14.3: Section Templates System

import { 
  getSectionTemplate,
  processTemplate,
  selectTemplateByContentType,
  validateTemplatePerformance,
  validateTemplateSEO,
  validateTemplatePerformanceSEO,
  registerCustomTemplate,
  getAllCustomTemplates,
  customizeTemplate,
  type SectionTemplate,
  type TemplateContext,
  type SEOValidationResult
} from '../../../../lib/services/article-generation/section-templates'

describe('Section Templates System', () => {
  describe('Template Interface and Structure', () => {
    it('should define a valid SectionTemplate interface', () => {
      const template: SectionTemplate = {
        type: 'introduction',
        wordCount: 120,
        seoRules: {
          keywordPlacement: 'first_100_words',
          densityTarget: 0.8,
          semanticKeywords: ['test', 'example'],
          hookRequired: true
        },
        placeholders: ['{{keyword}}', '{{audience}}'],
        template: 'Test template content with {{keyword}} for {{audience}}'
      }

      expect(template.type).toBe('introduction')
      expect(template.wordCount).toBe(120)
      expect(template.seoRules.keywordPlacement).toBe('first_100_words')
      expect(template.placeholders).toContain('{{keyword}}')
    })
  })

  describe('Template Selection Logic', () => {
    it('should select introduction template for introduction section type', () => {
      const context: TemplateContext = {
        sectionType: 'introduction',
        keyword: 'test keyword',
        targetAudience: 'General',
        contentType: 'blog_post'
      }

      const template = getSectionTemplate(context)
      expect(template).toBeDefined()
      expect(template.type).toBe('introduction')
    })

    it('should select H2 template for h2 section type', () => {
      const context: TemplateContext = {
        sectionType: 'h2',
        keyword: 'test keyword',
        targetAudience: 'General',
        contentType: 'blog_post'
      }

      const template = getSectionTemplate(context)
      expect(template).toBeDefined()
      expect(template.type).toBe('h2')
    })

    it('should select template based on content type and audience', () => {
      const businessContext: TemplateContext = {
        sectionType: 'introduction',
        keyword: 'business strategy',
        targetAudience: 'Small Business Owners',
        contentType: 'business_guide'
      }

      const generalContext: TemplateContext = {
        sectionType: 'introduction',
        keyword: 'business strategy',
        targetAudience: 'General',
        contentType: 'blog_post'
      }

      const businessTemplate = getSectionTemplate(businessContext)
      const generalTemplate = getSectionTemplate(generalContext)

      expect(businessTemplate.template).not.toBe(generalTemplate.template)
    })
  })

  describe('Template Processing', () => {
    it('should process template with dynamic content insertion', () => {
      const template: SectionTemplate = {
        type: 'introduction',
        wordCount: 100,
        seoRules: {
          keywordPlacement: 'first_100_words',
          densityTarget: 1.0,
          semanticKeywords: ['test'],
          hookRequired: true
        },
        placeholders: ['{{keyword}}', '{{audience}}'],
        template: 'Welcome {{audience}} to our guide on {{keyword}}. This comprehensive resource will help you understand {{keyword}} better.'
      }

      const context: TemplateContext = {
        sectionType: 'introduction',
        keyword: 'digital marketing',
        targetAudience: 'Small Business Owners',
        contentType: 'blog_post'
      }

      const processed = processTemplate(template, context)
      expect(processed).toContain('Welcome Small Business Owners')
      expect(processed).toContain('digital marketing')
      expect(processed).not.toContain('{{keyword}}')
      expect(processed).not.toContain('{{audience}}')
    })

    it('should handle missing placeholders gracefully', () => {
      const template: SectionTemplate = {
        type: 'introduction',
        wordCount: 100,
        seoRules: {
          keywordPlacement: 'first_100_words',
          densityTarget: 1.0,
          semanticKeywords: ['test'],
          hookRequired: true
        },
        placeholders: ['{{keyword}}', '{{missing}}'],
        template: 'Content about {{keyword}} and {{missing}}'
      }

      const context: TemplateContext = {
        sectionType: 'introduction',
        keyword: 'test',
        targetAudience: 'General',
        contentType: 'blog_post'
      }

      const processed = processTemplate(template, context)
      expect(processed).toContain('test')
      expect(processed).toContain('{{missing}}') // Should preserve unreplaced placeholders
    })

    it('should process template within performance threshold (<50ms)', async () => {
      const template: SectionTemplate = {
        type: 'introduction',
        wordCount: 100,
        seoRules: {
          keywordPlacement: 'first_100_words',
          densityTarget: 1.0,
          semanticKeywords: ['test'],
          hookRequired: true
        },
        placeholders: ['{{keyword}}'],
        template: 'Test content for {{keyword}}'
      }

      const context: TemplateContext = {
        sectionType: 'introduction',
        keyword: 'test',
        targetAudience: 'General',
        contentType: 'blog_post'
      }

      const startTime = performance.now()
      processTemplate(template, context)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(50)
    })
  })

  describe('Template Performance Tracking', () => {
    it('should track template selection performance (<10ms)', async () => {
      const context: TemplateContext = {
        sectionType: 'introduction',
        keyword: 'test',
        targetAudience: 'General',
        contentType: 'blog_post'
      }

      const startTime = performance.now()
      getSectionTemplate(context)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(10)
    })

    it('should validate template performance metrics', () => {
      const metrics = validateTemplatePerformance()
      
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0)
      expect(metrics.averageSelectionTime).toBeLessThan(10)
      expect(metrics.averageProcessingTime).toBeLessThan(50)
      expect(metrics.memoryUsage).toBeLessThan(50)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing template types gracefully', () => {
      const context: TemplateContext = {
        sectionType: 'invalid_type' as any,
        keyword: 'test',
        targetAudience: 'General',
        contentType: 'blog_post'
      }

      expect(() => getSectionTemplate(context)).not.toThrow()
      const template = getSectionTemplate(context)
      expect(template.type).toBe('h2') // Should fallback to default
    })

    it('should handle template processing failures', () => {
      const template: SectionTemplate = {
        type: 'introduction',
        wordCount: 100,
        seoRules: {
          keywordPlacement: 'first_100_words',
          densityTarget: 1.0,
          semanticKeywords: ['test'],
          hookRequired: true
        },
        placeholders: [],
        template: null as any // Invalid template
      }

      const context: TemplateContext = {
        sectionType: 'introduction',
        keyword: 'test',
        targetAudience: 'General',
        contentType: 'blog_post'
      }

      expect(() => processTemplate(template, context)).not.toThrow()
      const result = processTemplate(template, context)
      expect(typeof result).toBe('string')
    })
  })

  describe('Content Type and Audience Selection', () => {
    it('should select different templates for different content types', () => {
      const blogContext: TemplateContext = {
        sectionType: 'introduction',
        keyword: 'test',
        targetAudience: 'General',
        contentType: 'blog_post'
      }

      const guideContext: TemplateContext = {
        sectionType: 'introduction',
        keyword: 'test',
        targetAudience: 'General',
        contentType: 'comprehensive_guide'
      }

      const blogTemplate = getSectionTemplate(blogContext)
      const guideTemplate = getSectionTemplate(guideContext)

      expect(blogTemplate.type).toBe(guideTemplate.type)
      expect(blogTemplate.template).not.toBe(guideTemplate.template)
    })

    it('should select templates based on target audience', () => {
      const professionalContext: TemplateContext = {
        sectionType: 'h2',
        keyword: 'advanced topic',
        targetAudience: 'Marketing Professionals',
        contentType: 'blog_post'
      }

      const generalContext: TemplateContext = {
        sectionType: 'h2',
        keyword: 'advanced topic',
        targetAudience: 'General',
        contentType: 'blog_post'
      }

      const professionalTemplate = getSectionTemplate(professionalContext)
      const generalTemplate = getSectionTemplate(generalContext)

      expect(professionalTemplate.template).not.toBe(generalTemplate.template)
    })
  })

  describe('SEO Validation', () => {
    it('should detect SEO violations', () => {
      const template: SectionTemplate = {
        type: 'introduction',
        wordCount: 100,
        seoRules: {
          keywordPlacement: 'first_100_words',
          densityTarget: 1.0,
          semanticKeywords: ['test', 'example'],
          hookRequired: true
        },
        placeholders: ['{{keyword}}'],
        template: 'Welcome to our guide. This comprehensive resource covers everything you need to know.'
      }

      const context: TemplateContext = {
        sectionType: 'introduction',
        keyword: 'digital marketing',
        targetAudience: 'General',
        contentType: 'blog_post'
      }

      const validation = validateTemplateSEO(template, template.template, context)
      expect(validation.isValid).toBe(false)
      expect(validation.issues.length).toBeGreaterThan(0)
      expect(validation.issues.some(issue => issue.includes('keyword'))).toBe(true)
    })

    it('should validate template performance SEO', () => {
      const template: SectionTemplate = {
        type: 'introduction',
        wordCount: 120,
        seoRules: {
          keywordPlacement: 'first_100_words',
          densityTarget: 0.8,
          semanticKeywords: ['guide', 'tutorial'],
          hookRequired: true
        },
        placeholders: ['{{keyword}}'],
        template: 'Welcome {{audience}} to our guide on {{keyword}}.'
      }

      const context: TemplateContext = {
        sectionType: 'introduction',
        keyword: 'test',
        targetAudience: 'General',
        contentType: 'blog_post'
      }

      const validation = validateTemplatePerformanceSEO(template, context)
      expect(validation.isValid).toBe(true)
      expect(validation.score).toBeGreaterThan(70)
    })
  })

  describe('Template Customization Framework', () => {
    it('should register custom templates', () => {
      const customTemplate = {
        name: 'Custom Introduction',
        description: 'A custom introduction template',
        sectionType: 'introduction' as const,
        contentType: 'blog_post',
        targetAudience: 'Technical Users',
        template: {
          type: 'introduction' as const,
          wordCount: 150,
          seoRules: {
            keywordPlacement: 'first_100_words' as const,
            densityTarget: 1.2,
            semanticKeywords: ['technical', 'advanced'],
            hookRequired: true
          },
          placeholders: ['{{keyword}}', '{{audience}}'],
          template: 'Technical deep dive into {{keyword}} for {{audience}}.'
        },
        isActive: true
      }

      const templateId = registerCustomTemplate(customTemplate)
      expect(templateId).toBeDefined()
      expect(templateId).toMatch(/^custom_\d+_[a-z0-9]+$/)

      const allTemplates = getAllCustomTemplates()
      expect(allTemplates).toHaveLength(1)
      expect(allTemplates[0].name).toBe('Custom Introduction')
    })

    it('should customize existing templates', () => {
      const baseTemplate: SectionTemplate = {
        type: 'h2',
        wordCount: 500,
        seoRules: {
          keywordPlacement: 'distributed',
          densityTarget: 1.0,
          semanticKeywords: ['basic'],
          hookRequired: false
        },
        placeholders: ['{{keyword}}'],
        template: 'Content about {{keyword}}.'
      }

      const customized = customizeTemplate(baseTemplate, {
        wordCount: 600,
        densityTarget: 1.5,
        semanticKeywords: ['advanced', 'expert']
      })

      expect(customized.wordCount).toBe(600)
      expect(customized.seoRules.densityTarget).toBe(1.5)
      expect(customized.seoRules.semanticKeywords).toEqual(['advanced', 'expert'])
      expect(customized.type).toBe(baseTemplate.type) // Should preserve other properties
    })
  })
})
