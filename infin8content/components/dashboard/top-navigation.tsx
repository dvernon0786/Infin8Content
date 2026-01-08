"use client"

import { LogOut, User, Plus } from "lucide-react"
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

interface TopNavigationProps {
    email: string
    name?: string
    avatarUrl?: string
}

export function TopNavigation({ email, name, avatarUrl }: TopNavigationProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    
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

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1 md:hidden" aria-label="Toggle sidebar menu" />
            <Link 
                href="/dashboard" 
                className="flex items-center gap-2 font-semibold text-lg hover:opacity-80 transition-opacity"
                aria-label="Infin8Content - Go to dashboard"
            >
                <span className="hidden md:inline">Infin8Content</span>
                <span className="md:hidden">I8C</span>
            </Link>
            <div className="flex-1" />
            {showCreateButton && (
                <Button asChild className="gap-2">
                    <Link href="/dashboard/articles/generate">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Create Article</span>
                        <span className="sm:hidden">Create</span>
                    </Link>
                </Button>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={avatarUrl} alt={name || email} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{name || "User"}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="cursor-pointer"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    )
}
