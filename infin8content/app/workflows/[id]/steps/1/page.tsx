import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { WorkflowStepLayoutClient } from '@/components/workflows/WorkflowStepLayoutClient'
import { Step1ICPForm } from '@/components/workflows/steps/Step1ICPForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Step1Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 1)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={1}>
      <Step1ICPForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}
