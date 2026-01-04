import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import CreateOrganizationForm from './create-organization-form'

export default async function CreateOrganizationPage() {
  const currentUser = await getCurrentUser()
  
  // Redirect if user already has organization
  if (currentUser?.org_id) {
    redirect('/dashboard')
  }
  
  return <CreateOrganizationForm />
}
