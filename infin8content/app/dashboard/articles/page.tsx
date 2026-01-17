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
            <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
            <p className="text-muted-foreground">
              Manage and track your article generation progress
            </p>
          </div>
          {/* Mobile-Optimized Button */}
          <div className="hidden sm:block">
            <Link href="/dashboard/articles/generate">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Article
              </Button>
            </Link>
          </div>
          <div className="sm:hidden">
            <Link href="/dashboard/articles/generate">
              <TouchTarget size="large" variant="primary" className="w-full">
                <Plus className="h-5 w-5 mr-2" />
                Generate Article
              </TouchTarget>
            </Link>
          </div>
        </div>

        {/* Search and Filters - Client Component */}
        <ArticlesClient orgId={currentUser.org_id} />
        
      </div>
    </>
  )
}
