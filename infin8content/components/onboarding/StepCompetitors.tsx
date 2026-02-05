"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AIEnhancedInput } from "@/components/onboarding/ai-enhanced-input"
import { cn } from "@/lib/utils"

interface StepCompetitorsProps {
  className?: string
  onNext?: (data: CompetitorsData) => void
  onSkip?: () => void
}

interface CompetitorsData {
  competitors: string[]
}

export function StepCompetitors({ className, onNext, onSkip }: StepCompetitorsProps) {
  const [competitors, setCompetitors] = useState<string[]>([""])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    const validCompetitors = competitors.filter(c => c.trim())

    if (validCompetitors.length < 3) {
      newErrors.competitors = "Please add at least 3 competitors"
    } else if (validCompetitors.length > 7) {
      newErrors.competitors = "Maximum 7 competitors allowed"
    } else {
      // Validate each URL
      validCompetitors.forEach((competitor, index) => {
        if (!validateUrl(competitor)) {
          newErrors[`competitor_${index}`] = "Please enter a valid URL"
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const addCompetitor = () => {
    if (competitors.length < 7) {
      setCompetitors([...competitors, ""])
    }
  }

  const removeCompetitor = (index: number) => {
    const newCompetitors = competitors.filter((_, i) => i !== index)
    setCompetitors(newCompetitors.length > 0 ? newCompetitors : [""])
  }

  const updateCompetitor = (index: number, value: string) => {
    const newCompetitors = [...competitors]
    newCompetitors[index] = value
    setCompetitors(newCompetitors)

    // Clear error for this field
    if (errors[`competitor_${index}`]) {
      setErrors(prev => ({ ...prev, [`competitor_${index}`]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const validCompetitors = competitors.filter(c => c.trim())
      await onNext?.({ competitors: validCompetitors })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onSkip?.()
  }

  const validCompetitorsCount = competitors.filter(c => c.trim()).length
  const isFormValid = validCompetitorsCount >= 3 && validCompetitorsCount <= 7

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
            <div className="space-y-3">
              {competitors.map((competitor, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 space-y-2">
                    <AIEnhancedInput
                      value={competitor}
                      onChange={(value) => updateCompetitor(index, value)}
                      context="competitors"
                      placeholder={`Competitor ${index + 1} URL`}
                      error={errors[`competitor_${index}`]}
                      aria-label={`Competitor ${index + 1} URL with AI suggestions`}
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
