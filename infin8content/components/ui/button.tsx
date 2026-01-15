import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useMobilePerformance } from "@/hooks/use-mobile-performance"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        primary: "bg-[--color-primary-blue] text-white hover:bg-[--color-primary-blue]/90 focus-visible:ring-[--color-primary-blue]/20",
        secondary: "bg-[--color-primary-purple] text-white hover:bg-[--color-primary-purple]/90 focus-visible:ring-[--color-primary-purple]/20",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3 min-h-[44px] min-w-[44px]",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 min-h-[44px] min-w-[44px]",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4 min-h-[44px] min-w-[44px]",
        icon: "size-9 min-h-[44px] min-w-[44px]",
        "icon-sm": "size-8 min-h-[44px] min-w-[44px]",
        "icon-lg": "size-10 min-h-[44px] min-w-[44px]",
      },
      state: {
        default: "",
        hover: "",
        disabled: "disabled:pointer-events-none disabled:opacity-50",
        loading: "cursor-wait",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
)

interface ButtonProps extends React.ComponentProps<"button">, 
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

function Button({
  className,
  variant = "default",
  size = "default",
  state = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  const { measureTouchResponse, addTouchFeedback } = useMobilePerformance()
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  
  // Auto-set loading state and disabled when loading
  const finalState = loading ? "loading" : state
  const isDisabled = disabled || loading

  // Mobile performance optimization
  const handleClick = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const startTime = performance.now()
    
    // Measure touch response time
    measureTouchResponse(startTime, 'button')
    
    // Call original onClick
    onClick?.(event)
  }, [onClick, measureTouchResponse])

  // Add touch feedback to button element
  React.useEffect(() => {
    if (buttonRef.current) {
      addTouchFeedback(buttonRef.current)
    }
  }, [addTouchFeedback])

  return (
    <Comp
      ref={buttonRef}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-state={finalState}
      className={cn(buttonVariants({ variant, size, state: finalState, className }))}
      disabled={isDisabled}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
