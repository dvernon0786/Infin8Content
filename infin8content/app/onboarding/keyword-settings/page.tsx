"use client"

import { StepKeywordSettings } from "@/components/onboarding/StepKeywordSettings"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

import { useRouter } from "next/navigation"

export default function KeywordSettingsStepPage() {
  const router = useRouter()

  const handleNext = (data: any) => {
    localStorage.setItem('onboarding-keyword-settings', JSON.stringify(data))
    router.push('/onboarding/integration')
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
