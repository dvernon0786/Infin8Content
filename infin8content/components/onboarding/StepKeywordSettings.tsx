"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { LOCATION_CODE_MAP, SUPPORTED_LANGUAGE_CODES } from '@/lib/config/dataforseo-geo'

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
        }}>Keyword Settings</h2>

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
            }}>Configure your keyword strategy</h3>
            <p style={{
              fontSize: "13px",
              color: "#7b8098",
              marginBottom: "8px",
              lineHeight: "1.5"
            }}>
              Set up keyword generation parameters to align with your SEO goals and resource constraints.
            </p>
            <ul style={{
              fontSize: "13px",
              color: "#7b8098",
              lineHeight: "1.5"
            }}>
              <li>• Region determines the geographic focus for keyword research</li>
              <li>• Generation rules control keyword quality and quantity</li>
              <li>• Thresholds ensure we target valuable keywords</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Region */}
            <div className="space-y-2">
              <label htmlFor="target_region" style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#e8eaf2"
              }}>
                Target Region <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                id="target_region"
                value={formData.keyword_settings.target_region}
                onChange={(e) => handleInputChange('target_region', e.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
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
            <div className="space-y-2">
              <label htmlFor="language_code" style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#e8eaf2"
              }}>
                Language <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                id="language_code"
                value={formData.keyword_settings.language_code}
                onChange={(e) => handleInputChange('language_code', e.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
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
            <div className="space-y-2">
              <label style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#e8eaf2"
              }}>Auto Generate Keywords</label>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <input
                  type="checkbox"
                  id="auto_generate_keywords"
                  checked={formData.keyword_settings.auto_generate_keywords}
                  onChange={(e) => handleInputChange('auto_generate_keywords', e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "#4f6ef7",
                    cursor: "pointer"
                  }}
                />
                <label htmlFor="auto_generate_keywords" style={{
                  fontSize: "13px",
                  color: "#7b8098",
                  cursor: "pointer"
                }}>
                  Automatically generate keywords based on your business and competitors
                </label>
              </div>
            </div>

            {/* Monthly Keyword Limit */}
            <div className="space-y-2">
              <label htmlFor="monthly_keyword_limit" style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#e8eaf2"
              }}>
                Monthly Keyword Limit <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                id="monthly_keyword_limit"
                type="number"
                min="10"
                max="1000"
                value={formData.keyword_settings.monthly_keyword_limit}
                onChange={(e) => handleInputChange('monthly_keyword_limit', parseInt(e.target.value) || 100)}
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
              />
              <p style={{
                fontSize: "11px",
                color: "#7b8098"
              }}>Maximum keywords to generate per month (10-1000)</p>
            </div>

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
