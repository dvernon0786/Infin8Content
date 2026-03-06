"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/lib/hooks/use-current-user"

/**
 * Normalize site URL by removing trailing slash
 * Users can type https://example.com/ and we'll store https://example.com
 */
function normalizeSiteUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

interface StepIntegrationProps {
  className?: string
  onNext: (state: any) => void
  onSkip: () => void
}

type IntegrationPayload = {
  integration: {
    type: "wordpress"
    site_url: string
    username: string
    application_password: string
  }
}

function StepIntegration({ className, onNext, onSkip }: StepIntegrationProps) {
  const { user } = useCurrentUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<{
    message: string;
    limit?: number;
    currentValue?: number;
    plan?: string;
    metric?: string;
  } | null>(null)

  const [formData, setFormData] = useState<IntegrationPayload>({
    integration: {
      type: "wordpress",
      site_url: "",
      username: "",
      application_password: "",
    },
  })

  function updateField<K extends keyof IntegrationPayload["integration"]>(
    key: K,
    value: IntegrationPayload["integration"][K]
  ) {
    setFormData((prev) => ({
      integration: {
        ...prev.integration,
        [key]: value,
      },
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!user?.org_id) {
      console.error("[StepIntegration] Missing org context")
      return
    }

    setIsSubmitting(true)

    try {
      // 1️⃣ Persist integration with normalized URL
      const payload: IntegrationPayload = {
        integration: {
          ...formData.integration,
          site_url: normalizeSiteUrl(formData.integration.site_url),
        },
      }

      const persistRes = await fetch("/api/onboarding/persist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!persistRes.ok) {
        const data = await persistRes.json().catch(() => null)
        const error = new Error(data?.error || "Failed to persist integration") as any
        error.limit = data?.limit
        error.currentValue = data?.currentValue
        error.plan = data?.plan
        error.metric = data?.metric
        throw error
      }

      // 2️⃣ Observe canonical truth
      if (!user?.org_id) {
        throw new Error('User not authenticated or missing organization')
      }

      const observeRes = await fetch("/api/onboarding/observe", {
        method: 'GET',
      })

      if (!observeRes.ok) {
        throw new Error("Failed to observe onboarding state")
      }

      const state = await observeRes.json()

      // 3️⃣ Bubble up canonical state
      onNext(state)
    } catch (err: any) {
      console.error("[StepIntegration] Submission error:", err)
      setError({
        message: err.message || "An unexpected error occurred",
        limit: err.limit,
        currentValue: err.currentValue,
        plan: err.plan,
        metric: err.metric
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={cn("mx-auto w-full max-w-2xl", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Connect WordPress</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground mb-5">
            Connect your WordPress site so we can publish content directly.
            You can also skip this step and connect later from your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
                <div className="flex items-start gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-orange-900 leading-tight">
                      {error.metric === 'cms_connection'
                        ? 'CMS connection limit reached'
                        : 'Connection failed'}
                    </p>
                    <p className="text-sm text-orange-800 leading-normal">
                      {error.metric === 'cms_connection' && error.limit
                        ? `Your ${error.plan} plan allows ${error.limit} connected CMS platform(s).`
                        : error.message}
                    </p>
                    {error.metric === 'cms_connection' && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          className="text-xs h-8 bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={() => window.location.href = '/dashboard/settings/billing'}
                        >
                          Upgrade plan
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Site URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">WordPress Site URL</label>
              <Input
                type="url"
                placeholder="https://yoursite.com"
                value={formData.integration.site_url}
                onChange={(e) => updateField("site_url", e.target.value)}
                required
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium">WordPress Username</label>
              <Input
                type="text"
                placeholder="admin"
                value={formData.integration.username}
                onChange={(e) => updateField("username", e.target.value)}
                required
              />
            </div>

            {/* Application Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Application Password</label>
              <Input
                type="password"
                placeholder="xxxx xxxx xxxx xxxx xxxx"
                value={formData.integration.application_password}
                onChange={(e) =>
                  updateField("application_password", e.target.value)
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Generate this in WordPress → Users → Profile → Application Passwords
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Connecting…" : "Test & Connect"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={onSkip}
                disabled={isSubmitting}
              >
                Skip for now — I'll connect later
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

export { StepIntegration }
