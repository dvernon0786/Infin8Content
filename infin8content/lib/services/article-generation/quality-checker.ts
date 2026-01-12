// Quality Checker Functions
// Story 20.1: Prompt System Overhaul

import { checkKeywordDensity, validateSemanticKeywordCoverage, calculateReadabilityScore, validateContentStructure } from './seo-helpers'

export interface PromptQualityResult {
  hasEEATPrinciples: boolean
  eeatScore: number
  hasReadabilityTargets: boolean
  readabilityLevel?: string
  hasSemanticSEO: boolean
  semanticSEOScore: number
  missingElements: string[]
  isValid: boolean
  recommendations: string[]
}

export interface ContentQualityInput {
  title: string
  content: string
  keyword: string
  semanticKeywords: string[]
  targetAudience: string
}

export interface QualityCheckResult {
  overallScore: number
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  keywordDensity: ReturnType<typeof checkKeywordDensity>
  readability: ReturnType<typeof calculateReadabilityScore>
  semanticCoverage: ReturnType<typeof validateSemanticKeywordCoverage>
  structure: ReturnType<typeof validateContentStructure>
  recommendations: string[]
}

export interface TemplateValidationInput {
  type: string
  wordCount: number
  template: string
  seoRules: Record<string, any>
}

export interface TemplateQualityResult {
  meetsWordCountRequirements: boolean
  hasHookRequirement: boolean
  hasAuthorityBuilding: boolean
  hasSummary: boolean
  hasCallToAction: boolean
  hasQuestionFormat: boolean
  addressesCommonQuestions: boolean
  hasKeywordPlacement: boolean
  hasProperDensity: boolean
  isValid: boolean
  violations: string[]
  recommendations: string[]
}

/**
 * Validate system prompt quality for E-E-A-T principles and SEO requirements
 */
export function validatePromptQuality(systemPrompt: string): PromptQualityResult {
  const missingElements: string[] = []
  const recommendations: string[] = []
  
  // Check for E-E-A-T principles
  const eeatKeywords = ['expertise', 'experience', 'authority', 'trustworthiness', 'e-e-a-t']
  const eeatMatches = eeatKeywords.filter(keyword => 
    systemPrompt.toLowerCase().includes(keyword.toLowerCase())
  ).length
  
  const hasEEATPrinciples = eeatMatches >= 2
  const eeatScore = Math.round((eeatMatches / eeatKeywords.length) * 100)
  
  if (!hasEEATPrinciples) {
    missingElements.push('E-E-A-T principles')
    recommendations.push('Add explicit E-E-A-T (Expertise, Experience, Authority, Trustworthiness) principles')
  }
  
  // Check for readability targets
  const readabilityPatterns = [
    /grade\s*\d{1,2}/i,
    /readability\s*level/i,
    /grade\s*\d{1,2}\s*readability/i
  ]
  
  const hasReadabilityTargets = readabilityPatterns.some(pattern => pattern.test(systemPrompt))
  let readabilityLevel: string | undefined
  
  if (hasReadabilityTargets) {
    const match = systemPrompt.match(/grade\s*(\d{1,2})/i)
    if (match) {
      readabilityLevel = `Grade ${match[1]}`
    }
  } else {
    missingElements.push('Readability targets')
    recommendations.push('Specify target readability level (Grade 10-12 recommended)')
  }
  
  // Check for semantic SEO guidelines
  const semanticKeywords = [
    'semantic keywords',
    'lsi keywords',
    'topic clusters',
    'related terms',
    'semantic variations'
  ]
  
  const semanticMatches = semanticKeywords.filter(keyword =>
    systemPrompt.toLowerCase().includes(keyword.toLowerCase())
  ).length
  
  const hasSemanticSEO = semanticMatches >= 1
  const semanticSEOScore = Math.round((semanticMatches / semanticKeywords.length) * 100)
  
  if (!hasSemanticSEO) {
    missingElements.push('Semantic SEO guidelines')
    recommendations.push('Add semantic keyword and LSI keyword guidelines')
  }
  
  const isValid = hasEEATPrinciples && hasReadabilityTargets && hasSemanticSEO
  
  return {
    hasEEATPrinciples,
    eeatScore,
    hasReadabilityTargets,
    readabilityLevel,
    hasSemanticSEO,
    semanticSEOScore,
    missingElements,
    isValid,
    recommendations
  }
}

/**
 * Run comprehensive quality checks on generated content
 */
