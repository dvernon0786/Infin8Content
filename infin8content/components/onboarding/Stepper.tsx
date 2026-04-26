"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import "./stepper.css"

interface StepperProps {
  currentStep: number
  className?: string
}

const steps = [
  { id: 1, name: "Business" },
  { id: 2, name: "Competitors" },
  { id: 3, name: "Blog" },
  { id: 4, name: "Content Defaults" },
  { id: 5, name: "Integration" },
]

export function Stepper({ currentStep, className }: StepperProps) {
  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return "completed"
    if (stepId === currentStep) return "current"
    return "upcoming"
  }

  return (
    <nav
      role="navigation"
      aria-label={`Onboarding Progress: Step ${currentStep} of 5`}
      className="stepper-container"
    >
      <div className="stepper-track">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id)
          const isLast = index === steps.length - 1

          return (
            <React.Fragment key={step.id}>
              <div className="stepper-step">
                <div
                  className={cn("stepper-indicator", `stepper-${status}`)}
                  aria-current={status === "current" ? "step" : undefined}
                >
                  {status === "completed" ? (
                    <svg
                      className="stepper-checkmark"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>

                <div className={cn("stepper-label", `stepper-label-${status}`)}>
                  {step.name}
                </div>
              </div>

              {!isLast && (
                <div
                  className={cn("stepper-connector", `stepper-connector-${status}`)}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </nav>
  )
}
