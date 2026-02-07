import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SidebarNavigation } from "@/components/dashboard/sidebar-navigation"
import { TopNavigation } from "@/components/dashboard/top-navigation"
import { ResponsiveLayoutProvider } from "@/components/dashboard/responsive-layout-provider"
import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { checkOnboardingStatus } from "@/lib/guards/onboarding-guard"
import { redirect } from "next/navigation"
import { PaymentGuard } from "@/components/guards/payment-guard"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
        redirect("/login")
    }

    // CHECK ONBOARDING STATUS - HARD GATE
    if (currentUser.org_id) {
        const onboardingCompleted = await checkOnboardingStatus(currentUser.org_id)
        
        if (!onboardingCompleted) {
            redirect('/onboarding')  // ← MANDATORY REDIRECT
        }
    }

    return (
        <PaymentGuard>
            <ResponsiveLayoutProvider>
                <SidebarProvider>
                    <SidebarNavigation />
                    <SidebarInset>
                        <TopNavigation
                            email={currentUser.email}
                            name={currentUser.first_name || currentUser.email.split('@')[0]}
                        />
                        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                            {children}
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </ResponsiveLayoutProvider>
        </PaymentGuard>
    )
}
