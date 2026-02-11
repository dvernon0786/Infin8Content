import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { WorkflowStepLayoutClient } from '@/components/workflows/WorkflowStepLayoutClient'
import { Step4LongtailsForm } from '@/components/workflows/steps/Step4LongtailsForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Step4Page({ params }: PageProps) {
  const { id } = await params
  const workflow = await requireWorkflowStepAccess(id, 4)

  return (
    <WorkflowStepLayoutClient workflow={workflow} step={4}>
      <Step4LongtailsForm workflowId={workflow.id} />
    </WorkflowStepLayoutClient>
  )
}
