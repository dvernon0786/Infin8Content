"use client"

import { StepBusiness } from "@/components/onboarding/StepBusiness"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
import { useRouter } from "next/navigation"

export default function BusinessStepPage() {
  const router = useRouter()

  const handleNext = async (data: any) => {
    try {
      const response = await fetch('/api/onboarding/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error || 'Business info failed')
      }

      router.push('/onboarding/competitors')
    } catch (error) {
      throw error
    }
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
