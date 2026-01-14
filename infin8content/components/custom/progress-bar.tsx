/**
 * ProgressBar Component
 * Enhanced progress bar with brand gradient styling and animations
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressBarVariants = cva(
  "relative h-2 w-full overflow-hidden rounded-full bg-secondary transition-all duration-300",
  {
    variants: {
      size: {
        sm: "h-1",
        default: "h-2",
        lg: "h-3",
      },
      variant: {
        default: "",
        brand: "",
        success: "",
        warning: "",
        error: "",
      },
      animated: {
        true: "transition-all duration-500 ease-out",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
      animated: true,
    },
  }
)

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        brand: "bg-[--gradient-brand]",
        success: "bg-[--color-success]",
        warning: "bg-[--color-warning]",
        error: "bg-[--color-error]",
      },
      animated: {
        true: "transition-all duration-500 ease-out",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: true,
    },
  }
)

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressBarVariants> {
  value?: number
  max?: number
  showLabel?: boolean
  animated?: boolean
  "aria-label"?: string
  "aria-describedby"?: string
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value = 0, max = 100, showLabel = false, animated = true, variant = "default", size = "default", "aria-label": ariaLabel, "aria-describedby": ariaDescribedby, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    // Generate ARIA attributes for accessibility
    const ariaProps = {
      role: "progressbar",
      "aria-valuenow": value,
      "aria-valuemin": 0,
      "aria-valuemax": max,
      "aria-valuetext": `${Math.round(percentage)}%`,
      ...(ariaLabel && { "aria-label": ariaLabel }),
      ...(ariaDescribedby && { "aria-describedby": ariaDescribedby }),
    }

    return (
      <div
        ref={ref}
        className={cn(progressBarVariants({ size, variant, animated }), className)}
        {...ariaProps}
        {...props}
      >
        <div
          className={cn(progressIndicatorVariants({ variant, animated }))}
          style={{ 
            transform: `translateX(-${100 - percentage}%)`,
            ...(variant === "brand" && {
              background: "linear-gradient(90deg, #217CEB 0%, #4A42CC 100%)",
            })
          }}
        />
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-background mix-blend-difference">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
    )
  }
)

ProgressBar.displayName = "ProgressBar"

export { ProgressBar, progressBarVariants, progressIndicatorVariants }
