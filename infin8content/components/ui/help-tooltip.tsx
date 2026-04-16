// Epic 12: Story 12-5 — Contextual Help Tooltips
// Reusable HelpTooltip wrapper using existing Tooltip primitive

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelpTooltipProps {
  content: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function HelpTooltip({ content, side = 'top', className }: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Help: ${content}`}
            className={cn(
              'inline-flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[--brand-electric-blue] rounded-full',
              className
            )}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-[220px] text-xs leading-snug">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
