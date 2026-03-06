"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCurrentUser } from "@/lib/hooks/use-current-user"

function normalizeSiteUrl(url: string): string {
    return url.endsWith("/") ? url.slice(0, -1) : url
}

interface WordPressIntegrationFormProps {
    initialData?: {
        url: string
        username: string
    }
    onSuccess: (data: any) => void
    onCancel?: () => void
}

export function WordPressIntegrationForm({ initialData, onSuccess, onCancel }: WordPressIntegrationFormProps) {
    const { user } = useCurrentUser()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<any>(null)

    const [formData, setFormData] = useState({
        wordpress: {
            url: initialData?.url || "",
            username: initialData?.username || "",
            application_password: "",
        },
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (!user?.org_id) {
            console.error("[WordPressIntegrationForm] Missing org context")
            return
        }

        setIsSubmitting(true)

        try {
            const payload = {
                wordpress: {
                    ...formData.wordpress,
                    url: normalizeSiteUrl(formData.wordpress.url),
                },
            }

            // 1️⃣ Save and Test
            const res = await fetch("/api/onboarding/integration", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => null)
                throw new Error(data?.error || "Failed to connect WordPress")
            }

            // 2️⃣ Persist to general onboarding state for system consistency
            // (This triggers quotas and derivation in the background)
            await fetch("/api/onboarding/persist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ integration: { ...payload.wordpress, type: 'wordpress' } }),
            })

            onSuccess(payload)
        } catch (err: any) {
            console.error("[WordPressIntegrationForm] Submission error:", err)
            setError(err.message || "An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                    {error}
                </div>
            )}

            {/* Site URL */}
            <div className="space-y-2">
                <label className="text-sm font-medium">WordPress Site URL</label>
                <Input
                    type="url"
                    placeholder="https://yoursite.com"
                    value={formData.wordpress.url}
                    onChange={(e) => setFormData({ ...formData, wordpress: { ...formData.wordpress, url: e.target.value } })}
                    required
                />
            </div>

            {/* Username */}
            <div className="space-y-2">
                <label className="text-sm font-medium">WordPress Username</label>
                <Input
                    type="text"
                    placeholder="admin"
                    value={formData.wordpress.username}
                    onChange={(e) => setFormData({ ...formData, wordpress: { ...formData.wordpress, username: e.target.value } })}
                    required
                />
            </div>

            {/* Application Password */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Application Password</label>
                <Input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx xxxx"
                    value={formData.wordpress.application_password}
                    onChange={(e) => setFormData({ ...formData, wordpress: { ...formData.wordpress, application_password: e.target.value } })}
                    required
                />
                <p className="text-xs text-muted-foreground">
                    Generate this in WordPress → Users → Profile → Application Passwords
                </p>
            </div>

            <div className="flex gap-3 pt-2">
                {onCancel && (
                    <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Connecting..." : (initialData ? "Update Connection" : "Connect WordPress")}
                </Button>
            </div>
        </form>
    )
}
