import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { WorkflowStepLayoutClient } from '@/components/workflows/WorkflowStepLayoutClient'
import { Step1ICPForm } from '@/components/workflows/steps/Step1ICPForm'

interface PageProps {
  params: { id: string }
}

export default async function Step1Page({ params }: PageProps) {
  const workflow = await requireWorkflowStepAccess(params.id, 1)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={1}>
      <Step1ICPForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}
