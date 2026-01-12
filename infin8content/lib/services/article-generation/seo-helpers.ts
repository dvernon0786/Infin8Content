// SEO Helpers Functions
// Story 20.1: Prompt System Overhaul

export interface KeywordDensityResult {
  density: number
  count: number
  wordCount: number
  isValid: boolean
  isKeywordStuffing: boolean
  recommendation?: string
}

export interface SemanticCoverageResult {
  coveragePercentage: number
  coveredKeywords: string[]
  missingKeywords: string[]
  isValid: boolean
  recommendation?: string
}

export interface ReadabilityResult {
  score: number
  gradeLevel: number
  isTargetGrade: boolean
  avgWordsPerSentence: number
  avgSyllablesPerWord: number
  recommendation?: string
}

export interface ContentStructureResult {
  hasProperHierarchy: boolean
  hierarchyErrors: string[]
  paragraphIssues: string[]
  isValid: boolean
  recommendation?: string
}

/**
 * Check keyword density in content
 * Validates 1-2% for primary keywords, 0.5-1% for secondary keywords
 */
export function checkKeywordDensity(
  content: string,
  keyword: string,
  type: 'primary' | 'secondary'
): KeywordDensityResult {
  if (!content || !keyword) {
    return {
      density: 0,
      count: 0,
      wordCount: 0,
      isValid: false,
      isKeywordStuffing: false,
      recommendation: 'Content or keyword is missing'
    }
  }

  const words = content.toLowerCase().split(/\s+/).filter(word => word.length > 0)
  const wordCount = words.length
  const keywordLower = keyword.toLowerCase()
  
  // Count keyword occurrences (case-insensitive, handle multi-word keywords)
  const count = words.reduce((acc, word, index) => {
    // Remove punctuation for accurate matching
    const cleanWord = word.replace(/[.,!?;:()[\]{}"']/g, '').toLowerCase()
    
    // For multi-word keywords, check sequences
    if (keywordLower.includes(' ')) {
      const keywordWords = keywordLower.split(' ')
      // Check if this word starts a keyword sequence
      for (let i = 0; i < keywordWords.length; i++) {
        if (index + i < words.length) {
          const nextWords = words.slice(index, index + keywordWords.length)
            .map(w => w.replace(/[.,!?;:()[\]{}"']/g, '').toLowerCase())
            .join(' ')
          if (nextWords === keywordLower) {
            return acc + 1
          }
        }
      }
      return acc
    } else {
      // Single word keyword
      return acc + (cleanWord === keywordLower ? 1 : 0)
    }
  }, 0)

  const density = wordCount > 0 ? (count / wordCount) : 0

  // Define validation thresholds
  const thresholds = type === 'primary' 
    ? { min: 0.01, max: 0.02 } // 1-2% for primary
    : { min: 0.005, max: 0.01 } // 0.5-1% for secondary

  const isValid = density >= thresholds.min && density <= thresholds.max
  const isKeywordStuffing = density > thresholds.max * 2 // More than double the max

  let recommendation: string | undefined
  if (!isValid) {
    if (density < thresholds.min) {
      recommendation = `Increase ${type} keyword density to ${Math.round(thresholds.min * 100)}-${Math.round(thresholds.max * 100)}%`
    } else if (isKeywordStuffing) {
      recommendation = `Reduce keyword density - appears to be keyword stuffing`
    } else {
      recommendation = `Reduce ${type} keyword density to ${Math.round(thresholds.max * 100)}% or less`
    }
  }

  return {
    density,
    count,
    wordCount,
    isValid,
    isKeywordStuffing,
    recommendation
  }
}

/**
 * Validate semantic keyword coverage in content
 */
export function validateSemanticKeywordCoverage(
  content: string,
  semanticKeywords: string[]
): SemanticCoverageResult {
  if (!semanticKeywords || semanticKeywords.length === 0) {
    return {
      coveragePercentage: 100,
      coveredKeywords: [],
      missingKeywords: [],
      isValid: true
    }
  }

  const contentLower = content.toLowerCase()
  const coveredKeywords: string[] = []
  const missingKeywords: string[] = []

  semanticKeywords.forEach(keyword => {
    if (contentLower.includes(keyword.toLowerCase())) {
      coveredKeywords.push(keyword)
    } else {
      missingKeywords.push(keyword)
    }
  })

  const coveragePercentage = semanticKeywords.length > 0 
    ? Math.round((coveredKeywords.length / semanticKeywords.length) * 100)
    : 100

  const isValid = coveragePercentage >= 70 // At least 70% coverage

  let recommendation: string | undefined
  if (!isValid) {
    recommendation = `Include more semantic keywords. Current coverage: ${coveragePercentage}%`
  }

  return {
    coveragePercentage,
    coveredKeywords,
    missingKeywords,
    isValid,
    recommendation
  }
}

/**
 * Calculate readability score using Flesch-Kincaid formula
 * Targets Grade 10-12 level
 */
export function calculateReadabilityScore(content: string): ReadabilityResult {
  if (!content || content.trim().length === 0) {
    return {
      score: 0,
      gradeLevel: 0,
      isTargetGrade: false,
      avgWordsPerSentence: 0,
      avgSyllablesPerWord: 0,
      recommendation: 'Content is empty'
    }
  }

  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = content.split(/\s+/).filter(w => w.length > 0)
  
  if (sentences.length === 0 || words.length === 0) {
    return {
      score: 0,
      gradeLevel: 0,
      isTargetGrade: false,
      avgWordsPerSentence: 0,
      avgSyllablesPerWord: 0,
      recommendation: 'Unable to calculate readability - no sentences or words found'
    }
  }

  const avgWordsPerSentence = words.length / sentences.length
  
  // Count syllables (simplified algorithm)
  const countSyllables = (word: string): number => {
    word = word.toLowerCase()
    if (word.length <= 3) return 1
    
    let syllables = 0
    const vowels = 'aeiouy'
    let previousWasVowel = false
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i])
      if (isVowel && !previousWasVowel) {
        syllables++
      }
      previousWasVowel = isVowel
    }
    
    // Adjust for silent 'e'
    if (word.endsWith('e') && syllables > 1) {
      syllables--
    }
    
    return Math.max(1, syllables)
  }
  
  const totalSyllables = words.reduce((acc, word) => acc + countSyllables(word), 0)
  const avgSyllablesPerWord = totalSyllables / words.length
  
  // Flesch-Kincaid Grade Level formula
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
  const gradeLevel = Math.round((0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59)
  
  const isTargetGrade = gradeLevel >= 10 && gradeLevel <= 12

  let recommendation: string | undefined
  if (!isTargetGrade) {
    if (gradeLevel < 10) {
      recommendation = 'Content is too simple - use more complex sentences and vocabulary'
    } else {
      recommendation = 'Content is too complex - use shorter sentences and simpler words'
    }
  }

  return {
    score,
    gradeLevel,
    isTargetGrade,
    avgWordsPerSentence,
    avgSyllablesPerWord,
    recommendation
  }
}

/**
 * Validate content structure hierarchy and formatting
 */
export function validateContentStructure(content: string): ContentStructureResult {
  const hierarchyErrors: string[] = []
  const paragraphIssues: string[] = []

  // Check heading hierarchy
  const headingMatches = content.match(/<h([1-6])[^>]*>/gi) || []
  const headingLevels = headingMatches.map(match => {
    const levelMatch = match.match(/<h([1-6])/i)
    return levelMatch ? parseInt(levelMatch[1]) : 0
  })

  let hasProperHierarchy = true
  let previousLevel = 0

  headingLevels.forEach(level => {
    if (previousLevel > 0 && level > previousLevel + 1) {
      hasProperHierarchy = false
      hierarchyErrors.push(`H${level} found without H${level - 1}`)
    }
    previousLevel = level
  })

  // Check paragraph structure
  const paragraphs = content.split(/<p[^>]*>/i).filter(p => p.trim().length > 0)
  
  paragraphs.forEach((paragraph, index) => {
    // Remove closing tags and HTML for analysis
    const cleanParagraph = paragraph.replace(/<\/p>/i, '').replace(/<[^>]*>/g, '').trim()
    const sentences = cleanParagraph.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    if (sentences.length > 4) {
      paragraphIssues.push(`Paragraph too long (>4 sentences)`)
    }
    
    if (cleanParagraph.length > 300) {
      paragraphIssues.push(`Paragraph too long (${cleanParagraph.length} characters)`)
    }
  })

  const isValid = hasProperHierarchy && paragraphIssues.length === 0

  let recommendation: string | undefined
  if (!isValid) {
    const recommendations: string[] = []
    if (!hasProperHierarchy) {
      recommendations.push('Fix heading hierarchy - do not skip levels')
    }
    if (paragraphIssues.length > 0) {
      recommendations.push('Break up long paragraphs (max 4 sentences, 300 characters)')
    }
    recommendation = recommendations.join('. ')
  }

  return {
    hasProperHierarchy,
    hierarchyErrors,
    paragraphIssues,
    isValid,
    recommendation
  }
}
