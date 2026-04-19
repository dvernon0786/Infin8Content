import { createServiceRoleClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/get-current-user"
import Link from "next/link"
import { redirect } from "next/navigation"
import { TrialChecklist } from "@/components/dashboard/trial-checklist"
import { WorkflowDashboard } from "@/components/dashboard/workflow-dashboard/WorkflowDashboard"
import { ActiveServicesCard } from "@/components/dashboard/active-services-card"
import { GenerateArticlesCard } from "@/components/dashboard/generate-articles-card"
import { ContentActivityChart } from "@/components/dashboard/content-activity-chart"
import { calculateSummary } from "@/lib/services/intent-engine/workflow-dashboard-service"
import type { DashboardArticle } from "@/lib/types/dashboard.types"
import type { WorkflowDashboardItem } from "@/lib/services/intent-engine/workflow-dashboard-service"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user || !user.org_id) {
    redirect('/login')
  }

  const supabase = createServiceRoleClient()

  // Fetch workflows and articles in parallel
  const [{ data: workflows }, { data: rawArticles }] = await Promise.all([
    supabase
      .from("intent_workflows")
      .select("id, name, state, progress_percentage, created_at, updated_at, created_by, estimated_completion")
      .eq("organization_id", user.org_id),
    supabase
      .from("articles")
      .select("id, keyword, title, status, created_at, updated_at, scheduled_at, publish_at")
      .eq("org_id", user.org_id)
      .order("created_at", { ascending: false })
      .limit(500),
  ])

  const isTrial = (user.organizations?.plan || user.organizations?.plan_type)?.toLowerCase() === 'trial'

  // Show the dashboard UI regardless of whether workflows exist.
  // TrialChecklist will render as a collapsible banner when appropriate.
  const hasWorkflow = (workflows ?? []).length > 0
  const hasCompletedArticle = (rawArticles ?? []).some((a) => a.status === 'completed')

  // (flags computed above) TrialChecklist will receive `hasWorkflow` and `hasCompletedArticle`.

  // ----- Summary for ActiveServicesCard -----
  // Build lightweight WorkflowDashboardItem list (only fields calculateSummary needs)
  const workflowItems: WorkflowDashboardItem[] = (workflows ?? []).map((w) => ({
    id: w.id,
    name: w.name ?? "",
    state: w.state,
    progress_percentage: w.progress_percentage ?? 0,
    created_at: w.created_at,
    updated_at: w.updated_at,
    created_by: w.created_by ?? "",
    estimated_completion: w.estimated_completion ?? undefined,
    keywords: 0,
    articles: 0,
    display_updated_at: w.updated_at,
    display_created_at: w.created_at,
  }))
  const summary = calculateSummary(workflowItems)

  // ----- Stat card calculations -----
  const articles: DashboardArticle[] = (rawArticles ?? []) as DashboardArticle[]
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const generatedThisMonth = articles.filter((a) => new Date(a.created_at) >= thisMonth).length
  const publishedTotal = articles.filter((a) => !!a.publish_at).length

  return (
    <div className="flex flex-col gap-5">
      {/* Onboarding checklist (collapses to slim bar by default — TrialChecklist handles its own state) */}
      {isTrial && (
        <TrialChecklist
          hasWorkflow={hasWorkflow}
          hasCompletedArticle={hasCompletedArticle}
        />
      )}

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold dashboard-header-title">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your content engine at a glance</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white whitespace-nowrap dashboard-watch-btn">
          <div className="dashboard-watch-icon">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          Watch Video Tutorial
        </div>
      </div>

      {/* Row 1: Active Services | Generate Articles */}
      <div className="dashboard-grid">
        <ActiveServicesCard summary={summary} />
        <GenerateArticlesCard />
      </div>

      {/* Row 2: Stat cards | Content Activity Chart */}
      <div className="dashboard-grid">
        {/* Two stacked stat cards */}
        <div className="flex flex-col gap-2.5">
          {/* Stat: Generated */}
          <div className="stat-card">
            <div className="text-lg mb-1.5">📄</div>
            <div className="text-xs text-muted-foreground mb-1">Generated — Articles created this month</div>
            <div className="text-3xl font-extrabold text-neutral-900">{generatedThisMonth}</div>
          </div>

          {/* Stat: Published */}
          <div className="stat-card">
            <div className="text-lg mb-1.5">✅</div>
            <div className="text-xs text-muted-foreground mb-1">Published — Live on your sites</div>
            <div className="text-3xl font-extrabold text-neutral-900">{publishedTotal}</div>
          </div>
        </div>

        {/* Content Activity Chart */}
        <ContentActivityChart articles={articles} />
      </div>

      {/* Existing workflow dashboard (full width below) */}
      <WorkflowDashboard orgId={user.org_id} />
    </div>
  )
}
