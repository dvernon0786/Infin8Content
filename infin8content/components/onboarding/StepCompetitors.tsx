"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AIEnhancedInput } from "@/components/onboarding/ai-enhanced-input"
import { cn } from "@/lib/utils"
import { useCurrentUser } from '@/lib/hooks/use-current-user'

interface StepCompetitorsProps {
  className?: string
  onNext?: (data: any) => void
  onSkip?: () => void
}

interface CompetitorInput {
  url: string
  name?: string
}

export function StepCompetitors({ className, onNext, onSkip }: StepCompetitorsProps) {
  const [competitors, setCompetitors] = useState<CompetitorInput[]>([{ url: "", name: "" }])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useCurrentUser()

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const validCompetitors = competitors.filter(c => c.url.trim())

    if (validCompetitors.length < 1) {
      newErrors.competitors = "Please add at least 1 competitor"
    } else if (validCompetitors.length > 7) {
      newErrors.competitors = "Maximum 7 competitors allowed"
    } else {
      // Validate each URL
      validCompetitors.forEach((competitor, index) => {
        if (!validateUrl(competitor.url)) {
          newErrors[`competitor_${index}`] = "Please enter a valid URL"
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addCompetitor = () => {
    if (competitors.length < 7) {
      setCompetitors([...competitors, { url: "", name: "" }])
    }
  }

  const removeCompetitor = (index: number) => {
    const newCompetitors = competitors.filter((_, i) => i !== index)
    setCompetitors(newCompetitors.length > 0 ? newCompetitors : [{ url: "", name: "" }])
  }

  const updateCompetitor = (index: number, field: keyof CompetitorInput, value: string) => {
    const newCompetitors = [...competitors]
    newCompetitors[index] = { ...newCompetitors[index], [field]: value }
    setCompetitors(newCompetitors)

    // Clear error for this field
    if (errors[`competitor_${index}`]) {
      setErrors(prev => ({ ...prev, [`competitor_${index}`]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      console.error('[StepCompetitors] Form validation failed')
      return
    }

    if (!user?.org_id) {
      console.error('[StepCompetitors] User not authenticated')
      return
    }

    setIsSubmitting(true)
    try {
      console.log('[StepCompetitors] Attempting to persist competitors:', competitors)
      
      // 🎯 PERSIST COMPETITORS TO DATABASE (BULK OPERATION)
      const validCompetitors = competitors.filter(c => c.url.trim())
      
      // Call bulk competitors API
      const res = await fetch(`/api/organizations/${user.org_id}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitors: validCompetitors.map(c => ({
            url: c.url,
            name: c.name || c.url
          }))
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('[StepCompetitors] Competitor persist failed:', errorData)
        throw new Error(errorData?.error || `Failed to save competitors`)
      }

      const persistResult = await res.json()
      console.log('[StepCompetitors] All competitors persisted successfully:', persistResult)

      // 🎯 OBSERVE TRUTH FROM DB
      if (!user?.org_id) {
        throw new Error('User not authenticated or missing organization')
      }
      
      const observerRes = await fetch('/api/onboarding/observe', {
        method: 'GET',
      })
      console.log('[StepCompetitors] Observer response status:', observerRes.status)
      
      if (!observerRes.ok) {
        throw new Error('Failed to observe onboarding state')
      }

      const state = await observerRes.json()
      console.log('[StepCompetitors] Observer state:', state)

      // 🎯 PASS VALIDATED STATE UP (NOT RAW FORM DATA)
      await onNext?.(state)
    } catch (error) {
      console.error('[StepCompetitors] Complete error:', error)
      // Don't advance step on failure
      return
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    console.warn('Skip not implemented - all steps required for System Law compliance')
  }

  const validCompetitorsCount = competitors.filter(c => c.url.trim()).length
  const isFormValid = validCompetitorsCount >= 1 && validCompetitorsCount <= 7

  return (
    <main className={cn("w-full max-w-2xl mx-auto", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Competitor Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informational Context Box */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <h3 className="font-medium mb-2">Understanding your competition</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Adding competitor websites helps us analyze their content strategies and identify opportunities for your business.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Add 3-7 competitor websites for optimal analysis</li>
              <li>• Focus on direct competitors in your industry</li>
              <li>• We'll analyze their content to help you stand out</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Competitor Inputs */}
            <div className="space-y-4">
              <div className="text-sm font-medium">
                Competitor Websites <span className="text-destructive">*</span>
              </div>
              {competitors.map((competitor, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">
                      Competitor {index + 1} URL <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="url"
                      value={competitor.url}
                      onChange={(e) => updateCompetitor(index, 'url', e.target.value)}
                      placeholder={`Competitor ${index + 1} URL`}
                      className={cn(errors[`competitor_${index}`] && "border-destructive")}
                      aria-label={`Competitor ${index + 1} URL`}
                    />
                    <label className="text-sm font-medium">
                      Competitor {index + 1} Name <span className="text-muted-foreground">(Optional)</span>
                    </label>
                    <Input
                      type="text"
                      value={competitor.name || ""}
                      onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                      placeholder={`Competitor ${index + 1} Name`}
                      aria-label={`Competitor ${index + 1} Name`}
                    />
                  </div>
                  {competitors.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeCompetitor(index)}
                      className="flex-shrink-0"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Competitor Button */}
            {competitors.length < 7 && (
              <Button
                type="button"
                variant="outline"
                onClick={addCompetitor}
                className="w-full"
              >
                + Add Competitor
              </Button>
            )}

            {/* Error Message */}
            {errors.competitors && (
              <p className="text-sm text-destructive" role="alert">
                {errors.competitors}
              </p>
            )}

            {/* Competitor Count */}
            <p className="text-xs text-muted-foreground">
              {validCompetitorsCount} of 3-7 competitors added
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="default"
                disabled={!isFormValid || isSubmitting}
                loading={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Saving..." : "Next Step"}
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
