"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
import { StepBusiness } from "@/components/onboarding/StepBusiness"
import { StepCompetitors } from "@/components/onboarding/StepCompetitors"
import { StepContentDefaults } from "@/components/onboarding/StepContentDefaults"
import { StepKeywordSettings } from "@/components/onboarding/StepKeywordSettings"
import { StepIntegration } from "@/components/onboarding/StepIntegration"
import { StepCompletion } from "@/components/onboarding/StepCompletion"

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [observerState, setObserverState] = useState<any>(null)

  // 🎯 DERIVE NEXT STEP FROM CANONICAL STATE
  const deriveStepFromCanonicalState = (state: any): number => {
    const c = state.canonical_state
    console.log('[Onboarding] Deriving step from canonical state:', c)

    if (!c?.website_url) return 1
    if (!c?.business_description) return 1
    if (c?.target_audiences_count === 0) return 1
    if (c?.competitors === 0) return 2
    if (!c?.keyword_settings_present) return 3
    if (!c?.content_defaults_present) return 4

    return 5 // Integration step
  }

  const handleNext = async (observerState: any) => {
    // 🔒 SINGLE SOURCE OF TRUTH
    setObserverState(observerState)
    
    // 🎯 DERIVE NEXT STEP FROM CANONICAL STATE ONLY
    const nextStep = deriveStepFromCanonicalState(observerState)
    console.log('[Onboarding] Derived next step:', nextStep, 'from observer state:', observerState)
    setCurrentStep(nextStep)
  }

  // 🔒 TERMINATE ONBOARDING FOREVER WHEN COMPLETE
  useEffect(() => {
    if (observerState?.onboarding_completed === true) {
      console.log('[Onboarding] Onboarding completed - redirecting to dashboard')
      router.replace('/dashboard')
    }
  }, [observerState?.onboarding_completed, router])

  const handleSkip = () => {
    // 🎯 NO OPTIMISTIC ADVANCEMENT
    // Skip should still persist something or validate current state
    console.warn('Skip not implemented - all steps required for System Law compliance')
  }

  // 🔒 PREVENT ONBOARDING UI FLASH WHEN COMPLETE
  if (observerState?.onboarding_completed === true) {
    return null // Terminate onboarding UI
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <OnboardingWizard currentStep={currentStep} />
        </div>
        {renderStep()}
      </div>
    </div>
  )

  function renderStep() {
    switch (currentStep) {
      case 1:
        return <StepBusiness onNext={handleNext} onSkip={handleSkip} />
      case 2:
        return <StepCompetitors onNext={handleNext} onSkip={handleSkip} />
      case 3:
        return <StepKeywordSettings onNext={handleNext} onSkip={handleSkip} />
      case 4:
        return <StepContentDefaults onNext={handleNext} />
      case 5:
        return <StepIntegration onNext={handleNext} />
    }
  }
}
