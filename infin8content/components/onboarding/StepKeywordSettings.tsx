"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StepKeywordSettingsProps {
  className?: string
  onNext?: (data: KeywordSettingsData) => void
  onSkip?: () => void
}

interface KeywordSettingsData {
  region: string
  generation_rules: {
    max_keywords_per_month: number
    competition_threshold: number
    search_volume_min: number
  }
}

export function StepKeywordSettings({ className, onNext, onSkip }: StepKeywordSettingsProps) {
  const [formData, setFormData] = useState<KeywordSettingsData>({
    region: "us",
    generation_rules: {
      max_keywords_per_month: 50,
      competition_threshold: 0.5,
      search_volume_min: 100
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof KeywordSettingsData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleRulesChange = (field: keyof KeywordSettingsData['generation_rules'], value: any) => {
    setFormData(prev => ({
      ...prev,
      generation_rules: {
        ...prev.generation_rules,
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
          <CardTitle className="text-xl">Keyword Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informational Context Box */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <h3 className="font-medium mb-2">Configure your keyword strategy</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Set up keyword generation parameters to align with your SEO goals and resource constraints.
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Region determines the geographic focus for keyword research</li>
              <li>• Generation rules control keyword quality and quantity</li>
              <li>• Thresholds ensure we target valuable keywords</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Region */}
            <div className="space-y-2">
              <label htmlFor="region" className="text-sm font-medium">
                Target Region
              </label>
              <select
                id="region"
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="us">United States</option>
                <option value="uk">United Kingdom</option>
                <option value="ca">Canada</option>
                <option value="au">Australia</option>
                <option value="de">Germany</option>
                <option value="fr">France</option>
                <option value="es">Spain</option>
                <option value="it">Italy</option>
                <option value="jp">Japan</option>
                <option value="global">Global</option>
              </select>
            </div>

            {/* Generation Rules */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Generation Rules</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Max Keywords Per Month */}
                <div className="space-y-2">
                  <label htmlFor="max_keywords_per_month" className="text-sm font-medium">
                    Max Keywords/Month
                  </label>
                  <Input
                    id="max_keywords_per_month"
                    type="number"
                    min="1"
                    max="500"
                    value={formData.generation_rules.max_keywords_per_month}
                    onChange={(e) => handleRulesChange('max_keywords_per_month', parseInt(e.target.value) || 50)}
                  />
                </div>

                {/* Competition Threshold */}
                <div className="space-y-2">
                  <label htmlFor="competition_threshold" className="text-sm font-medium">
                    Competition Threshold
                  </label>
                  <Input
                    id="competition_threshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.generation_rules.competition_threshold}
                    onChange={(e) => handleRulesChange('competition_threshold', parseFloat(e.target.value) || 0.5)}
                  />
                  <p className="text-xs text-muted-foreground">0 (low) to 1 (high)</p>
                </div>

                {/* Search Volume Min */}
                <div className="space-y-2">
                  <label htmlFor="search_volume_min" className="text-sm font-medium">
                    Min Search Volume
                  </label>
                  <Input
                    id="search_volume_min"
                    type="number"
                    min="10"
                    max="100000"
                    value={formData.generation_rules.search_volume_min}
                    onChange={(e) => handleRulesChange('search_volume_min', parseInt(e.target.value) || 100)}
                  />
                  <p className="text-xs text-muted-foreground">Monthly searches</p>
                </div>
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
