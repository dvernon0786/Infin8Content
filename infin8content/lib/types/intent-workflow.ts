// Intent workflow types for Story 33.1
// Multi-tenant workflow management with organization context

export interface IntentWorkflow {
  id: string
  organization_id: string
  name: string
  status: IntentWorkflowStatus
  created_at: string
  created_by: string
  updated_at: string
  workflow_data: Record<string, any>
}

export type IntentWorkflowStatus = 
  | 'step_0_auth'
  | 'step_1_icp' 
  | 'step_2_competitors'
  | 'step_3_keywords'
  | 'step_4_topics'
  | 'step_5_generation'
  | 'completed'
  | 'failed'

export interface CreateIntentWorkflowRequest {
  name: string
  organization_id?: string // Optional, will use user's org if not provided
}

export interface CreateIntentWorkflowResponse {
  id: string
  name: string
  organization_id: string
  status: IntentWorkflowStatus
  created_at: string
}

export interface IntentWorkflowError {
  error: string
  message: string
  details?: Record<string, any>
}

// Database types for Supabase
export interface IntentWorkflowInsert {
  id?: string
  organization_id: string
  name: string
  status?: IntentWorkflowStatus
  created_by: string
  workflow_data?: Record<string, any>
}

export interface IntentWorkflowUpdate {
  name?: string
  status?: IntentWorkflowStatus
  workflow_data?: Record<string, any>
}

// Validation schemas
export const intentWorkflowStatuses = [
  'step_0_auth',
  'step_1_icp',
  'step_2_competitors', 
  'step_3_keywords',
  'step_4_topics',
  'step_5_generation',
  'completed',
  'failed'
] as const

export const isValidIntentWorkflowStatus = (status: string): status is IntentWorkflowStatus => {
  return intentWorkflowStatuses.includes(status as IntentWorkflowStatus)
}
