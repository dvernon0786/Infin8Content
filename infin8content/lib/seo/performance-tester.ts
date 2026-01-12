// SEO Performance Testing Tools
// Story 14.6: SEO Testing and Validation
// Task 3: Performance Testing Tools

import { calculateSEOScore, type SEOScoreInput } from './seo-scoring'

export interface PerformanceTestInput {
  content: string
  primaryKeyword: string
  secondaryKeywords: string[]
  competitorContent?: string
  targetKeywords: string[]
  contentType: string
}

export interface PerformanceMetrics {
  rankingPotential: number
  competitorScore: number
  uniquenessScore: number
  featuredSnippetScore: number
  mobileFriendlinessScore: number
  pageLoadImpactScore: number
  overallPerformanceScore: number
}

export interface CompetitorAnalysis {
  competitorScore: number
  contentGaps: string[]
  strengthAreas: string[]
  improvementOpportunities: string[]
}

export interface FeaturedSnippetAnalysis {
  snippetOptimizationScore: number
  questionBasedContent: boolean
  listFormatOpportunities: string[]
  definitionOpportunities: string[]
  howToGuides: string[]
}

export interface ContentUniquenessResult {
  uniquenessScore: number
  duplicatePhrases: string[]
  similarSentences: string[]
  originalityScore: number
  plagiarismRisk: 'low' | 'medium' | 'high'
}

export interface MobileFriendlinessResult {
  mobileScore: number
  readabilityOnMobile: number
  navigationStructure: number
  imageOptimization: number
  loadTimeImpact: number
}

export interface PageLoadImpactResult {
  contentComplexityScore: number
  imageCount: number
  wordCountImpact: number
  estimatedLoadTime: number
  optimizationSuggestions: string[]
}

export interface PerformanceTestResult {
  performanceMetrics: PerformanceMetrics
  competitorAnalysis?: CompetitorAnalysis
  featuredSnippetAnalysis: FeaturedSnippetAnalysis
  uniquenessResult: ContentUniquenessResult
  mobileFriendlinessResult: MobileFriendlinessResult
  pageLoadImpactResult: PageLoadImpactResult
  recommendations: PerformanceRecommendation[]
  overallScore: number
}

export interface PerformanceRecommendation {
  type: 'competitor' | 'uniqueness' | 'snippet' | 'mobile' | 'performance'
  priority: 'high' | 'medium' | 'low'
  description: string
  action: string
  impact: number
}

/**
 * Run comprehensive SEO performance analysis
 */
