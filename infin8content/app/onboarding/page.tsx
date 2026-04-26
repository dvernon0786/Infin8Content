"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
import { StepBusiness } from "@/components/onboarding/StepBusiness"
import { StepCompetitors } from "@/components/onboarding/StepCompetitors"
import { StepKeywordSettings } from "@/components/onboarding/StepKeywordSettings"
import { StepContentDefaults } from "@/components/onboarding/StepContentDefaults"
import { StepIntegration } from "@/components/onboarding/StepIntegration"

const darkThemeStyle = `
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.2);
  }
  * {
    scrollbar-color: rgba(255,255,255,0.1) transparent;
  }
`

type OnboardingObserverState = {
  orgId: string
  onboarding_completed?: boolean
  current_step: number
  canonical_state: {
    website_url: boolean
    business_description: boolean
    target_audiences_count: number
    competitors: number
    keyword_settings_present: boolean
    content_defaults_present: boolean
  }
  validation: {
    valid: boolean
    missing: string[]
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
    if (observerState?.validation?.valid === true) {
      console.log('[Onboarding] Complete → redirecting to dashboard')
      router.replace("/dashboard")
    }
  }, [observerState?.validation?.valid, router])

  /**
   * 🔒 Prevent onboarding UI flash after completion
   */
  if (observerState?.validation?.valid === true) {
    return null
  }

  return (
    <>
      <style>{darkThemeStyle}</style>
      <div style={{
        background: "linear-gradient(135deg, #08090d 0%, #0f1117 50%, #08090d 100%)",
        minHeight: "100vh",
        paddingTop: "60px",
        paddingBottom: "60px"
      }}>
        <div style={{
          maxWidth: "1160px",
          margin: "0 auto",
          padding: "0 28px"
        }}>
          <div style={{ marginBottom: "48px" }}>
            <OnboardingWizard currentStep={currentStep} />
          </div>

          {currentStep === 1 && <StepBusiness onNext={handleNext} />}
          {currentStep === 2 && <StepCompetitors onNext={handleNext} />}
          {currentStep === 3 && <StepKeywordSettings onNext={handleNext} />}
          {currentStep === 4 && <StepContentDefaults onNext={handleNext} />}
          {currentStep === 5 && <StepIntegration onNext={handleNext} />}
        </div>
      </div>
    </>
  )
}
