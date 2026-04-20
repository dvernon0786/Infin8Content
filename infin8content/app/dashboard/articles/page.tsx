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

  const rawPlan = ((currentUser.organizations as any)?.plan || 'trial').toLowerCase()
  const defaultPlan: PlanType = 'trial'
  const plan: PlanType = rawPlan in PLAN_LIMITS.article_generation ? (rawPlan as PlanType) : defaultPlan
  const generationLimit = PLAN_LIMITS.article_generation[plan] ?? null
  const articleUsage = (currentUser.organizations as any)?.article_usage ?? 0

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[22px] font-extrabold text-neutral-900 tracking-[-0.4px]">All Articles</h1>
            <p className="text-sm text-neutral-400 mt-1">Browse through all articles that you've generated so far.</p>
          </div>
          <Link href="/dashboard/articles/generate">
            <Button className="bg-(--brand-electric-blue) text-white rounded-md font-semibold text-sm px-4 py-2 flex items-center gap-2">
              <Plus size={14} /> Write Article
            </Button>
          </Link>
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
