"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AIEnhancedInput } from "@/components/onboarding/ai-enhanced-input"
import { cn } from "@/lib/utils"
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import "./onboarding-steps.css"

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


  const validCompetitorsCount = competitors.filter(c => c.url.trim()).length
  const isFormValid = validCompetitorsCount >= 1 && validCompetitorsCount <= 7

  return (
    <main className={cn("onboarding-step-container", className)}>
      <div className="onboarding-step-card">
        <h2 className="onboarding-step-title">Competitor Analysis</h2>

        <div className="onboarding-space-y-6">
          {/* Informational Context Box */}
          <div className="onboarding-info-box">
            <h3 className="onboarding-info-box-title">Understanding your competition</h3>
            <p className="onboarding-info-box-text">
              Adding competitor websites helps us analyze their content strategies and identify opportunities for your business.
            </p>
            <ul className="onboarding-info-box-list">
              <li>• Add 3-7 competitor websites for optimal analysis</li>
              <li>• Focus on direct competitors in your industry</li>
              <li>• We'll analyze their content to help you stand out</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="onboarding-space-y-4">
            {/* Competitor Inputs */}
            <div className="onboarding-space-y-4">
              <div className="onboarding-label">
                Competitor Websites <span className="onboarding-label-required">*</span>
              </div>
              {competitors.map((competitor, index) => (
                <div key={index} className="onboarding-competitor-row">
                  <div className="onboarding-competitor-input-group">
                    <label className="onboarding-label">
                      Competitor {index + 1} URL <span className="onboarding-label-required">*</span>
                    </label>
                    <input
                      type="url"
                      value={competitor.url}
                      onChange={(e) => updateCompetitor(index, 'url', e.target.value)}
                      placeholder={`Competitor ${index + 1} URL`}
                      className={cn("onboarding-input", errors[`competitor_${index}`] && "error")}
                      style={{ marginBottom: "12px" }}
                      aria-label={`Competitor ${index + 1} URL`}
                    />
                    <label className="onboarding-label">
                      Competitor {index + 1} Name <span style={{ color: "var(--onboarding-text-secondary)" }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={competitor.name || ""}
                      onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                      placeholder={`Competitor ${index + 1} Name`}
                      className="onboarding-input"
                      aria-label={`Competitor ${index + 1} Name`}
                    />
                  </div>
                  {competitors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCompetitor(index)}
                      className="onboarding-remove-button"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Competitor Button */}
            {competitors.length < 7 && (
              <button
                type="button"
                onClick={addCompetitor}
                className="onboarding-add-button"
              >
                + Add Competitor
              </button>
            )}

            {/* Error Message */}
            {errors.competitors && (
              <p className="onboarding-error-text" role="alert">
                {errors.competitors}
              </p>
            )}

            {/* Competitor Count */}
            <p className="onboarding-counter">
              {validCompetitorsCount} of 3-7 competitors added
            </p>

            {/* Action Buttons */}
            <div className="onboarding-button-group">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={cn("onboarding-button onboarding-button-primary onboarding-button-full")}
              >
                {isSubmitting ? "Saving..." : "Next Step"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
