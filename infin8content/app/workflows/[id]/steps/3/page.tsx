import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { WorkflowStepLayoutClient } from '@/components/workflows/WorkflowStepLayoutClient'
import { Step3SeedsForm } from '@/components/workflows/steps/Step3SeedsForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Step3Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 3)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={3}>
      <Step3SeedsForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}
