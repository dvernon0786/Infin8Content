"use client"

import * as React from "react"
import { Stepper } from "@/components/onboarding/Stepper"
import { cn } from "@/lib/utils"

interface OnboardingWizardProps {
  currentStep: number
  className?: string
}

export function OnboardingWizard({ currentStep, className }: OnboardingWizardProps) {
  return (
    <div className={cn("w-full", className)}>
      <Stepper currentStep={currentStep} />
    </div>
  )
}
