"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

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

  const getStepStyles = (status: string) => {
    switch (status) {
      case "completed":
        return "text-primary-blue"
      case "current":
        return "text-primary-blue font-semibold"
      case "upcoming":
        return "text-muted-foreground"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <nav
      role="navigation"
      aria-label={`Onboarding Progress: Step ${currentStep} of 5`}
      className={cn(
        "w-full overflow-x-auto pb-2",
        className
      )}
    >
      <div className="flex items-center justify-between min-w-max gap-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id)
          const isLast = index === steps.length - 1

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center min-w-0">
                {/* Step indicator */}
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                    getStepStyles(status),
                    status === "current" && "bg-primary-blue text-white",
                    status === "completed" && "bg-primary-blue text-white",
                    status === "upcoming" && "bg-muted text-muted-foreground"
                  )}
                  aria-current={status === "current" ? "step" : undefined}
                >
                  {status === "completed" ? (
                    <svg
                      className="w-4 h-4"
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

                {/* Step name */}
                <div
                  className={cn(
                    "mt-2 text-xs sm:text-sm font-medium text-center transition-colors",
                    getStepStyles(status)
                  )}
                >
                  {step.name}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-px min-w-8 max-w-16 transition-colors",
                    status === "completed" ? "bg-primary-blue" : "bg-muted"
                  )}
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
