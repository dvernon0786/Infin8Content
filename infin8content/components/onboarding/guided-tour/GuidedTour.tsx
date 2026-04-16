'use client'

// Epic 12: Story 12-1 — Post-Payment Guided Tour
// 6-step modal sequence using existing Dialog primitive.
// Shown once: reads onboarding_tour_shown from org; calls PATCH /api/onboarding/tour-shown on finish/skip.
// Gated by ENABLE_GUIDED_TOURS feature flag (checked server-side by parent).

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Rocket,
  FileText,
  GitBranch,
  Search,
  Globe,
  CheckCircle2,
} from 'lucide-react'

interface TourStep {
  icon: React.ReactNode
  title: string
  description: string
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: <Rocket className="h-10 w-10 text-[--brand-electric-blue]" />,
    title: "Welcome to Infin8Content 🎉",
    description:
      "You're in. Let's take 60 seconds to show you the key features so you can start generating content that ranks.",
  },
  {
    icon: <FileText className="h-10 w-10 text-[--brand-electric-blue]" />,
    title: "Generate Unlimited Articles",
    description:
      "Head to Articles to create SEO-optimized content. Each article is researched with live web data and written section by section.",
  },
  {
    icon: <GitBranch className="h-10 w-10 text-[--brand-electric-blue]" />,
    title: "Run a Full Content Workflow",
    description:
      "Workflows are the engine of Infin8Content. Define your ICP, add competitors, and we'll map out an entire keyword-to-article content strategy.",
  },
  {
    icon: <Search className="h-10 w-10 text-[--brand-electric-blue]" />,
    title: "Research Keywords Instantly",
    description:
      "Use the Research tab to find high-opportunity keywords for your niche. Filter by difficulty, volume, and intent.",
  },
  {
    icon: <Globe className="h-10 w-10 text-[--brand-electric-blue]" />,
    title: "Publish Directly to Your CMS",
    description:
      "Connect WordPress (or other platforms) once in Settings → Integrations. Then publish any article in one click.",
  },
  {
    icon: <CheckCircle2 className="h-10 w-10 text-[--color-success]" />,
    title: "You're Ready to Go",
    description:
      "Start with creating your first Workflow or generate a standalone article. Your checklist on the dashboard will track your progress.",
  },
]

interface GuidedTourProps {
  open: boolean
  onComplete: () => void
}

export function GuidedTour({ open, onComplete }: GuidedTourProps) {
  const [step, setStep] = useState(0)
  const [completing, setCompleting] = useState(false)

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  const finish = async () => {
    if (completing) return
    setCompleting(true)
    try {
      await fetch('/api/onboarding/tour-shown', { method: 'PATCH' })
    } finally {
      onComplete()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) finish() }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="items-center text-center pb-2">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[--brand-electric-blue]/10 mb-4">
            {current.icon}
          </div>
          <DialogTitle className="font-poppins text-xl text-center">
            {current.title}
          </DialogTitle>
          <DialogDescription className="font-lato text-sm text-center text-neutral-600 pt-1">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 py-2">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-6 bg-[--brand-electric-blue]'
                  : i < step
                  ? 'w-1.5 bg-[--brand-electric-blue]/40'
                  : 'w-1.5 bg-neutral-200'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between gap-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={finish}
            disabled={completing}
            className="text-neutral-400 hover:text-neutral-600"
          >
            Skip tour
          </Button>
          <Button
            size="sm"
            onClick={isLast ? finish : () => setStep((s) => s + 1)}
            disabled={completing}
            className="bg-[--brand-electric-blue] text-white hover:bg-[--brand-electric-blue]/90 min-w-24"
          >
            {isLast ? 'Get started' : 'Next →'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
