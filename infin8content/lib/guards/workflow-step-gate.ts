import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getStepFromState, canAccessStep as canAccessWorkflowStep, getNextStep, getPreviousStep } from '@/lib/services/workflow-engine/workflow-progression'
import { WorkflowState as StateMachineState } from '@/lib/fsm/workflow-events'

export interface WorkflowState {
  id: string
  name: string
  state: StateMachineState
  created_at: string
  updated_at: string
}

export async function getWorkflowState(workflowId: string): Promise<WorkflowState | null> {
  const user = await getCurrentUser()
  if (!user?.org_id) return null

  const supabase = createServiceRoleClient()
  
  const { data, error } = await supabase
    .from('intent_workflows')
    .select('*')
    .eq('id', workflowId)
    .eq('organization_id', user.org_id)
    .single() as { data: any; error: any }

  if (error || !data) return null

  return {
    id: data.id as string,
    name: data.name as string,
    state: data.state as StateMachineState,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  }
}

export function canAccessStep(workflowState: WorkflowState, targetStep: number): boolean {
  // Use state-driven access control instead of stored current_step
  return canAccessWorkflowStep(workflowState.state, targetStep)
}

export async function requireWorkflowStepAccess(workflowId: string, targetStep: number): Promise<WorkflowState> {
  const workflowState = await getWorkflowState(workflowId)
  
  if (!workflowState) {
    redirect('/dashboard')
  }

  // If workflow is completed, redirect to dashboard
  if (workflowState.state === 'completed') {
    redirect('/dashboard')
  }

  // If workflow is cancelled, redirect to dashboard
  if (workflowState.state === 'cancelled') {
    redirect('/dashboard')
  }

  // If trying to access future step, redirect to current step
  if (!canAccessStep(workflowState, targetStep)) {
    const currentStep = getStepFromState(workflowState.state)
    redirect(`/workflows/${workflowId}/steps/${currentStep}`)
  }

  return workflowState
}

export function getStepUrl(workflowId: string, step: number): string {
  return `/workflows/${workflowId}/steps/${step}`
}

export function getNextStepUrl(workflowState: WorkflowState): string | null {
    const nextStep = getNextStep(workflowState.state)
    if (!nextStep) return null
    return getStepUrl(workflowState.id, nextStep)
  }

export function getPreviousStepUrl(workflowState: WorkflowState): string | null {
    const previousStep = getPreviousStep(workflowState.state)
    if (!previousStep) return null
    return getStepUrl(workflowState.id, previousStep)
  }