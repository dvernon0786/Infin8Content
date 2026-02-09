"use client"

import { StepCompetitors } from "@/components/onboarding/StepCompetitors"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

import { useRouter } from "next/navigation"

export default function CompetitorsStepPage() {
  const router = useRouter()

  const handleNext = async (data: any) => {
    try {
      const response = await fetch('/api/onboarding/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error || 'Competitors info failed')
      }

      router.push('/onboarding/blog')
    } catch (error) {
      throw error
    }
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
