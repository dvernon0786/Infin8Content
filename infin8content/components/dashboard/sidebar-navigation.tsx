"use client";

import React from "react";

import {
    FileText,
    Settings,
    MoreHorizontal,
    Eye,
    LayoutGrid,
    Bot,
    BarChart3,
    Link2,
    ChevronDown,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
} from "@/components/ui/sidebar"
import { useResponsiveNavigation } from "@/hooks/use-responsive-navigation"
import { PLAN_LIMITS } from "@/lib/config/plan-limits"

interface SidebarNavigationProps {
    orgName?: string
    plan?: keyof typeof PLAN_LIMITS.article_generation
    usage?: number
}

type NavSub = { title: string; url: string }
type NavItem = {
    id: string
    title: string
    url: string
    icon: React.ComponentType<any>
    exact?: boolean
    disabled?: boolean
    badge?: string
    sub?: NavSub[]
}

// Coming-soon items have no real routes
// Tour attribute mapping
const getTourAttribute = (itemId: string): string | undefined => {
  const map: Record<string, string> = {
    articles: "articles-nav",
    "blog-automation": "workflows-nav",
  }
  return map[itemId]
}

const NAV_ITEMS: NavItem[] = [
    {
        id: "overview",
        title: "Overview",
        url: "/dashboard",
        icon: LayoutGrid,
        exact: true,
    },
    {
        id: "articles",
        title: "Articles",
        url: "/dashboard/articles",
        icon: FileText,
        sub: [
            { title: "All Articles", url: "/dashboard/articles" },
            { title: "AI SEO Editor", url: "/dashboard/articles" },
        ],
    },
    {
        id: "blog-automation",
        title: "Blog Automation",
        url: "#",
        icon: Bot,
        sub: [
            { title: "Campaigns & Autoblogs", url: "#" },
            { title: "Site Optimizers", url: "#" },
            { title: "Integrations", url: "/dashboard/settings/integrations" },
            { title: "Feeds", url: "#" },
        ],
    },
    {
        id: "analytics",
        title: "Analytics & Reports",
        url: "/analytics",
        icon: BarChart3,
        sub: [
            { title: "Analytics Dashboard", url: "/analytics" },
            { title: "LLM Brand Monitors", url: "/dashboard/llm-visibility" },
            { title: "SEO Reports", url: "#" },
        ],
    },
    {
        id: "backlink",
        title: "Backlink Exchange",
        url: "/dashboard/backlink-exchange",
        icon: Link2,
        badge: "NEW",
    },
]

