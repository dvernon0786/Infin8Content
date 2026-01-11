"use client"

import {
    BarChart,
    FileText,
    Globe,
    PenTool,
    Search,
    Settings,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
    {
        title: "Research",
        url: "/dashboard/research",
        icon: Search,
    },
    {
        title: "Write",
        url: "/dashboard/write",
        icon: PenTool,
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

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                                        <Link href={item.url} aria-label={`Navigate to ${item.title}`}>
                                            <item.icon aria-hidden="true" />
                                            <span>{item.title}</span>
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
