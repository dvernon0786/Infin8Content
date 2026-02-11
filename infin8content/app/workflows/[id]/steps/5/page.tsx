import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { WorkflowStepLayoutClient } from '@/components/workflows/WorkflowStepLayoutClient'
import { Step5FilteringForm } from '@/components/workflows/steps/Step5FilteringForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Step5Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 5)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={5}>
      <Step5FilteringForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}
