'use client'

import { useState } from 'react'
import { LOCATION_CODE_MAP, SUPPORTED_LANGUAGE_CODES } from '@/lib/config/dataforseo-geo'

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English', de: 'German', fr: 'French', es: 'Spanish', it: 'Italian', ja: 'Japanese',
  ar: 'Arabic', nl: 'Dutch', pt: 'Portuguese', ru: 'Russian', sv: 'Swedish',
  ko: 'Korean', hi: 'Hindi', tr: 'Turkish', pl: 'Polish'
}

interface KeywordSettings {
  target_region: string
  language_code: string
  auto_generate_keywords: boolean
  monthly_keyword_limit: number
}

interface Props {
  keywordSettings: KeywordSettings | null
}

export default function KeywordSettingsForm({ keywordSettings }: Props) {
  const [formData, setFormData] = useState<KeywordSettings>({
    target_region: keywordSettings?.target_region ?? 'United States',
    language_code: keywordSettings?.language_code ?? 'en',
    auto_generate_keywords: keywordSettings?.auto_generate_keywords ?? true,
    monthly_keyword_limit: keywordSettings?.monthly_keyword_limit ?? 100,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: keyof KeywordSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/keyword-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save keyword settings')
        return
      }

      setSuccessMessage('Keyword settings saved successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
      window.location.reload()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid =
    formData.target_region.length >= 2 &&
    formData.language_code.length >= 2 &&
    formData.monthly_keyword_limit >= 10 &&
    formData.monthly_keyword_limit <= 1000

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <div className="text-sm flex items-center gap-1 text-green-600 bg-green-50 p-3 rounded-md border border-green-200" role="alert" aria-live="polite">
          <span aria-hidden="true">✓</span> {successMessage}
        </div>
      )}
      {error && (
        <div className="text-sm flex items-center gap-1 text-red-600 bg-red-50 p-3 rounded-md border border-red-200" role="alert" aria-live="polite">
          <span aria-hidden="true">⚠</span> {error}
        </div>
      )}

      <div>
        <label htmlFor="target_region" className="block text-sm font-medium text-gray-900">
          Target Region <span className="text-red-500">*</span>
        </label>
        <select
          id="target_region"
          value={formData.target_region}
          onChange={(e) => handleChange('target_region', e.target.value)}
          disabled={isSubmitting}
          className="mt-1 block w-full px-3 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {['United States', ...Object.keys(LOCATION_CODE_MAP)
            .filter(r => r !== 'United States')
            .sort((a, b) => a.localeCompare(b))]
            .map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">Geographic region for keyword research</p>
      </div>

      <div>
        <label htmlFor="language_code" className="block text-sm font-medium text-gray-900">
          Language <span className="text-red-500">*</span>
        </label>
        <select
          id="language_code"
          value={formData.language_code}
          onChange={(e) => handleChange('language_code', e.target.value)}
          disabled={isSubmitting}
          className="mt-1 block w-full px-3 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Array.from(SUPPORTED_LANGUAGE_CODES)
            .sort()
            .map(code => (
              <option key={code} value={code}>
                {LANGUAGE_LABELS[code] || code.toUpperCase()}
              </option>
            ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">Language for keyword results from DataForSEO</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900">Auto Generate Keywords</label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="checkbox"
            id="auto_generate_keywords"
            checked={formData.auto_generate_keywords}
            onChange={(e) => handleChange('auto_generate_keywords', e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="auto_generate_keywords" className="text-sm text-gray-600">
            Automatically generate keywords based on your business and competitors
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="monthly_keyword_limit" className="block text-sm font-medium text-gray-900">
          Monthly Keyword Limit <span className="text-red-500">*</span>
        </label>
        <input
          id="monthly_keyword_limit"
          type="number"
          min="10"
          max="1000"
          value={formData.monthly_keyword_limit}
          onChange={(e) => handleChange('monthly_keyword_limit', parseInt(e.target.value) || 100)}
          disabled={isSubmitting}
          className="mt-1 block w-full px-3 py-3 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">Maximum keywords to generate per month (10–1000)</p>
      </div>

      <button
        type="submit"
        disabled={!isFormValid || isSubmitting}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
