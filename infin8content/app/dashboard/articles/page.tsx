import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import ArticlesClient from './articles-client'
import { PLAN_LIMITS, type PlanType } from '@/lib/config/plan-limits'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TouchTarget } from '@/components/mobile/touch-target'

export default async function ArticlesPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.org_id) {
    redirect('/login')
  }

  const plan = ((currentUser.organizations as any)?.plan || 'trial').toLowerCase() as PlanType
  const generationLimit = PLAN_LIMITS.article_generation[plan] ?? null
  const articleUsage = (currentUser.organizations as any)?.article_usage ?? 0

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
          plan={plan}
          articleUsage={articleUsage}
          generationLimit={generationLimit}
        />

      </div>
    </>
  )
}
