import { redirect } from "next/navigation"
import { createServiceRoleClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/get-current-user"

export default async function OnboardingLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user?.org_id) redirect("/login")

  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from("organizations")
    .select("onboarding_completed")
    .eq("id", user.org_id)
    .single() as { data: { onboarding_completed: boolean } | null }

  if (data?.onboarding_completed) {
    redirect("/dashboard")
  }

  return (
    <div style={{
      background: "#08090d",
      color: "#e8eaf2",
      minHeight: "100vh",
      fontFamily: "var(--font-body, 'DM Sans', sans-serif)"
    }}>
      {children}
    </div>
  )
}
