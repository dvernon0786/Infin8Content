// Quality Checker Tests
// Story 20.1: Prompt System Overhaul

import { describe, it, expect, beforeEach } from 'vitest'
import {
  validatePromptQuality,
  runQualityChecks,
  validateTemplateQuality
} from '@/lib/services/article-generation/quality-checker'
import { checkKeywordDensity, calculateReadabilityScore } from '@/lib/services/article-generation/seo-helpers'

describe('Quality Checker', () => {
  describe('validatePromptQuality', () => {
    it('should validate system prompt contains E-E-A-T principles', () => {
      const systemPrompt = `You are an elite SEO content strategist.
      
      **Your Core Objectives:**
      1. Demonstrate expertise, experience, authority, and trustworthiness (E-E-A-T)
      2. Create content that ranks on page 1
      3. Write naturally for humans first`
      
      const result = validatePromptQuality(systemPrompt)
      
      expect(result.hasEEATPrinciples).toBe(true)
      expect(result.eeatScore).toBeGreaterThan(0)
      expect(result.isValid).toBe(false) // Missing other elements
    })

    it('should flag system prompt missing E-E-A-T principles', () => {
      const systemPrompt = `You are a content writer.
      Write good content that ranks well.
      Use keywords naturally.`
      
      const result = validatePromptQuality(systemPrompt)
      
      expect(result.hasEEATPrinciples).toBe(false)
      expect(result.eeatScore).toBe(0)
      expect(result.missingElements).toContain('E-E-A-T principles')
      expect(result.isValid).toBe(false)
    })

    it('should validate readability targets are included', () => {
      const systemPrompt = `Write content targeting Grade 10-12 readability level.
      Ensure broad accessibility and comprehension.`
      
      const result = validatePromptQuality(systemPrompt)
      
      expect(result.hasReadabilityTargets).toBe(true)
      expect(result.readabilityLevel).toBe('Grade 10')
      expect(result.isValid).toBe(false) // Missing other elements
    })

    it('should validate semantic SEO guidelines are present', () => {
      const systemPrompt = `Include semantic keywords and LSI terms.
      Use topic clusters and related concepts naturally.`
      
      const result = validatePromptQuality(systemPrompt)
      
      expect(result.hasSemanticSEO).toBe(true)
      expect(result.semanticSEOScore).toBeGreaterThan(0)
      expect(result.isValid).toBe(false) // Missing other elements
    })
  })

  describe('runQualityChecks', () => {
    it('should run comprehensive quality checks on generated content', () => {
      const content = {
        title: 'SEO Optimization Guide',
        content: '<p>SEO helps websites rank better in search results and improves online visibility greatly.</p><p>Good search optimization brings more visitors to your site through smart placement methods.</p><p>Proper keyword placement helps search engines understand your pages well and content value for user searches.</p><p>Better search engine ranking means more customers can find your business online and see your services first.</p><p>Expert SEO work creates real growth for companies in busy digital markets with clear results and improved performance.</p><p>This method gives lasting worth over time and builds strong brand advantages for your business digital visibility online.</p><p>These proven plans work well across many fields and varied market conditions consistently.</p><p>Effective SEO strategies require careful planning and execution for maximum results.</p>',
        keyword: 'SEO',
        semanticKeywords: ['search engine ranking', 'digital visibility'],
        targetAudience: 'intermediate'
      }
      
      const result = runQualityChecks(content)
      
      expect(result.overallScore).toBeGreaterThan(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
      expect(result.keywordDensity.isValid).toBe(true)
      expect(result.readability.isTargetGrade).toBe(true)
      expect(result.semanticCoverage.isValid).toBe(true)
      expect(result.structure.isValid).toBe(true)
    })

    it('should identify quality issues and provide recommendations', () => {
      const content = {
        title: 'SEO Guide',
        content: 'SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO SEO', // Keyword stuffing
        keyword: 'SEO',
        semanticKeywords: ['search ranking'],
        targetAudience: 'intermediate'
      }
      
      const result = runQualityChecks(content)
      
      expect(result.overallScore).toBeLessThan(70)
      expect(result.keywordDensity.isValid).toBe(false)
      expect(result.keywordDensity.isKeywordStuffing).toBe(true)
      expect(result.recommendations).toContain('Reduce keyword density - appears to be keyword stuffing')
    })

    it('should provide detailed quality metrics', () => {
      const content = {
        title: 'Complete Guide',
        content: 'This is well-structured content with proper SEO optimization and semantic keywords.',
        keyword: 'SEO optimization',
        semanticKeywords: ['search ranking', 'digital marketing'],
        targetAudience: 'intermediate'
      }
      
      const result = runQualityChecks(content)
      
      expect(result).toHaveProperty('keywordDensity')
      expect(result).toHaveProperty('readability')
      expect(result).toHaveProperty('semanticCoverage')
      expect(result).toHaveProperty('structure')
      expect(result).toHaveProperty('overallScore')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('qualityGrade')
    })
  })

  describe('validateTemplateQuality', () => {
    it('should validate introduction template meets requirements', () => {
      const template = {
        type: 'introduction',
        wordCount: 120,
        template: 'Start with a compelling hook about {{keyword}}. Include {{hook}} to engage readers.',
        seoRules: {
          keywordPlacement: 'first_100_words',
          densityTarget: 0.8,
          hookRequired: true
        }
      }
      
      const result = validateTemplateQuality(template, 'introduction')
      
      expect(result.meetsWordCountRequirements).toBe(true)
      expect(result.hasHookRequirement).toBe(true)
      expect(result.hasKeywordPlacement).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should validate H2 section template includes topic authority building', () => {
      const template = {
        type: 'h2',
        wordCount: 300,
        template: 'Build authority around {{keyword}} with expert insights and comprehensive coverage.',
        seoRules: {
          keywordPlacement: 'distributed',
          densityTarget: 1.2,
          authorityBuilding: true
        }
      }
      
      const result = validateTemplateQuality(template, 'h2')
      
      expect(result.hasAuthorityBuilding).toBe(true)
      expect(result.hasProperDensity).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should validate conclusion template includes summary and CTA', () => {
      const template = {
        type: 'conclusion',
        wordCount: 150,
        template: 'Summary of key points about {{keyword}}. Include call to action for next steps.',
        seoRules: {
          keywordPlacement: 'reinforcement',
          densityTarget: 0.5,
          summaryRequired: true,
          ctaRequired: true
        }
      }
      
      const result = validateTemplateQuality(template, 'conclusion')
      
      expect(result.hasSummary).toBe(true)
      expect(result.hasCallToAction).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should validate FAQ template addresses common questions', () => {
      const template = {
        type: 'faq',
        wordCount: 200,
        template: 'Address common questions about {{keyword}}. Provide clear, helpful answers.',
        seoRules: {
          keywordPlacement: 'distributed',
          densityTarget: 0.8,
          questionFormat: true
        }
      }
      
      const result = validateTemplateQuality(template, 'faq')
      
      expect(result.hasQuestionFormat).toBe(true)
      expect(result.addressesCommonQuestions).toBe(true)
      expect(result.isValid).toBe(true)
    })

    it('should flag template violations', () => {
      const template = {
        type: 'introduction',
        wordCount: 50, // Too short
        template: 'Brief content without engaging opening.',
        seoRules: {
          keywordPlacement: 'first_100_words',
          densityTarget: 0.8,
          hookRequired: true
        }
      }
      
      const result = validateTemplateQuality(template, 'introduction')
      
      expect(result.meetsWordCountRequirements).toBe(false)
      expect(result.hasHookRequirement).toBe(false)
      expect(result.isValid).toBe(false)
      expect(result.violations).toContain('Word count below minimum (80-150 words)')
      expect(result.violations).toContain('Missing hook requirement')
    })
  })
})
