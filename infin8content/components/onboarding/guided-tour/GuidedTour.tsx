'use client'

// Epic 12: Story 12-1 — Post-Payment Guided Tour (Rewrite)
//
// CHANGES FROM ORIGINAL:
//   - Dialog primitive replaced with createPortal-based spotlight overlay
//   - 5-second auto-play timer per step with animated progress bar
//   - "Next →" skips ahead and resets timer; "Skip tour" exits immediately
//   - Each step targets a real DOM element via data-tour="*" attributes
//   - Spotlight punches a hole in the dim overlay using clip-path
//   - scrollIntoView called per step so the target is always visible
//   - Tooltip card floats near the highlighted element (auto-positioned)
//   - GuidedTourWrapper contract unchanged: { open, onComplete }
//
// REQUIRED: Add these data-tour attributes to dashboard elements —
//   data-tour="sidebar"           — sidebar root nav element
//   data-tour="articles-nav"      — "Articles" sidebar link
//   data-tour="workflows-nav"     — "Workflows" sidebar link
//   data-tour="research-nav"      — "Research" sidebar link
//   data-tour="settings-nav"      — "Settings — Integrations" sidebar link
//   data-tour="generate-card"     — GenerateArticlesCard root div
//   data-tour="active-services"   — ActiveServicesCard root div
//   data-tour="stat-cards"        — the stat cards wrapper div
//   data-tour="activity-chart"    — ContentActivityChart root div
//   data-tour="workflow-dashboard" — WorkflowDashboard root div

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Rocket,
  FileText,
  GitBranch,
  Search,
  Globe,
  CheckCircle2,
  X,
  ChevronRight,
} from 'lucide-react'

// ──── Types ────────────────────────────────────────────────────────────────

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

interface TourStep {
  icon: React.ReactNode
  title: string
  description: string
  /** data-tour attribute value to spotlight. null = no spotlight (welcome/final step). */
  target: string | null
  /** Where to position the tooltip relative to the spotlight */
  tooltipSide: 'right' | 'bottom' | 'left' | 'top' | 'center'
}

// ──── Step definitions ─────────────────────────────────────────────────────

const TOUR_STEPS: TourStep[] = [
  {
    icon: <Rocket className="h-8 w-8" style={{ color: 'var(--brand-electric-blue)' }} />,
    title: 'Welcome to Infin8Content 🎉',
    description:
      "You're in. Let's take 60 seconds to show you the key features so you can start generating content that ranks.",
    target: null,
    tooltipSide: 'center',
  },
  {
    icon: <FileText className="h-8 w-8" style={{ color: 'var(--brand-electric-blue)' }} />,
    title: 'Generate unlimited articles',
    description:
      'Each article is researched with live web data and written section by section. Click "Generate" to create your first piece.',
    target: 'generate-card',
    tooltipSide: 'right',
  },
  {
    icon: <GitBranch className="h-8 w-8" style={{ color: 'var(--brand-electric-blue)' }} />,
    title: 'Run a full content workflow',
    description:
      'Workflows are the engine of Infin8Content. Define your ICP, add competitors, and we map out an entire keyword-to-article strategy.',
    target: 'workflow-dashboard',
    tooltipSide: 'top',
  },
  {
    icon: <Search className="h-8 w-8" style={{ color: 'var(--brand-electric-blue)' }} />,
    title: 'Research keywords instantly',
    description:
      'Discover high-opportunity keywords for your niche. Filter by difficulty, volume, and search intent — all in one place.',
    target: 'research-nav',
    tooltipSide: 'right',
  },
  {
    icon: <Globe className="h-8 w-8" style={{ color: 'var(--brand-electric-blue)' }} />,
    title: 'Publish directly to your CMS',
    description:
      'Connect WordPress or another platform once in Settings — Integrations. Then publish any finished article in one click.',
    target: 'settings-nav',
    tooltipSide: 'right',
  },
  {
    icon: <CheckCircle2 className="h-8 w-8" style={{ color: 'var(--color-success, #22c55e)' }} />,
    title: "You're ready to go",
    description:
      'Start by creating your first Workflow or generating a standalone article. Your dashboard checklist tracks your progress.',
    target: null,
    tooltipSide: 'center',
  },
]

const STEP_DURATION_MS = 5000
const PADDING = 12 // px padding around the spotlight rect
const TOOLTIP_W = 320 // px – tooltip card width

