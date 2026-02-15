// Intent workflow types for Story 33.1
// Multi-tenant workflow management with organization context

import { SupabaseClient } from '@supabase/supabase-js'
import { 
  INTENT_WORKFLOW_STEPS, 
  ALL_WORKFLOW_STATES,
  type WorkflowState 
} from '@/lib/constants/intent-workflow-steps'

export interface IntentWorkflow {
  id: string
  organization_id: string
  name: string
  state: WorkflowState
  current_step: number
  created_at: string
  created_by: string
  updated_at: string
  workflow_data: Record<string, any>
}

export type IntentWorkflowStatus = WorkflowState

export interface CreateIntentWorkflowRequest {
  name: string
  organization_id?: string // Optional, will use user's org if not provided
}

export interface CreateIntentWorkflowResponse {
  id: string
  name: string
  organization_id: string
  state: WorkflowState
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
export const intentWorkflowStatuses = ALL_WORKFLOW_STATES

export const isValidIntentWorkflowStatus = (status: string): status is IntentWorkflowStatus => {
  return intentWorkflowStatuses.includes(status as IntentWorkflowStatus)
}
