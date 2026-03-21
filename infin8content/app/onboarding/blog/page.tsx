"use client"

import { StepBlog } from "@/components/onboarding/StepBlog"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

import { useRouter } from "next/navigation"

export default function BlogStepPage() {
  const router = useRouter()

  const handleNext = async (data: any) => {
    try {
      const response = await fetch('/api/onboarding/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error || 'Blog info failed')
      }

      router.push('/onboarding/content-defaults')
    } catch (error) {
      throw error
    }
  }

  const handleSkip = () => {
    router.push('/onboarding/content-defaults')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <OnboardingWizard currentStep={3} />
        </div>
        <StepBlog onNext={handleNext} onSkip={handleSkip} />
      </div>
    </div>
  )
}
