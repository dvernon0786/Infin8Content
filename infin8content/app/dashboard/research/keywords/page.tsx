import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { KeywordResearchForm } from '@/components/research/keyword-research-form'
import { KeywordResultsTable, type KeywordResult } from '@/components/research/keyword-results-table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KeywordResearchPageClient } from './keyword-research-client'

export default async function KeywordResearchPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.org_id) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-8">
          <p className="font-lato hover:text-[--color-primary-blue] text-neutral-600 text-body">Authentication required. Please log in.</p>
        </div>
      </div>
    )
  }

  const plan = currentUser.organizations?.plan || 'starter'
  const planLimits: Record<string, number | null> = {
    starter: 50,
    pro: 200,
    agency: null,
  }
  const limit = planLimits[plan]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-poppins text-neutral-900 text-h2-desktop">Keyword Research</h1>
        <p className="font-lato hover:text-[--color-primary-blue] text-neutral-600 text-body">
          Research keywords with search volume, difficulty, and trend data
        </p>
      </div>

      {/* Usage Limit Info */}
      {limit !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="font-lato text-small font-medium text-neutral-900">Usage Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={plan === 'pro' ? 'default' : 'secondary'} className="bg-neutral-100 text-neutral-700 border border-neutral-200">
                {plan.toUpperCase()}
              </Badge>
              <span className="text-sm font-lato text-neutral-600">
                {limit} keyword researches per month
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Research Form and Results */}
      <KeywordResearchPageClient />
    </div>
  )
}

