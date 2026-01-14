/**
 * ArticleStateBadge Component
 * Displays article states with semantic color mapping and icons
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { FileText, Eye, CheckCircle, Globe } from "lucide-react"

import { cn } from "@/lib/utils"

const articleStateBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 transition-all duration-200",
  {
    variants: {
      state: {
        draft: "bg-[--color-info] text-white border border-[--color-info]/20",
        inReview: "bg-[--color-warning] text-white border border-[--color-warning]/20",
        approved: "bg-[--color-success] text-white border border-[--color-success]/20",
        published: "bg-[--color-success] text-white border border-[--color-success]/20",
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
      variant: {
        default: "",
        outline: "bg-transparent border-current text-current",
        subtle: "bg-current/10 text-current border-current/20",
      },
    },
    defaultVariants: {
      state: "draft",
      size: "default",
      showIcon: true,
      animated: true,
      variant: "default",
    },
  }
)

export interface ArticleStateBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof articleStateBadgeVariants> {
  state: 'draft' | 'inReview' | 'approved' | 'published'
  showIcon?: boolean
  showTooltip?: boolean
  tooltipText?: string
  animated?: boolean
}

const articleStateConfig = {
  draft: {
    label: 'Draft',
    description: 'Article is in draft state',
    icon: FileText,
    color: 'var(--color-info)',
  },
  inReview: {
    label: 'In Review',
    description: 'Article is currently under review',
    icon: Eye,
    color: 'var(--color-warning)',
  },
  approved: {
    label: 'Approved',
    description: 'Article has been approved for publication',
    icon: CheckCircle,
    color: 'var(--color-success)',
  },
  published: {
    label: 'Published',
    description: 'Article has been published',
    icon: Globe,
    color: 'var(--color-success)',
  },
}

const ArticleStateBadge = React.forwardRef<HTMLSpanElement, ArticleStateBadgeProps>(
  ({ 
    className, 
    state, 
    size = "default", 
    showIcon = true, 
    showTooltip = false,
    tooltipText,
    animated = true,
    variant = "default",
    children,
    ...props 
  }, ref) => {
    const config = articleStateConfig[state]
    const Icon = config.icon
    const defaultTooltipText = tooltipText || config.description

    const badgeContent = (
      <span
        ref={ref}
        className={cn(articleStateBadgeVariants({ state, size, showIcon, animated, variant }), className)}
        role="status"
        aria-label={`Article state: ${config.label}`}
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

ArticleStateBadge.displayName = "ArticleStateBadge"

export { ArticleStateBadge, articleStateBadgeVariants, articleStateConfig }
