import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) return null

  const name = currentUser.email.split('@')[0]
  const orgName = currentUser.organizations?.name || "My Organization"
  const plan = currentUser.organizations?.plan || "starter"
  const status = currentUser.organizations?.payment_status?.replace('_', ' ') || "active"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground capitalize">
          Welcome back, {name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Plan
            </CardTitle>
            <Badge variant={plan === 'pro' || plan === 'agency' ? 'default' : 'secondary'}>
              {plan.toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgName}</div>
            <p className="text-xs text-muted-foreground capitalize">
              Status: {status}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
