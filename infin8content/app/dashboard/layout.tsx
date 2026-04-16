import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SidebarNavigation } from "@/components/dashboard/sidebar-navigation"
import { TopNavigation } from "@/components/dashboard/top-navigation"
import { ResponsiveLayoutProvider } from "@/components/dashboard/responsive-layout-provider"
import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { checkOnboardingStatus } from "@/lib/guards/onboarding-guard"
import { redirect } from "next/navigation"
import { PaymentGuard } from "@/components/guards/payment-guard"
// Epic 12: Onboarding & Feature Discovery — additive imports
import { PaymentStatusBanner } from "@/components/dashboard/payment-status-banner"
import { AnnouncementBanner } from "@/components/dashboard/announcement-banner"
import { GuidedTourWrapper } from "@/components/onboarding/guided-tour/GuidedTourWrapper"
import { isFeatureFlagEnabled } from "@/lib/utils/feature-flags"
import { FEATURE_FLAG_KEYS } from "@/lib/types/feature-flag"

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

        // 🔥 ABSOLUTE LOCK-IN - Invariant violation check
        if (process.env.NODE_ENV === 'development' && !onboardingCompleted) {
            throw new Error(
                'Dashboard rendered without onboarding completion — invariant violated. ' +
                'This should be impossible due to middleware enforcement. ' +
                'Check middleware.ts and onboarding-guard.ts for bypass attempts.'
            )
        }

        if (!onboardingCompleted) {
            redirect('/onboarding')  // ← MANDATORY REDIRECT
        }
    }

    // Epic 12: Load feature flags and org state for new components (additive)
    const tourShown = (currentUser.organizations as any)?.onboarding_tour_shown ?? true
    const [toursEnabled, announcementsEnabled] = currentUser.org_id
        ? await Promise.all([
            isFeatureFlagEnabled(currentUser.org_id, FEATURE_FLAG_KEYS.ENABLE_GUIDED_TOURS),
            isFeatureFlagEnabled(currentUser.org_id, FEATURE_FLAG_KEYS.ENABLE_FEATURE_ANNOUNCEMENTS),
          ])
        : [false, false]

    return (
        <PaymentGuard>
            {/* Epic 12: Payment status + announcements — additive, above main layout */}
            <PaymentStatusBanner
                paymentStatus={currentUser.organizations?.payment_status}
                trialEndsAt={(currentUser.organizations as any)?.trial_ends_at}
                planType={currentUser.organizations?.plan}
            />
            {announcementsEnabled && <AnnouncementBanner />}
            {toursEnabled && <GuidedTourWrapper tourShown={tourShown} />}
            <ResponsiveLayoutProvider>
                <SidebarProvider>
                    <SidebarNavigation
                        orgName={currentUser.organizations?.name}
                        plan={currentUser.organizations?.plan as any}
                        usage={currentUser.organizations?.article_usage}
                    />
                    <SidebarInset>
                        <TopNavigation
                            email={currentUser.email}
                            name={currentUser.first_name || currentUser.email.split('@')[0]}
                            plan={currentUser.organizations?.plan as any}
                            usage={currentUser.organizations?.article_usage}
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
