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
          {/* Mobile-Optimized Button */}
          <div className="hidden sm:block">
            <Link href="/dashboard/articles/generate">
              <Button
                className="
                  bg-[--color-primary-blue]
                  text-white
                  hover:bg-[--color-primary-blue]/90
                  font-lato
                "
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Article
              </Button>
            </Link>
          </div>
          <div className="sm:hidden">
            <Link href="/dashboard/articles/generate">
              <TouchTarget
                size="large"
                className="
                  w-full
                  bg-[--color-primary-blue]
                  text-white
                  font-lato
                "
              >
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
