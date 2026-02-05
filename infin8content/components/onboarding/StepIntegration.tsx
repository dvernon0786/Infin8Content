"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StepIntegrationProps {
  className?: string
  onComplete?: (data: IntegrationData) => void
  onSkip?: () => void
}

interface IntegrationData {
  platform: string
  credentials: {
    api_key?: string
    webhook_url?: string
    username?: string
    password?: string
  }
}

export function StepIntegration({ className, onComplete, onSkip }: StepIntegrationProps) {
  const [formData, setFormData] = useState<IntegrationData>({
    platform: "wordpress",
    credentials: {}
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.platform === "wordpress") {
      if (!formData.credentials.webhook_url) {
        newErrors.webhook_url = "Webhook URL is required for WordPress integration"
      } else if (!formData.credentials.webhook_url.startsWith('https://')) {
        newErrors.webhook_url = "Webhook URL must be a valid HTTPS URL"
      }
    }

    if (formData.platform === "custom") {
      if (!formData.credentials.api_key) {
        newErrors.api_key = "API Key is required for custom integration"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof IntegrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear errors when platform changes
    if (field === 'platform') {
      setErrors({})
      setFormData(prev => ({
        ...prev,
        [field]: value,
        credentials: {}
      }))
    }
  }

  const handleCredentialsChange = (field: keyof IntegrationData['credentials'], value: string) => {
    setFormData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [field]: value
      }
    }))

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onComplete?.(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onSkip?.()
  }

  const isFormValid = formData.platform === "wordpress" 
    ? formData.credentials.webhook_url && formData.credentials.webhook_url.startsWith('https://')
    : formData.platform === "custom" 
    ? formData.credentials.api_key
    : true

  return (
    <main className={cn("w-full max-w-2xl mx-auto", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Integration Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informational Context Box */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <h3 className="font-medium mb-2">Connect your publishing platform</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Set up integration with your content management system to enable seamless publishing.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• WordPress enables direct blog publishing</li>
              <li>• Custom API allows integration with any platform</li>
              <li>• You can configure integrations later in settings</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Platform Selection */}
            <div className="space-y-2">
              <label htmlFor="platform" className="text-sm font-medium">
                Publishing Platform
              </label>
              <select
                id="platform"
                value={formData.platform}
                onChange={(e) => handleInputChange('platform', e.target.value)}
                className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="wordpress">WordPress</option>
                <option value="custom">Custom API</option>
                <option value="none">Skip for now</option>
              </select>
            </div>

            {/* Platform-specific credentials */}
            {formData.platform === "wordpress" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">WordPress Configuration</h3>
                
                <div className="space-y-2">
                  <label htmlFor="webhook_url" className="text-sm font-medium">
                    Webhook URL <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="webhook_url"
                    type="url"
                    placeholder="https://your-site.com/wp-json/infin8content/webhook"
                    value={formData.credentials.webhook_url || ""}
                    onChange={(e) => handleCredentialsChange('webhook_url', e.target.value)}
                    className={cn(errors.webhook_url && "border-destructive")}
                    aria-describedby={errors.webhook_url ? "webhook_url-error" : undefined}
                  />
                  {errors.webhook_url && (
                    <p id="webhook_url-error" className="text-sm text-destructive" role="alert">
                      {errors.webhook_url}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Install our WordPress plugin and copy the webhook URL
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="wp_username" className="text-sm font-medium">
                    WordPress Username (Optional)
                  </label>
                  <Input
                    id="wp_username"
                    type="text"
                    placeholder="admin"
                    value={formData.credentials.username || ""}
                    onChange={(e) => handleCredentialsChange('username', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="wp_password" className="text-sm font-medium">
                    Application Password (Optional)
                  </label>
                  <Input
                    id="wp_password"
                    type="password"
                    placeholder="WordPress application password"
                    value={formData.credentials.password || ""}
                    onChange={(e) => handleCredentialsChange('password', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Generate in WordPress Users → Profile → Application Passwords
                  </p>
                </div>
              </div>
            )}

            {formData.platform === "custom" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Custom API Configuration</h3>
                
                <div className="space-y-2">
                  <label htmlFor="api_key" className="text-sm font-medium">
                    API Key <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="api_key"
                    type="password"
                    placeholder="Your API integration key"
                    value={formData.credentials.api_key || ""}
                    onChange={(e) => handleCredentialsChange('api_key', e.target.value)}
                    className={cn(errors.api_key && "border-destructive")}
                    aria-describedby={errors.api_key ? "api_key-error" : undefined}
                  />
                  {errors.api_key && (
                    <p id="api_key-error" className="text-sm text-destructive" role="alert">
                      {errors.api_key}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="custom_webhook" className="text-sm font-medium">
                    Webhook Endpoint (Optional)
                  </label>
                  <Input
                    id="custom_webhook"
                    type="url"
                    placeholder="https://your-api.com/webhook"
                    value={formData.credentials.webhook_url || ""}
                    onChange={(e) => handleCredentialsChange('webhook_url', e.target.value)}
                  />
                </div>
              </div>
            )}

            {formData.platform === "none" && (
              <div className="bg-muted/50 rounded-lg p-4 border">
                <p className="text-sm text-muted-foreground">
                  You can configure integrations later in the settings panel.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="default"
                disabled={!isFormValid || isSubmitting || formData.platform === "none"}
                loading={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Connecting..." : formData.platform === "none" ? "Complete Setup" : "Connect Platform"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial"
              >
                Skip & Add Later
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
