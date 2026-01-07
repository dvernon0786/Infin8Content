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
          <p className="text-muted-foreground">Authentication required. Please log in.</p>
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
        <h1 className="text-3xl font-bold tracking-tight">Keyword Research</h1>
        <p className="text-muted-foreground">
          Research keywords with search volume, difficulty, and trend data
        </p>
      </div>

      {/* Usage Limit Info */}
      {limit !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Usage Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={plan === 'pro' || plan === 'agency' ? 'default' : 'secondary'}>
                {plan.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
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

