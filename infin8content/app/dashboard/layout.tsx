import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SidebarNavigation } from "@/components/dashboard/sidebar-navigation"
import { TopNavigation } from "@/components/dashboard/top-navigation"
import { getCurrentUser } from "@/lib/supabase/get-current-user"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
        redirect("/login")
    }

    return (
        <SidebarProvider>
            <SidebarNavigation />
            <SidebarInset>
                <TopNavigation
                    email={currentUser.email}
                    name={currentUser.first_name || currentUser.email.split('@')[0]}
                />
                <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
