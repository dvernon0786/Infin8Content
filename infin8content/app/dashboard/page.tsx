import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SidebarNavigation } from "@/components/dashboard/sidebar-navigation"
import { TopNavigation } from "@/components/dashboard/top-navigation"
import { ResponsiveLayoutProvider } from "@/components/dashboard/responsive-layout-provider"
import { LayoutDiagnostic } from "@/components/layout-diagnostic"
import { redirect } from "next/navigation"
import { PaymentGuard } from "@/components/guards/payment-guard"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function DashboardPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    // Should be handled by middleware, but safe fallback
    return (
      <>
        <div className="flex flex-col gap-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Unable to load user data. Please try refreshing the page.</p>
          </div>
        </div>
      </>
    )
  }

  // AC requires "Welcome back, {First Name}" - use first_name if available, fallback to email prefix
  const firstName = currentUser.first_name || currentUser.email.split('@')[0]
  const orgName = currentUser.organizations?.name
  const plan = currentUser.organizations?.plan || "starter"
  const status = currentUser.organizations?.payment_status?.replace('_', ' ') || "active"

  // If no organization, user shouldn't be here (middleware should redirect)
  // But handle gracefully for edge cases
  if (!orgName) {
    return (
      <>
        <div className="flex flex-col gap-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Organization not found. Please contact support.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Main Content */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {firstName}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Plan
              </CardTitle>
              <Badge variant={plan === 'pro' ? 'default' : 'secondary'}>
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
      
      {/* LayoutDiagnostic for ongoing monitoring */}
      <LayoutDiagnostic />
    </>
  )
}
