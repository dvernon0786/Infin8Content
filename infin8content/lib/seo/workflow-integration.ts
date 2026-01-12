// SEO Workflow Integration
// Story 14.6: SEO Testing and Validation
// Task 6: Workflow Integration

import { calculateSEOScore, type SEOScoreInput } from './seo-scoring'
import { validateSEOContent, type ValidationInput } from './validation-engine'
import { generateRealTimeRecommendations, type RecommendationInput } from './recommendation-system'
import { generateSEOReport, type ReportInput } from './reporting'

export interface WorkflowIntegrationConfig {
  enableRealTimeValidation: boolean
  validationCheckpoints: ValidationCheckpoint[]
  autoRegenerationTriggers: AutoRegenerationTrigger[]
  manualOverrideOptions: ManualOverrideOption[]
  performanceThresholds: PerformanceThresholds
}

export interface ValidationCheckpoint {
  stage: 'research' | 'outline' | 'content' | 'final'
  enabled: boolean
  requiredScore: number
  criticalIssues: string[]
  blockProgression: boolean
}

export interface AutoRegenerationTrigger {
  condition: 'score_below_threshold' | 'critical_errors' | 'missing_elements'
  threshold: number
  enabled: boolean
  maxAttempts: number
}

export interface ManualOverrideOption {
  type: 'skip_validation' | 'accept_score' | 'modify_thresholds'
  description: string
  requiresApproval: boolean
  impact: 'low' | 'medium' | 'high'
}

export interface PerformanceThresholds {
  minimumScore: number
  targetScore: number
  maxValidationTime: number
  maxRecommendationTime: number
  maxReportTime: number
}

export interface WorkflowContext {
  articleId: string
  currentStage: 'research' | 'outline' | 'content' | 'final' | 'completed'
  content: string
  metadata: ArticleMetadata
  validationHistory: ValidationHistoryEntry[]
  recommendations: RecommendationHistoryEntry[]
  scores: ScoreHistoryEntry[]
  status: 'in-progress' | 'validated' | 'needs-review' | 'completed'
}

export interface ArticleMetadata {
  primaryKeyword: string
  secondaryKeywords: string[]
  targetWordCount: number
  contentType: string
  targetAudience?: string
  searchIntent?: string
  competitorContent?: string
  createdAt: string
  updatedAt: string
}

export interface ValidationHistoryEntry {
  timestamp: string
  stage: string
  score: number
  passed: boolean
  issues: string[]
  criticalIssues: string[]
  recommendations: string[]
}

export interface RecommendationHistoryEntry {
  timestamp: string
  stage: string
  recommendations: string[]
  appliedRecommendations: string[]
  impact: number
}

export interface ScoreHistoryEntry {
  timestamp: string
  stage: string
  overallScore: number
  breakdown: ScoreBreakdownEntry
}

export interface ScoreBreakdownEntry {
  keywordDensity: number
  readability: number
  structure: number
  semanticCoverage: number
  contentLength: number
  metaOptimization: number
}

export interface ValidationResult {
  passed: boolean
  score: number
  stage: string
  issues: WorkflowIssue[]
  recommendations: string[]
  canProceed: boolean
  requiresManualReview: boolean
}

export interface WorkflowIssue {
  type: 'critical' | 'warning' | 'info'
  category: string
  message: string
  suggestion: string
  blockProgression: boolean
}

export interface RegenerationResult {
  regenerated: boolean
  newContent?: string
  reason: string
  improvement: number
  attempts: number
}

export interface WorkflowStatus {
  currentStage: string
  overallProgress: number
  validationStatus: 'passed' | 'failed' | 'pending'
  lastValidationTime: string
  nextCheckpoint: string
  estimatedCompletion: string
}

/**
 * Main workflow integration service
 */
export class SEOWorkflowIntegration {
  private config: WorkflowIntegrationConfig
  private context: WorkflowContext
  private validationHistory: ValidationHistoryEntry[] = []
  private recommendationHistory: RecommendationHistoryEntry[] = []
  private scoreHistory: ScoreHistoryEntry[] = []

