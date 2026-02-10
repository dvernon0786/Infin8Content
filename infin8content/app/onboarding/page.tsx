"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
import { StepBusiness } from "@/components/onboarding/StepBusiness"
import { StepCompetitors } from "@/components/onboarding/StepCompetitors"
import { StepKeywordSettings } from "@/components/onboarding/StepKeywordSettings"
import { StepContentDefaults } from "@/components/onboarding/StepContentDefaults"
import { StepIntegration } from "@/components/onboarding/StepIntegration"

type OnboardingObserverState = {
  onboarding_completed: boolean
  current_step: number
  canonical_state: {
    website_url: boolean
    business_description: boolean
    target_audiences_count: number
    competitors: number
    keyword_settings_present: boolean
    content_defaults_present: boolean
  }
}

export default function OnboardingPage() {
  const router = useRouter()

  const [currentStep, setCurrentStep] = useState(1)
  const [observerState, setObserverState] =
    useState<OnboardingObserverState | null>(null)

  /**
   * 🔒 SINGLE SOURCE OF TRUTH
   * UI never derives steps.
   * Backend observer decides everything.
   */
  const handleNext = async (stepData: any) => {
    // Call observer API to get canonical state
    const response = await fetch('/api/onboarding/observe', {
      method: 'GET',
    })
    
    const observerState = await response.json()
    setObserverState(observerState)
    setCurrentStep(observerState.current_step)
  }

  /**
   * 🔒 TERMINATE ONBOARDING FOREVER
   */
  useEffect(() => {
    if (observerState?.onboarding_completed) {
      router.replace("/dashboard")
    }
  }, [observerState?.onboarding_completed, router])

  /**
   * 🔒 Prevent onboarding UI flash after completion
   */
  if (observerState?.onboarding_completed) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <OnboardingWizard currentStep={currentStep} />
        </div>

        {currentStep === 1 && <StepBusiness onNext={handleNext} />}
        {currentStep === 2 && <StepCompetitors onNext={handleNext} />}
        {currentStep === 3 && <StepKeywordSettings onNext={handleNext} />}
        {currentStep === 4 && <StepContentDefaults onNext={handleNext} />}
        {currentStep === 5 && <StepIntegration onNext={handleNext} />}
      </div>
    </div>
  )
}
