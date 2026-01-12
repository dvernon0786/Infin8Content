// SEO Recommendation System
// Story 14.6: SEO Testing and Validation
// Task 4: Real-time Recommendation System

import { calculateSEOScore, type SEOScoreInput, type SEOScoreResult, type SEOIssue } from './seo-scoring'
import { validateSEOContent, type ValidationInput, type ValidationResult } from './validation-engine'

export interface RecommendationInput {
  content: string
  primaryKeyword: string
  secondaryKeywords: string[]
  targetWordCount: number
  contentType: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq' | 'general'
  targetAudience?: string
  searchIntent?: string
}

export interface RecommendationContext {
  currentSection: string
  totalSections: number
  sectionIndex: number
  wordCountSoFar: number
  targetTotalWordCount: number
  keywordsUsed: string[]
  keywordsRemaining: string[]
}

export interface RealTimeRecommendation {
  id: string
  type: 'keyword' | 'readability' | 'structure' | 'semantic' | 'length' | 'placement' | 'intent'
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: 'immediate' | 'next-section' | 'future'
  title: string
  description: string
  action: string
  example?: string
  impact: number
  effort: 'low' | 'medium' | 'high'
  timeframe: 'now' | 'next-paragraph' | 'next-section' | 'revision'
}

export interface KeywordPlacementRecommendation {
  keyword: string
  placementType: 'title' | 'first-paragraph' | 'heading' | 'body' | 'conclusion'
  currentPosition: number
  recommendedPosition: number
  urgency: 'immediate' | 'soon' | 'optional'
  example: string
}

export interface SemanticEnhancementRecommendation {
  semanticKeyword: string
  context: string
  suggestedPlacement: string
  relevanceScore: number
  example: string
}

export interface ContentLengthRecommendation {
  currentLength: number
  targetLength: number
  difference: number
  suggestions: string[]
  priority: 'expand' | 'condense' | 'maintain'
}

export interface InternalLinkingRecommendation {
  opportunity: string
  anchorText: string
  targetUrl?: string
  context: string
  relevanceScore: number
}

export interface CallToActionRecommendation {
  type: 'primary' | 'secondary' | 'informational'
  placement: 'end-of-section' | 'mid-content' | 'conclusion'
  text: string
  purpose: string
  urgency: number
}

export interface RecommendationResult {
  recommendations: RealTimeRecommendation[]
  keywordPlacements: KeywordPlacementRecommendation[]
  semanticEnhancements: SemanticEnhancementRecommendation[]
  contentLengthRecommendations: ContentLengthRecommendation[]
  internalLinkingOpportunities: InternalLinkingRecommendation[]
  callToActionOptimizations: CallToActionRecommendation[]
  overallScore: number
  priorityActions: string[]
  quickWins: string[]
}

/**
 * Generate real-time SEO recommendations during content creation
 */
