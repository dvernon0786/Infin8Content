"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { validateBusinessDescription, validateTargetAudiences } from "@/lib/validation/onboarding-profile-schema"

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

    // Website URL validation
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
      return
    }

    setIsSubmitting(true)
    try {
      await onNext?.(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onSkip?.()
  }

  const isFormValid = () => {
    // Website URL must be valid
    if (!formData.website_url || !validateUrl(formData.website_url)) {
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informational Context Box */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <h3 className="font-medium mb-2">Help us understand your business</h3>
            <p className="text-sm text-muted-foreground mb-2">
              This information helps us tailor the content generation to your specific needs and target audience.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Website URL helps us analyze your online presence</li>
              <li>• Business description guides content tone and style</li>
              <li>• Target audiences ensure content reaches the right people</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Website URL */}
            <div className="space-y-2">
              <label htmlFor="website_url" className="text-sm font-medium">
                Website URL <span className="text-destructive">*</span>
              </label>
              <Input
                id="website_url"
                type="url"
                placeholder="https://example.com"
                value={formData.website_url}
                onChange={(e) => handleInputChange('website_url', e.target.value)}
                className={cn(errors.website_url && "border-destructive")}
                aria-describedby={errors.website_url ? "website_url-error" : undefined}
              />
              {errors.website_url && (
                <p id="website_url-error" className="text-sm text-destructive" role="alert">
                  {errors.website_url}
                </p>
              )}
            </div>

            {/* Business Description */}
            <div className="space-y-2">
              <label htmlFor="business_description" className="text-sm font-medium">
                Business Description <span className="text-destructive">*</span>
              </label>
              <div className="space-y-2">
                <textarea
                  id="business_description"
                  rows={4}
                  maxLength={500}
                  placeholder="Describe what your business does, who it serves, and what makes it different."
                  value={formData.business_description}
                  onChange={(e) => handleInputChange('business_description', e.target.value)}
                  className={cn(
                    "w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    errors.business_description && "border-destructive"
                  )}
                  aria-describedby={errors.business_description ? "business_description-error" : "business_description-help"}
                />
                <div className="flex justify-between items-center">
                  <p id="business_description-help" className="text-xs text-muted-foreground">
                    Keep it short and specific. This helps us generate accurate research and content.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formData.business_description?.length || 0} / 500 characters
                  </p>
                </div>
                {errors.business_description && (
                  <p id="business_description-error" className="text-sm text-destructive" role="alert">
                    {errors.business_description}
                  </p>
                )}
              </div>
            </div>

            {/* Target Audiences */}
            <div className="space-y-2">
              <label htmlFor="target_audiences" className="text-sm font-medium">
                Target Audiences
              </label>
              <div className="space-y-3">
                <p id="target_audiences-help" className="text-sm text-muted-foreground">
                  Add up to 5 specific audience groups. Each should be a short phrase, not a sentence.
                </p>
                
                <Input
                  id="target_audiences"
                  type="text"
                  placeholder="e.g. Small business owners in local services"
                  onChange={(e) => handleAudiencesChange(e.target.value)}
                  className={cn(
                    "w-full",
                    errors.target_audiences && "border-destructive"
                  )}
                  aria-describedby={errors.target_audiences ? "target_audiences-error" : "target_audiences-guidance"}
                />
                
                <div className="space-y-2">
                  <p id="target_audiences-guidance" className="text-xs text-muted-foreground font-medium">
                    Format: <strong>role + context + qualifier</strong>
                  </p>
                  
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Examples:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Marketing managers at SaaS startups</li>
                      <li>• E-commerce founders selling physical products</li>
                      <li>• Healthcare clinic administrators</li>
                    </ul>
                  </div>
                  
                  {formData.target_audiences && formData.target_audiences.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formData.target_audiences.length} / 5 audiences</span>
                      {formData.target_audiences.some(a => a.length > 80) && (
                        <span className="text-destructive">Some entries exceed 80 characters</span>
                      )}
                    </div>
                  )}
                </div>
                
                {errors.target_audiences && (
                  <p id="target_audiences-error" className="text-sm text-destructive" role="alert">
                    {errors.target_audiences}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="default"
                disabled={!isFormValid() || isSubmitting}
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
