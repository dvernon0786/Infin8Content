import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SidebarNavigation } from "@/components/dashboard/sidebar-navigation"
import { TopNavigation } from "@/components/dashboard/top-navigation"
import { ResponsiveLayoutProvider } from "@/components/dashboard/responsive-layout-provider"
import { redirect } from "next/navigation"
import { PaymentGuard } from "@/components/guards/payment-guard"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MobileCard } from "@/components/mobile/mobile-card"
import { useMobileLayout } from "@/hooks/use-mobile-layout"
import { ContentPerformanceDashboard } from "@/components/dashboard/content-performance-dashboard"
import { QuickActions } from "@/components/dashboard/quick-actions"

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

  // Primary CTA logic
  const articles = currentUser.organizations?.articles || []

  interface Article {
    status: string
    updated_at: string
    id: string
  }

  const latestActiveArticle = articles
    .filter((a: Article) => a.status !== "published")
    .sort(
      (a: Article, b: Article) =>
        new Date(b.updated_at).getTime() -
        new Date(a.updated_at).getTime()
    )[0]

  const primaryCTA = latestActiveArticle
    ? {
        label: "Continue Article",
        href: `/dashboard/articles/${latestActiveArticle.id}/edit`,
      }
    : {
        label: "Create New Article",
        href: "/dashboard/articles/generate",
      }

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
          <h1 className="text-2xl font-semibold tracking-tight">
            Let's keep your content moving
          </h1>
          <p className="text-muted-foreground">
            Pick up where you left off or start a new article
          </p>
        </div>

        {/* Primary CTA */}
        <div className="flex items-center gap-3">
          <a
            href={primaryCTA.href}
            className="
              inline-flex items-center justify-center
              rounded-md px-6 py-3
              text-sm font-medium
              bg-primary text-primary-foreground
              hover:bg-primary/90
              transition-colors
            "
          >
            {primaryCTA.label}
          </a>

          {latestActiveArticle && (
            <span className="text-sm text-muted-foreground">
              Last updated{" "}
              {new Date(latestActiveArticle.updated_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Mobile-Optimized Dashboard Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Desktop Card */}
          <Card className="hidden md:block">
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

          {/* Mobile Card */}
          <MobileCard
            title="Current Plan"
            subtitle={orgName}
            description={`Status: ${status}`}
            badge={plan.toUpperCase()}
            badgeColor={plan === 'pro' ? 'blue' : 'gray'}
            className="md:hidden"
            testId="mobile-plan-card"
          >
            <div className="text-2xl font-bold">{orgName}</div>
          </MobileCard>
        </div>

        {/* Content Performance Dashboard */}
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">
            Content momentum
          </h2>
          <p className="text-sm text-muted-foreground">
            How your content production is trending
          </p>

          <ContentPerformanceDashboard />
        </div>

        {/* Additional Mobile-Optimized Content */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions Card */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>

          <MobileCard
            title="Quick Actions"
            badge="3"
            badgeColor="blue"
            className="md:hidden"
            testId="mobile-quick-actions-card"
          >
            <QuickActions />
          </MobileCard>
        </div>
      </div>
    </>
  )
}
