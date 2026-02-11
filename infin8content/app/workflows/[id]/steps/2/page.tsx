import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { WorkflowStepLayoutClient } from '@/components/workflows/WorkflowStepLayoutClient'
import { Step2CompetitorsForm } from '@/components/workflows/steps/Step2CompetitorsForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Step2Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 2)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={2}>
      <Step2CompetitorsForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}
