"use client"
import { StepIntegration } from "@/components/onboarding/StepIntegration"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
import { useRouter } from "next/navigation"

export default function IntegrationStepPage() {
  const router = useRouter()

  const handleNext = async (data: any) => {
    await handleComplete(data)
  }

  const handleComplete = async (data: any) => {
    const res = await fetch("/api/onboarding/integration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error?.error || "WordPress integration failed")
    }

    // Redirect ONLY after backend success
    router.push("/dashboard")
  }

  // Skip is allowed — CMS integration is optional
  const handleSkip = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <OnboardingWizard currentStep={6} />
        </div>
        <StepIntegration onNext={handleNext} onSkip={handleSkip} />
      </div>
    </div>
  )
}
