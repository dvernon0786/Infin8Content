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


  const validCompetitorsCount = competitors.filter(c => c.url.trim()).length
  const isFormValid = validCompetitorsCount >= 1 && validCompetitorsCount <= 7

  return (
    <main className={cn("w-full max-w-2xl mx-auto", className)}>
      <div style={{
        background: "#0f1117",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "14px",
        padding: "32px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
      }}>
        <h2 style={{
          fontSize: "22px",
          fontWeight: "600",
          color: "#ffffff",
          marginBottom: "24px"
        }}>Competitor Analysis</h2>

        <div className="space-y-6">
          {/* Informational Context Box */}
          <div style={{
            background: "rgba(79, 110, 247, 0.08)",
            border: "1px solid rgba(79, 110, 247, 0.2)",
            borderRadius: "10px",
            padding: "16px"
          }}>
            <h3 style={{
              fontWeight: "600",
              marginBottom: "8px",
              color: "#ffffff",
              fontSize: "14px"
            }}>Understanding your competition</h3>
            <p style={{
              fontSize: "13px",
              color: "#7b8098",
              marginBottom: "8px",
              lineHeight: "1.5"
            }}>
              Adding competitor websites helps us analyze their content strategies and identify opportunities for your business.
            </p>
            <ul style={{
              fontSize: "13px",
              color: "#7b8098",
              lineHeight: "1.5"
            }}>
              <li>• Add 3-7 competitor websites for optimal analysis</li>
              <li>• Focus on direct competitors in your industry</li>
              <li>• We'll analyze their content to help you stand out</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Competitor Inputs */}
            <div className="space-y-4">
              <div style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#e8eaf2"
              }}>
                Competitor Websites <span style={{ color: "#ef4444" }}>*</span>
              </div>
              {competitors.map((competitor, index) => (
                <div key={index} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px"
                }}>
                  <div style={{ flex: 1 }}>
                    <label style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#e8eaf2",
                      display: "block",
                      marginBottom: "6px"
                    }}>
                      Competitor {index + 1} URL <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="url"
                      value={competitor.url}
                      onChange={(e) => updateCompetitor(index, 'url', e.target.value)}
                      placeholder={`Competitor ${index + 1} URL`}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "#13151e",
                        border: errors[`competitor_${index}`] ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "8px",
                        color: "#e8eaf2",
                        fontSize: "14px",
                        outline: "none",
                        marginBottom: "12px"
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "rgba(79,110,247,0.3)"}
                      onBlur={(e) => e.currentTarget.style.borderColor = errors[`competitor_${index}`] ? "#ef4444" : "rgba(255,255,255,0.07)"}
                      aria-label={`Competitor ${index + 1} URL`}
                    />
                    <label style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#e8eaf2",
                      display: "block",
                      marginBottom: "6px"
                    }}>
                      Competitor {index + 1} Name <span style={{ color: "#7b8098" }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={competitor.name || ""}
                      onChange={(e) => updateCompetitor(index, 'name', e.target.value)}
                      placeholder={`Competitor ${index + 1} Name`}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "#13151e",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "8px",
                        color: "#e8eaf2",
                        fontSize: "14px",
                        outline: "none"
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "rgba(79,110,247,0.3)"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
                      aria-label={`Competitor ${index + 1} Name`}
                    />
                  </div>
                  {competitors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCompetitor(index)}
                      style={{
                        padding: "10px 8px",
                        background: "#13151e",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "8px",
                        color: "#ef4444",
                        fontSize: "18px",
                        fontWeight: "600",
                        cursor: "pointer",
                        height: "fit-content",
                        marginTop: "30px"
                      }}
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
                style={{
                  width: "100%",
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontWeight: "600",
                  borderRadius: "8px",
                  background: "transparent",
                  border: "1px dashed rgba(79, 110, 247, 0.4)",
                  color: "#4f6ef7",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(79, 110, 247, 0.8)"
                  e.currentTarget.style.background = "rgba(79, 110, 247, 0.05)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(79, 110, 247, 0.4)"
                  e.currentTarget.style.background = "transparent"
                }}
              >
                + Add Competitor
              </button>
            )}

            {/* Error Message */}
            {errors.competitors && (
              <p style={{
                fontSize: "12px",
                color: "#ef4444",
                marginTop: "4px"
              }} role="alert">
                {errors.competitors}
              </p>
            )}

            {/* Competitor Count */}
            <p style={{
              fontSize: "11px",
              color: "#7b8098"
            }}>
              {validCompetitorsCount} of 3-7 competitors added
            </p>

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              gap: "12px",
              paddingTop: "16px"
            }}>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                style={{
                  flex: 1,
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontWeight: "600",
                  borderRadius: "8px",
                  background: (!isFormValid || isSubmitting) ? "rgba(79, 110, 247, 0.4)" : "#4f6ef7",
                  color: "#ffffff",
                  border: "none",
                  cursor: (!isFormValid || isSubmitting) ? "not-allowed" : "pointer",
                  opacity: (!isFormValid || isSubmitting) ? 0.6 : 1,
                  transition: "all 0.2s",
                  boxShadow: "0 0 20px rgba(79,110,247,0.3)"
                }}
                onMouseEnter={(e) => {
                  if (isFormValid && !isSubmitting) {
                    e.currentTarget.style.background = "#3d5df5"
                    e.currentTarget.style.boxShadow = "0 0 30px rgba(79,110,247,0.5)"
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#4f6ef7"
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(79,110,247,0.3)"
                }}
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
