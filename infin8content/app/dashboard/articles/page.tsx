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
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a0a0a', letterSpacing: '-0.4px' }}>
              All Articles
            </h1>
            <p style={{ fontSize: 13, color: '#9aa3b0', marginTop: 3 }}>
              Browse through all articles that you've generated so far.
            </p>
          </div>
          <Link href="/dashboard/articles/generate">
            <Button style={{
              background: '#0066FF',
              color: '#fff',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: 'none'
            }}>
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
