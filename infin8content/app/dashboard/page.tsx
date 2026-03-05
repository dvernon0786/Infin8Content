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
    const isTrial = (user.organizations?.plan_type || user.organizations?.plan)?.toLowerCase() === 'trial'

    if (isTrial) {
      return (
        <div className="mx-auto max-w-xl py-20 text-center">
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

  return <WorkflowDashboard orgId={user.org_id} />
}
