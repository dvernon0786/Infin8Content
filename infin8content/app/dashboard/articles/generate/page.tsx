import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import { ArticleGenerationPageClient } from './article-generation-client'

export default async function ArticleGenerationPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.org_id) {
    redirect('/login')
  }

  return (
    <>
      <ArticleGenerationPageClient organizationId={currentUser.org_id!} />
    </>
  )
}
