// Unit tests for section-processor helper functions
// Story 14.1: Enhanced System Prompt with E-E-A-T Principles

import {
  calculateTargetDensity,
  generateSemanticKeywords,
  getUserIntentSignals,
  getStyleGuidance,
  formatResearchSources,
  getEnhancedSectionGuidance
} from '@/lib/services/article-generation/section-processor'

// Mock TavilySource type for testing
interface MockTavilySource {
  title: string
  url: string
  excerpt?: string
  content?: string
  published_date?: string | null
  author?: string | null
  relevance_score?: number
}

describe('Section Processor Helper Functions', () => {
  describe('calculateTargetDensity', () => {
    it('should calculate target density for short content (300 words)', () => {
      const result = calculateTargetDensity(300)
      expect(result).toBeGreaterThanOrEqual(1) // 0.5% minimum
      expect(result).toBeLessThanOrEqual(4)    // 1.5% maximum
      expect(result).toBe(3) // Average of 1.5 and 4.5, floored = 3
    })

    it('should calculate target density for medium content (600 words)', () => {
      const result = calculateTargetDensity(600)
      expect(result).toBeGreaterThanOrEqual(3) // 0.5% minimum
      expect(result).toBeLessThanOrEqual(9)    // 1.5% maximum
      expect(result).toBe(6) // Average of 3 and 9, floored
    })

    it('should calculate target density for long content (1000 words)', () => {
      const result = calculateTargetDensity(1000)
      expect(result).toBeGreaterThanOrEqual(5) // 0.5% minimum
      expect(result).toBeLessThanOrEqual(15)   // 1.5% maximum
      expect(result).toBe(10) // Average of 5 and 15, floored
    })

    it('should handle edge case with very short content', () => {
      const result = calculateTargetDensity(50)
      expect(result).toBeGreaterThanOrEqual(0) // 0.5% minimum, rounded up
      expect(result).toBeLessThanOrEqual(1)    // 1.5% maximum, rounded down
    })
  })

  describe('generateSemanticKeywords', () => {
    it('should generate semantic keywords for primary keyword', () => {
      const result = generateSemanticKeywords('content marketing')
      const keywords = result.split(', ')
      
      expect(keywords).toContain('content marketing')
      expect(keywords).toContain('content marketing guide')
      expect(keywords).toContain('content marketing tips')
      expect(keywords).toContain('content marketing examples')
      expect(keywords).toHaveLength(5) // Limited to 5 keywords
    })

    it('should handle "best" prefix removal', () => {
      const result = generateSemanticKeywords('best content marketing')
      const keywords = result.split(', ')
      
      expect(keywords).toContain('best content marketing') // Original keyword
      expect(keywords).toContain('content marketing') // "best" removed
      expect(keywords).toContain('best content marketing guide') // Guide variation of original
      expect(keywords).toHaveLength(5) // Limited to 5 keywords
    })

    it('should handle "top" prefix removal', () => {
      const result = generateSemanticKeywords('top content strategies')
      const keywords = result.split(', ')
      
      expect(keywords).toContain('top content strategies') // Original keyword
      expect(keywords).toContain('content strategies') // "top" removed
      expect(keywords).toContain('top content strategies guide') // Guide variation of original
      expect(keywords).toHaveLength(5) // Limited to 5 keywords
    })

    it('should handle "how to" prefix removal', () => {
      const result = generateSemanticKeywords('how to write content')
      const keywords = result.split(', ')
      
      expect(keywords).toContain('how to write content') // Original keyword
      expect(keywords).toContain('write content') // "how to" removed
      expect(keywords).toContain('how to write content guide') // Guide variation of original
      expect(keywords).toHaveLength(5) // Limited to 5 keywords
    })
  })

  describe('getUserIntentSignals', () => {
    it('should identify informational intent', () => {
      const result = getUserIntentSignals('content marketing guide', 'h2')
      
      expect(result).toContain('learn, understand, or discover information')
      expect(result).toContain('comprehensive explanations')
      expect(result).toContain('step-by-step guidance')
    })

    it('should identify commercial intent', () => {
      const result = getUserIntentSignals('best content marketing tools', 'h2')
      
      expect(result).toContain('comparing options')
      expect(result).toContain('evaluating choices')
      expect(result).toContain('Compare options')
      expect(result).toContain('pros/cons')
    })

    it('should identify transactional intent', () => {
      const result = getUserIntentSignals('buy content marketing software', 'h2')
      
      expect(result).toContain('ready to take action')
      expect(result).toContain('purchase, or commit')
      expect(result).toContain('clear calls-to-action')
      expect(result).toContain('practical implementation steps')
    })

    it('should default to informational for unrecognized patterns', () => {
      const result = getUserIntentSignals('content strategies', 'h2')
      
      expect(result).toContain('learn, understand, or discover information')
      expect(result).toContain('comprehensive explanations')
      expect(result).toContain('step-by-step guidance')
    })
  })

  describe('getStyleGuidance', () => {
    it('should provide professional style guidance', () => {
      const result = getStyleGuidance('Professional', 'General')
      
      expect(result).toContain('formal language')
      expect(result).toContain('industry terminology')
      expect(result).toContain('authoritative tone')
      expect(result).toContain('Cite sources frequently')
    })

    it('should provide conversational style guidance', () => {
      const result = getStyleGuidance('Conversational', 'General')
      
      expect(result).toContain('speaking to a friend')
      expect(result).toContain('you')
      expect(result).toContain('your')
      expect(result).toContain('relatable examples')
      expect(result).toContain('short and punchy')
    })

    it('should provide technical style guidance', () => {
      const result = getStyleGuidance('Technical', 'Experts')
      
      expect(result).toContain('precise terminology')
      expect(result).toContain('specifications')
      expect(result).toContain('technical details')
      expect(result).toContain('domain expertise')
    })

    it('should provide casual style guidance', () => {
      const result = getStyleGuidance('Casual', 'General')
      
      expect(result).toContain('Relaxed, friendly tone')
      expect(result).toContain('contractions')
      expect(result).toContain('colloquialisms')
      expect(result).toContain('relatability')
    })

    it('should provide formal style guidance', () => {
      const result = getStyleGuidance('Formal', 'Academic')
      
      expect(result).toContain('Academic or business writing')
      expect(result).toContain('No contractions')
      expect(result).toContain('Objective, third-person')
      expect(result).toContain('Highly structured')
    })

    it('should default to professional for unrecognized styles', () => {
      const result = getStyleGuidance('Unknown', 'General')
      
      expect(result).toContain('formal language')
      expect(result).toContain('industry terminology')
      expect(result).toContain('authoritative tone')
    })
  })

  describe('formatResearchSources', () => {
    const mockSources: MockTavilySource[] = [
      {
        title: 'Content Marketing Strategies 2024',
        url: 'https://example.com/content-marketing',
        content: 'This article covers the latest content marketing strategies and best practices for digital success.',
        published_date: '2024-01-15',
        author: 'John Doe',
        relevance_score: 0.95
      },
      {
        title: 'SEO Best Practices Guide',
        url: 'https://harvard.edu/seo-guide',
        content: 'A comprehensive guide to SEO optimization from Harvard researchers.',
        published_date: '2024-02-20',
        author: 'Dr. Jane Smith',
        relevance_score: 0.88
      },
      {
        title: 'Government Marketing Resources',
        url: 'https://ftc.gov/marketing-resources',
        content: 'Official FTC guidelines for digital marketing and advertising.',
        published_date: '2024-03-10',
        author: 'Federal Trade Commission',
        relevance_score: 0.82
      }
    ]

    it('should format research sources with authority indicators', () => {
      const result = formatResearchSources(mockSources as any)
      
      expect(result).toContain('🎓 Academic') // Harvard .edu
      expect(result).toContain('🏛️ Government') // FTC .gov
      expect(result).toContain('📰 Industry') // Regular .com
    })

    it('should include source titles and URLs', () => {
      const result = formatResearchSources(mockSources as any)
      
      expect(result).toContain('[Content Marketing Strategies 2024](https://example.com/content-marketing)')
      expect(result).toContain('[SEO Best Practices Guide](https://harvard.edu/seo-guide)')
      expect(result).toContain('[Government Marketing Resources](https://ftc.gov/marketing-resources)')
    })

    it('should include excerpts truncated to 200 characters', () => {
      const result = formatResearchSources(mockSources as any)
      
      expect(result).toContain('Excerpt: This article covers the latest content marketing strategies and best practices for digital success....')
      expect(result).toContain('Excerpt: A comprehensive guide to SEO optimization from Harvard researchers....')
      expect(result).toContain('Excerpt: Official FTC guidelines for digital marketing and advertising....')
    })

    it('should include relevance scores', () => {
      const result = formatResearchSources(mockSources as any)
      
      expect(result).toContain('Relevance: 0.95')
      expect(result).toContain('Relevance: 0.88')
      expect(result).toContain('Relevance: 0.82')
    })

    it('should handle missing excerpt gracefully', () => {
      const sourcesWithoutExcerpt = [
        {
          title: 'Test Source',
          url: 'https://example.com/test',
          relevance_score: 0.9
        }
      ]
      
      const result = formatResearchSources(sourcesWithoutExcerpt as any)
      expect(result).toContain('No excerpt available')
    })

    it('should limit to 10 sources', () => {
      const manySources = Array.from({ length: 15 }, (_, i) => ({
        title: `Source ${i + 1}`,
        url: `https://example.com/source-${i + 1}`,
        excerpt: `Excerpt for source ${i + 1}`,
        relevance_score: 0.9
      }))
      
      const result = formatResearchSources(manySources as any)
      const sourceCount = (result.match(/^\d+\./gm) || []).length
      expect(sourceCount).toBe(10)
    })
  })

  describe('getEnhancedSectionGuidance', () => {
    it('should provide enhanced guidance for introduction sections', () => {
      const result = getEnhancedSectionGuidance('introduction', 'Content Marketing Guide', 'content marketing', 350)
      
      expect(result).toContain('SEO-Optimized Introduction Structure (300-400 words)')
      expect(result).toContain('Opening Hook (1-2 sentences)')
      expect(result).toContain('Keyword Integration (First paragraph)')
      expect(result).toContain('content marketing')
      expect(result).toContain('Primary keyword in first 100 words')
      expect(result).toContain('Value Proposition')
      expect(result).toContain('Credibility Signal')
    })

    it('should provide enhanced guidance for H2 sections', () => {
      const result = getEnhancedSectionGuidance('h2', 'Content Strategy', 'content marketing', 600)
      
      expect(result).toContain('SEO-Optimized H2 Section Structure (500-700 words)')
      expect(result).toContain('Opening (Topic Sentence + Context)')
      expect(result).toContain('Core Content (3-5 paragraphs)')
      expect(result).toContain('Definition/Overview')
      expect(result).toContain('Deep Dive')
      expect(result).toContain('Practical Application')
      expect(result).toContain('content marketing')
      expect(result).toContain('3-4 citations distributed throughout')
    })

    it('should provide enhanced guidance for H3 subsections', () => {
      const result = getEnhancedSectionGuidance('h3', 'Social Media Tactics', 'content marketing', 400)
      
      expect(result).toContain('SEO-Optimized H3 Subsection Structure (300-500 words)')
      expect(result).toContain('Context Connection (1 sentence)')
      expect(result).toContain('Focused Content (2-4 paragraphs)')
      expect(result).toContain('Specific Focus')
      expect(result).toContain('Detailed Explanation')
      expect(result).toContain('Practical Takeaway')
      expect(result).toContain('Long-tail keyword variation')
    })

    it('should provide enhanced guidance for conclusion sections', () => {
      const result = getEnhancedSectionGuidance('conclusion', 'Final Thoughts', 'content marketing', 400)
      
      expect(result).toContain('SEO-Optimized Conclusion Structure (300-500 words)')
      expect(result).toContain('Summary Opening (1-2 paragraphs)')
      expect(result).toContain('Key Takeaways (1 paragraph with 3-5 points)')
      expect(result).toContain('Future Outlook / Next Steps')
      expect(result).toContain('Final Memorable Statement (1 sentence)')
      expect(result).toContain('content marketing')
      expect(result).toContain('synthesizes article')
    })

    it('should provide enhanced guidance for FAQ sections', () => {
      const result = getEnhancedSectionGuidance('faq', 'Common Questions', 'content marketing', 500)
      
      expect(result).toContain('SEO-Optimized FAQ Structure (400-600 words)')
      expect(result).toContain('Section Introduction (1-2 sentences)')
      expect(result).toContain('Question Format (5-8 Q&A pairs)')
      expect(result).toContain('Question Optimization')
      expect(result).toContain('Answer Structure (Each 60-150 words)')
      expect(result).toContain('Direct Answer')
      expect(result).toContain('Supporting Detail')
      expect(result).toContain('Actionable Tip')
      expect(result).toContain('5-8 questions')
      expect(result).toContain('featured snippet optimization')
    })

    it('should provide default guidance for unknown section types', () => {
      const result = getEnhancedSectionGuidance('unknown', 'Custom Section', 'content marketing', 300)
      
      expect(result).toContain('Generate comprehensive content for Custom Section')
      expect(result).toContain('following SEO best practices')
      expect(result).toContain('content marketing')
      expect(result).toContain('natural keyword occurrences')
    })

    it('should include target density calculations in guidance', () => {
      const result = getEnhancedSectionGuidance('introduction', 'Test Section', 'test keyword', 400)
      
      expect(result).toContain('Target density:') // Should contain calculated density
      expect(result).toContain('test keyword') // Should include the keyword
    })

    it('should include semantic keywords in guidance', () => {
      const result = getEnhancedSectionGuidance('h2', 'Test Section', 'content marketing', 600)
      
      expect(result).toContain('content marketing guide') // Should include semantic variations
      expect(result).toContain('content marketing tips')
    })
  })
})
