"use client"

import {
    BarChart,
    FileText,
    Globe,
    PenTool,
    Search,
    Settings,
    Menu,
    X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useResponsiveNavigation } from "@/hooks/use-responsive-navigation"
import { responsiveCSSVars } from "@/lib/utils/responsive-breakpoints"

const items = [
    {
        title: "Write",
        url: "/dashboard/write",
        icon: PenTool,
    },
    {
        title: "Research",
        url: "/dashboard/research",
        icon: Search,
    },
    {
        title: "Publish",
        url: "/dashboard/publish",
        icon: Globe,
    },
    {
        title: "Articles",
        url: "/dashboard/articles",
        icon: FileText,
    },
    {
        title: "Track",
        url: "/dashboard/track",
        icon: BarChart,
    },
    {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
    },
]

export function SidebarNavigation() {
    const pathname = usePathname()
    const { isMobile, isTablet, isDesktop, sidebarOpenMobile, setSidebarOpenMobile } = useResponsiveNavigation()

    // Mobile-specific header with close button
    const mobileHeader = (
        <SidebarHeader className="border-b">
            <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">I8C</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpenMobile(false)}
                    className="h-8 w-8"
                    style={{ minHeight: '44px', minWidth: '44px' }} // Critical touch target with inline fallback
                    aria-label="Close sidebar"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </SidebarHeader>
    )

    // Desktop/tablet header with full branding
    const desktopHeader = (
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                <span className="font-semibold text-lg">Infin8Content</span>
                {isTablet && (
                    <Badge variant="secondary" className="text-xs">
                        Tablet
                    </Badge>
                )}
            </div>
        </SidebarHeader>
    )

    return (
        <Sidebar>
            {isMobile ? mobileHeader : desktopHeader}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className={cn(
                        "transition-opacity duration-200",
                        isMobile && "sr-only" // Hide label on mobile for cleaner look
                    )}>
                        Production
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton 
                                        asChild 
                                        isActive={pathname.startsWith(item.url)}
                                        className={cn(
                                            // Touch-optimized sizing for mobile
                                            isMobile && "min-h-[44px] py-3",
                                            // Smooth transitions
                                            "transition-all duration-200"
                                        )}
                                        style={isMobile ? { minHeight: '44px' } : undefined} // Critical touch target fallback
                                    >
                                        <Link 
                                            href={item.url} 
                                            aria-label={`Navigate to ${item.title}`}
                                            onClick={() => {
                                                // Auto-close mobile sidebar after navigation
                                                if (isMobile) {
                                                    setSidebarOpenMobile(false)
                                                }
                                            }}
                                        >
                                            <item.icon 
                                                aria-hidden="true" 
                                                className={cn(
                                                    "shrink-0",
                                                    isMobile && "h-5 w-5" // Larger icons on mobile
                                                )} 
                                            />
                                            <span className={cn(
                                                "truncate",
                                                isMobile && "text-sm font-medium" // Adjust text size for mobile
                                            )}>
                                                {item.title}
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

            </SidebarContent>
        </Sidebar>
    )
}
