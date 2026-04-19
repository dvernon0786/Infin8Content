"use client";

import {
    BarChart,
    FileText,
    Globe,
    PenTool,
    Search,
    Settings,
    Menu,
    X,
    MoreHorizontal,
    Eye,
} from "lucide-react"
import Image from "next/image"
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
        title: "Dashboard",
        url: "/dashboard",
        icon: BarChart,
    },
    {
        title: "Articles",
        url: "/dashboard/articles",
        icon: FileText,
    },
    {
        title: "AI Visibility",
        url: "/dashboard/llm-visibility",
        icon: Eye,
    },
    {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
    },
]

// LEGACY DASHBOARD ITEMS — DISABLED FOR MVP
/*
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
        title: "Track",
        url: "/dashboard/track",
        icon: BarChart,
    },
*/

import { PLAN_LIMITS } from "@/lib/config/plan-limits"

interface SidebarNavigationProps {
    orgName?: string
    plan?: keyof typeof PLAN_LIMITS.article_generation
    usage?: number
}

export function SidebarNavigation({ orgName = "Acme Agency", plan, usage }: SidebarNavigationProps) {
    const pathname = usePathname()
    const { isMobile, setSidebarOpenMobile } = useResponsiveNavigation()

    const currentPlan = plan || 'trial'
    const currentUsage = usage || 0
    const limit = PLAN_LIMITS.article_generation[currentPlan]
    const progressPercentage = limit ? Math.min(100, Math.round((currentUsage / limit) * 100)) : 0
    const planLabel = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)

    return (
        <Sidebar className="border-right border-[#E5E5E7] bg-white">
            {/* 1. Org Switcher / Header */}
            <SidebarHeader className="p-4 mb-2 border-b border-[#F4F4F6]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#217CEB] to-[#4A42CC] flex items-center justify-center text-white font-black text-lg shadow-lg">
                        ∞
                    </div>
                    <span className="font-poppins text-sm font-extrabold text-text-primary tracking-tight">
                        Infin8Content
                    </span>
                </div>

                <div className="p-2 border border-[#E5E5E7] bg-[#F4F4F6] rounded-lg cursor-pointer flex items-center justify-between hover:bg-[#E5E5E7] transition-colors group">
                    <div className="flex flex-col">
                        <span className="font-poppins text-[11px] font-bold text-text-primary leading-4 truncate max-w-30">
                            {orgName}
                        </span>
                        <span className="font-lato text-[9px] font-bold text-[#71717A] uppercase tracking-wider">
                            {planLabel} Plan
                        </span>
                    </div>
                    <MoreHorizontal className="h-3 w-3 text-[#71717A] group-hover:text-[#217CEB] transition-colors" />
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3">
                <SidebarGroup>
                    <SidebarGroupLabel className="px-3 mb-2 font-lato text-[9px] font-black text-[#71717A] uppercase tracking-[0.15em]">
                        Navigation
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {items.map((item) => {
                                const isActive = pathname === item.url || (item.url !== '/dashboard' && pathname.startsWith(item.url))
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            className={cn(
                                                "min-h-10 px-3 py-2 rounded-lg transition-all duration-200 border border-transparent",
                                                isActive ? "bg-[#217CEB]/8 border-[#217CEB]/20 text-[#217CEB]" : "text-[#52525B] hover:bg-[#F4F4F6]"
                                            )}
                                        >
                                            <Link
                                                href={item.url}
                                                onClick={() => isMobile && setSidebarOpenMobile(false)}
                                                className="flex items-center gap-3"
                                            >
                                                <item.icon className={cn("h-4 w-4", isActive ? "text-[#217CEB]" : "text-[#71717A]")} />
                                                <span className={cn(
                                                    "font-lato text-[13px] tracking-tight flex-1",
                                                    isActive ? "font-bold" : "font-medium"
                                                )}>
                                                    {item.title}
                                                </span>
                                                {item.title === "Articles" && currentUsage > 0 && (
                                                    <Badge className="ml-auto bg-warning/10 text-warning text-[9px] font-black border-none px-1.5 py-0 h-4">
                                                        {currentUsage}
                                                    </Badge>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* 3. Usage Meter / Footer */}
            <div className="p-4 mt-auto">
                <div className="p-3 bg-[#217CEB]/5 border border-[#217CEB]/15 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-lato text-[10px] font-black text-[#217CEB] uppercase tracking-wider">
                            {planLabel} Plan
                        </span>
                        <span className="font-lato text-[10px] font-bold text-[#71717A]">
                            {limit ? `${currentUsage} / ${limit} articles` : `${currentUsage} articles`}
                        </span>
                    </div>
                    {limit ? (
                        <div className="h-1.5 bg-[#E5E5E7] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-linear-to-r from-[#217CEB] to-[#4A42CC] rounded-full transition-all duration-500 ease-out shadow-[0_0_4px_rgba(33,124,235,0.3)]"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    ) : (
                        <div className="h-1.5 bg-[#217CEB]/10 rounded-full overflow-hidden">
                            <div className="h-full w-full bg-linear-to-r from-[#217CEB] to-[#4A42CC] opacity-20" />
                        </div>
                    )}
                </div>
            </div>
        </Sidebar>
    )
}
