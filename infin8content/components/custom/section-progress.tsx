/**
 * SectionProgress Component
 * Displays progress for individual sections with dynamic text and animations
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Loader2, Clock } from "lucide-react"

import { cn } from "@/lib/utils"

const sectionProgressVariants = cva(
  "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300",
  {
    variants: {
      status: {
        pending: "bg-background border-border",
        active: "bg-[--gradient-brand]/5 border-[--color-primary-blue]/50 shadow-sm",
        completed: "bg-[--color-success]/5 border-[--color-success]/50",
        error: "bg-[--color-error]/5 border-[--color-error]/50",
      },
      size: {
        sm: "p-2 gap-2",
        default: "p-3 gap-3",
        lg: "p-4 gap-4",
      },
      animated: {
        true: "transition-all duration-300",
        false: "",
      },
    },
    defaultVariants: {
      status: "pending",
      size: "default",
      animated: true,
    },
  }
)

const iconVariants = cva(
  "flex-shrink-0 transition-all duration-300",
  {
    variants: {
      status: {
        pending: "text-muted-foreground",
        active: "text-[--color-primary-blue] animate-pulse",
        completed: "text-[--color-success]",
        error: "text-[--color-error]",
      },
      size: {
        sm: "h-4 w-4",
        default: "h-5 w-5",
        lg: "h-6 w-6",
      },
    },
    defaultVariants: {
      status: "pending",
      size: "default",
    },
  }
)

const textVariants = cva(
  "flex-1 min-w-0 transition-all duration-300",
  {
    variants: {
      status: {
        pending: "text-muted-foreground",
        active: "text-foreground font-medium",
        completed: "text-foreground",
        error: "text-[--color-error] font-medium",
      },
      size: {
        sm: "text-sm",
        default: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      status: "pending",
      size: "default",
    },
  }
)

export interface SectionProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sectionProgressVariants> {
  sectionNumber: number
  sectionName: string
  isActive?: boolean
  isCompleted?: boolean
  hasError?: boolean
  progress?: number
  showProgress?: boolean
  animated?: boolean
}

const SectionProgress = React.forwardRef<HTMLDivElement, SectionProgressProps>(
  ({ 
    className, 
    sectionNumber, 
    sectionName, 
    isActive = false, 
    isCompleted = false, 
    hasError = false,
    progress = 0,
    showProgress = false,
    animated = true,
    size = "default",
    ...props 
  }, ref) => {
    // Determine status based on props
    const status = hasError ? "error" : isCompleted ? "completed" : isActive ? "active" : "pending"
    
    // Generate dynamic text
    const getProgressText = () => {
      if (hasError) return `Error in Section ${sectionNumber}: ${sectionName}`
      if (isCompleted) return `Section ${sectionNumber}: ${sectionName} (Completed)`
      if (isActive) {
        if (showProgress && progress > 0) {
          return `Generating Section ${sectionNumber}: ${sectionName} (${Math.round(progress)}%)`
        }
        return `Generating Section ${sectionNumber}: ${sectionName}`
      }
      return `Section ${sectionNumber}: ${sectionName}`
    }

    // Render appropriate icon
    const renderIcon = () => {
      if (hasError) {
        return <div className="relative">
          <div className={cn(iconVariants({ status, size }))}>
            <div className="h-full w-full rounded-full bg-[--color-error] flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
        </div>
      }
      
      if (isCompleted) {
        return (
          <div className={cn(iconVariants({ status: "completed", size }))}>
            <Check className="h-full w-full" />
          </div>
        )
      }
      
      if (isActive) {
        return (
          <div className={cn(iconVariants({ status: "active", size }))}>
            <Loader2 className="h-full w-full animate-spin" />
          </div>
        )
      }
      
      return (
        <div className={cn(iconVariants({ status: "pending", size }))}>
          <Clock className="h-full w-full" />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(sectionProgressVariants({ status, size, animated }), className)}
        role="status"
        aria-live={isActive ? "polite" : "off"}
        aria-label={getProgressText()}
        {...props}
      >
        {renderIcon()}
        <div className={cn(textVariants({ status, size }))}>
          <div className="truncate">{getProgressText()}</div>
          {showProgress && isActive && progress > 0 && (
            <div className="mt-1 w-full bg-secondary rounded-full h-1 overflow-hidden">
              <div 
                className="h-full bg-[--gradient-brand] transition-all duration-500 ease-out"
                style={{ transform: `translateX(-${100 - progress}%)` }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }
)

SectionProgress.displayName = "SectionProgress"

export { SectionProgress, sectionProgressVariants, iconVariants, textVariants }
