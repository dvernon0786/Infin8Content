import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { requireOnboardingComplete } from "@/lib/guards/onboarding-gate"

export default async function WorkflowsLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user?.org_id) {
    redirect("/login")
  }

  // Enforce onboarding completion for all workflow pages
  await requireOnboardingComplete(user.org_id)

  return <>{children}</>
}
