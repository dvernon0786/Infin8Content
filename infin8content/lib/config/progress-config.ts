/**
 * Progress tracking configuration constants
 * Story 4a.6: Real-Time Progress Tracking and Updates
 */

export const PROGRESS_CONFIG = {
  // Progress percentage weights for different stages
  STAGE_WEIGHTS: {
    QUEUED: 0,
    RESEARCHING: 5,
    WRITING_START: 10,
    WRITING_END: 90,
    GENERATING: 95,
    COMPLETED: 100,
  } as const,

  // Time estimation constants
  TIME_ESTIMATION: {
    MINIMUM_SECONDS: 30,
    RECONNECT_DELAY_MS: 1000,
    MAX_RECONNECT_ATTEMPTS: 5,
    CONNECTION_TIMEOUT_MS: 3000,
  } as const,

  // Progress calculation constants
  CALCULATION: {
    BASE_WRITING_PERCENTAGE: 10,
    WRITING_RANGE_PERCENTAGE: 80,
  } as const,
} as const;

/**
 * Calculate progress percentage based on current section and total sections
 */
export function calculateProgressPercentage(
  currentSection: number,
  totalSections: number,
  stage: 'researching' | 'writing' | 'generating' | 'completed'
): number {
  if (stage === 'completed') return PROGRESS_CONFIG.STAGE_WEIGHTS.COMPLETED;
  if (stage === 'researching') return PROGRESS_CONFIG.STAGE_WEIGHTS.RESEARCHING;
  if (stage === 'generating') return PROGRESS_CONFIG.STAGE_WEIGHTS.GENERATING;
  
  // For writing stage, calculate based on section progress
  if (stage === 'writing' && totalSections > 0) {
    const sectionProgress = (currentSection - 1) / totalSections;
    const writingProgress = PROGRESS_CONFIG.CALCULATION.BASE_WRITING_PERCENTAGE + 
      (sectionProgress * PROGRESS_CONFIG.CALCULATION.WRITING_RANGE_PERCENTAGE);
    return Math.min(writingProgress, PROGRESS_CONFIG.STAGE_WEIGHTS.WRITING_END);
  }
  
  return PROGRESS_CONFIG.STAGE_WEIGHTS.QUEUED;
}

/**
 * Calculate estimated time remaining based on elapsed time and progress
 */
export function calculateEstimatedTimeRemaining(
  elapsedSeconds: number,
  progressPercentage: number
): number | null {
  if (elapsedSeconds <= 0 || progressPercentage <= 0) return null;
  
  // Simple linear extrapolation
  const estimatedTotalSeconds = elapsedSeconds / (progressPercentage / 100);
  const remainingSeconds = estimatedTotalSeconds - elapsedSeconds;
  
  return Math.max(remainingSeconds, PROGRESS_CONFIG.TIME_ESTIMATION.MINIMUM_SECONDS);
}
