"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Globe, Key } from "lucide-react"

interface WordPressIntegrationData {
  wordpress: {
    url: string
    username: string
    application_password: string
  }
}

interface StepIntegrationProps {
  onComplete: (data: WordPressIntegrationData) => Promise<void>
  onSkip: () => void
  className?: string
}

export function StepIntegration({ onComplete, onSkip, className }: StepIntegrationProps) {
  const [data, setData] = useState<WordPressIntegrationData>({
    wordpress: {
      url: "",
      username: "",
      application_password: ""
    }
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (field: keyof WordPressIntegrationData["wordpress"], value: string) => {
    setData(prev => ({
      wordpress: { ...prev.wordpress, [field]: value }
    }))
    if (error) setError(null)
  }

  const submit = async () => {
    setLoading(true)
    setError(null)

    try {
      await onComplete(data)
    } catch (e: any) {
      setError(e.message || "Failed to connect to WordPress")
    } finally {
      setLoading(false)
    }
  }

  const skip = () => {
    onSkip()
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Connect WordPress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">WordPress Site URL <span className="text-destructive">*</span></label>
            <Input
              placeholder="https://your-site.com"
              value={data.wordpress.url}
              onChange={(e) => update("url", e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Username <span className="text-destructive">*</span></label>
            <Input
              placeholder="WordPress username"
              value={data.wordpress.username}
              onChange={(e) => update("username", e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Application Password <span className="text-destructive">*</span></label>
            <Input
              type="password"
              placeholder="WordPress application password"
              value={data.wordpress.application_password}
              onChange={(e) => update("application_password", e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Create an Application Password in WordPress → Users → Profile → Application Passwords
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={submit} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Test & Connect
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={skip} disabled={loading}>
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