export function runQualityChecks(content: ContentQualityInput): QualityCheckResult {
  const recommendations: string[] = []
  
  // Run individual checks
  const keywordDensity = checkKeywordDensity(content.content, content.keyword, 'primary')
  const readability = calculateReadabilityScore(content.content)
  const semanticCoverage = validateSemanticKeywordCoverage(content.content, content.semanticKeywords)
  const structure = validateContentStructure(content.content)
  
  // Collect recommendations
  if (keywordDensity.recommendation) {
    recommendations.push(keywordDensity.recommendation)
  }
  
  if (readability.recommendation) {
    recommendations.push(readability.recommendation)
  }
  
  if (semanticCoverage.recommendation) {
    recommendations.push(semanticCoverage.recommendation)
  }
  
  if (structure.recommendation) {
    recommendations.push(structure.recommendation)
  }
  
  // Calculate overall score
  const scores = [
    keywordDensity.isValid ? 25 : 0,
    readability.isTargetGrade ? 25 : 0,
    semanticCoverage.isValid ? 25 : 0,
    structure.isValid ? 25 : 0
  ]
  
  const overallScore = scores.reduce((acc, score) => acc + score, 0)
  
  // Determine quality grade
  let qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  if (overallScore >= 90) qualityGrade = 'A'
  else if (overallScore >= 80) qualityGrade = 'B'
  else if (overallScore >= 70) qualityGrade = 'C'
  else if (overallScore >= 60) qualityGrade = 'D'
  else qualityGrade = 'F'
  
  return {
    overallScore,
    qualityGrade,
    keywordDensity,
    readability,
    semanticCoverage,
    structure,
    recommendations
  }
}

/**
 * Validate template quality against section-specific requirements
 */
export function validateTemplateQuality(template: TemplateValidationInput, sectionType: string): TemplateQualityResult {
  const violations: string[] = []
  const recommendations: string[] = []
  
  // Word count validation
  const wordCountRanges = {
    introduction: { min: 80, max: 150 },
    h2: { min: 200, max: 400 },
    h3: { min: 150, max: 300 },
    conclusion: { min: 100, max: 200 },
    faq: { min: 150, max: 250 }
  }
  
  const range = wordCountRanges[sectionType as keyof typeof wordCountRanges] || wordCountRanges.h2
  const meetsWordCountRequirements = template.wordCount >= range.min && template.wordCount <= range.max
  
  if (!meetsWordCountRequirements) {
    violations.push(`Word count below minimum (${range.min}-${range.max} words)`)
    recommendations.push(`Adjust word count to ${range.min}-${range.max} words`)
  }
  
  // Section-specific validations
  const hasHookRequirement = template.template.includes('{{hook}}') || template.template.toLowerCase().includes('hook')
  const hasAuthorityBuilding = template.template.toLowerCase().includes('authority') || template.template.toLowerCase().includes('expert')
  const hasSummary = template.template.toLowerCase().includes('summary') || template.template.includes('{{summary}}')
  const hasCallToAction = template.template.includes('{{call_to_action}}') || template.template.toLowerCase().includes('call to action')
  const hasQuestionFormat = template.template.toLowerCase().includes('question') || template.template.includes('{{question}}')
  const addressesCommonQuestions = template.template.toLowerCase().includes('common questions') || template.template.toLowerCase().includes('frequently asked')
  
  // SEO rules validation
  const hasKeywordPlacement = template.seoRules?.keywordPlacement !== undefined
  const hasProperDensity = template.seoRules?.densityTarget !== undefined && template.seoRules.densityTarget > 0
  
  // Section-specific requirement checks
  switch (sectionType) {
    case 'introduction':
      if (!hasHookRequirement) {
        violations.push('Missing hook requirement')
        recommendations.push('Add hook requirement to introduction template')
      }
      break
      
    case 'h2':
      if (!hasAuthorityBuilding) {
        violations.push('Missing authority building elements')
        recommendations.push('Add authority building guidance to H2 template')
      }
      break
      
    case 'conclusion':
      if (!hasSummary) {
        violations.push('Missing summary requirement')
        recommendations.push('Add summary requirement to conclusion template')
      }
      if (!hasCallToAction) {
        violations.push('Missing call-to-action requirement')
        recommendations.push('Add call-to-action requirement to conclusion template')
      }
      break
      
    case 'faq':
      if (!hasQuestionFormat) {
        violations.push('Missing question format')
        recommendations.push('Add question format to FAQ template')
      }
      if (!addressesCommonQuestions) {
        violations.push('Missing common questions guidance')
        recommendations.push('Add guidance for addressing common questions')
      }
      break
  }
  
  if (!hasKeywordPlacement) {
    violations.push('Missing keyword placement strategy')
    recommendations.push('Define keyword placement strategy in SEO rules')
  }
  
  if (!hasProperDensity) {
    violations.push('Missing or invalid density target')
    recommendations.push('Set proper keyword density target in SEO rules')
  }
  
  const isValid = violations.length === 0
  
  return {
    meetsWordCountRequirements,
    hasHookRequirement,
    hasAuthorityBuilding,
    hasSummary,
    hasCallToAction,
    hasQuestionFormat,
    addressesCommonQuestions,
    hasKeywordPlacement,
    hasProperDensity,
    isValid,
    violations,
    recommendations
  }
}
