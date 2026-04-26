"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { validateBusinessDescription, validateTargetAudiences } from "@/lib/validation/onboarding-profile-schema"
import { useCurrentUser } from '@/lib/hooks/use-current-user'

interface StepBusinessProps {
  className?: string
  onNext?: (data: BusinessData) => void
  onSkip?: () => void
}

interface BusinessData {
  website_url?: string
  business_description?: string
  target_audiences?: string[]
}

export function StepBusiness({ className, onNext, onSkip }: StepBusinessProps) {
  const [formData, setFormData] = useState<BusinessData>({
    website_url: "",
    business_description: "",
    target_audiences: []
  })
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

    // Website URL validation (required)
    if (!formData.website_url) {
      newErrors.website_url = "Website URL is required"
    } else if (!validateUrl(formData.website_url)) {
      newErrors.website_url = "Please enter a valid URL (e.g., https://example.com)"
    }

    // Business Description validation using production schema
    if (formData.business_description) {
      const descriptionResult = validateBusinessDescription(formData.business_description)
      if (!descriptionResult.success) {
        newErrors.business_description = descriptionResult.error.issues[0].message
      }
    } else {
      newErrors.business_description = "Please provide a brief but meaningful description of your business."
    }

    // Target Audiences validation using production schema
    if (formData.target_audiences && formData.target_audiences.length > 0) {
      const audiencesResult = validateTargetAudiences(formData.target_audiences)
      if (!audiencesResult.success) {
        const firstError = audiencesResult.error.issues[0]
        if (firstError.code === 'too_small') {
          newErrors.target_audiences = "Each audience must be 80 characters or fewer."
        } else if (firstError.code === 'too_big') {
          newErrors.target_audiences = "You can add up to 5 target audiences only."
        } else {
          newErrors.target_audiences = firstError.message
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof BusinessData, value: string | string[]) => {
    console.log('[StepBusiness] handleInputChange:', field, value)
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }

    // Real-time validation for URL field
    if (field === 'website_url' && typeof value === 'string') {
      if (value && !validateUrl(value)) {
        setErrors(prev => ({ 
          ...prev, 
          website_url: "Please enter a valid URL (e.g., https://example.com)" 
        }))
      } else {
        setErrors(prev => ({ ...prev, website_url: "" }))
      }
    }

    // Real-time validation for business description
    if (field === 'business_description' && typeof value === 'string') {
      if (value) {
        const result = validateBusinessDescription(value)
        if (!result.success) {
          setErrors(prev => ({ 
            ...prev, 
            business_description: result.error.issues[0].message
          }))
        } else {
          setErrors(prev => ({ ...prev, business_description: "" }))
        }
      } else {
        setErrors(prev => ({ ...prev, business_description: "" }))
      }
    }
  }

  const handleAudiencesChange = (value: string) => {
    // Split by comma and trim whitespace
    const audiences = value.split(',').map(a => a.trim()).filter(Boolean)
    handleInputChange('target_audiences', audiences)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      console.error('[StepBusiness] Form validation failed')
      return
    }

    setIsSubmitting(true)
    try {
      console.log('[StepBusiness] Attempting to persist:', formData)
      
      // 🎯 PERSIST TO DATABASE FIRST
      const res = await fetch('/api/onboarding/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      console.log('[StepBusiness] Persist response status:', res.status)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('[StepBusiness] Persist failed:', errorData)
        throw new Error(errorData?.error || `Failed with status ${res.status}`)
      }

      const persistResult = await res.json()
      console.log('[StepBusiness] Persist success:', persistResult)

      // 🎯 OBSERVE TRUTH FROM DB
      if (!user?.org_id) {
        throw new Error('User not authenticated or missing organization')
      }
      
      const observerRes = await fetch('/api/onboarding/observe', {
        method: 'GET',
      })
      console.log('[StepBusiness] Observer response status:', observerRes.status)
      
      if (!observerRes.ok) {
        throw new Error('Failed to observe onboarding state')
      }

      const state = await observerRes.json()
      console.log('[StepBusiness] Observer state:', state)

      // 🎯 PASS VALIDATED STATE UP (NOT RAW FORM DATA)
      await onNext?.(state)
    } catch (error) {
      console.error('[StepBusiness] Complete error:', error)
      // Don't advance step on failure
      return
    } finally {
      setIsSubmitting(false)
    }
  }


  const isFormValid = () => {
    // Website URL validation (optional)
    if (formData.website_url && !validateUrl(formData.website_url)) {
      return false
    }
    
    // Business Description must pass schema validation
    if (!formData.business_description) {
      return false
    }
    const descriptionResult = validateBusinessDescription(formData.business_description)
    if (!descriptionResult.success) {
      return false
    }
    
    // Target Audiences must pass schema validation (optional but if provided, must be valid)
    if (formData.target_audiences && formData.target_audiences.length > 0) {
      const audiencesResult = validateTargetAudiences(formData.target_audiences)
      if (!audiencesResult.success) {
        return false
      }
    }
    
    return true
  }

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
        }}>Business Information</h2>

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
            }}>Help us understand your business</h3>
            <p style={{
              fontSize: "13px",
              color: "#7b8098",
              marginBottom: "8px",
              lineHeight: "1.5"
            }}>
              This information helps us tailor the content generation to your specific needs and target audience.
            </p>
            <ul style={{
              fontSize: "13px",
              color: "#7b8098",
              lineHeight: "1.5"
            }}>
              <li>• Website URL helps us analyze your online presence</li>
              <li>• Business description guides content tone and style</li>
              <li>• Target audiences ensure content reaches the right people</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Website URL */}
            <div className="space-y-2">
              <label htmlFor="website_url" style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#e8eaf2"
              }}>
                Website URL <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="website_url"
                type="url"
                placeholder="https://example.com"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#13151e",
                  border: errors.website_url ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "8px",
                  color: "#e8eaf2",
                  fontSize: "14px",
                  outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(79,110,247,0.3)"}
                onBlur={(e) => e.target.style.borderColor = errors.website_url ? "#ef4444" : "rgba(255,255,255,0.07)"}
                aria-describedby={errors.website_url ? "website_url-error" : undefined}
              />
              {errors.website_url && (
                <p id="website_url-error" style={{
                  fontSize: "12px",
                  color: "#ef4444",
                  marginTop: "4px"
                }} role="alert">
                  {errors.website_url}
                </p>
              )}
            </div>

            {/* Business Description */}
            <div className="space-y-2">
              <label htmlFor="business_description" style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#e8eaf2"
              }}>
                Business Description <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className="space-y-2">
                <textarea
                  id="business_description"
                  rows={4}
                  maxLength={500}
                  placeholder="Describe what your business does, who it serves, and what makes it different."
                  value={formData.business_description}
                  onChange={(e) => handleInputChange('business_description', e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#13151e",
                    border: errors.business_description ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "8px",
                    color: "#e8eaf2",
                    fontSize: "14px",
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "none",
                    minHeight: "100px"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "rgba(79,110,247,0.3)"}
                  onBlur={(e) => e.currentTarget.style.borderColor = errors.business_description ? "#ef4444" : "rgba(255,255,255,0.07)"}
                  aria-describedby={errors.business_description ? "business_description-error" : "business_description-help"}
                />
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <p id="business_description-help" style={{
                    fontSize: "12px",
                    color: "#7b8098"
                  }}>
                    Keep it short and specific. This helps us generate accurate research and content.
                  </p>
                  <p style={{
                    fontSize: "12px",
                    color: "#7b8098"
                  }}>
                    {formData.business_description?.length || 0} / 500 characters
                  </p>
                </div>
                {errors.business_description && (
                  <p id="business_description-error" style={{
                    fontSize: "12px",
                    color: "#ef4444",
                    marginTop: "4px"
                  }} role="alert">
                    {errors.business_description}
                  </p>
                )}
              </div>
            </div>

            {/* Target Audiences */}
            <div className="space-y-2">
              <label htmlFor="target_audiences" style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#e8eaf2"
              }}>
                Target Audiences <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className="space-y-3">
                <p id="target_audiences-help" style={{
                  fontSize: "13px",
                  color: "#7b8098"
                }}>
                  Add up to 5 specific audience groups. Each should be a short phrase, not a sentence.
                </p>

                <input
                  id="target_audiences"
                  type="text"
                  placeholder="e.g. Small business owners in local services"
                  onChange={(e) => handleAudiencesChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#13151e",
                    border: errors.target_audiences ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "8px",
                    color: "#e8eaf2",
                    fontSize: "14px",
                    outline: "none"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "rgba(79,110,247,0.3)"}
                  onBlur={(e) => e.currentTarget.style.borderColor = errors.target_audiences ? "#ef4444" : "rgba(255,255,255,0.07)"}
                  aria-describedby={errors.target_audiences ? "target_audiences-error" : "target_audiences-guidance"}
                />

                <div className="space-y-2">
                  <p id="target_audiences-guidance" style={{
                    fontSize: "12px",
                    color: "#7b8098",
                    fontWeight: "600"
                  }}>
                    Format: <strong style={{ color: "#e8eaf2" }}>role + context + qualifier</strong>
                  </p>

                  <div style={{
                    fontSize: "12px",
                    color: "#7b8098"
                  }}>
                    <p style={{ fontWeight: "600", marginBottom: "4px", color: "#e8eaf2" }}>Examples:</p>
                    <ul style={{ paddingLeft: "16px" }}>
                      <li>• Marketing managers at SaaS startups</li>
                      <li>• E-commerce founders selling physical products</li>
                      <li>• Healthcare clinic administrators</li>
                    </ul>
                  </div>

                  {formData.target_audiences && formData.target_audiences.length > 0 && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                      color: "#7b8098"
                    }}>
                      <span>{formData.target_audiences.length} / 5 audiences</span>
                      {formData.target_audiences.some(a => a.length > 80) && (
                        <span style={{ color: "#ef4444" }}>Some entries exceed 80 characters</span>
                      )}
                    </div>
                  )}
                </div>

                {errors.target_audiences && (
                  <p id="target_audiences-error" style={{
                    fontSize: "12px",
                    color: "#ef4444",
                    marginTop: "4px"
                  }} role="alert">
                    {errors.target_audiences}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              gap: "12px",
              paddingTop: "16px"
            }}>
              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                style={{
                  flex: 1,
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontWeight: "600",
                  borderRadius: "8px",
                  background: (!isFormValid() || isSubmitting) ? "rgba(79, 110, 247, 0.4)" : "#4f6ef7",
                  color: "#ffffff",
                  border: "none",
                  cursor: (!isFormValid() || isSubmitting) ? "not-allowed" : "pointer",
                  opacity: (!isFormValid() || isSubmitting) ? 0.6 : 1,
                  transition: "all 0.2s",
                  boxShadow: "0 0 20px rgba(79,110,247,0.3)"
                }}
                onMouseEnter={(e) => {
                  if (!isFormValid() && !isSubmitting) {
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