  constructor(config: WorkflowIntegrationConfig, initialContext: WorkflowContext) {
    this.config = config
    this.context = initialContext
  }

  /**
   * Process content at current workflow stage
   */
  async processStage(stage: 'research' | 'outline' | 'content' | 'final'): Promise<ValidationResult> {
    const startTime = performance.now()
    
    try {
      // Update current stage
      this.context.currentStage = stage
      this.context.metadata.updatedAt = new Date().toISOString()

      // Check if validation is enabled for this stage
      const checkpoint = this.config.validationCheckpoints.find(cp => cp.stage === stage)
      if (!checkpoint?.enabled) {
        return {
          passed: true,
          score: 100,
          stage,
          issues: [],
          recommendations: [],
          canProceed: true,
          requiresManualReview: false
        }
      }

      // Run SEO validation
      const validationResult = await this.runValidation(stage)
      
      // Add to history
      this.addToValidationHistory(validationResult, stage)

      // Check if auto-regeneration is needed
      if (this.shouldTriggerRegeneration(validationResult)) {
        const regenerationResult = await this.triggerRegeneration({
          passed: validationResult.passed,
          score: validationResult.score,
          issues: validationResult.issues,
          recommendations: validationResult.recommendations
        })
        if (regenerationResult.regenerated) {
          // Re-run validation with regenerated content
          const newValidationResult = await this.runValidation(stage)
          this.addToValidationHistory(newValidationResult, stage)
          return {
            ...newValidationResult,
            stage,
            canProceed: newValidationResult.passed,
            requiresManualReview: false
          }
        }
      }

      // Check if manual review is required
      const requiresManualReview = this.requiresManualReview(validationResult, checkpoint)

      const endTime = performance.now()
      const executionTime = Math.round((endTime - startTime) * 100) / 100


      return {
        ...validationResult,
        stage,
        canProceed: validationResult.passed && !requiresManualReview,
        requiresManualReview
      }
    } catch (error) {
      
      return {
        passed: false,
        score: 0,
        stage,
        issues: [{
          type: 'critical',
          category: 'system',
          message: `Stage processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Check system configuration and try again',
          blockProgression: true
        }],
        recommendations: ['Retry stage processing'],
        canProceed: false,
        requiresManualReview: true
      }
    }
  }

  /**
   * Run comprehensive SEO validation for current stage
   */
  private async runValidation(stage: string): Promise<{
    passed: boolean
    score: number
    issues: WorkflowIssue[]
    recommendations: string[]
  }> {
    try {
      // Calculate SEO score
      const scoreResult = calculateSEOScore({
        content: this.context.content,
        primaryKeyword: this.context.metadata.primaryKeyword,
        secondaryKeywords: this.context.metadata.secondaryKeywords,
        targetWordCount: this.context.metadata.targetWordCount,
        contentType: this.context.metadata.contentType as any
      })

      // Run validation checks
      const validationResult = validateSEOContent({
        content: this.context.content,
        primaryKeyword: this.context.metadata.primaryKeyword,
        secondaryKeywords: this.context.metadata.secondaryKeywords,
        targetWordCount: this.context.metadata.targetWordCount,
        contentType: this.context.metadata.contentType
      })

      // Generate recommendations
      const recommendationResult = generateRealTimeRecommendations({
        content: this.context.content,
        primaryKeyword: this.context.metadata.primaryKeyword,
        secondaryKeywords: this.context.metadata.secondaryKeywords,
        targetWordCount: this.context.metadata.targetWordCount,
        contentType: this.context.metadata.contentType as any,
        targetAudience: this.context.metadata.targetAudience,
        searchIntent: this.context.metadata.searchIntent
      })

      // Convert validation issues to workflow issues
      const workflowIssues: WorkflowIssue[] = [
        ...validationResult.issues.map(issue => ({
          type: issue.type as 'critical' | 'warning' | 'info',
          category: issue.category,
          message: issue.message,
          suggestion: issue.suggestion,
          blockProgression: issue.type === 'error'
        })),
        ...scoreResult.issues.map(issue => ({
          type: issue.type as 'critical' | 'warning' | 'info',
          category: issue.category,
          message: issue.message,
          suggestion: issue.suggestion,
          blockProgression: issue.type === 'error'
        }))
      ]

      // Get checkpoint requirements
      const checkpoint = this.config.validationCheckpoints.find(cp => cp.stage === stage)
      const requiredScore = checkpoint?.requiredScore || 70
      const criticalIssues = checkpoint?.criticalIssues || []

      // Check for critical issues
      const foundCriticalIssues = workflowIssues.filter(issue => 
        criticalIssues.some(critical => issue.message.includes(critical))
      )

      const passed = scoreResult.overallScore >= requiredScore && 
                    validationResult.passed && 
                    foundCriticalIssues.length === 0

      // Add to score history
      this.addToScoreHistory(scoreResult, stage)

      return {
        passed,
        score: scoreResult.overallScore,
        issues: workflowIssues,
        recommendations: recommendationResult.recommendations.map(r => r.action)
      }
    } catch (error) {
      
      return {
        passed: false,
        score: 0,
        issues: [{
          type: 'critical',
          category: 'system',
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Check content format and try again',
          blockProgression: true
        }],
        recommendations: ['Fix validation errors and retry']
      }
    }
  }

  /**
   * Check if auto-regeneration should be triggered
   */
  private shouldTriggerRegeneration(validationResult: {
    passed: boolean
    score: number
    issues: WorkflowIssue[]
    recommendations: string[]
  }): boolean {
    return this.config.autoRegenerationTriggers.some(trigger => {
      if (!trigger.enabled) return false

      switch (trigger.condition) {
        case 'score_below_threshold':
          return validationResult.score < trigger.threshold
        case 'critical_errors':
          return validationResult.issues.filter(issue => issue.type === 'critical').length > 0
        case 'missing_elements':
          return validationResult.issues.some(issue => 
            issue.category === 'structure' && issue.type === 'critical'
          )
        default:
          return false
      }
    })
  }

  /**
   * Trigger content regeneration
   */
  private async triggerRegeneration(validationResult: {
    passed: boolean
    score: number
    issues: WorkflowIssue[]
    recommendations: string[]
  }): Promise<RegenerationResult> {
    const startTime = performance.now()
    
    try {
      // This would integrate with the actual content generation system
      // For now, we'll simulate regeneration with recommendations applied
      
      const originalScore = validationResult.score
      const criticalIssues = validationResult.issues.filter(issue => issue.type === 'critical')
      
      // Simulate content improvement (in real implementation, this would call the generation API)
      const improvementEstimate = Math.min(30, criticalIssues.length * 5)
      const newScore = Math.min(100, originalScore + improvementEstimate)
      
      // Simulate content changes (would be actual regeneration in production)
      const contentChanges = criticalIssues.map(issue => issue.suggestion).join('\n')
      
      const endTime = performance.now()
      const executionTime = Math.round((endTime - startTime) * 100) / 100


      return {
        regenerated: true,
        newContent: this.context.content + '\n\n[REGENERATED] Applied improvements:\n' + contentChanges,
        reason: `Addressed ${criticalIssues.length} critical issues`,
        improvement: newScore - originalScore,
        attempts: 1
      }
    } catch (error) {
      
      return {
        regenerated: false,
        reason: `Regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        improvement: 0,
        attempts: 1
      }
    }
  }

  /**
   * Check if manual review is required
   */
  private requiresManualReview(
    validationResult: {
      passed: boolean
      score: number
      issues: WorkflowIssue[]
      recommendations: string[]
    },
    checkpoint: ValidationCheckpoint
  ): boolean {
    // Check for blocking issues
    const hasBlockingIssues = validationResult.issues.some(issue => issue.blockProgression)
    
    // Check for critical issues that block progression
    const hasCriticalIssues = validationResult.issues.some(issue => issue.type === 'critical')
    
    // Check if checkpoint blocks progression on failure
    const blocksOnFailure = checkpoint.blockProgression && !validationResult.passed
    
    return hasBlockingIssues || hasCriticalIssues || blocksOnFailure
  }

  /**
   * Add validation result to history
   */
  private addToValidationHistory(
    validationResult: ValidationResult | {
      passed: boolean
      score: number
      issues: WorkflowIssue[]
      recommendations: string[]
    },
    stage: string
  ): void {
    const entry: ValidationHistoryEntry = {
      timestamp: new Date().toISOString(),
      stage,
      score: validationResult.score,
      passed: validationResult.passed,
      issues: validationResult.issues.map(issue => issue.message),
      criticalIssues: validationResult.issues.filter(issue => issue.type === 'critical').map(issue => issue.message),
      recommendations: validationResult.recommendations
    }

    this.validationHistory.push(entry)
    this.context.validationHistory = [...this.validationHistory]
  }

  /**
   * Add score result to history
   */
  private addToScoreHistory(scoreResult: any, stage: string): void {
    const entry: ScoreHistoryEntry = {
      timestamp: new Date().toISOString(),
      stage,
      overallScore: scoreResult.overallScore,
      breakdown: {
        keywordDensity: scoreResult.breakdown.keywordDensity,
        readability: scoreResult.breakdown.readability,
        structure: scoreResult.breakdown.structure,
        semanticCoverage: scoreResult.breakdown.semanticCoverage,
        contentLength: scoreResult.breakdown.contentLength,
        metaOptimization: scoreResult.breakdown.metaOptimization
      }
    }

    this.scoreHistory.push(entry)
    this.context.scores = [...this.scoreHistory]
  }

  /**
   * Get current workflow status
   */
  getWorkflowStatus(): WorkflowStatus {
    const stageOrder = ['research', 'outline', 'content', 'final', 'completed']
    const currentIndex = stageOrder.indexOf(this.context.currentStage)
    const overallProgress = (currentIndex / (stageOrder.length - 1)) * 100

    const lastValidation = this.validationHistory[this.validationHistory.length - 1]
    const validationStatus = lastValidation ? 
      (lastValidation.passed ? 'passed' : 'failed') : 'pending'

    const nextCheckpoint = stageOrder[currentIndex + 1] || 'completed'
    
    // Estimate completion (simplified)
    const estimatedCompletion = this.estimateCompletionTime()

    return {
      currentStage: this.context.currentStage,
      overallProgress: Math.round(overallProgress),
      validationStatus,
      lastValidationTime: lastValidation?.timestamp || new Date().toISOString(),
      nextCheckpoint,
      estimatedCompletion
    }
  }

  /**
   * Estimate completion time
   */
  private estimateCompletionTime(): string {
    const stageOrder = ['research', 'outline', 'content', 'final']
    const currentIndex = stageOrder.indexOf(this.context.currentStage)
    const remainingStages = stageOrder.length - currentIndex - 1
    
    // Estimate 30 minutes per remaining stage
    const estimatedMinutes = remainingStages * 30
    const completionTime = new Date(Date.now() + estimatedMinutes * 60 * 1000)
    
    return completionTime.toISOString()
  }

  /**
   * Apply manual override
   */
  applyManualOverride(overrideType: string, reason: string): boolean {
    const override = this.config.manualOverrideOptions.find(option => option.type === overrideType)
    
    if (!override) {
      return false
    }

    if (override.requiresApproval) {
      return false
    }

    // Apply override logic
    switch (overrideType) {
      case 'skip_validation':
        this.context.status = 'validated'
        return true
        
      case 'accept_score':
        this.context.status = 'validated'
        return true
        
      case 'modify_thresholds':
        // Would update config thresholds here
        return true
        
      default:
        return false
    }
  }

  /**
   * Generate comprehensive workflow report
   */
  async generateWorkflowReport(): Promise<any> {
    try {
      const reportInput: ReportInput = {
        articleId: this.context.articleId,
        content: this.context.content,
        primaryKeyword: this.context.metadata.primaryKeyword,
        secondaryKeywords: this.context.metadata.secondaryKeywords,
        targetWordCount: this.context.metadata.targetWordCount,
        contentType: this.context.metadata.contentType,
        competitorContent: this.context.metadata.competitorContent,
        historicalData: this.convertScoreHistoryToHistoricalData(),
        reportType: 'comprehensive',
        exportFormats: ['pdf', 'json']
      }

      return generateSEOReport(reportInput)
    } catch (error) {
      throw error
    }
  }

  /**
   * Convert score history to historical data format
   */
  private convertScoreHistoryToHistoricalData(): any[] {
    return this.scoreHistory.map(entry => ({
      date: entry.timestamp,
      score: entry.overallScore,
      metrics: {
        overallScore: entry.overallScore,
        keywordDensity: entry.breakdown.keywordDensity,
        readabilityScore: entry.breakdown.readability,
        structureScore: entry.breakdown.structure,
        semanticCoverage: entry.breakdown.semanticCoverage,
        contentLength: entry.breakdown.contentLength,
        metaOptimization: entry.breakdown.metaOptimization,
        rankingPotential: entry.overallScore, // Simplified
        uniquenessScore: 85, // Default value
        mobileFriendliness: 85, // Default value
        performanceImpact: 85 // Default value
      },
      issues: 0, // Would be calculated from validation history
      recommendations: 0 // Would be calculated from recommendation history
    }))
  }

  /**
   * Get validation history
   */
  getValidationHistory(): ValidationHistoryEntry[] {
    return [...this.validationHistory]
  }

  /**
   * Get score history
   */
  getScoreHistory(): ScoreHistoryEntry[] {
    return [...this.scoreHistory]
  }

  /**
   * Update content
   */
  updateContent(newContent: string): void {
    this.context.content = newContent
    this.context.metadata.updatedAt = new Date().toISOString()
  }

  /**
   * Get current context
   */
  getContext(): WorkflowContext {
    return { ...this.context }
  }
}

/**
 * Create default workflow configuration
 */
export function createDefaultWorkflowConfig(): WorkflowIntegrationConfig {
  return {
    enableRealTimeValidation: true,
    validationCheckpoints: [
      {
        stage: 'research',
        enabled: true,
        requiredScore: 60,
        criticalIssues: ['missing keywords', 'insufficient research'],
        blockProgression: false
      },
      {
        stage: 'outline',
        enabled: true,
        requiredScore: 70,
        criticalIssues: ['improper structure', 'missing sections'],
        blockProgression: true
      },
      {
        stage: 'content',
        enabled: true,
        requiredScore: 75,
        criticalIssues: ['keyword stuffing', 'plagiarism risk', 'poor readability'],
        blockProgression: true
      },
      {
        stage: 'final',
        enabled: true,
        requiredScore: 80,
        criticalIssues: ['critical SEO errors', 'accessibility issues'],
        blockProgression: false
      }
    ],
    autoRegenerationTriggers: [
      {
        condition: 'score_below_threshold',
        threshold: 60,
        enabled: true,
        maxAttempts: 2
      },
      {
        condition: 'critical_errors',
        threshold: 3,
        enabled: true,
        maxAttempts: 1
      }
    ],
    manualOverrideOptions: [
      {
        type: 'skip_validation',
        description: 'Skip validation for current stage',
        requiresApproval: true,
        impact: 'high'
      },
      {
        type: 'accept_score',
        description: 'Accept current score despite validation issues',
        requiresApproval: false,
        impact: 'medium'
      },
      {
        type: 'modify_thresholds',
        description: 'Temporarily modify validation thresholds',
        requiresApproval: true,
        impact: 'high'
      }
    ],
    performanceThresholds: {
      minimumScore: 60,
      targetScore: 85,
      maxValidationTime: 5000, // 5 seconds
      maxRecommendationTime: 3000, // 3 seconds
      maxReportTime: 10000 // 10 seconds
    }
  }
}
