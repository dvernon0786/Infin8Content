export const APPROVAL_THRESHOLDS = Object.freeze({
  seeds: 1,
  longtails: 2,
  clusters: 1,
  subtopics: 1,
} as const)

export type ApprovalEntityType = keyof typeof APPROVAL_THRESHOLDS
