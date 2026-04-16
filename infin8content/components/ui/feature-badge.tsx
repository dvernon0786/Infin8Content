// Epic 12: Story 12-2 — Feature Discovery Mechanisms
// "New" badge variant extending existing Badge component

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FeatureBadgeProps {
  variant?: 'new' | 'pro' | 'coming-soon'
  className?: string
}

const variants: Record<NonNullable<FeatureBadgeProps['variant']>, string> = {
  new: 'bg-[--brand-electric-blue] text-white border-[--brand-electric-blue] hover:bg-[--brand-electric-blue]/90',
  pro: 'bg-[--brand-infinite-purple] text-white border-[--brand-infinite-purple] hover:bg-[--brand-infinite-purple]/90',
  'coming-soon': 'bg-neutral-100 text-neutral-500 border-neutral-200',
}

const labels: Record<NonNullable<FeatureBadgeProps['variant']>, string> = {
  new: 'New',
  pro: 'Pro',
  'coming-soon': 'Soon',
}

export function FeatureBadge({ variant = 'new', className }: FeatureBadgeProps) {
  return (
    <Badge
      className={cn('text-[10px] font-semibold px-1.5 py-0 h-4 ml-1.5', variants[variant], className)}
    >
      {labels[variant]}
    </Badge>
  )
}
