"use client"

import { StepBusiness } from "@/components/onboarding/StepBusiness"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
import { useRouter } from "next/navigation"

export default function BusinessStepPage() {
  const router = useRouter()

  const handleNext = (data: any) => {
    // Store data (in real implementation, this would save to backend/localStorage)
    localStorage.setItem('onboarding-business', JSON.stringify(data))
    router.push('/onboarding/competitors')
  }

  const handleSkip = () => {
    router.push('/onboarding/competitors')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <OnboardingWizard currentStep={1} />
        </div>
        <StepBusiness onNext={handleNext} onSkip={handleSkip} />
      </div>
    </div>
  )
}
