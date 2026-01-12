// SEO Scoring Engine
// Story 14.6: SEO Testing and Validation
// Task 1: SEO Scoring Engine Implementation

import { calculateReadabilityScore, validateContentStructure } from '@/lib/services/article-generation/section-processor'

export interface SEOScoreInput {
  content: string
  primaryKeyword: string
  secondaryKeywords: string[]
  targetWordCount: number
  contentType: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq' | 'general'
}

export interface SEOScoreBreakdown {
  keywordDensity: number
  readability: number
  structure: number
  semanticCoverage: number
  contentLength: number
  metaOptimization: number
}

export interface SEOScoreResult {
  overallScore: number
  breakdown: SEOScoreBreakdown
  metrics: SEOMetrics
  recommendations: SEORecommendation[]
  issues: SEOIssue[]
}

export interface SEOMetrics {
  wordCount: number
  keywordDensity: number
  readabilityScore: number
  semanticKeywordCount: number
  headingCount: number
  linkCount: number
  imageCount: number
}

export interface SEORecommendation {
  type: 'keyword' | 'readability' | 'structure' | 'semantic' | 'length' | 'meta'
  priority: 'high' | 'medium' | 'low'
  description: string
  action: string
  impact: number
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  category: 'keyword' | 'readability' | 'structure' | 'semantic' | 'length' | 'meta' | 'performance'
  message: string
  suggestion: string
}

/**
 * Calculate comprehensive SEO score (0-100) for content
 */