export function runPerformanceTest(input: PerformanceTestInput): PerformanceTestResult {
  // Input validation
  if (!input || !input.content || typeof input.content !== 'string') {
    return {
      performanceMetrics: {
        rankingPotential: 0,
        competitorScore: 0,
        uniquenessScore: 0,
        featuredSnippetScore: 0,
        mobileFriendlinessScore: 0,
        pageLoadImpactScore: 0,
        overallPerformanceScore: 0
      },
      competitorAnalysis: undefined,
      featuredSnippetAnalysis: {
        snippetOptimizationScore: 0,
        questionBasedContent: false,
        listFormatOpportunities: [],
        definitionOpportunities: [],
        howToGuides: []
      },
      uniquenessResult: {
        uniquenessScore: 0,
        duplicatePhrases: [],
        similarSentences: [],
        originalityScore: 0,
        plagiarismRisk: 'high'
      },
      mobileFriendlinessResult: {
        mobileScore: 0,
        readabilityOnMobile: 0,
        navigationStructure: 0,
        imageOptimization: 0,
        loadTimeImpact: 0
      },
      pageLoadImpactResult: {
        contentComplexityScore: 0,
        imageCount: 0,
        wordCountImpact: 0,
        estimatedLoadTime: 0,
        optimizationSuggestions: []
      },
      recommendations: [{
        type: 'performance',
        priority: 'high',
        description: 'Invalid input: content is required',
        action: 'Ensure content is provided',
        impact: 0
      }],
      overallScore: 0
    }
  }

  const startTime = performance.now()
  
  try {
    // Calculate base SEO score
    const baseScoreInput: SEOScoreInput = {
      content: input.content,
      primaryKeyword: input.primaryKeyword || '',
      secondaryKeywords: input.secondaryKeywords || [],
      targetWordCount: 300,
      contentType: input.contentType as any
    }
    
    const baseScoreResult = calculateSEOScore(baseScoreInput)
    
    // Run individual performance tests
    const competitorAnalysis = input.competitorContent ? 
      analyzeCompetitorContent(input.content, input.competitorContent, input.targetKeywords) : 
      undefined
    
    const featuredSnippetAnalysis = analyzeFeaturedSnippetPotential(input.content, input.targetKeywords)
    const uniquenessResult = analyzeContentUniqueness(input.content)
    const mobileFriendlinessResult = analyzeMobileFriendliness(input.content)
    const pageLoadImpactResult = analyzePageLoadImpact(input.content)
    
    // Calculate performance metrics
    const rankingPotential = calculateRankingPotential(
      baseScoreResult.overallScore,
      competitorAnalysis?.competitorScore || 50,
      uniquenessResult.uniquenessScore,
      featuredSnippetAnalysis.snippetOptimizationScore
    )
    
    const performanceMetrics: PerformanceMetrics = {
      rankingPotential,
      competitorScore: competitorAnalysis?.competitorScore || 0,
      uniquenessScore: uniquenessResult.uniquenessScore,
      featuredSnippetScore: featuredSnippetAnalysis.snippetOptimizationScore,
      mobileFriendlinessScore: mobileFriendlinessResult.mobileScore,
      pageLoadImpactScore: 100 - pageLoadImpactResult.contentComplexityScore, // Invert so higher is better
      overallPerformanceScore: 0 // Will be calculated below
    }
    
    // Calculate overall performance score
    const weights = {
      rankingPotential: 0.30,
      uniquenessScore: 0.25,
      featuredSnippetScore: 0.20,
      mobileFriendlinessScore: 0.15,
      pageLoadImpactScore: 0.10
    }
    
    performanceMetrics.overallPerformanceScore = Math.round(
      performanceMetrics.rankingPotential * weights.rankingPotential +
      performanceMetrics.uniquenessScore * weights.uniquenessScore +
      performanceMetrics.featuredSnippetScore * weights.featuredSnippetScore +
      performanceMetrics.mobileFriendlinessScore * weights.mobileFriendlinessScore +
      performanceMetrics.pageLoadImpactScore * weights.pageLoadImpactScore
    )
    
    // Generate recommendations
    const recommendations = generatePerformanceRecommendations(
      performanceMetrics,
      competitorAnalysis,
      featuredSnippetAnalysis,
      uniquenessResult,
      mobileFriendlinessResult,
      pageLoadImpactResult
    )
    
    const endTime = performance.now()
    const executionTime = Math.round((endTime - startTime) * 100) / 100
    
    
    return {
      performanceMetrics,
      competitorAnalysis,
      featuredSnippetAnalysis,
      uniquenessResult,
      mobileFriendlinessResult,
      pageLoadImpactResult,
      recommendations,
      overallScore: performanceMetrics.overallPerformanceScore
    }
  } catch (error) {
    
    // Return fallback result
    return {
      performanceMetrics: {
        rankingPotential: 0,
        competitorScore: 0,
        uniquenessScore: 0,
        featuredSnippetScore: 0,
        mobileFriendlinessScore: 0,
        pageLoadImpactScore: 0,
        overallPerformanceScore: 0
      },
      featuredSnippetAnalysis: {
        snippetOptimizationScore: 0,
        questionBasedContent: false,
        listFormatOpportunities: [],
        definitionOpportunities: [],
        howToGuides: []
      },
      uniquenessResult: {
        uniquenessScore: 0,
        duplicatePhrases: [],
        similarSentences: [],
        originalityScore: 0,
        plagiarismRisk: 'high'
      },
      mobileFriendlinessResult: {
        mobileScore: 0,
        readabilityOnMobile: 0,
        navigationStructure: 0,
        imageOptimization: 0,
        loadTimeImpact: 0
      },
      pageLoadImpactResult: {
        contentComplexityScore: 0,
        imageCount: 0,
        wordCountImpact: 0,
        estimatedLoadTime: 0,
        optimizationSuggestions: []
      },
      recommendations: [{
        type: 'performance',
        priority: 'high',
        description: 'Performance analysis failed',
        action: 'Check content format and try again',
        impact: 0
      }],
      overallScore: 0
    }
  }
}

