import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import ArticlesClient from './articles-client'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TouchTarget } from '@/components/mobile/touch-target'

export default async function ArticlesPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.org_id) {
    redirect('/login')
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-poppins text-neutral-900 text-h2-desktop">
              Articles
            </h1>
            <p className="font-lato text-neutral-600 text-body">
              Manage and track your article generation progress
            </p>
          </div>
        </div>

        {/* Search and Filters - Client Component */}
        <ArticlesClient
          orgId={currentUser.org_id}
          plan={currentUser.organizations?.plan || 'trial'}
        />

      </div>
    </>
  )
}
