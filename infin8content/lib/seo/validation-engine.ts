// SEO Validation Engine
// Story 14.6: SEO Testing and Validation
// Task 2: Automated Validation Framework

import { calculateSEOScore, type SEOScoreInput, type SEOIssue } from './seo-scoring'
import { calculateReadabilityScore, validateContentStructure } from '@/lib/services/article-generation/section-processor'

export interface ValidationRule {
  id: string
  name: string
  description: string
  category: 'keyword' | 'readability' | 'structure' | 'meta' | 'performance' | 'semantic' | 'length'
  severity: 'error' | 'warning' | 'info'
  validate: (input: ValidationInput) => ValidationResult
}

export interface ValidationInput {
  content: string
  primaryKeyword: string
  secondaryKeywords: string[]
  targetWordCount: number
  contentType: string
  options?: ValidationOptions
}

export interface ValidationOptions {
  strictMode?: boolean
  skipPerformanceTests?: boolean
  customRules?: ValidationRule[]
}

export interface ValidationResult {
  passed: boolean
  score: number
  issues: SEOIssue[]
  recommendations: ValidationRecommendation[]
  metrics: ValidationMetrics
}

export interface ValidationRecommendation {
  ruleId: string
  type: 'fix' | 'improve' | 'consider'
  priority: 'high' | 'medium' | 'low'
  message: string
  action: string
  expectedValue?: any
  actualValue?: any
}

export interface ValidationMetrics {
  totalRules: number
  passedRules: number
  failedRules: number
  errorCount: number
  warningCount: number
  infoCount: number
  validationTime: number
}

/**
 * Main validation engine that runs all SEO validation checks
 */