// ──── Helpers ──────────────────────────────────────────────────────────────

function getTargetRect(target: string | null): SpotlightRect | null {
  if (!target) return null
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
  if (!el) return null
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  const r = el.getBoundingClientRect()
  return {
    top: r.top - PADDING,
    left: r.left - PADDING,
    width: r.width + PADDING * 2,
    height: r.height + PADDING * 2,
  }
}

function computeTooltipStyle(
  rect: SpotlightRect | null,
  side: TourStep['tooltipSide'],
  vw: number,
  vh: number,
): React.CSSProperties {
  if (!rect || side === 'center') {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: TOOLTIP_W,
    }
  }

  const GAP = 16
  let top: number
  let left: number

  if (side === 'right') {
    top = rect.top + rect.height / 2
    left = rect.left + rect.width + GAP
    // Clamp so it stays on screen
    top = Math.min(top, vh - 200)
    left = Math.min(left, vw - TOOLTIP_W - GAP)
    return { position: 'fixed', top, left, transform: 'translateY(-50%)', width: TOOLTIP_W }
  }

  if (side === 'left') {
    top = rect.top + rect.height / 2
    left = rect.left - TOOLTIP_W - GAP
    left = Math.max(left, GAP)
    top = Math.min(top, vh - 200)
    return { position: 'fixed', top, left, transform: 'translateY(-50%)', width: TOOLTIP_W }
  }

  if (side === 'bottom') {
    top = rect.top + rect.height + GAP
    left = rect.left + rect.width / 2 - TOOLTIP_W / 2
    top = Math.min(top, vh - 220)
    left = Math.max(GAP, Math.min(left, vw - TOOLTIP_W - GAP))
    return { position: 'fixed', top, left, width: TOOLTIP_W }
  }

  // top
  top = rect.top - GAP - 220 // approx tooltip height
  left = rect.left + rect.width / 2 - TOOLTIP_W / 2
  top = Math.max(GAP, top)
  left = Math.max(GAP, Math.min(left, vw - TOOLTIP_W - GAP))
  return { position: 'fixed', top, left, width: TOOLTIP_W }
}

// ──── Main component ───────────────────────────────────────────────────────

interface GuidedTourProps {
  open: boolean
  onComplete: () => void
}

