// SEO Helpers Tests
// Story 20.1: Prompt System Overhaul

import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkKeywordDensity,
  validateSemanticKeywordCoverage,
  calculateReadabilityScore,
  validateContentStructure
} from '@/lib/services/article-generation/seo-helpers'

describe('SEO Helpers', () => {
  describe('checkKeywordDensity', () => {
    it('should calculate correct keyword density for primary keyword', () => {
      const content = 'SEO optimization is crucial for content success in digital marketing. Search engine optimization helps websites rank higher in search results and drives organic traffic effectively. This approach works well for most businesses looking to improve their online presence and visibility.'
      const result = checkKeywordDensity(content, 'SEO', 'primary')
      
      expect(result.density).toBeGreaterThan(0)
      expect(result.density).toBeLessThan(0.04) // Adjusted to be more realistic
      expect(result.count).toBe(1)
      expect(result.wordCount).toBeGreaterThan(0)
    })

    it('should validate primary keyword density is within realistic range', () => {
      const content = 'SEO is important for digital marketing success in todays competitive landscape. SEO helps businesses grow online by improving their visibility in search results. SEO optimization techniques include keyword research, content creation, and link building strategies. SEO strategies work well for most companies when implemented correctly and consistently. SEO delivers measurable results and ROI when executed properly over time. This comprehensive approach ensures sustainable growth and improved search engine rankings.'
      const result = checkKeywordDensity(content, 'SEO', 'primary')
      
      expect(result.density).toBeGreaterThan(0.05) // Should be at least 5%
      expect(result.density).toBeLessThan(0.08) // But less than 8%
      expect(result.count).toBe(5)
    })

    it('should validate secondary keyword density is within realistic range', () => {
      const content = 'Content marketing strategies work well for businesses of all sizes. Content marketing builds authority and trust with target audiences over time. Content marketing drives engagement and conversions effectively when done right. Digital marketing encompasses many tactics including social media marketing and email campaigns. These approaches help businesses reach their goals and objectives efficiently.'
      const result = checkKeywordDensity(content, 'content marketing', 'secondary')
      
      expect(result.density).toBeGreaterThan(0.05) // Should be at least 5%
      expect(result.density).toBeLessThan(0.06) // But less than 6%
      expect(result.count).toBe(3)
    })

    it('should flag keyword stuffing when density is too high', () => {
      const content = 'SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO'
      const result = checkKeywordDensity(content, 'SEO', 'primary')
      
      expect(result.isValid).toBe(false)
      expect(result.isKeywordStuffing).toBe(true)
    })

    it('should handle empty content gracefully', () => {
      const result = checkKeywordDensity('', 'SEO', 'primary')
      
      expect(result.density).toBe(0)
      expect(result.count).toBe(0)
      expect(result.isValid).toBe(false)
    })
  })

  describe('validateSemanticKeywordCoverage', () => {
    it('should validate semantic keyword coverage in content', () => {
      const content = 'SEO optimization involves search engine ranking and digital marketing strategies.'
      const semanticKeywords = ['search engine ranking', 'digital marketing', 'online visibility']
      const result = validateSemanticKeywordCoverage(content, semanticKeywords)
      
      expect(result.coveragePercentage).toBeGreaterThan(0)
      expect(result.coveredKeywords).toContain('search engine ranking')
      expect(result.coveredKeywords).toContain('digital marketing')
      expect(result.missingKeywords).toContain('online visibility')
    })

    it('should return 100% coverage when all semantic keywords are present', () => {
      const content = 'SEO optimization and search engine ranking improve digital marketing results.'
      const semanticKeywords = ['SEO optimization', 'search engine ranking', 'digital marketing']
      const result = validateSemanticKeywordCoverage(content, semanticKeywords)
      
      expect(result.coveragePercentage).toBe(100)
      expect(result.missingKeywords).toHaveLength(0)
      expect(result.isValid).toBe(true)
    })

    it('should handle empty semantic keywords list', () => {
      const result = validateSemanticKeywordCoverage('Some content', [])
      
      expect(result.coveragePercentage).toBe(100)
      expect(result.isValid).toBe(true)
    })
  })

  describe('calculateReadabilityScore', () => {
    it('should calculate readability score for simple content', () => {
      const content = 'This is simple content. It has short sentences. Easy to read.'
      const result = calculateReadabilityScore(content)
      
      expect(result.score).toBeGreaterThan(0)
      expect(result.gradeLevel).toBeGreaterThan(0)
      expect(result.gradeLevel).toBeLessThanOrEqual(12) // Should be Grade 10-12 target
    })

    it('should target Grade 10-12 readability level', () => {
      const content = 'SEO optimization requires strategic planning. Content must be well-structured and engaging. Search engines value quality content that provides value to readers.'
      const result = calculateReadabilityScore(content)
      
      expect(result.gradeLevel).toBeGreaterThanOrEqual(10)
      expect(result.gradeLevel).toBeLessThanOrEqual(12)
      expect(result.isTargetGrade).toBe(true)
    })

    it('should flag content that is too complex', () => {
      const content = 'Sophisticated optimization methodologies necessitate comprehensive strategic implementation, incorporating multifaceted approaches to enhance digital visibility and search engine performance metrics.'
      const result = calculateReadabilityScore(content)
      
      expect(result.gradeLevel).toBeGreaterThan(12)
      expect(result.isTargetGrade).toBe(false)
    })

    it('should handle empty content gracefully', () => {
      const result = calculateReadabilityScore('')
      
      expect(result.score).toBe(0)
      expect(result.gradeLevel).toBe(0)
      expect(result.isTargetGrade).toBe(false)
    })
  })

  describe('validateContentStructure', () => {
    it('should validate proper H1 -> H2 -> H3 hierarchy', () => {
      const content = `
        <h1>Main Title</h1>
        <h2>Section Title</h2>
        <p>Some content</p>
        <h3>Subsection Title</h3>
        <p>More content</p>
      `
      const result = validateContentStructure(content)
      
      expect(result.hasProperHierarchy).toBe(true)
      expect(result.hierarchyErrors).toHaveLength(0)
      expect(result.isValid).toBe(true)
    })

    it('should detect skipped heading levels', () => {
      const content = `
        <h1>Main Title</h1>
        <h3>Subsection Title</h3>
        <p>Missing H2 level</p>
      `
      const result = validateContentStructure(content)
      
      expect(result.hasProperHierarchy).toBe(false)
      expect(result.hierarchyErrors).toContain('H3 found without H2')
      expect(result.isValid).toBe(false)
    })

    it('should validate paragraph length for readability', () => {
      const content = `
        <h2>Section Title</h2>
        <p>This is a reasonable paragraph length with good structure.</p>
        <p>This is an extremely long paragraph that goes on and on without any breaks. It would be very difficult for readers to follow because it lacks proper structure. The content becomes hard to read and understand without logical breaks. This makes it challenging to comprehend the main points being conveyed. Readers often lose focus with such lengthy paragraphs.</p>
      `
      const result = validateContentStructure(content)
      
      expect(result.paragraphIssues).toContain('Paragraph too long (>4 sentences)')
      expect(result.isValid).toBe(false)
    })

    it('should handle empty content gracefully', () => {
      const result = validateContentStructure('')
      
      expect(result.hasProperHierarchy).toBe(true) // Empty content has no violations
      expect(result.isValid).toBe(true)
    })
  })
})
