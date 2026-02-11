"use client"

import { StepIntegration } from "@/components/onboarding/StepIntegration"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
import { useRouter } from "next/navigation"

console.log("🔥🔥🔥 INTEGRATION PAGE LOADED 🔥🔥🔥")

export default function IntegrationStepPage() {
  const router = useRouter()

  // 🔥 System Law: onNext calls handleComplete for integration
  const handleNext = async (data: any) => {
    await handleComplete(data)
  }

  const handleComplete = async (data: any) => {
    console.log("🔥🔥🔥 HANDLE COMPLETE CALLED 🔥🔥🔥", data)

    const res = await fetch("/api/onboarding/integration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    console.log("🔥🔥🔥 API RESPONSE STATUS 🔥🔥🔥", res.status)

    if (!res.ok) {
      const error = await res.json()
      console.error("🔥🔥🔥 API FAILED 🔥🔥🔥", error)
      throw new Error(error?.error || "WordPress integration failed")
    }

    const result = await res.json()
    console.log("🔥🔥🔥 API SUCCESS 🔥🔥🔥", result)

    // ✅ Redirect ONLY after backend success
    router.push("/dashboard")
  }

  // 🚫 Skipping completion is NOT allowed without an API
  const handleSkip = () => {
    router.push("/onboarding")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <OnboardingWizard currentStep={6} />
        </div>
        <StepIntegration onNext={handleNext} />
      </div>
    </div>
  )
}