export function generateRealTimeRecommendations(
  input: RecommendationInput,
  context?: RecommendationContext
): RecommendationResult {
  const startTime = performance.now()
  
  try {
    // Calculate current SEO score
    const scoreInput: SEOScoreInput = {
      content: input.content,
      primaryKeyword: input.primaryKeyword,
      secondaryKeywords: input.secondaryKeywords,
      targetWordCount: input.targetWordCount,
      contentType: input.contentType
    }
    
    const currentScore = calculateSEOScore(scoreInput)
    
    // Run validation for specific issues
    const validationInput: ValidationInput = {
      content: input.content,
      primaryKeyword: input.primaryKeyword,
      secondaryKeywords: input.secondaryKeywords,
      targetWordCount: input.targetWordCount,
      contentType: input.contentType
    }
    
    const validationResult = validateSEOContent(validationInput)
    
    // Generate different types of recommendations
    const keywordPlacements = generateKeywordPlacementRecommendations(input, context)
    const semanticEnhancements = generateSemanticEnhancementRecommendations(input, context)
    const contentLengthRecommendations = generateContentLengthRecommendations(input, context)
    const internalLinkingOpportunities = generateInternalLinkingRecommendations(input, context)
    const callToActionOptimizations = generateCallToActionRecommendations(input, context)
    
    // Generate general recommendations
    const recommendations = generateGeneralRecommendations(
      input,
      currentScore,
      validationResult,
      context
    )
    
    // Identify priority actions and quick wins
    const priorityActions = recommendations
      .filter(r => r.priority === 'critical' || r.priority === 'high')
      .filter(r => r.effort === 'low')
      .slice(0, 5)
      .map(r => r.action)
    
    const quickWins = recommendations
      .filter(r => r.impact > 15 && r.effort === 'low')
      .slice(0, 3)
      .map(r => r.title)
    
    const endTime = performance.now()
    const executionTime = Math.round((endTime - startTime) * 100) / 100
    
    
    return {
      recommendations,
      keywordPlacements,
      semanticEnhancements,
      contentLengthRecommendations,
      internalLinkingOpportunities,
      callToActionOptimizations,
      overallScore: currentScore.overallScore,
      priorityActions,
      quickWins
    }
  } catch (error) {
    
    return {
      recommendations: [{
        id: 'error-fallback',
        type: 'keyword',
        priority: 'critical',
        category: 'immediate',
        title: 'Recommendation System Error',
        description: 'Unable to generate recommendations',
        action: 'Check content format and try again',
        impact: 0,
        effort: 'low',
        timeframe: 'now'
      }],
      keywordPlacements: [],
      semanticEnhancements: [],
      contentLengthRecommendations: [],
      internalLinkingOpportunities: [],
      callToActionOptimizations: [],
      overallScore: 0,
      priorityActions: [],
      quickWins: []
    }
  }
}

/**
 * Generate keyword placement recommendations
 */
function generateKeywordPlacementRecommendations(
  input: RecommendationInput,
  context?: RecommendationContext
): KeywordPlacementRecommendation[] {
  const recommendations: KeywordPlacementRecommendation[] = []
  const content = input.content.toLowerCase()
  const keyword = input.primaryKeyword.toLowerCase()
  
  // Check title/heading placement
  const firstLine = input.content.split('\n')[0]
  const hasKeywordInTitle = firstLine.toLowerCase().includes(keyword)
  
  if (!hasKeywordInTitle && input.contentType !== 'general') {
    recommendations.push({
      keyword: input.primaryKeyword,
      placementType: 'title',
      currentPosition: -1,
      recommendedPosition: 0,
      urgency: 'immediate',
      example: `${input.primaryKeyword}: Complete Guide to Best Practices`
    })
  }
  
  // Check first paragraph placement
  const firstParagraph = input.content.split('\n\n')[0] || ''
  const firstParagraphWords = firstParagraph.split(/\s+/)
  const first100Words = firstParagraphWords.slice(0, 100).join(' ')
  const hasKeywordInFirst100 = first100Words.includes(keyword)
  
  if (!hasKeywordInFirst100) {
    recommendations.push({
      keyword: input.primaryKeyword,
      placementType: 'first-paragraph',
      currentPosition: -1,
      recommendedPosition: 50,
      urgency: 'immediate',
      example: `Understanding ${input.primaryKeyword} is crucial for success because...`
    })
  }
  
  // Check heading placement
  const headings = input.content.match(/^#{1,6}\s+(.+)$/gm) || []
  const hasKeywordInHeading = headings.some(heading => heading.toLowerCase().includes(keyword))
  
  if (!hasKeywordInHeading && input.contentType === 'h2') {
    recommendations.push({
      keyword: input.primaryKeyword,
      placementType: 'heading',
      currentPosition: -1,
      recommendedPosition: 0,
      urgency: 'soon',
      example: `## ${input.primaryKeyword} Best Practices and Strategies`
    })
  }
  
  // Check body placement frequency
  const keywordCount = (content.match(new RegExp(keyword, 'g')) || []).length
  const targetCount = Math.ceil(input.targetWordCount * 0.015) // 1.5% density
  
  if (keywordCount < targetCount) {
    const neededCount = targetCount - keywordCount
    recommendations.push({
      keyword: input.primaryKeyword,
      placementType: 'body',
      currentPosition: keywordCount,
      recommendedPosition: targetCount,
      urgency: neededCount > 2 ? 'immediate' : 'soon',
      example: `When implementing ${input.primaryKeyword}, consider these key factors...`
    })
  }
  
  return recommendations
}

/**
 * Generate semantic enhancement recommendations
 */
function generateSemanticEnhancementRecommendations(
  input: RecommendationInput,
  context?: RecommendationContext
): SemanticEnhancementRecommendation[] {
  const recommendations: SemanticEnhancementRecommendation[] = []
  const content = input.content.toLowerCase()
  
  input.secondaryKeywords.forEach(semanticKeyword => {
    const semanticLower = semanticKeyword.toLowerCase()
    
    if (!content.includes(semanticLower)) {
      // Determine best placement based on content type
      let suggestedPlacement = ''
      let contextExample = ''
      
      switch (input.contentType) {
        case 'introduction':
          suggestedPlacement = 'First paragraph for context'
          contextExample = `This guide to ${input.primaryKeyword} will explore ${semanticKeyword} as a key component...`
          break
        case 'h2':
          suggestedPlacement = 'Main body paragraphs'
          contextExample = `One of the most important aspects of ${input.primaryKeyword} is ${semanticKeyword}...`
          break
        case 'conclusion':
          suggestedPlacement = 'Summary section'
          contextExample = `In summary, ${semanticKeyword} plays a vital role in successful ${input.primaryKeyword}...`
          break
        default:
          suggestedPlacement = 'Natural integration in content'
          contextExample = `Understanding ${semanticKeyword} is essential when working with ${input.primaryKeyword}...`
      }
      
      recommendations.push({
        semanticKeyword,
        context: suggestedPlacement,
        suggestedPlacement: contextExample,
        relevanceScore: calculateSemanticRelevance(input.primaryKeyword, semanticKeyword),
        example: contextExample
      })
    }
  })
  
  return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5)
}

