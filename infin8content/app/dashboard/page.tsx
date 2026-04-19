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

  // ----- No-workflow empty state -----
  if (!workflows || workflows.length === 0) {
    if (isTrial) {
      return (
        <div className="space-y-6 mx-auto max-w-xl py-20">
          <TrialChecklist hasWorkflow={false} hasCompletedArticle={false} />
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Your $1 trial is active ✨</h1>
            <p className="mt-2 text-muted-foreground">
              Experience the power of Infin8Content. You can generate one complete, full-length article during your trial to see the quality of our AI engine.
            </p>
            <Link
              href="/dashboard/workflows/new"
              className="inline-block mt-6 rounded-md bg-primary px-6 py-3 text-white"
            >
              Generate your first article
            </Link>
          </div>
        </div>
      )
    }
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h1 className="text-2xl font-semibold">You're all set 🎉</h1>
        <p className="mt-2 text-muted-foreground">
          Your workspace is ready. Create your first workflow to start generating content automatically.
        </p>
        <Link
          href="/dashboard/workflows/new"
          className="inline-block mt-6 rounded-md bg-primary px-6 py-3 text-white"
        >
          Create your first workflow
        </Link>
      </div>
    )
  }

  // ----- Trial checklist flags -----
  let hasWorkflow = false
  let hasCompletedArticle = false
  if (isTrial) {
    hasWorkflow = workflows.length > 0
    hasCompletedArticle = (rawArticles ?? []).some((a) => a.status === 'completed')
  }

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
  const publishedTotal = articles.filter((a) => a.status === "published").length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Onboarding checklist (collapses to slim bar by default — TrialChecklist handles its own state) */}
      {isTrial && (
        <TrialChecklist
          hasWorkflow={hasWorkflow}
          hasCompletedArticle={hasCompletedArticle}
        />
      )}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0a0a0a", margin: 0, letterSpacing: "-0.4px" }}>
            Overview
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "#9aa3b0" }}>
            Your content engine at a glance
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#444",
          cursor: "pointer", padding: "6px 12px", borderRadius: 8,
          border: "1px solid #e4e7ec", background: "#fff", whiteSpace: "nowrap",
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%", background: "#0a0a0a",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          Watch Video Tutorial
        </div>
      </div>

      {/* Row 1: Active Services | Generate Articles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.55fr", gap: 14 }}>
        <ActiveServicesCard summary={summary} />
        <GenerateArticlesCard />
      </div>

      {/* Row 2: Stat cards | Content Activity Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.55fr", gap: 14 }}>
        {/* Two stacked stat cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Stat: Generated */}
          <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 12, padding: "16px 20px", flex: 1 }}>
            <div style={{ fontSize: 17, marginBottom: 6 }}>📄</div>
            <div style={{ fontSize: 12, color: "#9aa3b0", marginBottom: 5 }}>Generated — Articles created this month</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.5px" }}>{generatedThisMonth}</div>
          </div>

          {/* Stat: Published */}
          <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 12, padding: "16px 20px", flex: 1 }}>
            <div style={{ fontSize: 17, marginBottom: 6 }}>✅</div>
            <div style={{ fontSize: 12, color: "#9aa3b0", marginBottom: 5 }}>Published — Live on your sites</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.5px" }}>{publishedTotal}</div>
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
