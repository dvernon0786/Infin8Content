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

  const handleComplete = async (data: any) => {
    console.log("🔥🔥🔥 OLD ONBOARDING HANDLE COMPLETE CALLED 🔥🔥🔥", data)
    
    setOnboardingData(prev => ({ ...prev, ...data }))
    
    try {
      const res = await fetch("/api/onboarding/integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      console.log("🔥🔥🔥 OLD ONBOARDING API RESPONSE STATUS 🔥🔥🔥", res.status)

      if (!res.ok) {
        const error = await res.json()
        console.error("🔥🔥🔥 OLD ONBOARDING API FAILED 🔥🔥🔥", error)
        throw new Error(error?.error || "Integration failed")
      }

      const result = await res.json()
      console.log("🔥🔥🔥 OLD ONBOARDING API SUCCESS 🔥🔥🔥", result)
      
      // Handle completion - redirect to dashboard
      window.location.href = "/dashboard"
    } catch (error) {
      console.error("🔥🔥🔥 OLD ONBOARDING COMPLETE FAILED 🔥🔥🔥", error)
      throw error
    }
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