/**
 * Calculate semantic relevance between primary and semantic keywords
 */
function calculateSemanticRelevance(primaryKeyword: string, semanticKeyword: string): number {
  const primaryWords = primaryKeyword.toLowerCase().split(/\s+/)
  const semanticWords = semanticKeyword.toLowerCase().split(/\s+/)
  
  // Check for common words
  const commonWords = primaryWords.filter(word => semanticWords.includes(word))
  const commonWordScore = commonWords.length / Math.max(primaryWords.length, semanticWords.length)
  
  // Check for semantic patterns
  const semanticPatterns = [
    'strategies', 'techniques', 'methods', 'approach', 'guide', 'tutorial',
    'best', 'top', 'advanced', 'basic', 'implementation', 'optimization'
  ]
  
  const patternMatch = semanticPatterns.some(pattern => 
    semanticKeyword.toLowerCase().includes(pattern) || primaryKeyword.toLowerCase().includes(pattern)
  )
  
  const patternScore = patternMatch ? 0.3 : 0
  
  return Math.min(1, commonWordScore + patternScore + 0.2) // Base relevance of 0.2
}

/**
 * Generate content length recommendations
 */
function generateContentLengthRecommendations(
  input: RecommendationInput,
  context?: RecommendationContext
): ContentLengthRecommendation[] {
  const recommendations: ContentLengthRecommendation[] = []
  const currentWordCount = input.content.split(/\s+/).filter(w => w.length > 0).length
  const targetLength = input.targetWordCount
  const difference = targetLength - currentWordCount
  
  let priority: 'expand' | 'condense' | 'maintain' = 'maintain'
  let suggestions: string[] = []
  
  if (Math.abs(difference) > targetLength * 0.2) { // More than 20% difference
    if (difference > 0) {
      priority = 'expand'
      suggestions = [
        `Add ${Math.ceil(difference / 3)} more examples or case studies`,
        `Expand on key concepts with detailed explanations`,
        `Include practical implementation steps`,
        `Add relevant statistics or research findings`,
        `Provide more context and background information`
      ]
    } else {
      priority = 'condense'
      suggestions = [
        `Remove ${Math.ceil(Math.abs(difference) / 3)} redundant phrases`,
        'Combine similar sentences for better flow',
        'Eliminate filler words and unnecessary details',
        'Focus on the most important points',
        'Use more concise language'
      ]
    }
  } else if (Math.abs(difference) > targetLength * 0.1) { // 10-20% difference
    if (difference > 0) {
      priority = 'expand'
      suggestions = [
        'Add a few more examples to illustrate points',
        'Expand conclusion with key takeaways',
        'Include additional context or background'
      ]
    } else {
      priority = 'condense'
      suggestions = [
        'Review for unnecessary repetition',
        'Consider combining shorter paragraphs'
      ]
    }
  }
  
  recommendations.push({
    currentLength: currentWordCount,
    targetLength,
    difference,
    suggestions,
    priority
  })
  
  return recommendations
}

