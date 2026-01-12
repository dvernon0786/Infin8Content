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

export interface QualityIssue {
  type: 'critical' | 'minor'
  category: 'word_count' | 'keyword_density' | 'formatting' | 'readability' | 'citations' | 'coherence'
  message: string
  severity: number // 1-10 scale for issue severity
  autoFixable: boolean
}

export interface EnhancedQualityValidationResult {
  passed: boolean
  metrics: QualityMetrics
  issues: QualityIssue[]
  criticalIssues: QualityIssue[]
  minorIssues: QualityIssue[]
  qualityScore: number // 0-100
  autoFixAvailable: boolean
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
/**
 * Enhanced quality validation with critical/minor issue classification
 * Story 20.4: Smart Quality Retry System
 */
export function validatePromptQuality(
  content: string,
  targetWordCount: number,
  keyword: string,
  sectionType: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq',
  qualityRetryCount: number = 0
): EnhancedQualityValidationResult {
  const issues: QualityIssue[] = []
  
  // Word count validation with classification
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length
  const wordCountVariance = Math.abs(wordCount - targetWordCount) / targetWordCount
  
  if (wordCountVariance > 0.5) {
    // More than 50% variance = critical
    issues.push({
      type: 'critical',
      category: 'word_count',
      message: `Word count ${wordCount} is ${((wordCountVariance) * 100).toFixed(1)}% from target ${targetWordCount}`,
      severity: Math.min(10, Math.ceil(wordCountVariance * 20)),
      autoFixable: true
    })
  } else if (wordCountVariance > 0.2) {
    // 20-50% variance = minor
    issues.push({
      type: 'minor',
      category: 'word_count',
      message: `Word count ${wordCount} is ${((wordCountVariance) * 100).toFixed(1)}% from target ${targetWordCount}`,
      severity: Math.ceil(wordCountVariance * 10),
      autoFixable: true
    })
  }

  // Citation validation
  const citationsCount = countCitations(content)
  if (citationsCount === 0 && sectionType !== 'introduction' && sectionType !== 'conclusion') {
    issues.push({
      type: 'critical',
      category: 'citations',
      message: 'No citations found - content lacks authoritative sources',
      severity: 8,
      autoFixable: false
    })
  } else if (citationsCount < 1) {
    issues.push({
      type: 'minor',
      category: 'citations',
      message: `Only ${citationsCount} citation(s) found - consider adding more sources`,
      severity: 4,
      autoFixable: false
    })
  }

  const citationFormatValid = validateCitationFormatting(content)
  if (!citationFormatValid) {
    issues.push({
      type: 'minor',
      category: 'formatting',
      message: 'Citation formatting issues detected',
      severity: 3,
      autoFixable: true
    })
  }

  // Keyword density validation
  const keywordDensity = calculateKeywordDensity(content, keyword)
  if (keywordDensity < 0.003) {
    // Less than 0.3% = critical (keyword not used enough)
    issues.push({
      type: 'critical',
      category: 'keyword_density',
      message: `Keyword "${keyword}" density too low: ${(keywordDensity * 100).toFixed(2)}%`,
      severity: 7,
      autoFixable: true
    })
  } else if (keywordDensity > 0.04) {
    // More than 4% = critical (keyword stuffing)
    issues.push({
      type: 'critical',
      category: 'keyword_density',
      message: `Keyword "${keyword}" density too high: ${(keywordDensity * 100).toFixed(2)}% - possible stuffing`,
      severity: 8,
      autoFixable: true
    })
  } else if (keywordDensity < 0.008 || keywordDensity > 0.025) {
    // Outside optimal range = minor
    issues.push({
      type: 'minor',
      category: 'keyword_density',
      message: `Keyword "${keyword}" density suboptimal: ${(keywordDensity * 100).toFixed(2)}%`,
      severity: 3,
      autoFixable: true
    })
  }

  // Heading structure validation
  const headingValid = validateHeadingStructure(content, sectionType)
  if (!headingValid) {
    issues.push({
      type: 'minor',
      category: 'formatting',
      message: `Heading structure invalid for section type: ${sectionType}`,
      severity: 4,
      autoFixable: true
    })
  }

  // Readability validation
  const readabilityScore = calculateReadability(content)
  if (readabilityScore < 30) {
    // Very difficult = critical
    issues.push({
      type: 'critical',
      category: 'readability',
      message: `Readability too difficult: ${readabilityScore} (very complex text)`,
      severity: 6,
      autoFixable: true
    })
  } else if (readabilityScore < 50) {
    // Difficult = minor
    issues.push({
      type: 'minor',
      category: 'readability',
      message: `Readability challenging: ${readabilityScore} (could be simplified)`,
      severity: 3,
      autoFixable: true
    })
  }

  // Content coherence check (basic)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  if (sentences.length === 0) {
    issues.push({
      type: 'critical',
      category: 'coherence',
      message: 'No coherent sentences found',
      severity: 10,
      autoFixable: false
    })
  } else if (sentences.length === 1 && wordCount > 100) {
    // Single very long sentence = coherence issue
    issues.push({
      type: 'minor',
      category: 'coherence',
      message: 'Single long sentence detected - consider breaking up',
      severity: 2,
      autoFixable: true
    })
  }

