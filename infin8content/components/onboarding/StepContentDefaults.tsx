"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StepContentDefaultsProps {
  className?: string
  onNext?: (data: ContentDefaultsData) => void
  onSkip?: () => void
}

interface ContentDefaultsData {
  language: string
  tone: string
  publishing_rules: {
    min_word_count: number
    max_word_count: number
    include_images: boolean
  }
}

export function StepContentDefaults({ className, onNext, onSkip }: StepContentDefaultsProps) {
  const [formData, setFormData] = useState<ContentDefaultsData>({
    language: "en",
    tone: "professional",
    publishing_rules: {
      min_word_count: 800,
      max_word_count: 2000,
      include_images: true
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof ContentDefaultsData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleRulesChange = (field: keyof ContentDefaultsData['publishing_rules'], value: any) => {
    setFormData(prev => ({
      ...prev,
      publishing_rules: {
        ...prev.publishing_rules,
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

  return (
    <main className={cn("w-full max-w-2xl mx-auto", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Content Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informational Context Box */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <h3 className="font-medium mb-2">Configure your content preferences</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Set the default settings for content generation to match your brand voice and requirements.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Language determines the primary language for your content</li>
              <li>• Tone sets the writing style and voice</li>
              <li>• Publishing rules ensure consistent content quality</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Language */}
            <div className="space-y-2">
              <label htmlFor="language" className="text-sm font-medium">
                Primary Language <span className="text-destructive">*</span>
              </label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <label htmlFor="tone" className="text-sm font-medium">
                Content Tone <span className="text-destructive">*</span>
              </label>
              <select
                id="tone"
                value={formData.tone}
                onChange={(e) => handleInputChange('tone', e.target.value)}
                className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
                <option value="technical">Technical</option>
                <option value="conversational">Conversational</option>
              </select>
            </div>

            {/* Publishing Rules */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Publishing Rules</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Min Word Count */}
                <div className="space-y-2">
                  <label htmlFor="min_word_count" className="text-sm font-medium">
                    Min Word Count <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="min_word_count"
                    type="number"
                    min="100"
                    max="5000"
                    value={formData.publishing_rules.min_word_count}
                    onChange={(e) => handleRulesChange('min_word_count', parseInt(e.target.value) || 800)}
                  />
                </div>

                {/* Max Word Count */}
                <div className="space-y-2">
                  <label htmlFor="max_word_count" className="text-sm font-medium">
                    Max Word Count <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="max_word_count"
                    type="number"
                    min="100"
                    max="10000"
                    value={formData.publishing_rules.max_word_count}
                    onChange={(e) => handleRulesChange('max_word_count', parseInt(e.target.value) || 2000)}
                  />
                </div>
              </div>

              {/* Include Images */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="include_images"
                  checked={formData.publishing_rules.include_images}
                  onChange={(e) => handleRulesChange('include_images', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="include_images" className="text-sm font-medium">
                  Include images in generated content
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="default"
                disabled={isSubmitting}
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
