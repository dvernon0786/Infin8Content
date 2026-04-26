"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { LOCATION_CODE_MAP, SUPPORTED_LANGUAGE_CODES } from '@/lib/config/dataforseo-geo'
import "./onboarding-steps.css"

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English', de: 'German', fr: 'French', es: 'Spanish', it: 'Italian', ja: 'Japanese',
  ar: 'Arabic', nl: 'Dutch', pt: 'Portuguese', ru: 'Russian', sv: 'Swedish',
  ko: 'Korean', hi: 'Hindi', tr: 'Turkish', pl: 'Polish'
}

interface StepKeywordSettingsProps {
  className?: string
  onNext?: (data: KeywordSettingsData) => void
  onSkip?: () => void
}

interface KeywordSettingsData {
  keyword_settings: {
    target_region: string
    language_code: string
    auto_generate_keywords: boolean
    monthly_keyword_limit: number
  }
}

export function StepKeywordSettings({ className, onNext, onSkip }: StepKeywordSettingsProps) {
  const [formData, setFormData] = useState<KeywordSettingsData>({
    keyword_settings: {
      target_region: "United States",
      language_code: "en",
      auto_generate_keywords: true,
      monthly_keyword_limit: 100
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useCurrentUser()

  // Form validation
  const isFormValid =
    formData.keyword_settings.target_region.length >= 2 &&
    formData.keyword_settings.language_code.length >= 2 &&
    formData.keyword_settings.monthly_keyword_limit >= 10 &&
    formData.keyword_settings.monthly_keyword_limit <= 1000

  const handleInputChange = (field: keyof KeywordSettingsData['keyword_settings'], value: any) => {
    setFormData(prev => ({
      ...prev,
      keyword_settings: {
        ...prev.keyword_settings,
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('[StepKeywordSettings] User data:', user)
    console.log('[StepKeywordSettings] User org_id:', user?.org_id)
    
    if (!user?.org_id) {
      console.error('[StepKeywordSettings] User not authenticated')
      return
    }

    setIsSubmitting(true)
    try {
      console.log('[StepKeywordSettings] Attempting to persist keyword settings:', formData)
      console.log('[StepKeywordSettings] Payload JSON:', JSON.stringify(formData, null, 2))
      
      // 🎯 PERSIST KEYWORD SETTINGS TO DATABASE
      const res = await fetch('/api/onboarding/persist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('[StepKeywordSettings] Persist failed:', errorText)
        console.error('[StepKeywordSettings] Persist status:', res.status)
        
        let errorData: { error?: string } = {}
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          // If not JSON, use the raw text
          errorData = { error: errorText }
        }
        
        throw new Error(errorData.error || `Failed to save keyword settings (${res.status})`)
      }

      const persistResult = await res.json()
      console.log('[StepKeywordSettings] Persist success:', persistResult)

      // 🎯 OBSERVE TRUTH FROM DB
      if (!user?.org_id) {
        throw new Error('User not authenticated or missing organization')
      }
      
      const observerRes = await fetch('/api/onboarding/observe', {
        method: 'GET',
      })
      console.log('[StepKeywordSettings] Observer response status:', observerRes.status)
      
      if (!observerRes.ok) {
        throw new Error('Failed to observe onboarding state')
      }

      const state = await observerRes.json()
      console.log('[StepKeywordSettings] Observer state:', state)

      // 🎯 PASS VALIDATED STATE UP (NOT RAW FORM DATA)
      await onNext?.(state)
    } catch (error) {
      console.error('[StepKeywordSettings] Complete error:', error)
      // Don't advance step on failure
      return
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    console.warn('Skip not implemented - all steps required for System Law compliance')
  }

  return (
    <main className={cn("onboarding-step-container", className)}>
      <div className="onboarding-step-card">
        <h2 className="onboarding-step-title">Keyword Settings</h2>

        <div className="onboarding-space-y-6">
          {/* Informational Context Box */}
          <div className="onboarding-info-box">
            <h3 className="onboarding-info-box-title">Configure your keyword strategy</h3>
            <p className="onboarding-info-box-text">
              Set up keyword generation parameters to align with your SEO goals and resource constraints.
            </p>
            <ul className="onboarding-info-box-list">
              <li>• Region determines the geographic focus for keyword research</li>
              <li>• Generation rules control keyword quality and quantity</li>
              <li>• Thresholds ensure we target valuable keywords</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="onboarding-space-y-4">
            {/* Target Region */}
            <div className="onboarding-form-group">
              <label htmlFor="target_region" className="onboarding-label">
                Target Region <span className="onboarding-label-required">*</span>
              </label>
              <select
                id="target_region"
                value={formData.keyword_settings.target_region}
                onChange={(e) => handleInputChange('target_region', e.target.value)}
                className="onboarding-select"
              >
                {['United States', ...Object.keys(LOCATION_CODE_MAP)
                  .filter(r => r !== 'United States')
                  .sort((a, b) => a.localeCompare(b))]
                  .map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
              </select>
            </div>

            {/* Language Code */}
            <div className="onboarding-form-group">
              <label htmlFor="language_code" className="onboarding-label">
                Language <span className="onboarding-label-required">*</span>
              </label>
              <select
                id="language_code"
                value={formData.keyword_settings.language_code}
                onChange={(e) => handleInputChange('language_code', e.target.value)}
                className="onboarding-select"
              >
                {Array.from(SUPPORTED_LANGUAGE_CODES)
                  .sort()
                  .map(code => (
                    <option key={code} value={code}>
                      {LANGUAGE_LABELS[code] || code.toUpperCase()}
                    </option>
                  ))}
              </select>
            </div>

            {/* Auto Generate Keywords */}
            <div className="onboarding-form-group">
              <label className="onboarding-label">Auto Generate Keywords</label>
              <div className="onboarding-flex">
                <input
                  type="checkbox"
                  id="auto_generate_keywords"
                  checked={formData.keyword_settings.auto_generate_keywords}
                  onChange={(e) => handleInputChange('auto_generate_keywords', e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "var(--brand-electric-blue, #217CEB)",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                />
                <label htmlFor="auto_generate_keywords" className="onboarding-help-text" style={{ cursor: "pointer", margin: 0 }}>
                  Automatically generate keywords based on your business and competitors
                </label>
              </div>
            </div>

            {/* Monthly Keyword Limit */}
            <div className="onboarding-form-group">
              <label htmlFor="monthly_keyword_limit" className="onboarding-label">
                Monthly Keyword Limit <span className="onboarding-label-required">*</span>
              </label>
              <input
                id="monthly_keyword_limit"
                type="number"
                min="10"
                max="1000"
                value={formData.keyword_settings.monthly_keyword_limit}
                onChange={(e) => handleInputChange('monthly_keyword_limit', parseInt(e.target.value) || 100)}
                className="onboarding-input"
              />
              <p className="onboarding-help-text">Maximum keywords to generate per month (10-1000)</p>
            </div>

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
