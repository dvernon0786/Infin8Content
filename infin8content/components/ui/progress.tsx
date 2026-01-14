/**
 * Progress component
 * Enhanced with design token integration and brand variants
 * Based on Radix UI Progress primitive
 */

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-secondary transition-all duration-300",
  {
    variants: {
      size: {
        sm: "h-1",
        default: "h-4", 
        lg: "h-6",
      },
      variant: {
        default: "",
        brand: "",
        success: "",
        warning: "",
        error: "",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
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
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  value?: number
  showLabel?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "default", size = "default", showLabel = false, ...props }, ref) => {
  const percentage = Math.min(Math.max((value || 0), 0), 100)
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressVariants({ variant, size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(progressIndicatorVariants({ variant }))}
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
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress, progressVariants, progressIndicatorVariants }
