import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import ArticlesClient from './articles-client'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ArticlesPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.org_id) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground">
            Manage and track your article generation progress
          </p>
        </div>
        <Link href="/dashboard/articles/generate">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Article
          </Button>
        </Link>
      </div>

      {/* Search and Filters - Client Component */}
      <ArticlesClient orgId={currentUser.org_id} />
    </div>
  )
}