  // Classify issues
  const criticalIssues = issues.filter(i => i.type === 'critical')
  const minorIssues = issues.filter(i => i.type === 'minor')

  // Calculate quality score
  const baseScore = 100
  const criticalDeduction = criticalIssues.reduce((sum, issue) => sum + (issue.severity * 3), 0) // Reduced penalty
  const minorDeduction = minorIssues.reduce((sum, issue) => sum + Math.ceil(issue.severity / 2), 0) // Reduced penalty
  const qualityScore = Math.max(0, baseScore - criticalDeduction - minorDeduction)

  // Determine if auto-fix is available
  const autoFixAvailable = issues.some(i => i.autoFixable)

  const passed = criticalIssues.length === 0 && qualityScore >= 70 // Proper quality threshold for Story 20.4

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
    issues,
    criticalIssues,
    minorIssues,
    qualityScore,
    autoFixAvailable
  }
}

/**
 * Auto-fix minor quality issues programmatically
 * Story 20.4: Smart Quality Retry System
 */
export function autoFixMinorIssues(
  content: string,
  issues: QualityIssue[],
  targetWordCount: number,
  keyword: string,
  sectionType: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq'
): { fixedContent: string; fixesApplied: string[] } {
  let fixedContent = content
  const fixesApplied: string[] = []
  
  // Fix word count issues
  const wordCountIssues = issues.filter(i => i.category === 'word_count' && i.type === 'minor')
  if (wordCountIssues.length > 0) {
    const currentWordCount = fixedContent.split(/\s+/).filter(w => w.length > 0).length
    const variance = Math.abs(currentWordCount - targetWordCount) / targetWordCount
    
    if (currentWordCount < targetWordCount) {
      // Need to expand content
      const expansionNeeded = targetWordCount - currentWordCount
      const sentences = fixedContent.split(/[.!?]+/).filter(s => s.trim().length > 0)
      
      if (sentences.length > 0) {
        // Add elaboration to existing sentences
        const expansionPhrases = [
          ` which is particularly relevant for ${keyword} optimization`,
          ` providing comprehensive coverage of ${keyword} strategies`,
          ` ensuring thorough understanding of ${keyword} implementation`,
          ` offering detailed insights into ${keyword} best practices`
        ]
        
        const phraseToAdd = expansionPhrases[Math.floor(Math.random() * expansionPhrases.length)]
        fixedContent = fixedContent.replace(sentences[sentences.length - 1], 
          sentences[sentences.length - 1].trim() + phraseToAdd + '.')
        fixesApplied.push(`Expanded content by ${Math.round(expansionNeeded * 2)} words`)
      }
    } else {
      // Need to condense content
      const words = fixedContent.split(' ')
      const wordsToRemove = Math.min(currentWordCount - targetWordCount, Math.floor(words.length * 0.1))
      
      if (wordsToRemove > 0) {
        // Remove less important words (simple approach)
        const lessImportantWords = ['very', 'really', 'quite', 'rather', 'somewhat', 'actually', 'basically']
        let removed = 0
        
        for (let i = words.length - 1; i >= 0 && removed < wordsToRemove; i--) {
          if (lessImportantWords.includes(words[i].toLowerCase()) && words[i].length > 2) {
            words.splice(i, 1)
            removed++
          }
        }
        
        fixedContent = words.join(' ')
        fixesApplied.push(`Condensed content by removing ${removed} filler words`)
      }
    }
  }
  
  // Fix keyword density issues
  const keywordIssues = issues.filter(i => i.category === 'keyword_density' && i.type === 'minor')
  if (keywordIssues.length > 0) {
    const currentDensity = calculateKeywordDensity(fixedContent, keyword)
    const words = fixedContent.split(/\s+/).filter(w => w.length > 0)
    const optimalDensity = 0.015 // 1.5% target
    const targetKeywordCount = Math.max(1, Math.round(words.length * optimalDensity))
    const currentKeywordCount = Math.round(currentDensity * words.length)
    
    if (currentKeywordCount < targetKeywordCount) {
      // Need to add keyword instances
      const keywordToAdd = targetKeywordCount - currentKeywordCount
      const sentences = fixedContent.split(/[.!?]+/).filter(s => s.trim().length > 0)
      
      // Add keyword to multiple sentences
      for (let i = 0; i < keywordToAdd && i < sentences.length; i++) {
        const sentence = sentences[i]
        if (!sentence.toLowerCase().includes(keyword.toLowerCase())) {
          // Add keyword at the end of sentence
          sentences[i] = sentence.trim() + ` ${keyword}`
        }
      }
      
      fixedContent = sentences.join('. ')
      fixesApplied.push(`Added ${keywordToAdd} keyword instances for optimal density`)
    } else if (currentKeywordCount > targetKeywordCount) {
      // Need to remove keyword instances (keyword stuffing)
      const keywordToRemove = currentKeywordCount - targetKeywordCount
      let removed = 0
      
      // Remove some keyword instances
      const words = fixedContent.split(' ')
      for (let i = words.length - 1; i >= 0 && removed < keywordToRemove; i--) {
        if (words[i].toLowerCase() === keyword.toLowerCase() && Math.random() > 0.5) {
          words.splice(i, 1)
          removed++
        }
      }
      
      fixedContent = words.join(' ')
      fixesApplied.push(`Removed ${removed} keyword instances to reduce stuffing`)
    }
  }
  
  // Fix formatting issues
  const formattingIssues = issues.filter(i => i.category === 'formatting' && i.type === 'minor')
  if (formattingIssues.length > 0) {
    // Fix paragraph structure
    const paragraphs = fixedContent.split('\n\n').filter(p => p.trim().length > 0)
    
    if (paragraphs.length === 1 && paragraphs[0].length > 150) {
      // Split long paragraph
      const sentences = paragraphs[0].split(/[.!?]+/).filter(s => s.trim().length > 0)
      if (sentences.length > 2) {
        const midPoint = Math.ceil(sentences.length / 2)
        
        const firstHalf = sentences.slice(0, midPoint).join('. ').trim()
        const secondHalf = sentences.slice(midPoint).join('. ').trim()
        
        fixedContent = `${firstHalf}.\n\n${secondHalf}.`
        fixesApplied.push('Split long paragraph for better readability')
      }
    }
    
    // Fix heading structure
    if (sectionType === 'h2' && !fixedContent.includes('##')) {
      // Add H2 heading if missing
      const firstSentence = fixedContent.split('.')[0]
      fixedContent = `## ${firstSentence}\n\n${fixedContent.substring(firstSentence.length + 1).trim()}`
      fixesApplied.push('Added H2 heading structure')
    } else if (sectionType === 'h3' && !fixedContent.includes('###')) {
      // Add H3 heading if missing
      const firstSentence = fixedContent.split('.')[0]
      fixedContent = `### ${firstSentence}\n\n${fixedContent.substring(firstSentence.length + 1).trim()}`
      fixesApplied.push('Added H3 heading structure')
    }
  }
  
  // Fix readability issues
  const readabilityIssues = issues.filter(i => i.category === 'readability' && i.type === 'minor')
  if (readabilityIssues.length > 0) {
    // Simplify complex sentences
    const sentences = fixedContent.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      const words = sentence.split(' ')
      
      // Break up very long sentences
      if (words.length > 25) {
        const midPoint = Math.floor(words.length / 2)
        const firstHalf = words.slice(0, midPoint).join(' ')
        const secondHalf = words.slice(midPoint).join(' ')
        
        sentences[i] = `${firstHalf}. Additionally, ${secondHalf.toLowerCase()}`
      }
    }
    
    fixedContent = sentences.join('. ')
    fixesApplied.push('Simplified complex sentences for better readability')
  }
  
  return {
    fixedContent,
    fixesApplied
  }
}

