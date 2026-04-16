'use client'

// GuidedTourWrapper: client component that reads onboarding_tour_shown
// and conditionally renders the GuidedTour.
// Only mounted when tourShown=false and ENABLE_GUIDED_TOURS flag is on.

import { useState } from 'react'
import { GuidedTour } from '@/components/onboarding/guided-tour/GuidedTour'

interface GuidedTourWrapperProps {
  tourShown: boolean
}

export function GuidedTourWrapper({ tourShown }: GuidedTourWrapperProps) {
  const [open, setOpen] = useState(!tourShown)

  if (tourShown) return null

  return <GuidedTour open={open} onComplete={() => setOpen(false)} />
}
