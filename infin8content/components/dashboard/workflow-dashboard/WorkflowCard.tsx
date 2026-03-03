'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import type { WorkflowDashboardItem } from '@/lib/services/intent-engine/workflow-dashboard-service'

// ─── Brand Tokens (from global.css & user design) ────────────────────────────
const T = {
  blue: "#217CEB",
  purple: "#4A42CC",
  charcoal: "#2C2C2E",
  lightGray: "#F4F4F6",
  white: "#FFFFFF",
  neutral200: "#E5E5E7",
  neutral500: "#71717A",
  neutral600: "#52525B",
  neutral800: "#2C2C2E",
  neutral900: "#1C1C1E",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#06B6D4",
  gradient: "linear-gradient(90deg, #217CEB 0%, #4A42CC 100%)",
  gradientMesh: `radial-gradient(at 27% 37%, hsla(215,98%,61%,0.09) 0px, transparent 50%),
                 radial-gradient(at 97% 21%, hsla(265,87%,54%,0.09) 0px, transparent 50%)`,
}

const STEP_META = {
  step_1_icp: { label: "ICP Generation", short: "ICP", color: "#217CEB", gate: false },
  step_2_competitors: { label: "Competitor Analysis", short: "Compete", color: "#4A42CC", gate: false },
  step_3_seeds: { label: "Seed Approval", short: "Seeds", color: "#F59E0B", gate: true },
  step_4_longtails: { label: "Longtail Expansion", short: "Longtail", color: "#10B981", gate: false },
  step_5_filtering: { label: "Keyword Filtering", short: "Filter", color: "#06B6D4", gate: false },
  step_6_clustering: { label: "Topic Clustering", short: "Cluster", color: "#217CEB", gate: false },
  step_7_validation: { label: "Cluster Validation", short: "Validate", color: "#4A42CC", gate: false },
  step_8_subtopics: { label: "Subtopic Approval", short: "Subtopics", color: "#F59E0B", gate: true },
  step_9_articles: { label: "Article Generation", short: "Articles", color: "#10B981", gate: false },
  completed: { label: "Completed", short: "Done", color: "#22C55E", gate: false },
} as const

const STEP_ORDER = [
  "step_1_icp", "step_2_competitors", "step_3_seeds", "step_4_longtails",
  "step_5_filtering", "step_6_clustering", "step_7_validation", "step_8_subtopics",
  "step_9_articles", "completed",
]

const PROGRESS_MAP = {
  step_1_icp: 11, step_2_competitors: 22, step_3_seeds: 33, step_4_longtails: 44,
  step_5_filtering: 56, step_6_clustering: 67, step_7_validation: 78,
  step_8_subtopics: 89, step_9_articles: 94, completed: 100,
}

// ─── Atoms ────────────────────────────────────────────────────────────────────
function PipelineTrack({ state, compact = false }: { state: string, compact?: boolean }) {
  const baseState = state.replace(/_(running|failed|queued)$/, '')
  const currentIdx = STEP_ORDER.indexOf(baseState)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {STEP_ORDER.slice(0, 9).map((s, i) => {
        const isDone = i < currentIdx
        const isCurrent = i === currentIdx
        const meta = STEP_META[s as keyof typeof STEP_META]
        return (
          <div key={s} title={meta.label} style={{
            flex: 1, height: compact ? 5 : 7, borderRadius: 2,
            background: isDone
              ? meta.color
              : isCurrent
                ? meta.color
                : T.neutral200,
            opacity: isCurrent ? 1 : isDone ? 0.85 : 0.45,
            boxShadow: isCurrent ? `0 0 7px ${meta.color}70` : "none",
            transition: "all 0.3s ease",
          }} />
        )
      })}
    </div>
  )
}

