"use client"

import { StepKeywordSettings } from "@/components/onboarding/StepKeywordSettings"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

import { useRouter } from "next/navigation"

export default function KeywordSettingsStepPage() {
  const router = useRouter()

  const handleNext = async (data: any) => {
    try {
      const response = await fetch('/api/onboarding/keyword-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error || 'Keyword settings failed')
      }

      router.push('/onboarding/integration')
    } catch (error) {
      throw error
    }
  }

  const handleSkip = () => {
    router.push('/onboarding/integration')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <OnboardingWizard currentStep={5} />
        </div>
        <StepKeywordSettings onNext={handleNext} onSkip={handleSkip} />
      </div>
    </div>
  )
}