/**
 * Analyze competitor content and compare with target content
 */
function analyzeCompetitorContent(
  targetContent: string, 
  competitorContent: string, 
  targetKeywords: string[]
): CompetitorAnalysis {
  try {
    // Calculate competitor SEO score
    const competitorScoreInput: SEOScoreInput = {
      content: competitorContent,
      primaryKeyword: targetKeywords[0] || '',
      secondaryKeywords: targetKeywords.slice(1),
      targetWordCount: 300,
      contentType: 'general'
    }
    
    const competitorScoreResult = calculateSEOScore(competitorScoreInput)
    
    // Analyze content gaps and strengths
    const targetWords = targetContent.toLowerCase().split(/\s+/)
    const competitorWords = competitorContent.toLowerCase().split(/\s+/)
    
    const targetKeywordsInContent = targetKeywords.filter(keyword => 
      targetContent.toLowerCase().includes(keyword.toLowerCase())
    )
    
    const competitorKeywordsInContent = targetKeywords.filter(keyword => 
      competitorContent.toLowerCase().includes(keyword.toLowerCase())
    )
    
    const contentGaps: string[] = []
    const strengthAreas: string[] = []
    const improvementOpportunities: string[] = []
    
    // Identify content gaps (keywords competitor has but we don't)
    competitorKeywordsInContent.forEach(keyword => {
      if (!targetKeywordsInContent.includes(keyword)) {
        contentGaps.push(`Missing keyword: ${keyword}`)
      }
    })
    
    // Identify strength areas (keywords we have but competitor doesn't)
    targetKeywordsInContent.forEach(keyword => {
      if (!competitorKeywordsInContent.includes(keyword)) {
        strengthAreas.push(`Strong keyword coverage: ${keyword}`)
      }
    })
    
    // General improvement opportunities
    if (targetContent.length < competitorContent.length * 0.8) {
      improvementOpportunities.push('Consider expanding content length')
    }
    
    if (competitorScoreResult.overallScore > 70) {
      improvementOpportunities.push('Study competitor structure and approach')
    }
    
    return {
      competitorScore: competitorScoreResult.overallScore,
      contentGaps,
      strengthAreas,
      improvementOpportunities
    }
  } catch (error) {
    return {
      competitorScore: 50,
      contentGaps: ['Competitor analysis failed'],
      strengthAreas: [],
      improvementOpportunities: []
    }
  }
}

/**
 * Analyze featured snippet optimization potential
 */
