"use client"

import { StepIntegration } from "@/components/onboarding/StepIntegration"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

import { useRouter } from "next/navigation"

export default function IntegrationStepPage() {
  const router = useRouter()

  const handleComplete = async (data: any) => {
    console.log('[IntegrationStepPage] handleComplete called', data)

    try {
      console.log('[IntegrationStepPage] Sending API request...')
      const response = await fetch('/api/onboarding/integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      console.log('[IntegrationStepPage] API response status:', response.status)

      const payload = await response.json()
      console.log('[IntegrationStepPage] API response payload:', payload)

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save integration')
      }

      console.log('[IntegrationStepPage] Integration saved, redirecting to dashboard')
      // 🎯 NOTE: No localStorage - DB is now authoritative
      router.push('/dashboard')

    } catch (error) {
      console.error('[IntegrationStepPage] ERROR:', error)
      throw error // Re-throw to show error in component
    }
  }

  const handleSkip = () => {
    console.log('[IntegrationStepPage] Skipping integration, redirecting to dashboard')
    // 🎯 NOTE: No localStorage - DB is now authoritative
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