export function validateSEOContent(input: ValidationInput): ValidationResult {
  const startTime = performance.now()
  
  try {
    // Get all validation rules
    const rules = getValidationRules(input.options)
    
    // Run all validations
    const results: Array<{ rule: ValidationRule; result: ValidationResult }> = []
    
    for (const rule of rules) {
      try {
        const result = rule.validate(input)
        results.push({ rule, result })
      } catch (error) {
        results.push({
          rule,
          result: {
            passed: false,
            score: 0,
            issues: [{
              type: 'error',
              category: rule.category,
              message: `Validation rule ${rule.name} failed to execute`,
              suggestion: 'Check input format and try again'
            }],
            recommendations: [],
            metrics: {
              totalRules: 1,
              passedRules: 0,
              failedRules: 1,
              errorCount: 1,
              warningCount: 0,
              infoCount: 0,
              validationTime: 0
            }
          }
        })
      }
    }
    
    // Aggregate results
    const allIssues = results.flatMap(r => r.result.issues)
    const allRecommendations = results.flatMap(r => r.result.recommendations)
    const totalScore = results.reduce((sum, r) => sum + r.result.score, 0) / results.length
    
    const passedRules = results.filter(r => r.result.passed).length
    const failedRules = results.length - passedRules
    
    const errorCount = allIssues.filter(i => i.type === 'error').length
    const warningCount = allIssues.filter(i => i.type === 'warning').length
    const infoCount = allIssues.filter(i => i.type === 'info').length
    
    const endTime = performance.now()
    const validationTime = Math.round((endTime - startTime) * 100) / 100
    
    
    return {
      passed: failedRules === 0,
      score: Math.round(totalScore),
      issues: allIssues,
      recommendations: allRecommendations,
      metrics: {
        totalRules: results.length,
        passedRules,
        failedRules,
        errorCount,
        warningCount,
        infoCount,
        validationTime
      }
    }
  } catch (error) {
    
    return {
      passed: false,
      score: 0,
      issues: [{
        type: 'error',
        category: 'keyword',
        message: `Validation engine failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Please check your input and try again'
      }],
      recommendations: [],
      metrics: {
        totalRules: 0,
        passedRules: 0,
        failedRules: 0,
        errorCount: 1,
        warningCount: 0,
        infoCount: 0,
        validationTime: 0
      }
    }
  }
}

/**
 * Get all validation rules based on options
 */
function getValidationRules(options?: ValidationOptions): ValidationRule[] {
  const baseRules: ValidationRule[] = [
    // Keyword validation rules
    {
      id: 'keyword-density-primary',
      name: 'Primary Keyword Density',
      description: 'Ensures primary keyword density is between 1-2%',
      category: 'keyword',
      severity: 'error',
      validate: validateKeywordDensity
    },
    {
      id: 'keyword-placement',
      name: 'Keyword Placement',
      description: 'Checks strategic keyword placement in content',
      category: 'keyword',
      severity: 'warning',
      validate: validateKeywordPlacement
    },
    {
      id: 'keyword-semantic-coverage',
      name: 'Semantic Keyword Coverage',
      description: 'Validates semantic keyword usage',
      category: 'keyword',
      severity: 'info',
      validate: validateSemanticCoverage
    },
    
    // Readability validation rules
    {
      id: 'readability-grade',
      name: 'Readability Grade Level',
      description: 'Ensures content is readable (Grade 10-12)',
      category: 'readability',
      severity: 'warning',
      validate: validateReadabilityGrade
    },
    {
      id: 'readability-sentence-length',
      name: 'Sentence Length',
      description: 'Checks for excessively long sentences',
      category: 'readability',
      severity: 'info',
      validate: validateSentenceLength
    },
    
    // Structure validation rules
    {
      id: 'structure-heading-hierarchy',
      name: 'Heading Hierarchy',
      description: 'Validates proper H1-H6 heading structure',
      category: 'structure',
      severity: 'error',
      validate: validateHeadingHierarchy
    },
    {
      id: 'structure-content-flow',
      name: 'Content Flow',
      description: 'Checks logical content progression',
      category: 'structure',
      severity: 'info',
      validate: validateContentFlow
    },
    
    // Meta validation rules
    {
      id: 'meta-title-length',
      name: 'Title Length',
      description: 'Validates title length (50-60 characters)',
      category: 'meta',
      severity: 'warning',
      validate: validateTitleLength
    },
    {
      id: 'meta-description-length',
      name: 'Meta Description Length',
      description: 'Validates meta description length (150-160 characters)',
      category: 'meta',
      severity: 'warning',
      validate: validateMetaDescriptionLength
    },
    {
      id: 'meta-alt-text',
      name: 'Image Alt Text',
      description: 'Checks for missing image alt text',
      category: 'meta',
      severity: 'info',
      validate: validateImageAltText
    },
    
    // Performance validation rules
    {
      id: 'performance-content-length',
      name: 'Content Length',
      description: 'Validates content is not too short or too long',
      category: 'performance',
      severity: 'warning',
      validate: validateContentLength
    },
    {
      id: 'performance-internal-links',
      name: 'Internal Linking',
      description: 'Checks for internal linking opportunities',
      category: 'performance',
      severity: 'info',
      validate: validateInternalLinks
    }
  ]
  
  // Add custom rules if provided
  if (options?.customRules) {
    baseRules.push(...options.customRules)
  }
  
  // Filter rules based on options
  if (options?.skipPerformanceTests) {
    return baseRules.filter(rule => rule.category !== 'performance')
  }
  
  return baseRules
}

// Individual validation rule implementations

function validateKeywordDensity(input: ValidationInput): ValidationResult {
  // Input validation
  if (!input.content || typeof input.content !== 'string' || !input.primaryKeyword || typeof input.primaryKeyword !== 'string') {
    return {
      passed: false,
      score: 0,
      issues: [{
        type: 'error',
        category: 'keyword',
        message: 'Invalid input: content and primary keyword are required',
        suggestion: 'Ensure both content and primary keyword are provided'
      }],
      recommendations: [],
      metrics: {
        totalRules: 1,
        passedRules: 0,
        failedRules: 1,
        errorCount: 1,
        warningCount: 0,
        infoCount: 0,
        validationTime: 0
      }
    }
  }

  const wordCount = input.content.split(/\s+/).filter(w => w.length > 0).length
  const keywordCount = (input.content.toLowerCase().match(new RegExp(input.primaryKeyword.toLowerCase(), 'g')) || []).length
  const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0
  
  const optimalMin = 1.0
  const optimalMax = 2.0
  
  const passed = density >= optimalMin && density <= optimalMax
  const score = passed ? 100 : Math.max(0, 100 - Math.abs(density - ((optimalMin + optimalMax) / 2)) * 50)
  
  const issues: SEOIssue[] = []
  const recommendations: ValidationRecommendation[] = []
  
  if (!passed) {
    if (density < optimalMin) {
      issues.push({
        type: 'error',
        category: 'keyword',
        message: `Keyword density too low: ${density.toFixed(2)}% (optimal: ${optimalMin}-${optimalMax}%)`,
        suggestion: `Add ${Math.ceil((optimalMin * wordCount / 100) - keywordCount)} more occurrences of "${input.primaryKeyword}"`
      })
      
      recommendations.push({
        ruleId: 'keyword-density-primary',
        type: 'fix',
        priority: 'high',
        message: `Increase keyword density from ${density.toFixed(2)}% to optimal range`,
        action: `Add ${Math.ceil((optimalMin * wordCount / 100) - keywordCount)} more occurrences of "${input.primaryKeyword}"`,
        expectedValue: `${optimalMin}-${optimalMax}%`,
        actualValue: `${density.toFixed(2)}%`
      })
    } else {
      issues.push({
        type: 'warning',
        category: 'keyword',
        message: `Keyword density too high: ${density.toFixed(2)}% (optimal: ${optimalMin}-${optimalMax}%)`,
        suggestion: `Reduce keyword usage to avoid stuffing penalties`
      })
      
      recommendations.push({
        ruleId: 'keyword-density-primary',
        type: 'improve',
        priority: 'medium',
        message: `Reduce keyword density to optimal range`,
        action: `Remove ${Math.ceil(keywordCount - (optimalMax * wordCount / 100))} occurrences of "${input.primaryKeyword}"`,
        expectedValue: `${optimalMin}-${optimalMax}%`,
        actualValue: `${density.toFixed(2)}%`
      })
    }
  }
  
  return {
    passed,
    score,
    issues,
    recommendations,
    metrics: {
      totalRules: 1,
      passedRules: passed ? 1 : 0,
      failedRules: passed ? 0 : 1,
      errorCount: issues.filter(i => i.type === 'error').length,
      warningCount: issues.filter(i => i.type === 'warning').length,
      infoCount: issues.filter(i => i.type === 'info').length,
      validationTime: 0
    }
  }
}

function validateKeywordPlacement(input: ValidationInput): ValidationResult {
  // Input validation
  if (!input.content || typeof input.content !== 'string' || !input.primaryKeyword || typeof input.primaryKeyword !== 'string') {
    return {
      passed: false,
      score: 0,
      issues: [{
        type: 'error',
        category: 'keyword',
        message: 'Invalid input: content and primary keyword are required',
        suggestion: 'Ensure both content and primary keyword are provided'
      }],
      recommendations: [],
      metrics: {
        totalRules: 1,
        passedRules: 0,
        failedRules: 1,
        errorCount: 1,
        warningCount: 0,
        infoCount: 0,
        validationTime: 0
      }
    }
  }

  const content = input.content
  const keyword = input.primaryKeyword.toLowerCase()
  const contentLower = content.toLowerCase()
  
  const first100Words = contentLower.split(/\s+/).slice(0, 100).join(' ')
  const hasKeywordInFirst100 = first100Words.includes(keyword)
  
  const headings = content.match(/^#{1,6}\s+(.+)$/gm) || []
  const hasKeywordInHeading = headings.some(heading => heading.toLowerCase().includes(keyword))
  
  const passed = hasKeywordInFirst100 && hasKeywordInHeading
  const score = (hasKeywordInFirst100 ? 50 : 0) + (hasKeywordInHeading ? 50 : 0)
  
  const issues: SEOIssue[] = []
  const recommendations: ValidationRecommendation[] = []
  
  if (!hasKeywordInFirst100) {
    issues.push({
      type: 'warning',
      category: 'keyword',
      message: 'Primary keyword not found in first 100 words',
      suggestion: 'Include keyword early in content for better SEO'
    })
    
    recommendations.push({
      ruleId: 'keyword-placement',
      type: 'improve',
      priority: 'high',
      message: 'Add keyword to first 100 words',
      action: `Include "${input.primaryKeyword}" in the first paragraph`,
      expectedValue: 'Keyword in first 100 words',
      actualValue: 'Keyword not in first 100 words'
    })
  }
  
  if (!hasKeywordInHeading) {
    issues.push({
      type: 'info',
      category: 'keyword',
      message: 'Primary keyword not found in any heading',
      suggestion: 'Include keyword in at least one heading for better structure'
    })
    
    recommendations.push({
      ruleId: 'keyword-placement',
      type: 'consider',
      priority: 'medium',
      message: 'Add keyword to heading',
      action: `Include "${input.primaryKeyword}" in an H2 or H3 heading`,
      expectedValue: 'Keyword in heading',
      actualValue: 'Keyword not in headings'
    })
  }
  
  return {
    passed,
    score,
    issues,
    recommendations,
    metrics: {
      totalRules: 1,
      passedRules: passed ? 1 : 0,
      failedRules: passed ? 0 : 1,
      errorCount: 0,
      warningCount: issues.filter(i => i.type === 'warning').length,
      infoCount: issues.filter(i => i.type === 'info').length,
      validationTime: 0
    }
  }
}

function validateSemanticCoverage(input: ValidationInput): ValidationResult {
  // Input validation
  if (!input.content || typeof input.content !== 'string') {
    return {
      passed: false,
      score: 0,
      issues: [{
        type: 'error',
        category: 'keyword',
        message: 'Invalid input: content is required',
        suggestion: 'Ensure content is provided'
      }],
      recommendations: [],
      metrics: {
        totalRules: 1,
        passedRules: 0,
        failedRules: 1,
        errorCount: 1,
        warningCount: 0,
        infoCount: 0,
        validationTime: 0
      }
    }
  }

  const semanticKeywords = input.secondaryKeywords || []
  const contentLower = input.content.toLowerCase()
  
  const foundKeywords = semanticKeywords.filter(keyword => 
    contentLower.includes(keyword.toLowerCase())
  )
  
  const coveragePercentage = semanticKeywords.length > 0 ? (foundKeywords.length / semanticKeywords.length) * 100 : 100
  const passed = coveragePercentage >= 50
  const score = coveragePercentage
  
  const issues: SEOIssue[] = []
  const recommendations: ValidationRecommendation[] = []
  
  if (!passed) {
    const missingKeywords = semanticKeywords.filter(keyword => 
      !contentLower.includes(keyword.toLowerCase())
    )
    
    issues.push({
      type: 'info',
      category: 'keyword',
      message: `Low semantic coverage: ${foundKeywords.length}/${semanticKeywords.length} keywords found`,
      suggestion: 'Include more semantic keywords for better topical authority'
    })
    
    recommendations.push({
      ruleId: 'keyword-semantic-coverage',
      type: 'improve',
      priority: 'medium',
      message: 'Increase semantic keyword coverage',
      action: `Add these keywords: ${missingKeywords.slice(0, 3).join(', ')}`,
      expectedValue: '50%+ coverage',
      actualValue: `${coveragePercentage.toFixed(1)}% coverage`
    })
  }
  
  return {
    passed,
    score,
    issues,
    recommendations,
    metrics: {
      totalRules: 1,
      passedRules: passed ? 1 : 0,
      failedRules: passed ? 0 : 1,
      errorCount: 0,
      warningCount: 0,
      infoCount: issues.filter(i => i.type === 'info').length,
      validationTime: 0
    }
  }
}

function validateReadabilityGrade(input: ValidationInput): ValidationResult {
  try {
    const readabilityScore = calculateReadabilityScore(input.content)
    const optimalMin = 10
    const optimalMax = 12
    
    const passed = readabilityScore >= optimalMin && readabilityScore <= optimalMax
    const score = passed ? 100 : Math.max(0, 100 - Math.abs(readabilityScore - ((optimalMin + optimalMax) / 2)) * 20)
    
    const issues: SEOIssue[] = []
    const recommendations: ValidationRecommendation[] = []
    
    if (!passed) {
      if (readabilityScore < optimalMin) {
        issues.push({
          type: 'warning',
          category: 'readability',
          message: `Content too simple: Grade ${readabilityScore} (optimal: ${optimalMin}-${optimalMax})`,
          suggestion: 'Use more complex sentences and vocabulary'
        })
        
        recommendations.push({
          ruleId: 'readability-grade',
          type: 'improve',
          priority: 'medium',
          message: 'Increase content complexity',
          action: 'Use more sophisticated language and sentence structures',
          expectedValue: `Grade ${optimalMin}-${optimalMax}`,
          actualValue: `Grade ${readabilityScore}`
        })
      } else {
        issues.push({
          type: 'warning',
          category: 'readability',
          message: `Content too complex: Grade ${readabilityScore} (optimal: ${optimalMin}-${optimalMax})`,
          suggestion: 'Simplify content for better readability'
        })
        
        recommendations.push({
          ruleId: 'readability-grade',
          type: 'improve',
          priority: 'high',
          message: 'Simplify content complexity',
          action: 'Use shorter sentences and more common vocabulary',
          expectedValue: `Grade ${optimalMin}-${optimalMax}`,
          actualValue: `Grade ${readabilityScore}`
        })
      }
    }

    return { 
      score: Math.round(score), 
      recommendations, 
      issues,
      passed,
      metrics: {
        totalRules: 1,
        passedRules: passed ? 1 : 0,
        failedRules: passed ? 0 : 1,
        errorCount: 0,
        warningCount: issues.filter(i => i.type === 'warning').length,
        infoCount: issues.filter(i => i.type === 'info').length,
        validationTime: 0
      }
    }
  } catch (error) {
    return { 
      score: 0, 
      recommendations: [{
        ruleId: 'readability-grade',
        type: 'improve',
        priority: 'high',
        message: 'Readability calculation failed',
        action: 'Check content format',
        expectedValue: 'Valid readability score',
        actualValue: 'Error'
      }],
      issues: [{
        type: 'error',
        category: 'readability',
        message: 'Readability calculation failed',
        suggestion: 'Verify content format and try again'
      }],
      passed: false,
      metrics: {
        totalRules: 1,
        passedRules: 0,
        failedRules: 1,
        errorCount: 1,
        warningCount: 0,
        infoCount: 0,
        validationTime: 0
      }
    }
  }
}

function validateSentenceLength(input: ValidationInput): ValidationResult {
  const sentences = input.content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 25)
  
  const passed = longSentences.length === 0
  const score = Math.max(0, 100 - (longSentences.length * 10))
  
  const issues: SEOIssue[] = []
  const recommendations: ValidationRecommendation[] = []
  
  if (longSentences.length > 0) {
    issues.push({
      type: 'info',
      category: 'readability',
      message: `Found ${longSentences.length} sentences longer than 25 words`,
      suggestion: 'Break long sentences for better readability'
    })
    
    recommendations.push({
      ruleId: 'readability-sentence-length',
      type: 'consider',
      priority: 'low',
      message: 'Break up long sentences',
      action: 'Split sentences longer than 25 words into shorter ones',
      expectedValue: 'No sentences > 25 words',
      actualValue: `${longSentences.length} long sentences`
    })
  }
  
  return {
    passed,
    score,
    issues,
    recommendations,
    metrics: {
      totalRules: 1,
      passedRules: passed ? 1 : 0,
      failedRules: passed ? 0 : 1,
      errorCount: 0,
      warningCount: 0,
      infoCount: issues.filter(i => i.type === 'info').length,
      validationTime: 0
    }
  }
}

function validateHeadingHierarchy(input: ValidationInput): ValidationResult {
  try {
    const structureValidation = validateContentStructure(input.content)
    const passed = structureValidation.isValid
    const score = passed ? 100 : Math.max(0, 100 - (structureValidation.issues.length * 20))
    
    const issues: SEOIssue[] = []
    const recommendations: ValidationRecommendation[] = []
    
    if (!passed) {
      structureValidation.issues.forEach((issue: string) => {
        issues.push({
          type: 'error',
          category: 'structure',
          message: `Structure issue: ${issue}`,
          suggestion: 'Fix heading hierarchy and structure'
        })
      })
      
      recommendations.push({
        ruleId: 'structure-heading-hierarchy',
        type: 'fix',
        priority: 'high',
        message: 'Fix heading structure issues',
        action: 'Ensure proper H1-H6 heading hierarchy without skipped levels',
        expectedValue: 'Valid heading hierarchy',
        actualValue: structureValidation.issues.join('; ')
      })
    }

    return { 
      score: Math.round(score), 
      recommendations, 
      issues,
      passed,
      metrics: {
        totalRules: 1,
        passedRules: passed ? 1 : 0,
        failedRules: passed ? 0 : 1,
        errorCount: issues.filter(i => i.type === 'error').length,
        warningCount: issues.filter(i => i.type === 'warning').length,
        infoCount: issues.filter(i => i.type === 'info').length,
        validationTime: 0
      }
    }
  } catch (error) {
    return { 
      score: 0, 
      recommendations: [{
        ruleId: 'structure-heading-hierarchy',
        type: 'fix',
        priority: 'high',
        message: 'Structure validation failed',
        action: 'Check content format',
        expectedValue: 'Valid heading structure',
        actualValue: 'Error'
      }],
      issues: [{
        type: 'error',
        category: 'structure',
        message: 'Structure validation failed',
        suggestion: 'Verify content format and try again'
      }],
      passed: false,
      metrics: {
        totalRules: 1,
        passedRules: 0,
        failedRules: 1,
        errorCount: 1,
        warningCount: 0,
        infoCount: 0,
        validationTime: 0
      }
    }
  }
}

function validateContentFlow(input: ValidationInput): ValidationResult {
  const paragraphs = input.content.split('\n\n').filter(p => p.trim().length > 0)
  const hasGoodFlow = paragraphs.length >= 3 // At least intro, body, conclusion
  
  const passed = hasGoodFlow
  const score = hasGoodFlow ? 100 : 70
  
  const issues: SEOIssue[] = []
  const recommendations: ValidationRecommendation[] = []
  
  if (!hasGoodFlow) {
    issues.push({
      type: 'info',
      category: 'structure',
      message: `Content has only ${paragraphs.length} paragraphs (optimal: 3+)`,
      suggestion: 'Structure content with clear introduction, body, and conclusion'
    })
    
    recommendations.push({
      ruleId: 'structure-content-flow',
      type: 'consider',
      priority: 'low',
      message: 'Improve content structure',
      action: 'Add clear paragraphs for introduction, body, and conclusion',
      expectedValue: '3+ paragraphs',
      actualValue: `${paragraphs.length} paragraphs`
    })
  }
  
  return {
    passed,
    score,
    issues,
    recommendations,
    metrics: {
      totalRules: 1,
      passedRules: passed ? 1 : 0,
      failedRules: passed ? 0 : 1,
      errorCount: 0,
      warningCount: 0,
      infoCount: issues.filter(i => i.type === 'info').length,
      validationTime: 0
    }
  }
}

function validateTitleLength(input: ValidationInput): ValidationResult {
  const firstLine = input.content.split('\n')[0].trim()
  const titleLength = firstLine.length
  
  const optimalMin = 50
  const optimalMax = 60
  
  const passed = titleLength >= optimalMin && titleLength <= optimalMax
  const score = passed ? 100 : Math.max(0, 100 - Math.abs(titleLength - ((optimalMin + optimalMax) / 2)) * 2)
  
  const issues: SEOIssue[] = []
  const recommendations: ValidationRecommendation[] = []
  
  if (!passed && titleLength > 0) {
    if (titleLength < optimalMin) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: `Title too short: ${titleLength} characters (optimal: ${optimalMin}-${optimalMax})`,
        suggestion: 'Expand title for better SEO'
      })
      
      recommendations.push({
        ruleId: 'meta-title-length',
        type: 'improve',
        priority: 'medium',
        message: 'Expand title length',
        action: 'Add more descriptive words to the title',
        expectedValue: `${optimalMin}-${optimalMax} characters`,
        actualValue: `${titleLength} characters`
      })
    } else {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: `Title too long: ${titleLength} characters (optimal: ${optimalMin}-${optimalMax})`,
        suggestion: 'Shorten title for better display in search results'
      })
      
      recommendations.push({
        ruleId: 'meta-title-length',
        type: 'improve',
        priority: 'medium',
        message: 'Shorten title length',
        action: 'Remove unnecessary words from the title',
        expectedValue: `${optimalMin}-${optimalMax} characters`,
        actualValue: `${titleLength} characters`
      })
    }
  }
  
  return {
    passed,
    score,
    issues,
    recommendations,
    metrics: {
      totalRules: 1,
      passedRules: passed ? 1 : 0,
      failedRules: passed ? 0 : 1,
      errorCount: 0,
      warningCount: issues.filter(i => i.type === 'warning').length,
      infoCount: 0,
      validationTime: 0
    }
  }
}

function validateMetaDescriptionLength(input: ValidationInput): ValidationResult {
  const firstParagraph = input.content.split('\n\n')[0].trim()
  const descriptionLength = firstParagraph.length
  
  const optimalMin = 150
  const optimalMax = 160
  
  const passed = descriptionLength >= optimalMin && descriptionLength <= optimalMax
  const score = passed ? 100 : Math.max(0, 100 - Math.abs(descriptionLength - ((optimalMin + optimalMax) / 2)) * 2)
  
  const issues: SEOIssue[] = []
  const recommendations: ValidationRecommendation[] = []
  
  if (!passed) {
    if (descriptionLength < optimalMin) {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: `First paragraph too short: ${descriptionLength} characters (optimal: ${optimalMin}-${optimalMax})`,
        suggestion: 'Expand first paragraph for better meta description'
      })
      
      recommendations.push({
        ruleId: 'meta-description-length',
        type: 'improve',
        priority: 'medium',
        message: 'Expand meta description length',
        action: 'Add more detail to the first paragraph',
        expectedValue: `${optimalMin}-${optimalMax} characters`,
        actualValue: `${descriptionLength} characters`
      })
    } else {
      issues.push({
        type: 'warning',
        category: 'meta',
        message: `First paragraph too long: ${descriptionLength} characters (optimal: ${optimalMin}-${optimalMax})`,
        suggestion: 'Shorten first paragraph for better meta description'
      })
      
      recommendations.push({
        ruleId: 'meta-description-length',
        type: 'improve',
        priority: 'medium',
        message: 'Shorten meta description length',
        action: 'Condense the first paragraph',
        expectedValue: `${optimalMin}-${optimalMax} characters`,
        actualValue: `${descriptionLength} characters`
      })
    }
  }
  
  return {
    passed,
    score,
    issues,
    recommendations,
    metrics: {
      totalRules: 1,
      passedRules: passed ? 1 : 0,
      failedRules: passed ? 0 : 1,
      errorCount: 0,
      warningCount: issues.filter(i => i.type === 'warning').length,
      infoCount: 0,
      validationTime: 0
    }
  }
}

function validateImageAltText(input: ValidationInput): ValidationResult {
  const images = input.content.match(/!\[([^\]]*)\]\([^)]+\)/g) || []
  const imagesWithoutAlt = images.filter(img => {
    const altMatch = img.match(/!\[([^\]]*)\]/)
    return !altMatch || altMatch[1].trim() === ''
  })
  
  const passed = imagesWithoutAlt.length === 0
  const score = images.length > 0 ? Math.max(0, 100 - (imagesWithoutAlt.length * 20)) : 100
  
  const issues: SEOIssue[] = []
  const recommendations: ValidationRecommendation[] = []
  
  if (imagesWithoutAlt.length > 0) {
    issues.push({
      type: 'info',
      category: 'meta',
      message: `${imagesWithoutAlt.length} images missing alt text`,
      suggestion: 'Add descriptive alt text to all images'
    })
    
    recommendations.push({
      ruleId: 'meta-alt-text',
      type: 'consider',
      priority: 'low',
      message: 'Add image alt text',
      action: 'Add descriptive alt text to improve accessibility and SEO',
      expectedValue: 'All images have alt text',
      actualValue: `${imagesWithoutAlt.length} images missing alt text`
    })
  }
  
  return {
    passed,
    score,
    issues,
    recommendations,
    metrics: {
      totalRules: 1,
      passedRules: passed ? 1 : 0,
      failedRules: passed ? 0 : 1,
      errorCount: 0,
      warningCount: 0,
      infoCount: issues.filter(i => i.type === 'info').length,
      validationTime: 0
    }
  }
}

function validateContentLength(input: ValidationInput): ValidationResult {
  // Input validation
  if (!input.content || typeof input.content !== 'string') {
    return {
      passed: false,
      score: 0,
      issues: [{
        type: 'error',
        category: 'performance',
        message: 'Invalid input: content is required',
        suggestion: 'Ensure content is provided'
      }],
      recommendations: [],
      metrics: {
        totalRules: 1,
        passedRules: 0,
        failedRules: 1,
        errorCount: 1,
        warningCount: 0,
        infoCount: 0,
        validationTime: 0
      }
    }
  }

  const wordCount = input.content.split(/\s+/).filter(w => w.length > 0).length
  const targetWordCount = input.targetWordCount || 300
  
  const minLength = targetWordCount * 0.8
  const maxLength = targetWordCount * 1.5
  
  const passed = wordCount >= minLength && wordCount <= maxLength
  const score = passed ? 100 : Math.max(0, 100 - Math.abs(wordCount - targetWordCount) / targetWordCount * 100)
  
  const issues: SEOIssue[] = []
  const recommendations: ValidationRecommendation[] = []
  
  if (!passed) {
    if (wordCount < minLength) {
      issues.push({
        type: 'warning',
        category: 'performance',
        message: `Content too short: ${wordCount} words (target: ${targetWordCount})`,
        suggestion: 'Expand content to provide more comprehensive coverage'
      })
      
      recommendations.push({
        ruleId: 'performance-content-length',
        type: 'improve',
        priority: 'medium',
        message: 'Expand content length',
        action: `Add ${targetWordCount - wordCount} more words`,
        expectedValue: `${targetWordCount} words`,
        actualValue: `${wordCount} words`
      })
    } else {
      issues.push({
        type: 'info',
        category: 'performance',
        message: `Content quite long: ${wordCount} words (target: ${targetWordCount})`,
        suggestion: 'Consider condensing content for better readability'
      })
      
      recommendations.push({
        ruleId: 'performance-content-length',
        type: 'consider',
        priority: 'low',
        message: 'Consider condensing content',
        action: 'Review content for unnecessary repetition',
        expectedValue: `${targetWordCount} words`,
        actualValue: `${wordCount} words`
      })
    }
  }
  
  return {
    passed,
    score,
    issues,
    recommendations,
    metrics: {
      totalRules: 1,
      passedRules: passed ? 1 : 0,
      failedRules: passed ? 0 : 1,
      errorCount: 0,
      warningCount: issues.filter(i => i.type === 'warning').length,
      infoCount: issues.filter(i => i.type === 'info').length,
      validationTime: 0
    }
  }
}

function validateInternalLinks(input: ValidationInput): ValidationResult {
  // Input validation
  if (!input.content || typeof input.content !== 'string') {
    return {
      passed: false,
      score: 0,
      issues: [{
        type: 'error',
        category: 'performance',
        message: 'Invalid input: content is required',
        suggestion: 'Ensure content is provided'
      }],
      recommendations: [],
      metrics: {
        totalRules: 1,
        passedRules: 0,
        failedRules: 1,
        errorCount: 1,
        warningCount: 0,
        infoCount: 0,
        validationTime: 0
      }
    }
  }

  const links = input.content.match(/\[([^\]]+)\]\([^)]+\)/g) || []
  const internalLinks = links.filter(link => {
    const url = link.match(/\[([^\]]+)\]\(([^)]+)\)/)?.[2] || ''
    return !url.startsWith('http') && !url.startsWith('www')
  })
  
  const passed = internalLinks.length >= 1
  const score = passed ? 100 : Math.max(0, 100 - (1 * 25))
  
  const issues: SEOIssue[] = []
  const recommendations: ValidationRecommendation[] = []
  
  if (!passed) {
    issues.push({
      type: 'info',
      category: 'performance',
      message: 'No internal links found',
      suggestion: 'Add internal links to improve site structure and SEO'
    })
    
    recommendations.push({
      ruleId: 'performance-internal-links',
      type: 'consider',
      priority: 'low',
      message: 'Add internal links',
      action: 'Link to relevant internal content',
      expectedValue: '1+ internal links',
      actualValue: '0 internal links'
    })
  }
  
  return {
    passed,
    score,
    issues,
    recommendations,
    metrics: {
      totalRules: 1,
      passedRules: passed ? 1 : 0,
      failedRules: passed ? 0 : 1,
      errorCount: 0,
      warningCount: 0,
      infoCount: issues.filter(i => i.type === 'info').length,
      validationTime: 0
    }
  }
}
