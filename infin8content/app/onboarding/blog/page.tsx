"use client"

import { StepBlog } from "@/components/onboarding/StepBlog"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

import { useRouter } from "next/navigation"

export default function BlogStepPage() {
  const router = useRouter()

  const handleNext = (data: any) => {
    localStorage.setItem('onboarding-blog', JSON.stringify(data))
    router.push('/onboarding/content-defaults')
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
