import * as React from "react"

import { cn } from "@/lib/utils"
import { useMobilePerformance } from "@/hooks/use-mobile-performance"

function Input({ className, type, onFocus, onBlur, ...props }: React.ComponentProps<"input">) {
  const { measureTouchResponse, addTouchFeedback } = useMobilePerformance()
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Mobile performance optimization
  const handleFocus = React.useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    const startTime = performance.now()
    
    // Measure touch response time for input focus
    measureTouchResponse(startTime, 'input')
    
    // Call original onFocus
    onFocus?.(event)
  }, [onFocus, measureTouchResponse])

  // Add touch feedback to input element
  React.useEffect(() => {
    if (inputRef.current) {
      addTouchFeedback(inputRef.current)
    }
  }, [addTouchFeedback])

  return (
    <input
      ref={inputRef}
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[44px]",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      onFocus={handleFocus}
      onBlur={onBlur}
      {...props}
    />
  )
}

export { Input }
