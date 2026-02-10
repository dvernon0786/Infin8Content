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

interface StepIntegrationProps {
  className?: string
  onNext: (state: any) => void
}

type IntegrationPayload = {
  integration: {
    type: "wordpress"
    site_url: string
    username: string
    application_password: string
  }
}

function StepIntegration({ className, onNext }: StepIntegrationProps) {
  const { user } = useCurrentUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      // 1️⃣ Persist integration
      const persistRes = await fetch("/api/onboarding/persist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!persistRes.ok) {
        throw new Error("Failed to persist integration")
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
    } catch (err) {
      console.error("[StepIntegration] Submission error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={cn("mx-auto w-full max-w-2xl", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Integration</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Connecting…" : "Test & Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

export { StepIntegration }
