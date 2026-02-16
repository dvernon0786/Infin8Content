import { createServiceRoleClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/get-current-user"
import Link from "next/link"
import { redirect } from "next/navigation"
import { WorkflowDashboard } from "@/components/dashboard/workflow-dashboard/WorkflowDashboard"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user || !user.org_id) {
    redirect('/login')
  }

  const supabase = createServiceRoleClient()

  const { data: workflows } = await supabase
    .from("intent_workflows")
    .select("id")
    .eq("organization_id", user.org_id)

  if (!workflows || workflows.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h1 className="text-2xl font-semibold">You're all set 🎉</h1>
        <p className="mt-2 text-muted-foreground">
          Your workspace is ready. Create your first workflow to start generating content automatically.
        </p>
        <Link
          href="/workflows/new"
          className="inline-block mt-6 rounded-md bg-primary px-6 py-3 text-white"
        >
          Create your first workflow
        </Link>
      </div>
    )
  }

  return <WorkflowDashboard />
}