function StatusBadge({ state }: { state: string }) {
  const baseState = state.replace(/_(running|failed|queued)$/, '')
  const meta = STEP_META[baseState as keyof typeof STEP_META] || { label: state, short: state, color: T.neutral500, gate: false }
  const isGate = meta.gate

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 9px", borderRadius: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
      background: isGate ? "rgba(245,158,11,0.1)" : `${meta.color}14`,
      color: isGate ? T.warning : meta.color,
      border: `1px solid ${isGate ? "rgba(245,158,11,0.3)" : `${meta.color}35`}`,
      fontFamily: "var(--font-lato,'Lato',sans-serif)",
    }}>
      {isGate && <span style={{ fontSize: 8, marginRight: 1 }}>⬡</span>}
      {meta.short}
    </span>
  )
}

function ProgressBar({ value, color }: { value: number, color?: string }) {
  const c = color || T.blue
  return (
    <div style={{ height: 5, background: T.neutral200, borderRadius: 3, overflow: "hidden" }}>
      <div style={{
        width: `${value}%`, height: "100%", borderRadius: 3,
        background: c === T.blue ? `linear-gradient(90deg, ${c}, ${T.purple})` : c,
        transition: "width 0.5s ease",
        boxShadow: `0 0 6px ${c}50`,
      }} />
    </div>
  )
}

// ─── Enhanced WorkflowCard (drop-in replacement) ──────────────────────────────
export interface WorkflowCardProps {
  workflow: WorkflowDashboardItem
  onNavigate?: () => void
}

