"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { validateBusinessDescription, validateTargetAudiences } from "@/lib/validation/onboarding-profile-schema"
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import "./onboarding-steps.css"

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
    <main className={cn("onboarding-step-container", className)}>
      <div className="onboarding-step-card">
        <h2 className="onboarding-step-title">Business Information</h2>

        <div className="onboarding-space-y-6">
          {/* Informational Context Box */}
          <div className="onboarding-info-box">
            <h3 className="onboarding-info-box-title">Help us understand your business</h3>
            <p className="onboarding-info-box-text">
              This information helps us tailor the content generation to your specific needs and target audience.
            </p>
            <ul className="onboarding-info-box-list">
              <li>• Website URL helps us analyze your online presence</li>
              <li>• Business description guides content tone and style</li>
              <li>• Target audiences ensure content reaches the right people</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="onboarding-space-y-4">
            {/* Website URL */}
            <div className="onboarding-form-group">
              <label htmlFor="website_url" className="onboarding-label">
                Website URL <span className="onboarding-label-required">*</span>
              </label>
              <input
                id="website_url"
                type="url"
                placeholder="https://example.com"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                className={cn("onboarding-input", errors.website_url && "error")}
                aria-describedby={errors.website_url ? "website_url-error" : undefined}
              />
              {errors.website_url && (
                <p id="website_url-error" className="onboarding-error-text" role="alert">
                  {errors.website_url}
                </p>
              )}
            </div>

            {/* Business Description */}
            <div className="onboarding-form-group">
              <label htmlFor="business_description" className="onboarding-label">
                Business Description <span className="onboarding-label-required">*</span>
              </label>
              <div className="onboarding-form-group-space">
                <textarea
                  id="business_description"
                  rows={4}
                  maxLength={500}
                  placeholder="Describe what your business does, who it serves, and what makes it different."
                  value={formData.business_description}
                  onChange={(e) => handleInputChange('business_description', e.target.value)}
                  className={cn("onboarding-textarea", errors.business_description && "error")}
                  aria-describedby={errors.business_description ? "business_description-error" : "business_description-help"}
                />
                <div className="onboarding-flex-between">
                  <p id="business_description-help" className="onboarding-help-text">
                    Keep it short and specific. This helps us generate accurate research and content.
                  </p>
                  <p className="onboarding-help-text">
                    {formData.business_description?.length || 0} / 500 characters
                  </p>
                </div>
                {errors.business_description && (
                  <p id="business_description-error" className="onboarding-error-text" role="alert">
                    {errors.business_description}
                  </p>
                )}
              </div>
            </div>

            {/* Target Audiences */}
            <div className="onboarding-form-group">
              <label htmlFor="target_audiences" className="onboarding-label">
                Target Audiences <span className="onboarding-label-required">*</span>
              </label>
              <div className="onboarding-form-group-space">
                <p id="target_audiences-help" className="onboarding-help-text">
                  Add up to 5 specific audience groups. Each should be a short phrase, not a sentence.
                </p>

                <input
                  id="target_audiences"
                  type="text"
                  placeholder="e.g. Small business owners in local services"
                  onChange={(e) => handleAudiencesChange(e.target.value)}
                  className={cn("onboarding-input", errors.target_audiences && "error")}
                  aria-describedby={errors.target_audiences ? "target_audiences-error" : "target_audiences-guidance"}
                />

                <div className="onboarding-form-group-space">
                  <p id="target_audiences-guidance" className="onboarding-help-text" style={{ fontWeight: "600" }}>
                    Format: <strong style={{ color: "var(--onboarding-text-light, #e8eaf2)" }}>role + context + qualifier</strong>
                  </p>

                  <div className="onboarding-text-secondary">
                    <p style={{ fontWeight: "600", marginBottom: "4px", color: "var(--onboarding-text-light, #e8eaf2)" }}>Examples:</p>
                    <ul style={{ paddingLeft: "16px" }}>
                      <li>• Marketing managers at SaaS startups</li>
                      <li>• E-commerce founders selling physical products</li>
                      <li>• Healthcare clinic administrators</li>
                    </ul>
                  </div>

                  {formData.target_audiences && formData.target_audiences.length > 0 && (
                    <div className="onboarding-flex">
                      <span>{formData.target_audiences.length} / 5 audiences</span>
                      {formData.target_audiences.some(a => a.length > 80) && (
                        <span style={{ color: "var(--color-error, #ef4444)" }}>Some entries exceed 80 characters</span>
                      )}
                    </div>
                  )}
                </div>

                {errors.target_audiences && (
                  <p id="target_audiences-error" className="onboarding-error-text" role="alert">
                    {errors.target_audiences}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="onboarding-button-group">
              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
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
