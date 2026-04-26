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

  const getStepIndicatorColor = (status: string) => {
    switch (status) {
      case "completed":
        return { bg: "#4f6ef7", text: "#ffffff" }
      case "current":
        return { bg: "#4f6ef7", text: "#ffffff" }
      case "upcoming":
        return { bg: "#13151e", text: "#7b8098" }
      default:
        return { bg: "#13151e", text: "#7b8098" }
    }
  }

  const getStepTextColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4f6ef7"
      case "current":
        return "#4f6ef7"
      case "upcoming":
        return "#7b8098"
      default:
        return "#7b8098"
    }
  }

  return (
    <nav
      role="navigation"
      aria-label={`Onboarding Progress: Step ${currentStep} of 5`}
      style={{
        width: "100%",
        overflowX: "auto",
        paddingBottom: "8px"
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minWidth: "max-content",
        gap: "16px"
      }}>
        {steps.map((step, index) => {
          const status = getStepStatus(step.id)
          const isLast = index === steps.length - 1
          const colors = getStepIndicatorColor(status)

          return (
            <React.Fragment key={step.id}>
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 0
              }}>
                {/* Step indicator */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    fontSize: "14px",
                    fontWeight: "600",
                    background: colors.bg,
                    color: colors.text,
                    border: `2px solid ${colors.bg}`,
                    transition: "all 0.2s"
                  }}
                  aria-current={status === "current" ? "step" : undefined}
                >
                  {status === "completed" ? (
                    <svg
                      style={{ width: "16px", height: "16px" }}
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
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    textAlign: "center",
                    color: getStepTextColor(status),
                    transition: "color 0.2s"
                  }}
                >
                  {step.name}
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  style={{
                    flex: 1,
                    height: "2px",
                    minWidth: "32px",
                    maxWidth: "64px",
                    background: status === "completed" ? "#4f6ef7" : "#4a4f68",
                    transition: "background 0.2s"
                  }}
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