function analyzeFeaturedSnippetPotential(content: string, targetKeywords: string[]): FeaturedSnippetAnalysis {
  try {
    const contentLower = content.toLowerCase()
    
    // Check for question-based content
    const questions = content.match(/\b(what|how|why|when|where|who|which|can|should|will|do|does|is|are)\b.*\?/gi) || []
    const questionBasedContent = questions.length > 0
    
    // Identify list format opportunities
    const listIndicators = ['steps', 'tips', 'ways', 'methods', 'types', 'examples', 'benefits']
    const listFormatOpportunities: string[] = []
    const bulletLists = (content.match(/^\s*[-*+]\s+/gm) || []).length
    const numberedLists = (content.match(/^\s*\d+\.\s+/gm) || []).length
    const existingLists = bulletLists + numberedLists
    if (existingLists < 2) {
      listFormatOpportunities.push('Add numbered lists for step-by-step guides')
      listFormatOpportunities.push('Use bullet points for key takeaways')
    }
    
    // Identify definition opportunities
    const definitionKeywords = ['definition', 'means', 'refers to', 'is defined as']
    const definitionOpportunities: string[] = []
    
    if (targetKeywords && Array.isArray(targetKeywords)) {
      targetKeywords.forEach(keyword => {
        if (keyword && typeof keyword === 'string') {
          if (!definitionKeywords.some(def => contentLower.includes(`${keyword.toLowerCase()} ${def}`))) {
            definitionOpportunities.push(`Define "${keyword}" clearly`)
          }
        }
      })
    }
    
    // Identify how-to guide opportunities
    const howToPatterns = ['how to', 'step by step', 'guide', 'tutorial', 'instructions']
    const howToGuides: string[] = []
    
    if (targetKeywords && Array.isArray(targetKeywords)) {
      targetKeywords.forEach(keyword => {
        if (keyword && typeof keyword === 'string') {
          howToPatterns.forEach(pattern => {
            if (contentLower.includes(`${pattern} ${keyword.toLowerCase()}`)) {
              howToGuides.push(`${pattern} ${keyword}`)
            }
          })
        }
      })
    }
    
    // Calculate snippet optimization score
    let snippetScore = 20 // Base score
    
    // More nuanced scoring based on content analysis
    if (questionBasedContent) {
      const questionCount = (content.match(/\b(what|how|why|when|where|who|which|can|should|will|do|does|is|are)\b.*\?/gi) || []).length
      snippetScore += Math.min(50, questionCount * 20) // More questions = higher score
    }
    
    if (existingLists >= 2) snippetScore += 40
    if (existingLists >= 4) snippetScore += 25 // Bonus for lots of lists
    
    if (definitionOpportunities.length === 0) snippetScore += 20 // Already has definitions
    
    if (howToGuides.length > 0) snippetScore += 20
    
    // Cap at 100
    snippetScore = Math.min(100, snippetScore)
    
    return {
      snippetOptimizationScore: snippetScore,
      questionBasedContent,
      listFormatOpportunities,
      definitionOpportunities,
      howToGuides
    }
  } catch (error) {
    return {
      snippetOptimizationScore: 0,
      questionBasedContent: false,
      listFormatOpportunities: [],
      definitionOpportunities: [],
      howToGuides: []
    }
  }
}

/**
 * Analyze content uniqueness and potential plagiarism
 */
function analyzeContentUniqueness(content: string): ContentUniquenessResult {
  try {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
    const words = content.toLowerCase().replace(/[.,!?;:]/g, '').split(/\s+/)
    
    // Check for duplicate phrases (3+ word sequences)
    const phrases: { [key: string]: number } = {}
    const duplicatePhrases: string[] = []
    
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = words.slice(i, i + 3).join(' ')
      phrases[phrase] = (phrases[phrase] || 0) + 1
      
      if (phrases[phrase] > 1) {
        duplicatePhrases.push(phrase)
      }
    }
    
    // Check for similar sentences (high cosine similarity)
    const similarSentences: string[] = []
    
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const similarity = calculateSentenceSimilarity(sentences[i], sentences[j])
        if (similarity > 0.8) {
          similarSentences.push(`Similar: "${sentences[i].substring(0, 50)}..."`)
        }
      }
    }
    
    // Calculate uniqueness score
    const duplicatePhraseCount = duplicatePhrases.length
    const similarSentenceCount = similarSentences.length
    const totalSentences = sentences.length
    
    const uniquenessScore = Math.max(0, 100 - (duplicatePhraseCount * 12) - (similarSentenceCount * 15))
    
    // Determine plagiarism risk
    let plagiarismRisk: 'low' | 'medium' | 'high' = 'low'
    if (duplicatePhraseCount > 5 || similarSentenceCount > 3) {
      plagiarismRisk = 'high'
    } else if (duplicatePhraseCount > 2 || similarSentenceCount > 1) {
      plagiarismRisk = 'medium'
    }
    
    // Calculate originality score (inverse of duplication)
    const originalityScore = Math.max(0, 100 - (duplicatePhraseCount * 3) - (similarSentenceCount * 5))
    
    return {
      uniquenessScore: Math.round(uniquenessScore),
      duplicatePhrases: [...new Set(duplicatePhrases)].slice(0, 10),
      similarSentences: [...new Set(similarSentences)].slice(0, 5),
      originalityScore: Math.round(originalityScore),
      plagiarismRisk
    }
  } catch (error) {
    return {
      uniquenessScore: 0,
      duplicatePhrases: [],
      similarSentences: [],
      originalityScore: 0,
      plagiarismRisk: 'high'
    }
  }
}

