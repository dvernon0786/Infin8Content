// Format Validator Tests for Story 14-5: Format Changes and Content Structure
// RED PHASE: Tests will fail initially, then pass after implementation

import { 
  validateContentFormat,
  applyFormatCorrections,
  getFormatRules,
  getValidationCriteria,
  FormatValidationError,
  validateContentWithErrorHandling
} from '@/lib/services/article-generation/format-validator'

describe('Format Validator - Story 14-5', () => {
  describe('validateContentFormat', () => {
    it('should validate introduction section format correctly', () => {
      const validIntro = "This is a great introduction to content marketing. Content marketing helps businesses grow. You should learn these strategies."
      const result = validateContentFormat(validIntro, 'introduction')
      
      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
      expect(result.processingTime).toBeGreaterThan(0)
    })

    it('should detect paragraph length violations', () => {
      const longParagraph = "This is an extremely long paragraph that goes on and on without any breaks and contains way too many sentences for proper readability according to the content structure guidelines which specify that paragraphs should be limited to two to four sentences maximum for optimal user engagement and scannability."
      const result = validateContentFormat(longParagraph, 'h2')
      
      expect(result.isValid).toBe(false)
      expect(result.issues.some(issue => 
        issue.type === 'paragraph' && 
        issue.severity === 'warning' &&
        issue.message.includes('paragraph length')
      )).toBe(true)
    })

    it('should validate heading hierarchy structure', () => {
      const contentWithBadHierarchy = "# Main Title\n### Skipping H2\nThis should not be allowed."
      const result = validateContentFormat(contentWithBadHierarchy, 'h3')
      
      expect(result.isValid).toBe(false)
      expect(result.issues.some(issue => 
        issue.type === 'heading' && 
        issue.severity === 'error'
      )).toBe(true)
    })

    it('should check keyword density for SEO optimization', () => {
      const content = "Content marketing is great. Content marketing helps. Content marketing works. Content marketing wins. Content marketing again."
      const result = validateContentFormat(content, 'h2')
      
      // Should detect keyword stuffing (5 occurrences of "content marketing" in short content)
      expect(result.issues.some(issue => 
        issue.type === 'keyword' && 
        issue.message.includes('density')
      )).toBe(true)
    })

    it('should calculate readability score', () => {
      const simpleContent = "Good content is easy to read. Short sentences help. People like simple words."
      const result = validateContentFormat(simpleContent, 'introduction')
      
      expect(result.isValid).toBe(true)
      expect(result.issues.some(issue => issue.type === 'readability')).toBe(false)
    })
  })

  describe('applyFormatCorrections', () => {
    it('should apply paragraph length corrections', () => {
      const longParagraph = "This is a very long paragraph that contains too many sentences and needs to be broken up into smaller paragraphs for better readability and user engagement according to the content structure guidelines."
      const issues = [{
        type: 'paragraph' as const,
        severity: 'warning' as const,
        message: 'Paragraph too long',
        position: 0,
        suggestion: 'Break into smaller paragraphs'
      }]
      
      const corrected = applyFormatCorrections(longParagraph, issues)
      
      expect(corrected).not.toBe(longParagraph)
      expect(corrected.split('.').filter(s => s.trim()).length).toBeGreaterThan(1)
    })

    it('should handle empty issues array', () => {
      const content = "Good content here."
      const issues: any[] = []
      
      const corrected = applyFormatCorrections(content, issues)
      
      expect(corrected).toBe(content)
    })
  })

  describe('getFormatRules', () => {
    it('should return format rules for introduction sections', () => {
      const rules = getFormatRules('introduction')
      
      expect(rules).toHaveLength(3) // intro, hook, body
      expect(rules[0].name).toBe('introduction')
      expect(rules[0].wordCount.min).toBe(300)
      expect(rules[0].wordCount.max).toBe(400)
    })

    it('should return format rules for H2 sections', () => {
      const rules = getFormatRules('h2')
      
      expect(rules).toHaveLength(3) // topic, authority, evidence
      expect(rules[0].name).toBe('topic')
      expect(rules[0].wordCount.min).toBe(500)
      expect(rules[0].wordCount.max).toBe(700)
    })

    it('should return format rules for H3 subsections', () => {
      const rules = getFormatRules('h3')
      
      expect(rules).toHaveLength(3) // explanation, example, application
      expect(rules[0].name).toBe('explanation')
      expect(rules[1].name).toBe('example')
      expect(rules[2].name).toBe('application')
    })

    it('should return format rules for conclusion sections', () => {
      const rules = getFormatRules('conclusion')
      
      expect(rules).toHaveLength(2) // summary, cta
      expect(rules[0].name).toBe('summary')
      expect(rules[0].wordCount.min).toBe(200)
      expect(rules[0].wordCount.max).toBe(300)
    })

    it('should return format rules for FAQ sections', () => {
      const rules = getFormatRules('faq')
      
      expect(rules).toHaveLength(3) // question, answer, snippet
      expect(rules[0].name).toBe('question')
      expect(rules[2].name).toBe('snippet')
    })

    it('should return default rules for unknown section types', () => {
      const rules = getFormatRules('unknown')
      
      expect(rules.length).toBeGreaterThan(0)
      expect(rules[0].name).toBe('default')
    })
  })

  describe('getValidationCriteria', () => {
    it('should return validation criteria for introduction', () => {
      const criteria = getValidationCriteria('introduction')
      
      expect(criteria.some(c => c.type === 'paragraph')).toBe(true)
      expect(criteria.some(c => c.type === 'readability')).toBe(true)
      expect(criteria.some(c => c.type === 'keyword')).toBe(true)
    })

    it('should return criteria with proper thresholds', () => {
      const criteria = getValidationCriteria('h2')
      
      const paragraphCriteria = criteria.find(c => c.type === 'paragraph')
      expect(paragraphCriteria?.maxSentences).toBe(4)
      
      const readabilityCriteria = criteria.find(c => c.type === 'readability')
      expect(readabilityCriteria?.targetGrade).toBe(10)
    })
  })

  describe('FormatValidationError', () => {
    it('should create proper error with issues', () => {
      const issues = [{
        type: 'paragraph' as const,
        severity: 'error' as const,
        message: 'Test error',
        position: 0,
        suggestion: 'Fix it'
      }]
      
      const error = new FormatValidationError(issues, 'test-section', 'test content')
      
      expect(error.name).toBe('FormatValidationError')
      expect(error.message).toContain('test-section')
      expect(error.issues).toEqual(issues)
      expect(error.sectionId).toBe('test-section')
      expect(error.content).toBe('test content')
    })
  })

  describe('validateContentWithErrorHandling', () => {
    it('should handle valid content correctly', () => {
      const validContent = "Good content with proper structure. It has reasonable sentences."
      const result = validateContentWithErrorHandling(validContent, 'introduction', 'test-1')
      
      expect(result.content).toBe(validContent)
      expect(result.validation.isValid).toBe(true)
    })

    it('should apply automatic corrections for minor issues', () => {
      const contentWithIssues = "This is a very long paragraph that contains too many sentences and should be broken up into smaller parts for better readability and user engagement according to guidelines."
      const result = validateContentWithErrorHandling(contentWithIssues, 'h2', 'test-2')
      
      expect(result.validation.isValid).toBe(true)
      expect(result.content).not.toBe(contentWithIssues) // Should be corrected
    })

    it('should handle validation errors gracefully', () => {
      // Mock a scenario where validation fails
      const problematicContent = ""
      const result = validateContentWithErrorHandling(problematicContent, 'invalid-type', 'test-3')
      
      expect(result.validation.isValid).toBe(false)
      expect(result.validation.issues.some(issue => issue.type === 'system')).toBe(true)
    })
  })

  describe('Performance Requirements', () => {
    it('should complete validation in under 100ms', () => {
      const content = "This is test content for performance validation. It should process quickly."
      
      const startTime = performance.now()
      const result = validateContentFormat(content, 'h2')
      const endTime = performance.now()
      
      expect(result.processingTime).toBeLessThan(100)
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should handle batch validation efficiently', () => {
      const contents = Array.from({ length: 10 }, (_, i) => 
        `Content section ${i}. This is test content for batch validation performance.`
      )
      
      const startTime = performance.now()
      const results = contents.map(content => validateContentFormat(content, 'h2'))
      const endTime = performance.now()
      
      expect(results.every(r => r.processingTime < 100)).toBe(true)
      expect(endTime - startTime).toBeLessThan(500) // Batch should be under 500ms
    })
  })
})