/**
 * Generate internal linking opportunities
 */
function generateInternalLinkingRecommendations(
  input: RecommendationInput,
  context?: RecommendationContext
): InternalLinkingRecommendation[] {
  const recommendations: InternalLinkingRecommendation[] = []
  
  // Look for phrases that could be internal links
  const linkingPatterns = [
    { pattern: /\b(learn more|find out more|discover|explore)\b/gi, opportunity: 'Educational content' },
    { pattern: /\b(previous|next|related|similar)\b/gi, opportunity: 'Related content' },
    { pattern: /\b(guide|tutorial|how to|step by step)\b/gi, opportunity: 'Instructional content' },
    { pattern: /\b(example|case study|demonstration)\b/gi, opportunity: 'Examples and case studies' }
  ]
  
  linkingPatterns.forEach(({ pattern, opportunity }) => {
    const matches = input.content.match(pattern)
    if (matches && matches.length > 0) {
      recommendations.push({
        opportunity,
        anchorText: matches[0],
        context: 'Link to relevant internal content',
        relevanceScore: 0.7
      })
    }
  })
  
  // Look for keyword opportunities
  input.secondaryKeywords.forEach(keyword => {
    if (input.content.toLowerCase().includes(keyword.toLowerCase())) {
      recommendations.push({
        opportunity: `Link to ${keyword} resources`,
        anchorText: keyword,
        context: 'Internal link to related content',
        relevanceScore: 0.8
      })
    }
  })
  
  return recommendations.slice(0, 5)
}

/**
 * Generate call-to-action recommendations
 */
function generateCallToActionRecommendations(
  input: RecommendationInput,
  context?: RecommendationContext
): CallToActionRecommendation[] {
  const recommendations: CallToActionRecommendation[] = []
  
  // Determine appropriate CTA based on content type and search intent
  let ctaType: 'primary' | 'secondary' | 'informational' = 'informational'
  let placement: 'end-of-section' | 'mid-content' | 'conclusion' = 'conclusion'
  
  switch (input.contentType) {
    case 'introduction':
      ctaType = 'secondary'
      placement = 'end-of-section'
      break
    case 'conclusion':
      ctaType = 'primary'
      placement = 'conclusion'
      break
    case 'h2':
      ctaType = 'informational'
      placement = 'mid-content'
      break
  }
  
  // Generate CTA based on search intent
  const intent = input.searchIntent || 'informational'
  let ctaText = ''
  let purpose = ''
  let urgency = 0
  
  switch (intent) {
    case 'informational':
      ctaText = `Learn more about ${input.primaryKeyword} best practices`
      purpose = 'Encourage further learning'
      urgency = 0.6
      break
    case 'transactional':
      ctaText = `Get started with ${input.primaryKeyword} today`
      purpose = 'Drive action/conversion'
      urgency = 0.9
      break
    case 'commercial':
      ctaText = `Compare ${input.primaryKeyword} options and solutions`
      purpose = 'Support decision making'
      urgency = 0.7
      break
    default:
      ctaText = `Discover comprehensive ${input.primaryKeyword} strategies`
      purpose = 'Provide additional resources'
      urgency = 0.5
  }
  
  recommendations.push({
    type: ctaType,
    placement,
    text: ctaText,
    purpose,
    urgency
  })
  
  return recommendations
}

