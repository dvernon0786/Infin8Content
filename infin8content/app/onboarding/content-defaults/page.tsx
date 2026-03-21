"use client"

import { StepContentDefaults } from "@/components/onboarding/StepContentDefaults"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

import { useRouter } from "next/navigation"

export default function ContentDefaultsStepPage() {
  const router = useRouter()

  const handleNext = async (data: any) => {
    try {
      const response = await fetch('/api/onboarding/content-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error || 'Content defaults failed')
      }

      router.push('/onboarding/keyword-settings')
    } catch (error) {
      throw error
    }
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
        <StepContentDefaults onNext={handleNext} />
      </div>
    </div>
  )
}
