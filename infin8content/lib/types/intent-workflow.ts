// Intent workflow types for Story 33.1
// Multi-tenant workflow management with organization context

import { SupabaseClient } from '@supabase/supabase-js'
import { 
  ALL_WORKFLOW_STATES,
  type WorkflowState 
} from '@/lib/constants/intent-workflow-steps'

export interface IntentWorkflow {
  id: string
  organization_id: string
  name: string
  state: WorkflowState
  created_at: string
  created_by: string
  updated_at: string
}

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
  state?: WorkflowState
  created_by: string
}

export interface IntentWorkflowUpdate {
  name?: string
  state?: WorkflowState
}

// Validation schemas
export const intentWorkflowStates = ALL_WORKFLOW_STATES

export const isValidWorkflowState = (state: string): state is WorkflowState => {
  return intentWorkflowStates.includes(state as WorkflowState)
}