export function calculateSEOScore(input: SEOScoreInput): SEOScoreResult {
  const startTime = performance.now()
  
  try {
    // Validate input
    if (!input.content || typeof input.content !== 'string') {
      throw new Error('Content is required and must be a string')
    }
    
    if (!input.primaryKeyword || typeof input.primaryKeyword !== 'string') {
      throw new Error('Primary keyword is required and must be a string')
    }

    // Calculate individual scoring components
    const keywordScore = calculateKeywordDensityScore(input)
    const readabilityScore = calculateReadabilityScoreComponent(input)
    const structureScore = calculateStructureScore(input)
    const semanticScore = calculateSemanticCoverageScore(input)
    const lengthScore = calculateContentLengthScore(input)
    const metaScore = calculateMetaOptimizationScore(input)

    // Calculate weighted overall score
    const weights = {
      keywordDensity: 0.25,
      readability: 0.20,
      structure: 0.20,
      semanticCoverage: 0.15,
      contentLength: 0.10,
      metaOptimization: 0.10
    }

    const breakdown: SEOScoreBreakdown = {
      keywordDensity: keywordScore.score,
      readability: readabilityScore.score,
      structure: structureScore.score,
      semanticCoverage: semanticScore.score,
      contentLength: lengthScore.score,
      metaOptimization: metaScore.score
    }

    const overallScore = Math.round(
      breakdown.keywordDensity * weights.keywordDensity +
      breakdown.readability * weights.readability +
      breakdown.structure * weights.structure +
      breakdown.semanticCoverage * weights.semanticCoverage +
      breakdown.contentLength * weights.contentLength +
      breakdown.metaOptimization * weights.metaOptimization
    )

    // Generate metrics
    const metrics = extractSEOMetrics(input)

    // Generate recommendations and issues
    const allRecommendations = [
      ...keywordScore.recommendations,
      ...readabilityScore.recommendations,
      ...structureScore.recommendations,
      ...semanticScore.recommendations,
      ...lengthScore.recommendations,
      ...metaScore.recommendations
    ]

    const allIssues = [
      ...keywordScore.issues,
      ...readabilityScore.issues,
      ...structureScore.issues,
      ...semanticScore.issues,
      ...lengthScore.issues,
      ...metaScore.issues
    ]

    // Sort recommendations by impact and priority
    const recommendations = allRecommendations
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 10) // Top 10 recommendations

    const issues = allIssues
      .sort((a, b) => {
        const severityOrder = { error: 3, warning: 2, info: 1 }
        return severityOrder[b.type] - severityOrder[a.type]
      })
      .slice(0, 15) // Top 15 issues

    const endTime = performance.now()
    const executionTime = Math.round((endTime - startTime) * 100) / 100


    return {
      overallScore: Math.max(0, Math.min(100, overallScore)),
      breakdown,
      metrics,
      recommendations,
      issues
    }
  } catch (error) {
    
    // Return fallback result
    return {
      overallScore: 0,
      breakdown: {
        keywordDensity: 0,
        readability: 0,
        structure: 0,
        semanticCoverage: 0,
        contentLength: 0,
        metaOptimization: 0
      },
      metrics: {
        wordCount: 0,
        keywordDensity: 0,
        readabilityScore: 0,
        semanticKeywordCount: 0,
        headingCount: 0,
        linkCount: 0,
        imageCount: 0
      },
      recommendations: [{
        type: 'keyword',
        priority: 'high',
        description: 'SEO scoring failed',
        action: 'Check content and try again',
        impact: 0
      }],
      issues: [{
        type: 'error',
        category: 'keyword',
        message: `SEO scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Please check your input and try again'
      }]
    }
  }
}

/**
 * Calculate keyword density score (1-2% optimal)
 */
function calculateKeywordDensityScore(input: SEOScoreInput): {
  score: number
  recommendations: SEORecommendation[]
  issues: SEOIssue[]
} {
  const recommendations: SEORecommendation[] = []
  const issues: SEOIssue[] = []

  try {
    const wordCount = input.content.split(/\s+/).filter(w => w.length > 0).length
    const keywordCount = (input.content.toLowerCase().match(new RegExp(input.primaryKeyword.toLowerCase(), 'g')) || []).length
    const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0

    // Optimal range: 1-2%
    const optimalMin = 1.0
    const optimalMax = 2.0
    
    let score = 100
    
    if (density < optimalMin) {
      score = Math.max(0, (density / optimalMin) * 100)
      recommendations.push({
        type: 'keyword',
        priority: 'high',
        description: `Keyword density is too low (${density.toFixed(2)}%)`,
        action: `Add ${Math.ceil((optimalMin * wordCount / 100) - keywordCount)} more occurrences of "${input.primaryKeyword}"`,
        impact: 25
      })
      
      if (density === 0) {
        issues.push({
          type: 'error',
          category: 'keyword',
          message: `Primary keyword "${input.primaryKeyword}" not found in content`,
          suggestion: `Include "${input.primaryKeyword}" naturally throughout the content`
        })
      } else {
        issues.push({
          type: 'warning',
          category: 'keyword',
          message: `Keyword density below optimal range (${density.toFixed(2)}% < ${optimalMin}%)`,
          suggestion: `Increase keyword usage to reach ${optimalMin}-${optimalMax}% density`
        })
      }
    } else if (density > optimalMax) {
      score = Math.max(0, 100 - ((density - optimalMax) / optimalMax) * 100)
      recommendations.push({
        type: 'keyword',
        priority: 'medium',
        description: `Keyword density is too high (${density.toFixed(2)}%)`,
        action: `Remove ${Math.ceil(keywordCount - (optimalMax * wordCount / 100))} occurrences of "${input.primaryKeyword}"`,
        impact: 15
      })
      
      issues.push({
        type: 'warning',
        category: 'keyword',
        message: `Keyword density above optimal range (${density.toFixed(2)}% > ${optimalMax}%)`,
        suggestion: `Reduce keyword usage to avoid keyword stuffing penalties`
      })
    }

    return { score: Math.round(score), recommendations, issues }
  } catch (error) {
    return { 
      score: 0, 
      recommendations: [{
        type: 'keyword',
        priority: 'high',
        description: 'Keyword density calculation failed',
        action: 'Check content format',
        impact: 0
      }],
      issues: [{
        type: 'error',
        category: 'keyword',
        message: 'Keyword density calculation failed',
        suggestion: 'Verify content format and try again'
      }]
    }
  }
}

/**
 * Calculate readability score component
 */
function calculateReadabilityScoreComponent(input: SEOScoreInput): {
  score: number
  recommendations: SEORecommendation[]
  issues: SEOIssue[]
} {
  const recommendations: SEORecommendation[] = []
  const issues: SEOIssue[] = []

  try {
    const readabilityScore = calculateReadabilityScore(input.content)
    
    // Optimal range: Grade 10-12
    const optimalMin = 10
    const optimalMax = 12
    
    let score = 100
    
    if (readabilityScore < optimalMin) {
      score = Math.max(0, (readabilityScore / optimalMin) * 100)
      recommendations.push({
        type: 'readability',
        priority: 'medium',
        description: `Content is too simple (Grade ${readabilityScore})`,
        action: 'Use more complex sentences and advanced vocabulary',
        impact: 15
      })
      
      issues.push({
        type: 'info',
        category: 'readability',
        message: `Readability score is ${readabilityScore} (below optimal range ${optimalMin}-${optimalMax})`,
        suggestion: 'Consider using more sophisticated language for better SEO'
      })
    } else if (readabilityScore > optimalMax) {
      score = Math.max(0, 100 - ((readabilityScore - optimalMax) / (20 - optimalMax)) * 100)
      recommendations.push({
        type: 'readability',
        priority: 'high',
        description: `Content is too complex (Grade ${readabilityScore})`,
        action: 'Simplify sentences and use more common vocabulary',
        impact: 20
      })
      
      issues.push({
        type: 'warning',
        category: 'readability',
        message: `Readability score is ${readabilityScore} (above optimal range ${optimalMin}-${optimalMax})`,
        suggestion: 'Simplify content to improve user experience and SEO'
      })
    }

    return { score: Math.round(score), recommendations, issues }
  } catch (error) {
    return { 
      score: 0, 
      recommendations: [{
        type: 'readability',
        priority: 'high',
        description: 'Readability calculation failed',
        action: 'Check content format',
        impact: 0
      }],
      issues: [{
        type: 'error',
        category: 'readability',
        message: 'Readability calculation failed',
        suggestion: 'Verify content format and try again'
      }]
    }
  }
}

/**
 * Calculate content structure score
 */
function calculateStructureScore(input: SEOScoreInput): {
  score: number
  recommendations: SEORecommendation[]
  issues: SEOIssue[]
} {
  const recommendations: SEORecommendation[] = []
  const issues: SEOIssue[] = []

  try {
    const structureValidation = validateContentStructure(input.content)
    
    if (structureValidation.isValid) {
      return { score: 100, recommendations, issues }
    }

    let score = Math.max(0, 100 - (structureValidation.issues.length * 15))
    
    structureValidation.issues.forEach(issue => {
      recommendations.push({
        type: 'structure',
        priority: 'high',
        description: issue,
        action: 'Fix heading structure and hierarchy',
        impact: 20
      })
      
      issues.push({
        type: 'warning',
        category: 'structure',
        message: `Structure issue: ${issue}`,
        suggestion: 'Ensure proper H1-H6 heading hierarchy'
      })
    })

    return { score: Math.round(score), recommendations, issues }
  } catch (error) {
    return { 
      score: 0, 
      recommendations: [{
        type: 'structure',
        priority: 'high',
        description: 'Structure validation failed',
        action: 'Check content format',
        impact: 0
      }],
      issues: [{
        type: 'error',
        category: 'structure',
        message: 'Structure validation failed',
        suggestion: 'Verify content format and try again'
      }]
    }
  }
}

/**
 * Calculate semantic coverage score
 */
function calculateSemanticCoverageScore(input: SEOScoreInput): {
  score: number
  recommendations: SEORecommendation[]
  issues: SEOIssue[]
} {
  const recommendations: SEORecommendation[] = []
  const issues: SEOIssue[] = []

  try {
    const semanticKeywords = input.secondaryKeywords || []
    const contentLower = input.content.toLowerCase()
    
    let foundSemanticCount = 0
    const foundKeywords: string[] = []
    
    if (semanticKeywords && Array.isArray(semanticKeywords)) {
      semanticKeywords.forEach(keyword => {
        if (keyword && contentLower.includes(keyword.toLowerCase())) {
          foundSemanticCount++
          foundKeywords.push(keyword)
        }
      })
    }
    
    const coveragePercentage = semanticKeywords.length > 0 ? (foundSemanticCount / semanticKeywords.length) * 100 : 0
    let score = coveragePercentage
    
    if (coveragePercentage < 50) {
      recommendations.push({
        type: 'semantic',
        priority: 'medium',
        description: `Low semantic keyword coverage (${coveragePercentage.toFixed(1)}%)`,
        action: `Include more semantic keywords: ${semanticKeywords.filter(k => !foundKeywords.includes(k)).slice(0, 3).join(', ')}`,
        impact: 15
      })
      
      issues.push({
        type: 'info',
        category: 'semantic',
        message: `Only ${foundSemanticCount}/${semanticKeywords.length} semantic keywords found`,
        suggestion: 'Add more semantic variations to improve topical authority'
      })
    }

    return { score: Math.round(score), recommendations, issues }
  } catch (error) {
    return { 
      score: 0, 
      recommendations: [{
        type: 'semantic',
        priority: 'medium',
        description: 'Semantic coverage calculation failed',
        action: 'Check keyword lists',
        impact: 0
      }],
      issues: [{
        type: 'error',
        category: 'semantic',
        message: 'Semantic coverage calculation failed',
        suggestion: 'Verify keyword lists and try again'
      }]
    }
  }
}

/**
 * Calculate content length score
 */
function calculateContentLengthScore(input: SEOScoreInput): {
  score: number
  recommendations: SEORecommendation[]
  issues: SEOIssue[]
} {
  const recommendations: SEORecommendation[] = []
  const issues: SEOIssue[] = []

  try {
    const wordCount = input.content.split(/\s+/).filter(w => w.length > 0).length
    const targetCount = input.targetWordCount || 300
    
    let score = 100
    
    if (wordCount < targetCount * 0.8) {
      score = Math.max(0, (wordCount / (targetCount * 0.8)) * 100)
      recommendations.push({
        type: 'length',
        priority: 'medium',
        description: `Content is too short (${wordCount} words vs ${targetCount} target)`,
        action: `Add ${targetCount - wordCount} more words to reach optimal length`,
        impact: 10
      })
      
      issues.push({
        type: 'info',
        category: 'length',
        message: `Content length is ${wordCount} words (target: ${targetCount})`,
        suggestion: 'Expand content to provide more comprehensive coverage'
      })
    } else if (wordCount > targetCount * 1.5) {
      score = Math.max(0, 100 - ((wordCount - (targetCount * 1.5)) / (targetCount * 0.5)) * 100)
      recommendations.push({
        type: 'length',
        priority: 'low',
        description: `Content is quite long (${wordCount} words vs ${targetCount} target)`,
        action: 'Consider condensing content for better readability',
        impact: 5
      })
    }

    return { score: Math.round(score), recommendations, issues }
  } catch (error) {
    return { 
      score: 0, 
      recommendations: [{
        type: 'length',
        priority: 'low',
        description: 'Content length calculation failed',
        action: 'Check content format',
        impact: 0
      }],
      issues: [{
        type: 'error',
        category: 'length',
        message: 'Content length calculation failed',
        suggestion: 'Verify content format and try again'
      }]
    }
  }
}

/**
 * Calculate meta optimization score
 */
function calculateMetaOptimizationScore(input: SEOScoreInput): {
  score: number
  recommendations: SEORecommendation[]
  issues: SEOIssue[]
} {
  const recommendations: SEORecommendation[] = []
  const issues: SEOIssue[] = []

  try {
    let score = 100
    
    // Check for title tag optimization (simulated)
    const hasTitle = input.content.includes('#') || input.content.split('\n')[0].length > 0
    if (!hasTitle) {
      score -= 30
      recommendations.push({
        type: 'meta',
        priority: 'high',
        description: 'Missing title or heading',
        action: 'Add a clear title or H1 heading',
        impact: 25
      })
      
      issues.push({
        type: 'error',
        category: 'meta',
        message: 'No title or heading found',
        suggestion: 'Add a descriptive title for SEO'
      })
    }

    // Check for meta description simulation (first paragraph)
    const firstParagraph = input.content.split('\n\n')[0]
    const firstParagraphLength = firstParagraph.length
    
    if (firstParagraphLength < 100 || firstParagraphLength > 160) {
      score -= 20
      recommendations.push({
        type: 'meta',
        priority: 'medium',
        description: `First paragraph length ${firstParagraphLength} chars (optimal: 100-160)`,
        action: 'Adjust first paragraph to be between 100-160 characters',
        impact: 15
      })
      
      issues.push({
        type: 'info',
        category: 'meta',
        message: `First paragraph length: ${firstParagraphLength} characters`,
        suggestion: 'Optimize first paragraph for meta description length'
      })
    }

    return { score: Math.max(0, Math.round(score)), recommendations, issues }
  } catch (error) {
    return { 
      score: 0, 
      recommendations: [{
        type: 'meta',
        priority: 'medium',
        description: 'Meta optimization calculation failed',
        action: 'Check content format',
        impact: 0
      }],
      issues: [{
        type: 'error',
        category: 'meta',
        message: 'Meta optimization calculation failed',
        suggestion: 'Verify content format and try again'
      }]
    }
  }
}

/**
 * Extract SEO metrics from content
 */
function extractSEOMetrics(input: SEOScoreInput): SEOMetrics {
  try {
    const wordCount = input.content.split(/\s+/).filter(w => w.length > 0).length
    const keywordCount = (input.content.toLowerCase().match(new RegExp(input.primaryKeyword.toLowerCase(), 'g')) || []).length
    const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0
    const readabilityScore = calculateReadabilityScore(input.content)
    
    const semanticKeywordCount = input.secondaryKeywords?.filter(keyword => 
      keyword && input.content.toLowerCase().includes(keyword.toLowerCase())
    ).length || 0
    
    const headingCount = (input.content.match(/^#{1,6}\s+/gm) || []).length
    const linkCount = (input.content.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length
    const imageCount = (input.content.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length

    return {
      wordCount,
      keywordDensity: Math.round(keywordDensity * 100) / 100,
      readabilityScore,
      semanticKeywordCount,
      headingCount,
      linkCount,
      imageCount
    }
  } catch (error) {
    return {
      wordCount: 0,
      keywordDensity: 0,
      readabilityScore: 0,
      semanticKeywordCount: 0,
      headingCount: 0,
      linkCount: 0,
      imageCount: 0
    }
  }
}