/**
 * Generate general SEO recommendations
 */
function generateGeneralRecommendations(
  input: RecommendationInput,
  currentScore: SEOScoreResult,
  validationResult: ValidationResult,
  context?: RecommendationContext
): RealTimeRecommendation[] {
  const recommendations: RealTimeRecommendation[] = []
  
  // Process validation issues into recommendations
  validationResult.issues.forEach((issue: SEOIssue, index: number) => {
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium'
    let category: 'immediate' | 'next-section' | 'future' = 'immediate'
    let effort: 'low' | 'medium' | 'high' = 'medium'
    let timeframe: 'now' | 'next-paragraph' | 'next-section' | 'revision' = 'now'
    
    if (issue.type === 'error') {
      priority = 'critical'
      effort = 'low'
      timeframe = 'now'
    } else if (issue.type === 'warning') {
      priority = 'high'
      effort = 'medium'
      timeframe = 'next-paragraph'
    } else {
      priority = 'medium'
      effort = 'high'
      timeframe = 'revision'
    }
    
    // Map validation category to recommendation type
    const mapCategoryToType = (category: string): 'keyword' | 'readability' | 'structure' | 'semantic' | 'length' | 'placement' | 'intent' => {
      switch (category) {
        case 'keyword': return 'keyword'
        case 'readability': return 'readability'
        case 'structure': return 'structure'
        case 'semantic': return 'semantic'
        case 'length': return 'length'
        case 'meta': return 'structure' // Map meta to structure
        case 'performance': return 'structure' // Map performance to structure
        default: return 'structure'
      }
    }

    recommendations.push({
      id: `validation-${index}`,
      type: mapCategoryToType(issue.category),
      priority,
      category,
      title: `SEO ${issue.category} issue`,
      description: issue.message,
      action: issue.suggestion,
      impact: issue.type === 'error' ? 30 : issue.type === 'warning' ? 20 : 10,
      effort,
      timeframe
    })
  })
  
  // Add score-based recommendations
  if (currentScore.overallScore < 70) {
    recommendations.push({
      id: 'score-improvement',
      type: 'keyword',
      priority: 'high',
      category: 'immediate',
      title: 'Improve overall SEO score',
      description: `Current SEO score is ${currentScore.overallScore}/100`,
      action: 'Focus on keyword density and content structure',
      impact: 25,
      effort: 'medium',
      timeframe: 'next-paragraph'
    })
  }
  
  // Add content-type specific recommendations
  switch (input.contentType) {
    case 'introduction':
      recommendations.push({
        id: 'intro-hook',
        type: 'readability',
        priority: 'high',
        category: 'immediate',
        title: 'Add compelling hook',
        description: 'Introduction should start with engaging content',
        action: 'Add statistic, question, or surprising fact in first sentence',
        impact: 20,
        effort: 'low',
        timeframe: 'now'
      })
      break
      
    case 'conclusion':
      recommendations.push({
        id: 'conclusion-summary',
        type: 'structure',
        priority: 'medium',
        category: 'immediate',
        title: 'Summarize key points',
        description: 'Conclusion should reinforce main takeaways',
        action: 'Add 2-3 sentence summary of key points',
        impact: 15,
        effort: 'low',
        timeframe: 'now'
      })
      break
  }
  
  return recommendations
    .sort((a, b) => {
      // Sort by priority first, then by impact
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      
      if (priorityDiff !== 0) return priorityDiff
      
      return b.impact - a.impact
    })
    .slice(0, 15) // Limit to top 15 recommendations
}
