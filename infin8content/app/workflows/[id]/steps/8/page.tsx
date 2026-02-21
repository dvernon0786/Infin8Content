import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { WorkflowStepLayoutClient } from '@/components/workflows/WorkflowStepLayoutClient'
import { Step8SubtopicsForm } from '@/components/workflows/steps/Step8SubtopicsForm'

interface PageProps {
  params: { id: string }
}

export default async function Step8Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 8)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={8}>
      <Step8SubtopicsForm workflowId={workflow.id} workflowState={workflow.state} />
    </WorkflowStepLayoutClient>
  )
}
