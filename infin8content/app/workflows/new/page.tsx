import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { requireOnboardingComplete } from "@/lib/guards/onboarding-gate"
import { CreateWorkflowForm } from "@/components/workflows/CreateWorkflowForm"

export default async function NewWorkflowPage() {
  const user = await getCurrentUser()
  if (!user?.org_id) redirect("/login")

  // 🔒 HARD GATE — production authority
  await requireOnboardingComplete(user.org_id)

  return (
    <div className="mx-auto max-w-xl py-16">
      <h1 className="text-3xl font-bold">Create workflow</h1>
      <p className="mt-2 text-muted-foreground">
        Start a new intent workflow.
      </p>

      <div className="mt-6">
        <CreateWorkflowForm />
      </div>
    </div>
  )
}
