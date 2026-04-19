"use client"

import { LogOut, User, Bell, Search, MoreHorizontal, HelpCircle } from "lucide-react"
import { HelpDrawer } from "@/components/dashboard/help-drawer"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useResponsiveNavigation } from "@/hooks/use-responsive-navigation"

import { PLAN_LIMITS } from "@/lib/config/plan-limits"

interface TopNavigationProps {
    email: string
    name?: string
    avatarUrl?: string
    plan?: keyof typeof PLAN_LIMITS.article_generation
    usage?: number
}

export function TopNavigation({ email, name, avatarUrl, plan, usage }: TopNavigationProps) {
    const limit = plan ? PLAN_LIMITS.article_generation[plan] : null
    const pathname = usePathname()
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [overflowOpen, setOverflowOpen] = useState(false)
    const [helpOpen, setHelpOpen] = useState(false)
    const { isMobile, isTablet, isDesktop } = useResponsiveNavigation()

    const initials = name
        ? name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : email.substring(0, 2).toUpperCase()

    const [today, setToday] = useState<string>("")

    useEffect(() => {
        setToday(new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }))
    }, [])

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true)

            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Failed to logout')
            }

            // Redirect to login page after successful logout
            router.push('/login')
            router.refresh() // Refresh to clear any cached data
        } catch (error) {
            console.error('Logout error:', error)
            // Still redirect to login even if API call fails
            // The middleware will handle authentication check
            router.push('/login')
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        <>
        <header style={{
            background: "#0066FF",
            height: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
            flexShrink: 0,
            fontSize: "12px",
            color: "#fff",
        }}>
            {/* Left spacer — keeps center truly centred */}
            <div style={{ width: 90, flexShrink: 0 }}>
                <SidebarTrigger className="md:hidden text-white opacity-80 hover:opacity-100" />
            </div>

            {/* Center promo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f97316", flexShrink: 0 }} />
                <span style={{ opacity: 0.9 }}>See Infin8Content in action — Full Walkthrough:</span>
                <a
                    href="#"
                    style={{ color: "#fff", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
                    onClick={(e) => { e.preventDefault(); setHelpOpen(true) }}
                >
                    Watch Now
                </a>
            </div>

            {/* Right controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                {/* Plan pill */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "rgba(255,255,255,.18)", borderRadius: 20, padding: "3px 10px",
                    fontSize: 12, fontWeight: 600,
                }}>
                    <div style={{
                        width: 14, height: 14, borderRadius: "50%", background: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, fontWeight: 700, color: "#0066FF",
                    }}>∞</div>
                    <span>{plan ? (plan.charAt(0).toUpperCase() + plan.slice(1) + " Plan") : "Pro Plan"}</span>
                </div>

                {/* Upgrade button */}
                <button
                    onClick={() => router.push('/dashboard/settings/billing')}
                    style={{
                        background: "rgba(255,255,255,.22)",
                        border: "1px solid rgba(255,255,255,.45)",
                        borderRadius: 20, padding: "3px 11px",
                        fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#fff",
                    }}
                >
                    Upgrade
                </button>

                {/* Help & Support */}
                <button
                    onClick={() => setHelpOpen(true)}
                    style={{ display: "flex", alignItems: "center", gap: 5, opacity: 0.85, fontSize: 12, cursor: "pointer", background: "none", border: "none", color: "#fff" }}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    Help &amp; Support
                </button>

                {/* Avatar dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: "rgba(255,255,255,.28)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", border: "none", color: "#fff",
                            fontSize: 11, fontWeight: 700,
                        }}>
                            {initials}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal p-4">
                            <div className="flex flex-col space-y-1">
                                <p className="font-poppins text-sm font-bold text-text-primary leading-none">
                                    {name || "User"}
                                </p>
                                <p className="font-lato text-xs text-[#71717A] truncate">
                                    {email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer font-lato text-[#52525B] hover:text-[#0066FF]">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="text-red-600 focus:text-red-600 cursor-pointer font-lato"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
        <HelpDrawer open={helpOpen} onOpenChange={setHelpOpen} />
        </>
    )
}
