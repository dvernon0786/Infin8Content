"use client"

import { StepContentDefaults } from "@/components/onboarding/StepContentDefaults"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

import { useRouter } from "next/navigation"

export default function ContentDefaultsStepPage() {
  const router = useRouter()

  const handleNext = (data: any) => {
    localStorage.setItem('onboarding-content-defaults', JSON.stringify(data))
    router.push('/onboarding/keyword-settings')
  }

  const handleSkip = () => {
    router.push('/onboarding/keyword-settings')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <OnboardingWizard currentStep={4} />
        </div>
        <StepContentDefaults onNext={handleNext} onSkip={handleSkip} />
      </div>
    </div>
  )
}