/**
 * Calculate sentence similarity using simple word overlap
 */
function calculateSentenceSimilarity(sentence1: string, sentence2: string): number {
  const words1 = new Set(sentence1.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const words2 = new Set(sentence2.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  
  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

/**
 * Analyze mobile friendliness of content
 */
function analyzeMobileFriendliness(content: string): MobileFriendlinessResult {
  try {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = content.split(/\s+/)
    const images = content.match(/!\[([^\]]*)\]\([^)]+\)/g) || []
    
    // Calculate readability on mobile (shorter sentences preferred)
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 20)
    const readabilityOnMobile = Math.max(0, 100 - (longSentences.length * 25))
    
    // Navigation structure (heading analysis)
    const headings = content.match(/^#{1,6}\s+(.+)$/gm) || []
    const navigationStructure = Math.min(100, headings.length * 15)
    
    // Image optimization (alt text check)
    const imagesWithoutAlt = images.filter(img => {
      const altMatch = img.match(/!\[([^\]]*)\]/)
      return !altMatch || altMatch[1].trim() === ''
    })
    
    const imageOptimization = images.length > 0 ? 
      Math.max(0, 100 - (imagesWithoutAlt.length * 25)) : 100
    
    // Load time impact (content complexity)
    const contentComplexity = words.length + (images.length * 50) + (headings.length * 10)
    const loadTimeImpact = Math.max(0, 100 - (contentComplexity / 100))
    
    // Overall mobile score
    const mobileScore = Math.round(
      (readabilityOnMobile * 0.3 + 
       navigationStructure * 0.25 + 
       imageOptimization * 0.25 + 
       loadTimeImpact * 0.2)
    )
    
    return {
      mobileScore,
      readabilityOnMobile: Math.round(readabilityOnMobile),
      navigationStructure: Math.round(navigationStructure),
      imageOptimization: Math.round(imageOptimization),
      loadTimeImpact: Math.round(loadTimeImpact)
    }
  } catch (error) {
    return {
      mobileScore: 0,
      readabilityOnMobile: 0,
      navigationStructure: 0,
      imageOptimization: 0,
      loadTimeImpact: 0
    }
  }
}

/**
 * Analyze page load impact of content
 */
function analyzePageLoadImpact(content: string): PageLoadImpactResult {
  try {
    const words = content.split(/\s+/)
    const images = content.match(/!\[([^\]]*)\]\([^)]+\)/g) || []
    const links = content.match(/\[([^\]]+)\]\([^)]+\)/g) || []
    
    // Content complexity score
    const avgSentenceLength = words.length / (content.split(/[.!?]+/).length || 1)
    const complexityFactors = {
      wordCount: Math.min(50, words.length / 10),
      imageCount: images.length * 15,
      linkCount: links.length * 5,
      sentenceComplexity: avgSentenceLength * 2
    }
    
    const contentComplexityScore = Math.min(100, 
      complexityFactors.wordCount + 
      complexityFactors.imageCount + 
      complexityFactors.linkCount + 
      complexityFactors.sentenceComplexity
    )
    
    // Word count impact
    const wordCountImpact = Math.min(30, words.length / 20)
    
    // Estimated load time (simplified calculation)
    const baseLoadTime = 1.0 // 1 second base
    const wordLoadTime = words.length * 0.001 // 1ms per word
    const imageLoadTime = images.length * 0.5 // 500ms per image
    const linkLoadTime = links.length * 0.01 // 10ms per link
    
    const estimatedLoadTime = baseLoadTime + wordLoadTime + imageLoadTime + linkLoadTime
    
    // Optimization suggestions
    const optimizationSuggestions: string[] = []
    
    if (words.length > 1000) {
      optimizationSuggestions.push('Consider splitting long content into multiple pages')
    }
    
    if (images.length > 5) {
      optimizationSuggestions.push('Optimize images for faster loading')
    }
    
    if (avgSentenceLength > 25) {
      optimizationSuggestions.push('Break up long sentences for better readability')
    }
    
    if (estimatedLoadTime > 3) {
      optimizationSuggestions.push('Content may impact page load time significantly')
    }
    
    return {
      contentComplexityScore: Math.round(contentComplexityScore),
      imageCount: images.length,
      wordCountImpact: Math.round(wordCountImpact),
      estimatedLoadTime: Math.round(estimatedLoadTime * 100) / 100,
      optimizationSuggestions
    }
  } catch (error) {
    return {
      contentComplexityScore: 0,
      imageCount: 0,
      wordCountImpact: 0,
      estimatedLoadTime: 0,
      optimizationSuggestions: []
    }
  }
}