export function SidebarNavigation({ orgName = "Default Workspace", plan, usage }: SidebarNavigationProps) {
    const pathname = usePathname()
    const { isMobile, setSidebarOpenMobile } = useResponsiveNavigation()
    const [openSub, setOpenSub] = useState<string | null>(null)

    const planLabel = plan ? (plan.charAt(0).toUpperCase() + plan.slice(1)) : "Pro"

    const toggleSub = (id: string) => {
        setOpenSub(prev => prev === id ? null : id)
    }

    return (
        <Sidebar
            style={{ "--sidebar-width": "202px" } as React.CSSProperties}
            className="border-r-0"
            data-tour="sidebar"
        >
            {/* Brand area */}
            <SidebarHeader style={{ borderBottom: "1px solid #f0f0f0", padding: "15px 16px 11px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 7, background: "#0066FF",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.3px" }}>
                        Infin<span style={{ color: "#0066FF" }}>8</span>Content
                    </span>
                </div>

                {/* Workspace switcher */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 0 0", marginTop: 8,
                    borderTop: "1px solid #f0f0f0",
                    color: "#555", fontSize: 12, cursor: "pointer",
                }}>
                    <div style={{
                        width: 18, height: 18, borderRadius: 4, background: "#e6f0ff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 9, color: "#0066FF", fontWeight: 800, flexShrink: 0,
                    }}>W</div>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {orgName}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </div>
            </SidebarHeader>

            <SidebarContent style={{ padding: "8px" }}>
                {NAV_ITEMS.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.url
                        : item.url !== "#" && (pathname === item.url || pathname.startsWith(item.url))
                    const hasSub = "sub" in item && item.sub && item.sub.length > 0
                    const isOpen = openSub === item.id

                    const disabledStyle = item.disabled
                        ? { opacity: 0.6, cursor: "not-allowed", pointerEvents: "none" as const }
                        : {}

                    const itemStyle: React.CSSProperties = {
                        display: "flex", alignItems: "center", gap: 9,
                        padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                        fontSize: 13, transition: "background 0.12s",
                        background: isActive ? "#e6f0ff" : "transparent",
                        color: isActive ? "#0066FF" : "#444",
                        fontWeight: isActive ? 600 : 400,
                        userSelect: "none",
                        ...disabledStyle,
                    }

                    return (
                        <div key={item.id}>
                            {item.disabled || !hasSub ? (
                                <div
                                    style={itemStyle}
                                    title={item.disabled ? "Coming soon" : undefined}
                                    className={item.disabled ? "" : "hover:bg-[#f4f6f9]"}
                                    onClick={() => {
                                        if (!item.disabled && hasSub) toggleSub(item.id)
                                    }}
                                >
                                    <item.icon style={{ width: 15, height: 15, flexShrink: 0, opacity: isActive ? 1 : 0.8 }} />
                                    {item.disabled ? (
                                        <span style={{ flex: 1 }}>{item.title}</span>
                                    ) : (
                                        <Link
                                            href={item.url}
                                            style={{ flex: 1, color: "inherit", textDecoration: "none" }}
                                            onClick={() => isMobile && setSidebarOpenMobile(false)}
                                            data-tour={getTourAttribute(item.id)}
                                        >
                                            {item.title}
                                        </Link>
                                    )}
                                    {"badge" in item && item.badge && (
                                        <span style={{
                                            background: "#0066FF", color: "#fff",
                                            fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "1px 6px",
                                        }}>
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div
                                        style={itemStyle}
                                        className="hover:bg-[#f4f6f9]"
                                        onClick={() => toggleSub(item.id)}
                                    >
                                        <item.icon style={{ width: 15, height: 15, flexShrink: 0, opacity: isActive ? 1 : 0.8 }} />
                                        <span style={{ flex: 1 }}>{item.title}</span>
                                        <ChevronDown style={{
                                            width: 12, height: 12, flexShrink: 0,
                                            stroke: "#bbb", strokeWidth: 2.5,
                                            transition: "transform 0.2s",
                                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                        }} />
                                    </div>
                                    {/* Sub-items */}
                                    <div style={{
                                        overflow: "hidden",
                                        maxHeight: isOpen ? 300 : 0,
                                        transition: "max-height 0.25s ease",
                                    }}>
                                        {item.sub?.map((sub) => (
                                            <Link
                                                key={sub.title}
                                                href={sub.url}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 8,
                                                    padding: "5px 10px 5px 34px", borderRadius: 7,
                                                    fontSize: 12, color: "#666", textDecoration: "none",
                                                    transition: "background 0.12s",
                                                    ...(sub.url === "#" ? { opacity: 0.5, pointerEvents: "none" } : {}),
                                                }}
                                                className={sub.url !== "#" ? "hover:bg-[#f4f6f9] hover:text-[#0066FF]" : ""}
                                                onClick={() => isMobile && setSidebarOpenMobile(false)}
                                            >
                                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ccc", flexShrink: 0 }} />
                                                {sub.title}
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
            </SidebarContent>

            {/* Bottom promo items */}
            <div style={{ padding: "8px", borderTop: "1px solid #f0f0f0" }}>
                {[
                    { icon: "🔗", label: "Backlink Exchange", sub: "High-quality link building" },
                    { icon: "🚀", label: "Managed SEO", sub: "We handle your content" },
                ].map((promo) => (
                    <div
                        key={promo.label}
                        style={{
                            display: "flex", alignItems: "center", gap: 9,
                            padding: "7px 10px", borderRadius: 8, cursor: "pointer",
                        }}
                        className="hover:bg-[#f4f6f9]"
                    >
                        <div style={{
                            width: 28, height: 28, borderRadius: 7, background: "#f0f0f0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, fontSize: 14,
                        }}>
                            {promo.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: "#333" }}>{promo.label}</div>
                            <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>{promo.sub}</div>
                        </div>
                    </div>
                ))}
            </div>
        </Sidebar>
    )
}
