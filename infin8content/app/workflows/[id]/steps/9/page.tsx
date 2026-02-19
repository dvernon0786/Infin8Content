import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { WorkflowStepLayoutClient } from '@/components/workflows/WorkflowStepLayoutClient'
import { Step9ArticlesForm } from '@/components/workflows/steps/Step9ArticlesForm'

interface PageProps {
  params: { id: string }
}

export default async function Step9Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 9)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={9}>
      <Step9ArticlesForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}