export function GuidedTour({ open, onComplete }: GuidedTourProps) {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0) // 0–100
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const [vw, setVw] = useState(0)
  const [vh, setVh] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [mounted, setMounted] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef(0)
  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  // Client-only mount guard for createPortal
  useEffect(() => { setMounted(true) }, [])

  // Update viewport dims
  useEffect(() => {
    const update = () => { setVw(window.innerWidth); setVh(window.innerHeight) }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const finish = useCallback(async () => {
    if (completing) return
    setCompleting(true)
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      await fetch('/api/onboarding/tour-shown', { method: 'PATCH' })
    } finally {
      onComplete()
    }
  }, [completing, onComplete])

  const advance = useCallback(() => {
    if (isLast) {
      finish()
      return
    }
    setStep((s) => s + 1)
    setProgress(0)
    progressRef.current = 0
  }, [isLast, finish])

  // Start/reset timer on step change
  useEffect(() => {
    if (!open) return
    if (timerRef.current) clearInterval(timerRef.current)
    progressRef.current = 0
    setProgress(0)

    const interval = 50 // ms tick
    const ticks = STEP_DURATION_MS / interval
    let tick = 0

    timerRef.current = setInterval(() => {
      tick++
      const pct = Math.min((tick / ticks) * 100, 100)
      progressRef.current = pct
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(timerRef.current!)
        advance()
      }
    }, interval)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [step, open, advance])

  // Update spotlight rect on step change (after scroll settles)
  useEffect(() => {
    if (!open) return
    const timeout = setTimeout(() => {
      setSpotlight(getTargetRect(current.target))
    }, 350)
    return () => clearTimeout(timeout)
  }, [step, open, current.target])

  if (!open || !mounted) return null

  const tooltipStyle = computeTooltipStyle(spotlight, current.tooltipSide, vw, vh)

  return createPortal(
    <>
      {/* ── Overlay ──────────────────────────────────────────────────────── */}
      {spotlight ? (
        <>
          {/* Top */}
          <div style={{
            position: 'fixed', zIndex: 9998,
            top: 0, left: 0, right: 0,
            height: spotlight.top,
            backgroundColor: 'rgba(0,0,0,0.72)',
            transition: 'all 0.35s ease',
          }} />
          {/* Left */}
          <div style={{
            position: 'fixed', zIndex: 9998,
            top: spotlight.top,
            left: 0,
            width: spotlight.left,
            height: spotlight.height,
            backgroundColor: 'rgba(0,0,0,0.72)',
            transition: 'all 0.35s ease',
          }} />
          {/* Right */}
          <div style={{
            position: 'fixed', zIndex: 9998,
            top: spotlight.top,
            left: spotlight.left + spotlight.width,
            right: 0,
            height: spotlight.height,
            backgroundColor: 'rgba(0,0,0,0.72)',
            transition: 'all 0.35s ease',
          }} />
          {/* Bottom */}
          <div style={{
            position: 'fixed', zIndex: 9998,
            top: spotlight.top + spotlight.height,
            left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.72)',
            transition: 'all 0.35s ease',
          }} />
          {/* Spotlight border ring */}
          <div style={{
            position: 'fixed', zIndex: 9999,
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            borderRadius: 10,
            border: '2px solid rgba(33,124,235,0.7)',
            boxShadow: '0 0 0 3px rgba(33,124,235,0.18)',
            pointerEvents: 'none',
            transition: 'all 0.35s ease',
          }} />
        </>
      ) : (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, backgroundColor: 'rgba(0,0,0,0.72)' }} />
      )}

      {/* ── Tooltip card ──────────────────────────────────────────────────── */}
      <div
        style={{
          ...tooltipStyle,
          zIndex: 10000,
          background: 'var(--neutral-50, #fafafa)',
          borderRadius: 14,
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          transition: 'top 0.35s ease, left 0.35s ease',
          fontFamily: 'var(--font-body, var(--font-dm-sans, system-ui, sans-serif))',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(0,0,0,0.06)', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0,
            height: '100%',
            width: `${progress}%`,
            background: 'var(--brand-electric-blue, #217CEB)',
            transition: 'width 0.05s linear',
          }} />
        </div>

        {/* Card body */}
        <div style={{ padding: '20px 22px 18px' }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(33,124,235,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {current.icon}
            </div>
            <button
              onClick={finish}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--neutral-500, #71717a)', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="Skip tour"
            >
              <X size={16} />
            </button>
          </div>

          {/* Text */}
          <p style={{
            fontFamily: 'var(--font-display, var(--font-sora, system-ui))',
            fontSize: 16, fontWeight: 700,
            color: 'var(--neutral-800, #2c2c2e)',
            margin: '0 0 8px', lineHeight: 1.25,
            letterSpacing: '-0.3px',
          }}>
            {current.title}
          </p>
          <p style={{
            fontSize: 13.5, lineHeight: 1.6,
            color: 'var(--neutral-600, #52525b)',
            margin: '0 0 18px',
          }}>
            {current.description}
          </p>

          {/* Step dots + action row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Dots */}
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 5,
                    width: i === step ? 20 : 5,
                    borderRadius: 99,
                    background: i === step
                      ? 'var(--brand-electric-blue, #217ceb)'
                      : i < step
                        ? 'rgba(33,124,235,0.35)'
                        : 'rgba(0,0,0,0.12)',
                    transition: 'all 0.25s ease',
                  }}
                />
              ))}
            </div>

            {/* Next / Get started */}
            <button
              onClick={() => { advance() }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'var(--brand-electric-blue, #217CEB)',
                color: '#fff',
                border: 'none', cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13.5, fontWeight: 600,
                fontFamily: 'var(--font-display, var(--font-sora, system-ui))',
                letterSpacing: '-0.1px',
                transition: 'background 0.15s ease, transform 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1D6FD1')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--brand-electric-blue, #217CEB)')}
            >
              {isLast ? 'Get started' : (
                <>Next <ChevronRight size={14} /></>
              )}
            </button>
          </div>

          {/* Step counter */}
          <p style={{
            fontSize: 11.5,
            color: 'var(--neutral-500, #71717a)',
            marginTop: 10, marginBottom: 0,
            textAlign: 'right',
          }}>
            {step + 1} / {TOUR_STEPS.length}
          </p>
        </div>
      </div>
    </>,
    document.body,
  )
}
