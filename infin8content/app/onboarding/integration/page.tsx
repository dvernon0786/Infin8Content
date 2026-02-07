"use client"

import { StepIntegration } from "@/components/onboarding/StepIntegration"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

import { useRouter } from "next/navigation"

export default function IntegrationStepPage() {
  const router = useRouter()

  const handleComplete = async (data: any) => {
    localStorage.setItem('onboarding-integration', JSON.stringify(data))
    // Mark onboarding complete and redirect to dashboard
    localStorage.setItem('onboarding-completed', 'true')
    router.push('/dashboard')
  }

  const handleSkip = () => {
    localStorage.setItem('onboarding-completed', 'true')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <OnboardingWizard currentStep={6} />
        </div>
        <StepIntegration onComplete={handleComplete} onSkip={handleSkip} />
      </div>
    </div>
  )
}
