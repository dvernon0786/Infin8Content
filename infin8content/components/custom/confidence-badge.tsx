/**
 * ConfidenceBadge Component
 * Displays AI confidence levels with semantic color mapping
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Info, AlertTriangle, AlertCircle, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const confidenceBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 transition-all duration-200",
  {
    variants: {
      level: {
        high: "bg-[--color-success] text-white border border-[--color-success]/20",
        medium: "bg-[--color-warning] text-white border border-[--color-warning]/20",
        low: "bg-[--color-warning] text-white border border-[--color-warning]/20",
        veryLow: "bg-[--color-error] text-white border border-[--color-error]/20",
      },
      size: {
        sm: "px-2 py-0.5 text-xs gap-1",
        default: "px-2.5 py-1 text-xs gap-1.5",
        lg: "px-3 py-1.5 text-sm gap-2",
      },
      showIcon: {
        true: "",
        false: "",
      },
      animated: {
        true: "transition-all duration-200",
        false: "",
      },
    },
    defaultVariants: {
      level: "medium",
      size: "default",
      showIcon: true,
      animated: true,
    },
  }
)

export interface ConfidenceBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof confidenceBadgeVariants> {
  level: 'high' | 'medium' | 'low' | 'veryLow'
  showTooltip?: boolean
  tooltipText?: string
  animated?: boolean
}

const confidenceConfig = {
  high: {
    label: 'High',
    description: 'High confidence in the generated content',
    icon: Info,
    color: 'var(--color-success)',
  },
  medium: {
    label: 'Medium',
    description: 'Medium confidence in the generated content',
    icon: AlertTriangle,
    color: 'var(--color-warning)',
  },
  low: {
    label: 'Low',
    description: 'Low confidence in the generated content',
    icon: AlertTriangle,
    color: 'var(--color-warning)',
  },
  veryLow: {
    label: 'Very Low',
    description: 'Very low confidence in the generated content',
    icon: XCircle,
    color: 'var(--color-error)',
  },
}

const ConfidenceBadge = React.forwardRef<HTMLSpanElement, ConfidenceBadgeProps>(
  ({ 
    className, 
    level, 
    size = "default", 
    showIcon = true, 
    showTooltip = false,
    tooltipText,
    animated = true,
    children,
    ...props 
  }, ref) => {
    const config = confidenceConfig[level]
    const Icon = config.icon
    const defaultTooltipText = tooltipText || config.description

    const badgeContent = (
      <span
        ref={ref}
        className={cn(confidenceBadgeVariants({ level, size, showIcon, animated }), className)}
        role="status"
        aria-label={`Confidence: ${config.label}`}
        {...props}
      >
        {showIcon && (
          <Icon 
            className="h-3 w-3" 
            aria-hidden="true"
          />
        )}
        <span>{children || config.label}</span>
      </span>
    )

    if (showTooltip) {
      return (
        <div className="group relative inline-block">
          {badgeContent}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
            {defaultTooltipText}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )
    }

    return badgeContent
  }
)

ConfidenceBadge.displayName = "ConfidenceBadge"

export { ConfidenceBadge, confidenceBadgeVariants, confidenceConfig }
