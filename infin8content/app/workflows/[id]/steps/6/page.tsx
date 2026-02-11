import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { WorkflowStepLayoutClient } from '@/components/workflows/WorkflowStepLayoutClient'
import { Step6ClusteringForm } from '@/components/workflows/steps/Step6ClusteringForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Step6Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 6)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={6}>
      <Step6ClusteringForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}
