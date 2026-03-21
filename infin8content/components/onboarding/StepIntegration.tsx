"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CmsConnectionForm } from "@/components/settings/CmsConnectionForm"

interface StepIntegrationProps {
  className?: string
  onNext: (state: any) => void
  onSkip?: () => void
}

function StepIntegration({ className, onNext, onSkip }: StepIntegrationProps) {
  return (
    <main className={cn("mx-auto w-full max-w-2xl", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Connect a publishing platform</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground mb-5">
            Connect your CMS so you can publish content directly from Infin8Content.
            You can add more connections anytime from Settings → Integrations.
          </p>

          <CmsConnectionForm
            onSuccess={() => onNext(null)}
            onCancel={undefined}
          />

          {onSkip && (
            <div className="text-center pt-2 border-t mt-4">
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={onSkip}
              >
                Skip for now — I'll connect later
              </Button>
              <p className="text-[11px] text-muted-foreground/60 italic -mt-1">
                (Recommended to connect now to enable auto-publishing)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export { StepIntegration }