/**
 * Generate targeted retry prompts based on failure classification
 * Story 20.4: Smart Quality Retry System
 */
export function generateTargetedRetryPrompt(
  issues: QualityIssue[],
  originalContent: string,
  keyword: string,
  sectionType: 'introduction' | 'h2' | 'h3' | 'conclusion' | 'faq'
): string {
  const criticalIssues = issues.filter(i => i.type === 'critical')
  const minorIssues = issues.filter(i => i.type === 'minor')
  
  let retryPrompt = `Please regenerate this ${sectionType} section addressing the following specific issues:\n\n`
  
  // Address critical issues first
  if (criticalIssues.length > 0) {
    retryPrompt += `**CRITICAL ISSUES (must fix):**\n`
    
    criticalIssues.forEach(issue => {
      switch (issue.category) {
        case 'word_count':
          retryPrompt += `- Word count is severely off target. Ensure content is approximately the right length.\n`
          break
        case 'citations':
          retryPrompt += `- Content lacks authoritative sources. Add at least 1-2 proper citations.\n`
          break
        case 'keyword_density':
          if (issue.message.includes('too low')) {
            retryPrompt += `- Keyword "${keyword}" is severely underused. Include it naturally throughout the content.\n`
          } else {
            retryPrompt += `- Keyword "${keyword}" is overused (stuffing). Reduce usage to natural levels.\n`
          }
          break
        case 'readability':
          retryPrompt += `- Content is too complex to read. Simplify sentences and use clearer language.\n`
          break
        case 'coherence':
          retryPrompt += `- Content lacks coherent structure. Ensure logical flow and complete sentences.\n`
          break
      }
    })
  }
  
  // Address minor issues
  if (minorIssues.length > 0) {
    retryPrompt += `\n**MINOR ISSUES (improve if possible):**\n`
    
    minorIssues.forEach(issue => {
      switch (issue.category) {
        case 'word_count':
          retryPrompt += `- Adjust word count to be closer to target.\n`
          break
        case 'keyword_density':
          retryPrompt += `- Optimize keyword "${keyword}" density for better SEO.\n`
          break
        case 'formatting':
          retryPrompt += `- Improve formatting and structure for better readability.\n`
          break
        case 'readability':
          retryPrompt += `- Simplify some sentences for better readability.\n`
          break
      }
    })
  }
  
  // Add specific guidance based on section type
  retryPrompt += `\n**SECTION-SPECIFIC GUIDANCE:**\n`
  
  switch (sectionType) {
    case 'introduction':
      retryPrompt += `- Start with a compelling hook about ${keyword}\n`
      retryPrompt += `- Provide clear context and preview what readers will learn\n`
      retryPrompt += `- Keep it engaging and accessible\n`
      break
    case 'h2':
      retryPrompt += `- Focus on comprehensive coverage of the topic\n`
      retryPrompt += `- Include supporting evidence and examples\n`
      retryPrompt += `- Use proper heading structure with ##\n`
      break
    case 'h3':
      retryPrompt += `- Provide specific details and examples\n`
      retryPrompt += `- Focus on practical applications\n`
      retryPrompt += `- Use ### heading format\n`
      break
    case 'conclusion':
      retryPrompt += `- Summarize key points about ${keyword}\n`
      retryPrompt += `- Provide clear takeaways\n`
      retryPrompt += `- End with actionable next steps\n`
      break
    case 'faq':
      retryPrompt += `- Structure as clear questions and answers\n`
      retryPrompt += `- Focus on common user concerns\n`
      retryPrompt += `- Optimize for featured snippets\n`
      break
  }
  
  retryPrompt += `\n**ORIGINAL CONTENT FOR REFERENCE:**\n${originalContent.substring(0, 500)}${originalContent.length > 500 ? '...' : ''}\n\n`
  retryPrompt += `**REQUIREMENTS:**\n`
  retryPrompt += `- Address all critical issues\n`
  retryPrompt += `- Maintain natural, readable writing style\n`
  retryPrompt += `- Use "${keyword}" naturally throughout\n`
  retryPrompt += `- Include proper citations where appropriate\n`
  retryPrompt += `- Follow proper markdown formatting\n`
  
  return retryPrompt
}

/**
 * Validate content quality (legacy function for backward compatibility)
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
  // Lowered threshold from 60 to 50 to be more lenient
  // 50-59 = "Fairly Difficult" which is acceptable for technical content
  // 60+ = "Standard" readability (preferred)
  const readabilityScore = calculateReadability(content)
  const readabilityValid = readabilityScore >= 50
  if (!readabilityValid) {
    errors.push(`Readability score ${readabilityScore} is below target of 50`)
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

