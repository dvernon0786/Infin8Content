"use client"

import { StepCompetitors } from "@/components/onboarding/StepCompetitors"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

import { useRouter } from "next/navigation"

export default function CompetitorsStepPage() {
  const router = useRouter()

  const handleNext = (data: any) => {
    localStorage.setItem('onboarding-competitors', JSON.stringify(data))
    router.push('/onboarding/blog')
  }

  const handleSkip = () => {
    router.push('/onboarding/blog')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <OnboardingWizard currentStep={2} />
        </div>
        <StepCompetitors onNext={handleNext} onSkip={handleSkip} />
      </div>
    </div>
  )
}
