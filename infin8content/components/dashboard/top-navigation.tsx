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
        <header className={cn(
            "flex shrink-0 items-center justify-between border-b bg-white shadow-sm transition-[width,height] ease-linear",
            "h-16 px-6"
        )}>
            {/* Left side: Breadcrumb / Title */}
            <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden -ml-2 mr-1" />
                <h1 className="font-poppins text-lg font-bold text-[#2C2C2E] tracking-tight">
                    Dashboard
                </h1>
                <span className="text-[#E5E5E7]">·</span>
                <span className="font-lato text-sm text-[#71717A]">
                    {today}
                </span>
            </div>

            {/* Middle: Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#F4F4F6] border border-[#E5E5E7] rounded-lg w-80 group focus-within:ring-2 focus-within:ring-[#217CEB]/20 transition-all">
                <Search className="h-4 w-4 text-[#71717A] group-focus-within:text-[#217CEB]" />
                <input
                    type="text"
                    placeholder="Search workflows…"
                    className="bg-transparent border-none outline-none text-sm font-lato text-[#2C2C2E] placeholder:text-[#71717A] w-full"
                />
                <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#E5E5E7] bg-[#E5E5E7] text-[9px] font-bold text-[#71717A] font-sans">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </div>

            {/* Right side Actions */}
            <div className="flex items-center gap-4">
                {/* Plan Indicator */}
                {plan && (
                    <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-[#F59E0B]/5 border border-[#F59E0B]/15 rounded-lg mr-2">
                        <div className="flex flex-col">
                            <span className="font-lato text-[9px] font-black text-[#F59E0B] uppercase tracking-wider leading-none mb-1">
                                {plan === 'trial' ? 'Trial Usage' : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`}
                            </span>
                            {limit !== null && (
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-24 bg-[#E5E5E7] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-linear-to-r from-[#F59E0B] to-[#D97706] rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${Math.min(100, Math.round(((usage || 0) / limit) * 100))}%` }}
                                        />
                                    </div>
                                    <span className="font-lato text-[11px] font-bold text-[#F59E0B]">
                                        {usage || 0} / {limit}
                                    </span>
                                </div>
                            )}
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-[#217CEB] hover:bg-[#217CEB]/90 text-white border-none font-bold text-[11px] h-8 shadow-sm"
                            onClick={() => router.push('/dashboard/settings/billing')}
                        >
                            {plan === 'trial' ? 'Upgrade' : 'Manage'}
                        </Button>
                    </div>
                )}

                {/* Mobile Search - Icon only */}
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-[#71717A]">
                    <Search className="h-5 w-5" />
                </Button>

                {/* Help Button — Epic 12, Story 12-3/12-5/12-10/12-11 */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setHelpOpen(true)}
                    aria-label="Open help"
                    className="h-9 w-9 text-[#71717A] hover:bg-[#F4F4F6]"
                >
                    <HelpCircle className="h-5 w-5" />
                </Button>

                {/* Notifications */}
                <div className="relative cursor-pointer group">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-[#71717A] group-hover:bg-[#F4F4F6]">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F59E0B] border-2 border-white ring-1 ring-[#F59E0B]/20" />
                </div>

                {/* User Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="relative h-9 w-9 rounded-full p-0 overflow-hidden ring-2 ring-transparent hover:ring-[#217CEB]/30 transition-all"
                        >
                            <div className="h-full w-full bg-linear-to-br from-[#217CEB] to-[#4A42CC] flex items-center justify-center text-white text-[11px] font-bold font-poppins shadow-md">
                                {initials}
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal p-4">
                            <div className="flex flex-col space-y-1">
                                <p className="font-poppins text-sm font-bold text-[#2C2C2E] leading-none">
                                    {name || "User"}
                                </p>
                                <p className="font-lato text-xs text-[#71717A] truncate">
                                    {email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer font-lato text-[#52525B] hover:text-[#217CEB]">
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
