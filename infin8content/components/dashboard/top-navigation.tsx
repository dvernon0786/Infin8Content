"use client"

import { LogOut, User, Plus, Bell, Search, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
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

interface TopNavigationProps {
    email: string
    name?: string
    avatarUrl?: string
}

export function TopNavigation({ email, name, avatarUrl }: TopNavigationProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [overflowOpen, setOverflowOpen] = useState(false)
    const { isMobile, isTablet, isDesktop } = useResponsiveNavigation()
    
    const initials = name
        ? name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : email.substring(0, 2).toUpperCase()

    // Don't show "Create Article" button on the article generation page itself
    const showCreateButton = pathname !== "/dashboard/articles/generate"

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


    // Mobile search toggle
    const mobileSearch = (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden"
            aria-label="Toggle search"
        >
            <Search className="h-4 w-4" />
        </Button>
    )

    // Responsive search input
    const searchInput = (
        <div className={cn(
            "relative transition-all duration-200",
            isMobile && searchOpen ? "w-full" : isMobile ? "w-0 overflow-hidden" : "w-auto",
            isTablet && "max-w-xs"
        )}>
            <Search className={cn(
                "absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-600",
                "h-4 w-4"
            )} />
            <Input
                placeholder={isMobile ? "Search..." : "Search articles..."}
                className={cn(
                    "pl-10 font-lato text-neutral-600 placeholder:text-neutral-500",
                    isMobile && "h-10",
                    isTablet && "h-9 text-sm"
                )}
            />
        </div>
    )

    // Mobile overflow menu with notifications
    const mobileOverflowMenu = (
        <DropdownMenu open={overflowOpen} onOpenChange={setOverflowOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "relative",
                        isMobile && "h-10 w-10", // Larger touch target on mobile
                        "h-8 w-8"
                    )}
                    aria-label="More options"
                >
                    <MoreHorizontal className={cn(
                        isMobile && "h-5 w-5",
                        "h-4 w-4"
                    )} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer font-lato text-neutral-600">
                    <Bell className="mr-2 h-4 w-4 text-neutral-600" />
                    <span>Notifications</span>
                    <Badge variant="secondary" className="ml-auto bg-neutral-200 text-neutral-700">
                        3
                    </Badge>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer font-lato text-neutral-600">
                    <User className="mr-2 h-4 w-4 text-neutral-600" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer font-lato text-neutral-600"
                >
                    <LogOut className="mr-2 h-4 w-4 text-neutral-600" />
                    <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )

    // Responsive create button
    const createButton = showCreateButton && (
        <Button 
            variant="ghost"
            asChild 
            className={cn(
                "gap-2 transition-all duration-200 font-lato text-neutral-600 hover:text-[--brand-electric-blue]",
                isMobile && "h-10 px-3", // Larger on mobile
                "h-9"
            )}
        >
            <Link href="/dashboard/articles/generate">
                <Plus className={cn(
                    isMobile && "h-5 w-5",
                    "h-4 w-4"
                )} />
                <span className={cn(
                    isMobile && "hidden sm:inline", // Hide text on small mobile
                    isTablet && "hidden lg:inline", // Hide on tablet
                    "inline"
                )}>
                    Create Article
                </span>
                {isMobile && (
                    <span className="sm:hidden">Create</span>
                )}
            </Link>
        </Button>
    )

    return (
        <header className={cn(
            "flex shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear",
            "group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
            isMobile ? "h-16 px-3" : "h-16 px-4"
        )}>
            {/* Hamburger menu - only visible on mobile */}
            <SidebarTrigger 
                className={cn(
                    "-ml-1",
                    isMobile ? "flex" : "md:hidden"
                )} 
                aria-label="Toggle sidebar menu" 
            />


            {/* Mobile search toggle */}
            {mobileSearch}

            {/* Search input - responsive width */}
            {searchInput}

            <div className="flex-1" />

            {/* Right side actions */}
            <div className={cn(
                "flex items-center gap-2",
                isMobile && "gap-1" // Tighter spacing on mobile
            )}>
                {/* Notification bell - hidden on mobile (moved to overflow), shown on tablet+ */}
                {!isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-8 w-8 text-neutral-600 hover:text-[--brand-electric-blue]"
                        aria-label="View notifications"
                    >
                        <Bell className="h-4 w-4" />
                        <Badge 
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-neutral-200 text-neutral-700"
                        >
                            3
                        </Badge>
                    </Button>
                )}

                {/* Mobile overflow menu */}
                {isMobile && mobileOverflowMenu}

                {/* Create button */}
                {createButton}

                {/* User menu - hidden on mobile (moved to overflow) */}
                {!isMobile && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                className="relative rounded-full h-8 w-8" 
                                suppressHydrationWarning
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={avatarUrl} alt={name || email} />
                                    <AvatarFallback className="text-sm">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                            className="w-56" 
                            align="end" 
                            forceMount 
                            suppressHydrationWarning
                        >
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="font-lato text-body font-medium text-neutral-900 leading-none">
                                        {name || "User"}
                                    </p>
                                    <p className="font-lato text-small leading-none text-neutral-500">
                                        {email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer font-lato text-neutral-600">
                                <User className="mr-2 h-4 w-4 text-neutral-600" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="cursor-pointer font-lato text-neutral-600"
                            >
                                <LogOut className="mr-2 h-4 w-4 text-neutral-600" />
                                <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    )
}
