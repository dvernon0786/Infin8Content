import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { WorkflowStepLayoutClient } from '@/components/workflows/WorkflowStepLayoutClient'
import { Step7ValidationForm } from '@/components/workflows/steps/Step7ValidationForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Step7Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 7)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={7}>
      <Step7ValidationForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}
