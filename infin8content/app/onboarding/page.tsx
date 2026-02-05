"use client"

import { useState } from "react"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
import { StepBusiness } from "@/components/onboarding/StepBusiness"
import { StepCompetitors } from "@/components/onboarding/StepCompetitors"
import { StepBlog } from "@/components/onboarding/StepBlog"
import { StepContentDefaults } from "@/components/onboarding/StepContentDefaults"
import { StepKeywordSettings } from "@/components/onboarding/StepKeywordSettings"
import { StepIntegration } from "@/components/onboarding/StepIntegration"
import { StepCompletion } from "@/components/onboarding/StepCompletion"

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [onboardingData, setOnboardingData] = useState({})

  const handleNext = (stepData: any) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }))
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSkip = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleComplete = (data: any) => {
    setOnboardingData(prev => ({ ...prev, ...data }))
    // Handle completion - redirect to dashboard
    window.location.href = "/dashboard"
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBusiness onNext={handleNext} onSkip={handleSkip} />
      case 2:
        return <StepCompetitors onNext={handleNext} onSkip={handleSkip} />
      case 3:
        return <StepBlog onNext={handleNext} onSkip={handleSkip} />
      case 4:
        return <StepContentDefaults onNext={handleNext} onSkip={handleSkip} />
      case 5:
        return <StepKeywordSettings onNext={handleNext} onSkip={handleSkip} />
      case 6:
        return <StepIntegration onComplete={handleComplete} onSkip={() => handleComplete({})} />
      default:
        return <StepCompletion onStart={() => window.location.href = "/dashboard"} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <OnboardingWizard currentStep={currentStep} />
        </div>
        {renderStep()}
      </div>
    </div>
  )
}