export function WorkflowCard({ workflow, onNavigate }: WorkflowCardProps) {
  const router = useRouter()

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate()
    } else {
      router.push(`/workflows/${workflow.id}/steps/1`)
    }
  }

  const baseState = workflow.state.replace(/_(running|failed|queued)$/, '') as string
  const progress = PROGRESS_MAP[baseState as keyof typeof PROGRESS_MAP] || workflow.progress_percentage || 0
  const meta = STEP_META[baseState as keyof typeof STEP_META] || { label: workflow.state, short: workflow.state, color: T.neutral500, gate: false }
  const isGate = meta.gate
  const isDone = baseState === "completed"

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const created = formatDate(workflow.created_at)
  const lastUpdated = formatDate(workflow.updated_at)

  const keywordsCount = (workflow as any).keywords || 0
  const articlesCount = (workflow as any).articles || 0
  const approvalType = baseState === 'step_3_seeds' ? 'Seed Keywords' : baseState === 'step_8_subtopics' ? 'Subtopics' : null
  const stepNum = STEP_ORDER.indexOf(baseState) + 1 || (workflow.state === 'completed' ? 9 : 1)

  return (
    <>
      <style>{`
        @keyframes i8c-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); }
          50%      { box-shadow: 0 0 0 7px rgba(245,158,11,0); }
        }
      `}</style>
      <div style={{
        background: T.white,
        borderRadius: 12,
        border: `1px solid ${isGate ? "rgba(245,158,11,0.35)" : T.neutral200}`,
        boxShadow: isGate
          ? "0 4px 16px rgba(245,158,11,0.12)"
          : "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(33,124,235,0.04)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.22s ease",
        position: "relative",
      }}
        onClick={handleNavigate}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "translateY(-3px)"
          e.currentTarget.style.boxShadow = isGate
            ? "0 8px 24px rgba(245,158,11,0.18)"
            : "0 8px 24px rgba(33,124,235,0.12)"
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = isGate
            ? "0 4px 16px rgba(245,158,11,0.12)"
            : "0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(33,124,235,0.04)"
        }}
      >
        {/* Top accent bar */}
        <div style={{
          height: 3,
          background: isDone
            ? "linear-gradient(90deg, #22C55E, #10B981)"
            : isGate
              ? "linear-gradient(90deg, #F59E0B, #EF4444)"
              : T.gradient,
        }} />

        {/* Gate alert strip */}
        {isGate && (
          <div style={{
            padding: "7px 16px",
            background: "rgba(245,158,11,0.06)",
            borderBottom: "1px solid rgba(245,158,11,0.12)",
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%", background: T.warning,
              boxShadow: "0 0 0 3px rgba(245,158,11,0.2)",
              animation: "i8c-pulse 2s infinite",
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: T.warning,
              textTransform: "uppercase", letterSpacing: "0.08em",
              fontFamily: "var(--font-lato,'Lato',sans-serif)",
            }}>
              Action Required · {approvalType} awaiting review
            </span>
            <button style={{
              marginLeft: "auto", padding: "3px 10px", borderRadius: 4,
              border: `1px solid ${T.warning}`, background: "transparent",
              color: T.warning, fontSize: 10, fontWeight: 800, cursor: "pointer",
              letterSpacing: "0.06em", textTransform: "uppercase",
              fontFamily: "var(--font-lato,'Lato',sans-serif)",
            }} onClick={(e) => { e.stopPropagation(); handleNavigate(); }}>Review →</button>
          </div>
        )}

        {/* Main body */}
        <div style={{ padding: "16px 18px 14px" }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 14, fontWeight: 700, color: T.charcoal, marginBottom: 3,
                fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>{workflow.name}</div>
              <div style={{
                fontSize: 11, color: T.neutral500,
                fontFamily: "var(--font-lato,'Lato',sans-serif)",
              }}>Created {created} · Updated {lastUpdated}</div>
            </div>
            <StatusBadge state={workflow.state} />
          </div>

          {/* Pipeline track */}
          <div style={{ marginBottom: 10 }}>
            <PipelineTrack state={workflow.state} compact />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <span style={{
                fontSize: 10, color: T.neutral500,
                fontFamily: "var(--font-lato,'Lato',sans-serif)",
              }}>
                Step {stepNum} of 9 · {meta.label}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: isDone ? T.success : T.blue,
                fontFamily: "var(--font-lato,'Lato',sans-serif)",
              }}>{progress}%</span>
            </div>
          </div>

          {/* Progress bar */}
          <ProgressBar
            value={progress}
            color={isDone ? T.success : isGate ? T.warning : T.blue}
          />

          {/* Stats row */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
            marginTop: 14, paddingTop: 14,
            borderTop: `1px solid ${T.neutral200}`,
          }}>
            {[
              { label: "Keywords", value: typeof keywordsCount === 'number' && keywordsCount > 0 ? keywordsCount.toLocaleString() : '-' },
              { label: "Articles", value: articlesCount || '-' },
              { label: "Progress", value: `${progress}%` },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: 16, fontWeight: 800, color: T.charcoal, lineHeight: 1,
                  fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
                  background: s.label === "Keywords" ? `linear-gradient(135deg, ${T.blue}, ${T.purple})` : "none",
                  WebkitBackgroundClip: s.label === "Keywords" ? "text" : "unset",
                  WebkitTextFillColor: s.label === "Keywords" ? "transparent" : "unset",
                }}>{s.value}</div>
                <div style={{
                  fontSize: 10, color: T.neutral500, marginTop: 2, textTransform: "uppercase",
                  letterSpacing: "0.07em", fontFamily: "var(--font-lato,'Lato',sans-serif)",
                }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button style={{
            marginTop: 12, width: "100%", padding: "8px 0",
            borderRadius: 6, border: `1px solid ${isGate ? T.warning : T.blue}20`,
            background: isDone
              ? "rgba(34,197,94,0.05)"
              : isGate
                ? "rgba(245,158,11,0.06)"
                : "rgba(33,124,235,0.05)",
            color: isDone ? T.success : isGate ? T.warning : T.blue,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            fontFamily: "var(--font-lato,'Lato',sans-serif)",
            transition: "background 0.15s",
          }}
            onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
            onMouseEnter={e => e.currentTarget.style.background = isGate ? "rgba(245,158,11,0.12)" : "rgba(33,124,235,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = isDone ? "rgba(34,197,94,0.05)" : isGate ? "rgba(245,158,11,0.06)" : "rgba(33,124,235,0.05)"}
          >
            {isDone ? "✓ View Completed Workflow" : isGate ? `Review ${approvalType} →` : `Continue Step ${stepNum} →`}
          </button>
        </div>
      </div>
    </>
  )
}