/**
 * Calculate overall ranking potential
 */
function calculateRankingPotential(
  baseScore: number,
  competitorScore: number,
  uniquenessScore: number,
  snippetScore: number
): number {
  try {
    // Weight the different factors
    const weights = {
      baseSEO: 0.4,
      competitorAdvantage: 0.3,
      uniqueness: 0.2,
      snippetPotential: 0.1
    }
    
    // Calculate competitor advantage (how much better we are than competitors)
    const competitorAdvantage = Math.max(0, baseScore - competitorScore)
    
    const rankingPotential = Math.round(
      baseScore * weights.baseSEO +
      competitorAdvantage * weights.competitorAdvantage +
      uniquenessScore * weights.uniqueness +
      snippetScore * weights.snippetPotential
    )
    
    return Math.max(0, Math.min(100, rankingPotential))
  } catch (error) {
    return 50
  }
}

/**
 * Generate performance recommendations
 */
function generatePerformanceRecommendations(
  metrics: PerformanceMetrics,
  competitorAnalysis?: CompetitorAnalysis,
  snippetAnalysis?: FeaturedSnippetAnalysis,
  uniquenessResult?: ContentUniquenessResult,
  mobileResult?: MobileFriendlinessResult,
  pageLoadResult?: PageLoadImpactResult
): PerformanceRecommendation[] {
  const recommendations: PerformanceRecommendation[] = []
  
  // Competitor-based recommendations
  if (competitorAnalysis) {
    if (competitorAnalysis.competitorScore > metrics.overallPerformanceScore) {
      recommendations.push({
        type: 'competitor',
        priority: 'high',
        description: 'Competitors have stronger SEO optimization',
        action: 'Study competitor content structure and keyword usage',
        impact: 25
      })
    }
    
    if (competitorAnalysis.contentGaps.length > 0) {
      recommendations.push({
        type: 'competitor',
        priority: 'medium',
        description: 'Missing keyword opportunities identified',
        action: `Address: ${competitorAnalysis.contentGaps.slice(0, 2).join(', ')}`,
        impact: 15
      })
    }
  }
  
  // Featured snippet recommendations
  if (snippetAnalysis && snippetAnalysis.snippetOptimizationScore < 70) {
    recommendations.push({
      type: 'snippet',
      priority: 'medium',
      description: 'Low featured snippet optimization potential',
      action: 'Add question-based content and structured lists',
      impact: 20
    })
  }
  
  // Uniqueness recommendations
  if (uniquenessResult && uniquenessResult.uniquenessScore < 70) {
    recommendations.push({
      type: 'uniqueness',
      priority: 'high',
      description: 'Content may be too similar to existing content',
      action: 'Rewrite duplicate phrases and add unique insights',
      impact: 30
    })
  }
  
  // Mobile friendliness recommendations
  if (mobileResult && mobileResult.mobileScore < 80) {
    recommendations.push({
      type: 'mobile',
      priority: 'medium',
      description: 'Content needs mobile optimization',
      action: 'Shorten sentences and improve structure for mobile',
      impact: 15
    })
  }
  
  // Performance recommendations
  if (pageLoadResult && pageLoadResult.contentComplexityScore > 70) {
    recommendations.push({
      type: 'performance',
      priority: 'low',
      description: 'Content may impact page load time',
      action: 'Optimize images and consider content splitting',
      impact: 10
    })
  }
  
  return recommendations.sort((a, b) => b.impact - a.impact).slice(0, 10)
}
