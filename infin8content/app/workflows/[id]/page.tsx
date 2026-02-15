import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ step?: string }>
}

export default async function WorkflowRedirect({ params, searchParams }: PageProps) {
  const { id } = await params
  const { step } = await searchParams
  
  // Default to step 1 if no step provided
  const targetStep = step ?? '1'
  
  // Redirect to canonical folder-based routing
  redirect(`/workflows/${id}/steps/${targetStep}`)
}
