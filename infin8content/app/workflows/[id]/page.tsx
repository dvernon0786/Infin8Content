import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ step?: string }>
}

export default async function WorkflowRedirect({ params, searchParams }: PageProps) {
  const { id } = await params
  const { step } = await searchParams
  
  // Parse and validate step - only allow 1-9
  const parsedStep = parseInt(step ?? '1', 10)
  const safeStep = Number.isNaN(parsedStep) || parsedStep < 1 || parsedStep > 9
    ? 1
    : parsedStep
  
  // Redirect to canonical folder-based routing
  redirect(`/workflows/${id}/steps/${safeStep}`)
}
