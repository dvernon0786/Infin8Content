import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { requireOnboardingComplete } from "@/lib/guards/onboarding-gate"

export default async function NewWorkflowPage() {
  const user = await getCurrentUser()
  if (!user?.org_id) {
    redirect("/login")
  }

  // Enforce onboarding completion
  await requireOnboardingComplete(user.org_id)

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Workflow</h1>
        <p className="mt-2 text-muted-foreground">
          Set up automated content generation workflows for your organization.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="mb-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2">Workflow Creation</h2>
        <p className="text-muted-foreground mb-6">
          Workflow creation interface will be implemented here. This will allow you to configure content generation workflows with topics, schedules, and publishing targets.
        </p>
        <div className="text-sm text-muted-foreground">
          For now, workflows are managed through the admin interface.
        </div>
      </div>
    </div>
  )
}
