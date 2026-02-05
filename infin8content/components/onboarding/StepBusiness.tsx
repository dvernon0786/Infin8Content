"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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

    if (!formData.website_url) {
      newErrors.website_url = "Website URL is required"
    } else if (!validateUrl(formData.website_url)) {
      newErrors.website_url = "Please enter a valid URL (e.g., https://example.com)"
    }

    if (!formData.business_description || formData.business_description.length < 10) {
      newErrors.business_description = "Business description must be at least 10 characters"
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
      if (value && value.length < 10) {
        setErrors(prev => ({ 
          ...prev, 
          business_description: "Business description must be at least 10 characters" 
        }))
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

  const isFormValid = formData.website_url && 
                     validateUrl(formData.website_url) && 
                     formData.business_description && 
                     formData.business_description.length >= 10

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
              <textarea
                id="business_description"
                rows={4}
                placeholder="Describe what your business does, your products/services, and what makes you unique..."
                value={formData.business_description}
                onChange={(e) => handleInputChange('business_description', e.target.value)}
                className={cn(
                  "w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                  errors.business_description && "border-destructive"
                )}
                aria-describedby={errors.business_description ? "business_description-error" : undefined}
              />
              {errors.business_description && (
                <p id="business_description-error" className="text-sm text-destructive" role="alert">
                  {errors.business_description}
                </p>
              )}
            </div>

            {/* Target Audiences */}
            <div className="space-y-2">
              <label htmlFor="target_audiences" className="text-sm font-medium">
                Target Audiences
              </label>
              <Input
                id="target_audiences"
                type="text"
                placeholder="Small businesses, Entrepreneurs, Marketing professionals (comma separated)"
                onChange={(e) => handleAudiencesChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple audiences with commas
              </p>
            </div>

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
