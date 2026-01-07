/**
 * Content Quality Validation Utilities
 * Story 4a.5: LLM Content Generation with OpenRouter Integration
 */

export interface QualityMetrics {
  word_count: number
  citations_included: number
  readability_score: number
  keyword_density: number
  quality_passed: boolean
  quality_retry_count: number
}

export interface QualityValidationResult {
  passed: boolean
  metrics: QualityMetrics
  errors: string[]
}

/**
 * Calculate Flesch-Kincaid readability score
 * 
 * Formula: 206.835 - (1.015 × ASL) - (84.6 × ASW)
 * Where:
 * - ASL = Average Sentence Length (words per sentence)
 * - ASW = Average Syllables Per Word
 * 
 * Score ranges:
 * - 90-100: Very Easy
 * - 80-89: Easy
 * - 70-79: Fairly Easy
 * - 60-69: Standard
 * - 50-59: Fairly Difficult
 * - 30-49: Difficult
 * - 0-29: Very Difficult
 */
export function calculateReadability(content: string): number {
  // Remove markdown formatting for analysis
  const plainText = content
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links but keep text
    .replace(/#{1,6}\s+/g, '') // Remove heading markers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .trim()

  if (!plainText || plainText.length === 0) {
    return 0
  }

  // Split into sentences (simple approach)
  const sentences = plainText
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 0)

  if (sentences.length === 0) {
    return 0
  }

  // Split into words
  const words = plainText
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 0)

  if (words.length === 0) {
    return 0
  }

  // Calculate average sentence length
  const averageSentenceLength = words.length / sentences.length

  // Estimate syllables per word (simplified: count vowel groups)
  let totalSyllables = 0
  for (const word of words) {
    totalSyllables += estimateSyllables(word)
  }
  const averageSyllablesPerWord = totalSyllables / words.length

  // Calculate Flesch Reading Ease score
  const score = 206.835 - (1.015 * averageSentenceLength) - (84.6 * averageSyllablesPerWord)

  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10))
}

/**
 * Estimate syllables in a word (simplified approximation)
 */
function estimateSyllables(word: string): number {
  // Remove non-letters
  const cleanWord = word.replace(/[^a-z]/gi, '')
  
  if (cleanWord.length === 0) {
    return 1
  }

  // Count vowel groups (consecutive vowels count as one syllable)
  const vowelGroups = cleanWord.match(/[aeiouy]+/gi) || []
  let syllables = vowelGroups.length

  // Handle silent 'e' at end
  if (cleanWord.endsWith('e') && syllables > 1) {
    syllables--
  }

  // Minimum 1 syllable
  return Math.max(1, syllables)
}

/**
 * Count citations in content (markdown links)
 */
export function countCitations(content: string): number {
  // Match markdown links: [text](url)
  const citationRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const matches = content.match(citationRegex) || []
  return matches.length
}

/**
 * Validate citation formatting (proper markdown links)
 */
export function validateCitationFormatting(content: string): boolean {
  const citationRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const matches = content.match(citationRegex) || []
  
  // Check that all citations have valid URLs
  for (const match of matches) {
    const urlMatch = match.match(/\(([^)]+)\)/)
    if (!urlMatch || !urlMatch[1]) {
      return false
    }
    const url = urlMatch[1]
    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false
    }
  }
  
  return true
}

/**
 * Validate heading structure
 */
export function validateHeadingStructure(
  content: string,
  sectionType: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq'
): boolean {
  // Introduction and conclusion don't require headings
  if (sectionType === 'introduction' || sectionType === 'conclusion') {
    return true
  }

  // H2 sections should have H2 headings
  if (sectionType === 'h2') {
    return /^##\s+.+$/m.test(content)
  }

  // H3 sections should have H3 headings (and parent H2)
  if (sectionType === 'h3') {
    const hasH3 = /^###\s+.+$/m.test(content)
    // Note: We can't verify parent H2 from single section, so just check H3
    return hasH3
  }

  // FAQ sections should have headings
  if (sectionType === 'faq') {
    return /^#{1,3}\s+.+$/m.test(content)
  }

  return true
}

/**
 * Calculate keyword density
 */
export function calculateKeywordDensity(content: string, keyword: string): number {
  const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 0)
  if (words.length === 0) {
    return 0
  }

  const keywordLower = keyword.toLowerCase()
  const keywordMatches = words.filter(w => w.includes(keywordLower)).length
  
  return keywordMatches / words.length
}

/**
 * Validate keyword appears naturally (not keyword stuffing)
 */
export function validateKeywordNatural(content: string, keyword: string): boolean {
  const density = calculateKeywordDensity(content, keyword)
  
  // Keyword density should be between 0.5% and 3% for natural usage
  // Too low (< 0.5%) = keyword not used
  // Too high (> 3%) = keyword stuffing
  return density >= 0.005 && density <= 0.03
}

/**
 * Validate word count is within tolerance
 */
export function validateWordCount(
  content: string,
  targetWordCount: number,
  tolerancePercent: number = 0.1
): boolean {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length
  const variance = Math.abs(wordCount - targetWordCount) / targetWordCount
  return variance <= tolerancePercent
}

/**
 * Validate content quality
 */
export function validateContentQuality(
  content: string,
  targetWordCount: number,
  keyword: string,
  sectionType: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq',
  qualityRetryCount: number = 0
): QualityValidationResult {
  const errors: string[] = []
  
  // Word count validation
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length
  const wordCountValid = validateWordCount(content, targetWordCount, 0.1)
  if (!wordCountValid) {
    const variance = Math.abs(wordCount - targetWordCount) / targetWordCount
    errors.push(`Word count ${wordCount} is outside 10% tolerance of target ${targetWordCount} (variance: ${(variance * 100).toFixed(1)}%)`)
  }

  // Citation validation
  const citationsCount = countCitations(content)
  const citationsValid = citationsCount >= 1
  if (!citationsValid) {
    errors.push(`Only ${citationsCount} citation(s) found, need at least 1`)
  }

  const citationFormatValid = validateCitationFormatting(content)
  if (!citationFormatValid) {
    errors.push('Citation formatting is invalid (malformed markdown links)')
  }

  // Heading structure validation
  const headingValid = validateHeadingStructure(content, sectionType)
  if (!headingValid) {
    errors.push(`Heading structure is invalid for section type: ${sectionType}`)
  }

  // Keyword validation
  const keywordDensity = calculateKeywordDensity(content, keyword)
  const keywordValid = validateKeywordNatural(content, keyword)
  if (!keywordValid) {
    if (keywordDensity < 0.005) {
      errors.push(`Keyword "${keyword}" appears too infrequently (density: ${(keywordDensity * 100).toFixed(2)}%)`)
    } else {
      errors.push(`Keyword "${keyword}" appears too frequently - possible keyword stuffing (density: ${(keywordDensity * 100).toFixed(2)}%)`)
    }
  }

  // Readability validation
  const readabilityScore = calculateReadability(content)
  const readabilityValid = readabilityScore >= 60
  if (!readabilityValid) {
    errors.push(`Readability score ${readabilityScore} is below target of 60`)
  }

  const passed = errors.length === 0

  return {
    passed,
    metrics: {
      word_count: wordCount,
      citations_included: citationsCount,
      readability_score: readabilityScore,
      keyword_density: keywordDensity,
      quality_passed: passed,
      quality_retry_count: qualityRetryCount
    },
    errors
  }
}

