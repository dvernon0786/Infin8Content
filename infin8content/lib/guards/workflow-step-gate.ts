import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createServiceRoleClient } from '@/lib/supabase/server'

export interface WorkflowState {
  id: string
  name: string
  status: string
  current_step: number
  completed_steps: number[]
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
    status: data.status as string,
    current_step: (data.current_step as number) || 1,
    completed_steps: (data.completed_steps as number[]) || [],
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  }
}

export function canAccessStep(workflowState: WorkflowState, targetStep: number): boolean {
  // Cannot access if workflow is completed or cancelled
  if (workflowState.status === 'completed' || workflowState.status === 'cancelled') {
    return false
  }

  // Can only access current step or completed steps
  return targetStep <= workflowState.current_step
}

export async function requireWorkflowStepAccess(workflowId: string, targetStep: number): Promise<WorkflowState> {
  const workflowState = await getWorkflowState(workflowId)
  
  if (!workflowState) {
    redirect('/dashboard')
  }

  // If workflow is completed, redirect to dashboard
  if (workflowState.status === 'completed') {
    redirect('/dashboard')
  }

  // If workflow is cancelled, redirect to dashboard
  if (workflowState.status === 'cancelled') {
    redirect('/dashboard')
  }

  // If trying to access future step, redirect to current step
  if (!canAccessStep(workflowState, targetStep)) {
    redirect(`/workflows/${workflowId}/steps/${workflowState.current_step}`)
  }

  return workflowState
}

export function getStepUrl(workflowId: string, step: number): string {
  return `/workflows/${workflowId}/steps/${step}`
}

export function getNextStepUrl(workflowState: WorkflowState): string | null {
  const nextStep = workflowState.current_step + 1
  if (nextStep > 9) return null // Only 9 steps total
  return getStepUrl(workflowState.id, nextStep)
}

export function getPreviousStepUrl(workflowState: WorkflowState): string | null {
  const previousStep = workflowState.current_step - 1
  if (previousStep < 1) return null
  return getStepUrl(workflowState.id, previousStep)
}