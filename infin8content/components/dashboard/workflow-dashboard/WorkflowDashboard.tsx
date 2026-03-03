'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeArticles } from '@/hooks/use-realtime-articles'
import { WorkflowCard } from './WorkflowCard'
import type { DashboardResponse, WorkflowDashboardItem } from '@/lib/services/intent-engine/workflow-dashboard-service'
import { Loader2 } from 'lucide-react'

// ─── Brand Tokens ──────────────────────────────────────────────────────────
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
}

const STEP_ORDER = [
  "step_1_icp", "step_2_competitors", "step_3_seeds", "step_4_longtails",
  "step_5_filtering", "step_6_clustering", "step_7_validation", "step_8_subtopics",
  "step_9_articles", "completed",
]

const PROGRESS_MAP: Record<string, number> = {
  step_1_icp: 11, step_2_competitors: 22, step_3_seeds: 33, step_4_longtails: 44,
  step_5_filtering: 56, step_6_clustering: 67, step_7_validation: 78,
  step_8_subtopics: 89, step_9_articles: 94, completed: 100,
}

const STATE_TO_STEP_NUM: Record<string, number> = {
  'step_1_icp': 1,
  'step_2_competitors': 2,
  'step_3_seeds': 3,
  'step_4_longtails': 4,
  'step_5_filtering': 5,
  'step_6_clustering': 6,
  'step_7_validation': 7,
  'step_8_subtopics': 8,
  'step_9_articles': 9,
  'completed': 9
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
        const colors = {
          step_1_icp: "#217CEB",
          step_2_competitors: "#4A42CC",
          step_3_seeds: "#F59E0B",
          step_4_longtails: "#10B981",
          step_5_filtering: "#06B6D4",
          step_6_clustering: "#217CEB",
          step_7_validation: "#4A42CC",
          step_8_subtopics: "#F59E0B",
          step_9_articles: "#10B981",
        } as Record<string, string>
        const color = colors[s] || T.blue

        return (
          <div key={s} style={{
            flex: 1, height: compact ? 5 : 7, borderRadius: 2,
            background: isDone || isCurrent ? color : T.neutral200,
            opacity: isCurrent ? 1 : isDone ? 0.85 : 0.45,
            boxShadow: isCurrent ? `0 0 7px ${color}70` : "none",
            transition: "all 0.3s ease",
          }} />
        )
      })}
    </div>
  )
}

function StatusBadge({ state }: { state: string }) {
  const baseState = state.replace(/_(running|failed|queued)$/, '')
  const meta: Record<string, any> = {
    step_1_icp: { short: "ICP", color: "#217CEB", gate: false },
    step_2_competitors: { short: "Compete", color: "#4A42CC", gate: false },
    step_3_seeds: { short: "Seeds", color: "#F59E0B", gate: true },
    step_4_longtails: { short: "Longtail", color: "#10B981", gate: false },
    step_5_filtering: { short: "Filter", color: "#06B6D4", gate: false },
    step_6_clustering: { short: "Cluster", color: "#217CEB", gate: false },
    step_7_validation: { short: "Validate", color: "#4A42CC", gate: false },
    step_8_subtopics: { short: "Subtopics", color: "#F59E0B", gate: true },
    step_9_articles: { short: "Articles", color: "#10B981", gate: false },
    completed: { short: "Done", color: "#22C55E", gate: false },
  }
  const s = meta[baseState] || { short: baseState, color: T.neutral500, gate: false }
  const isGate = s.gate

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 9px", borderRadius: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
      background: isGate ? "rgba(245,158,11,0.1)" : `${s.color}14`,
      color: isGate ? T.warning : s.color,
      border: `1px solid ${isGate ? "rgba(245,158,11,0.3)" : `${s.color}35`}`,
      fontFamily: "var(--font-lato,'Lato',sans-serif)",
    }}>
      {isGate && <span style={{ fontSize: 8, marginRight: 1 }}>⬡</span>}
      {s.short}
    </span>
  )
}

function ArticleBadge({ status }: { status: string }) {
  const map: Record<string, any> = {
    published: { label: "Published", color: "#22C55E", bg: "rgba(34,197,94,0.09)" },
    draft: { label: "Draft", color: T.neutral500, bg: T.lightGray },
    generating: { label: "Generating", color: T.warning, bg: "rgba(245,158,11,0.09)" },
    failed: { label: "Failed", color: T.error, bg: "rgba(239,68,68,0.09)" },
  }
  const s = map[status] || map.draft
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase",
      background: s.bg, color: s.color,
      fontFamily: "var(--font-lato,'Lato',sans-serif)",
    }}>{s.label}</span>
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

// ─── KPI Strip ────────────────────────────────────────────────────────────────
function KPIStrip({ workflows, articles }: { workflows: WorkflowDashboardItem[], articles: any[] }) {
  const activeCount = workflows.filter(w => w.state !== 'completed' && w.state !== 'cancelled').length
  const totalKeywords = workflows.reduce((acc, w) => acc + (w.keywords || 0), 0)
  const articlesCount = articles.length
  const pendingApprovals = workflows.filter(w => w.state === 'step_3_seeds' || w.state === 'step_8_subtopics').length

  const avgProgress = workflows.length > 0
    ? Math.round(workflows.reduce((acc, w) => acc + (w.progress_percentage || 0), 0) / workflows.length)
    : 0

  const kpis = [
    { label: "Active Workflows", value: activeCount.toString(), sub: "+1 this week", alert: false, icon: "⬡", trend: true },
    { label: "Total Keywords", value: totalKeywords.toLocaleString(), sub: "Across all workflows", alert: false, icon: "⌖", trend: true },
    { label: "Articles Generated", value: articlesCount.toString(), sub: "Live articles", alert: false, icon: "▤", trend: true },
    { label: "Pending Approvals", value: pendingApprovals.toString(), sub: "Blocking progress", alert: pendingApprovals > 0, icon: "◈", trend: false },
    { label: "Avg. Completion", value: `${avgProgress}%`, sub: "Across all workflows", alert: false, icon: "◉", trend: true },
  ]

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
      {kpis.map((k) => (
        <div key={k.label} style={{
          background: T.white,
          borderRadius: 10,
          border: `1px solid ${k.alert ? "rgba(245,158,11,0.3)" : T.neutral200}`,
          padding: "14px 16px",
          position: "relative", overflow: "hidden",
          boxShadow: k.alert
            ? "0 4px 12px rgba(245,158,11,0.1)"
            : "0 1px 3px rgba(0,0,0,0.04)",
          transition: "box-shadow 0.2s",
        }}>
          {/* Top gradient line */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: k.alert
              ? "linear-gradient(90deg, #F59E0B, #EF4444)"
              : T.gradient,
            opacity: k.alert ? 1 : 0.6,
          }} />
          {/* Mesh background */}
          <div style={{
            position: "absolute", inset: 0,
            background: k.alert
              ? "radial-gradient(at 80% 0%, rgba(245,158,11,0.05) 0%, transparent 60%)"
              : "radial-gradient(at 80% 0%, rgba(33,124,235,0.04) 0%, transparent 60%)",
            pointerEvents: "none",
          }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{
                fontSize: 10, color: T.neutral500, textTransform: "uppercase",
                letterSpacing: "0.08em", fontWeight: 700,
                fontFamily: "var(--font-lato,'Lato',sans-serif)",
              }}>{k.label}</span>
              <span style={{ fontSize: 13, color: k.alert ? T.warning : T.neutral200 }}>{k.icon}</span>
            </div>
            <div style={{
              fontSize: 26, fontWeight: 800, lineHeight: 1, marginBottom: 5,
              fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
              background: k.alert ? "none" : T.gradient,
              WebkitBackgroundClip: k.alert ? "unset" : "text",
              WebkitTextFillColor: k.alert ? T.warning : "transparent",
              color: k.alert ? T.warning : T.charcoal,
            }}>{k.value}</div>
            <div style={{
              fontSize: 11, color: k.alert ? "rgba(245,158,11,0.8)" : T.neutral500,
              fontFamily: "var(--font-lato,'Lato',sans-serif)",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {k.trend && <span style={{ color: T.success, fontWeight: 700 }}>↑</span>}
              {k.alert && <span style={{ color: T.warning, fontWeight: 700 }}>!</span>}
              {k.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Action Required Banner ───────────────────────────────────────────────────
function ActionRequired({ workflows, onNavigate }: { workflows: WorkflowDashboardItem[], onNavigate: (id: string, state: string) => void }) {
  const pending = workflows.filter(w => w.state === 'step_3_seeds' || w.state === 'step_8_subtopics')
  if (!pending.length) return null

  return (
    <div style={{
      background: "rgba(245,158,11,0.04)",
      border: "1px solid rgba(245,158,11,0.25)",
      borderRadius: 10, marginBottom: 24, overflow: "hidden",
    }}>
      <div style={{
        padding: "11px 18px",
        borderBottom: "1px solid rgba(245,158,11,0.14)",
        display: "flex", alignItems: "center", gap: 9,
        background: "rgba(245,158,11,0.05)",
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%", background: T.warning,
          boxShadow: "0 0 0 3px rgba(245,158,11,0.2)",
          animation: "i8c-pulse 2s infinite", flexShrink: 0,
        }} />
        <span style={{
          fontSize: 12, fontWeight: 800, color: T.warning,
          textTransform: "uppercase", letterSpacing: "0.09em",
          fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
        }}>
          {pending.length} Approval{pending.length > 1 ? "s" : ""} Required — Workflow Progress Blocked
        </span>
      </div>
      {pending.map((wf) => {
        const approvalType = wf.state === 'step_3_seeds' ? 'Seed Keywords' : 'Subtopics'
        const stepNum = STATE_TO_STEP_NUM[wf.state]

        return (
          <div key={wf.id} style={{
            padding: "12px 18px",
            display: "flex", alignItems: "center", gap: 14,
            borderBottom: "1px solid rgba(245,158,11,0.07)",
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: T.charcoal, marginBottom: 2,
                fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
              }}>{wf.name}</div>
              <div style={{
                fontSize: 11, color: T.neutral500,
                fontFamily: "var(--font-lato,'Lato',sans-serif)",
              }}>
                Step {stepNum} of 9 ·{" "}
                <span style={{ color: T.warning, fontWeight: 600 }}>Waiting on {approvalType}</span>
                <span style={{ marginLeft: 6, color: T.neutral200 }}>·</span>
                <span style={{ marginLeft: 6 }}>Last updated {new Date(wf.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div style={{ width: 160, flexShrink: 0 }}>
              <PipelineTrack state={wf.state} compact />
            </div>
            <button
              onClick={() => onNavigate(wf.id, wf.state)}
              style={{
                padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer",
                background: T.warning, color: T.white, fontSize: 11, fontWeight: 800,
                letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap",
                fontFamily: "var(--font-lato,'Lato',sans-serif)",
                boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
                flexShrink: 0,
              }}>Review Now →</button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Workflow Table ───────────────────────────────────────────────────────────
function WorkflowTable({ workflows, onNavigate }: { workflows: WorkflowDashboardItem[], onNavigate: (id: string, state: string) => void }) {
  const router = useRouter()
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.neutral200}`,
      borderRadius: 10, overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        padding: "13px 18px",
        borderBottom: `1px solid ${T.neutral200}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: T.lightGray,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 800, color: T.charcoal, letterSpacing: "0.05em", textTransform: "uppercase",
          fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
        }}>All Workflows</span>
        <button onClick={() => router.push('/workflows/new')} style={{
          padding: "6px 14px", borderRadius: 6,
          border: `1px solid ${T.blue}`,
          background: T.gradient, color: T.white,
          fontSize: 11, fontWeight: 700, cursor: "pointer",
          boxShadow: "0 2px 8px rgba(33,124,235,0.2)",
          fontFamily: "var(--font-lato,'Lato',sans-serif)",
        }}>+ New Workflow</button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: T.lightGray }}>
            {["Workflow", "Step", "Pipeline", "Progress", "Keywords", "Articles", "Updated", ""].map(h => (
              <th key={h} style={{
                padding: "8px 14px", textAlign: "left",
                fontSize: 9, color: T.neutral500, fontWeight: 800,
                textTransform: "uppercase", letterSpacing: "0.1em",
                borderBottom: `1px solid ${T.neutral200}`,
                fontFamily: "var(--font-lato,'Lato',sans-serif)",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {workflows.map((wf, i) => {
            const baseState = wf.state.replace(/_(running|failed|queued)$/, '')
            const isGate = baseState === 'step_3_seeds' || baseState === 'step_8_subtopics'
            const isDone = baseState === "completed"
            const stepNum = STATE_TO_STEP_NUM[baseState]
            const progress = PROGRESS_MAP[baseState] || wf.progress_percentage || 0

            return (
              <tr key={wf.id} style={{
                borderBottom: i < workflows.length - 1 ? `1px solid ${T.neutral200}` : "none",
                cursor: "pointer", transition: "background 0.15s",
              }}
                onClick={() => onNavigate(wf.id, wf.state)}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(33,124,235,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "11px 14px" }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: T.charcoal, marginBottom: 2,
                    fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
                  }}>{wf.name}</div>
                  <div style={{
                    fontSize: 10, color: T.neutral500,
                    fontFamily: "var(--font-lato,'Lato',sans-serif)",
                  }}>Created {new Date(wf.created_at).toLocaleDateString()}</div>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <StatusBadge state={wf.state} />
                </td>
                <td style={{ padding: "11px 14px", minWidth: 150 }}>
                  <PipelineTrack state={wf.state} compact />
                </td>
                <td style={{ padding: "11px 14px", minWidth: 110 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar
                        value={progress}
                        color={isDone ? T.success : isGate ? T.warning : T.blue}
                      />
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: T.neutral500, minWidth: 26,
                      fontFamily: "var(--font-lato,'Lato',sans-serif)",
                    }}>{Math.round(progress)}%</span>
                  </div>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
                    background: T.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>{(wf.keywords || 0).toLocaleString()}</span>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: T.neutral600,
                    fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
                  }}>{wf.articles || 0}</span>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{
                    fontSize: 11, color: T.neutral500,
                    fontFamily: "var(--font-lato,'Lato',sans-serif)",
                  }}>{new Date(wf.updated_at).toLocaleDateString()}</span>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  {isGate ? (
                    <button style={{
                      padding: "5px 11px", borderRadius: 5,
                      border: `1px solid ${T.warning}`,
                      background: "rgba(245,158,11,0.07)", color: T.warning,
                      fontSize: 10, fontWeight: 800, cursor: "pointer",
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      fontFamily: "var(--font-lato,'Lato',sans-serif)",
                    }}>Approve</button>
                  ) : isDone ? (
                    <span style={{ fontSize: 10, color: T.success, fontWeight: 700 }}>✓ Done</span>
                  ) : (
                    <button style={{
                      padding: "5px 11px", borderRadius: 5,
                      border: `1px solid ${T.blue}30`,
                      background: "rgba(33,124,235,0.05)", color: T.blue,
                      fontSize: 10, fontWeight: 700, cursor: "pointer",
                      fontFamily: "var(--font-lato,'Lato',sans-serif)",
                    }}>View →</button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Articles Panel ───────────────────────────────────────────────────────────
function ArticlesPanel({ articles }: { articles: any[] }) {
  const router = useRouter()
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.neutral200}`,
      borderRadius: 10, overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        padding: "13px 18px", background: T.lightGray,
        borderBottom: `1px solid ${T.neutral200}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{
          fontSize: 12, fontWeight: 800, color: T.charcoal, letterSpacing: "0.05em", textTransform: "uppercase",
          fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
        }}>Recent Articles</span>
        <button
          onClick={() => router.push('/dashboard/articles')}
          style={{
            fontSize: 11, color: T.blue, fontWeight: 600, cursor: "pointer", background: "none", border: "none",
            fontFamily: "var(--font-lato,'Lato',sans-serif)",
          }}>View all {articles.length} →</button>
      </div>
      {articles.slice(0, 5).map((a, i) => (
        <div key={a.id} style={{
          padding: "11px 18px", display: "flex", alignItems: "center", gap: 10,
          borderBottom: i < Math.min(articles.length, 5) - 1 ? `1px solid ${T.neutral200}` : "none",
          cursor: "pointer", transition: "background 0.15s",
        }}
          onClick={() => router.push(`/dashboard/articles/${a.id}`)}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(33,124,235,0.02)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: T.charcoal,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3,
              fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
            }}>{a.title || a.keyword}</div>
            <div style={{
              fontSize: 10, color: T.neutral500,
              fontFamily: "var(--font-lato,'Lato',sans-serif)",
            }}>
              {a.keyword}
            </div>
          </div>
          <ArticleBadge status={a.status} />
        </div>
      ))}
      {articles.length === 0 && (
        <div style={{ padding: 24, textAlign: "center", color: T.neutral500, fontSize: 11 }}>
          No articles generated yet.
        </div>
      )}
    </div>
  )
}

// ─── Main WorkflowDashboard Component ─────────────────────────────────────────
export function WorkflowDashboard({ orgId }: { orgId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const subscriptionRef = useRef<any>(null)

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"cards" | "table">("cards")
  const [range, setRange] = useState("30d")

  const { articles, isConnected } = useRealtimeArticles({ orgId })

  useEffect(() => {
    fetchDashboard()
    setupRealtime()

    return () => {
      subscriptionRef.current?.unsubscribe()
    }
  }, [])

  async function fetchDashboard() {
    setLoading(true)
    const res = await fetch('/api/intent/workflows/dashboard')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  function setupRealtime() {
    subscriptionRef.current = supabase
      .channel('intent_workflows_dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'intent_workflows' },
        fetchDashboard
      )
      .subscribe()
  }

  const onNavigate = (id: string, state: string) => {
    const baseState = state.replace(/_(running|failed|queued)$/, '')
    const stepNum = STATE_TO_STEP_NUM[baseState] || 1
    router.push(`/workflows/${id}/steps/${stepNum}`)
  }

  if (loading && !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const workflows = data?.workflows || []

  return (
    <div style={{
      flex: 1, overflowY: "auto", padding: 24,
      animation: "i8c-slide 0.3s ease",
      background: T.lightGray,
    }}>
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(33, 124, 235, 0.2); border-radius: 2px; }
        @keyframes i8c-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); }
          50%      { box-shadow: 0 0 0 7px rgba(245,158,11,0); }
        }
        @keyframes i8c-slide {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{
            fontSize: 10, color: T.neutral500, textTransform: "uppercase",
            letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4,
            fontFamily: "var(--font-lato,'Lato',sans-serif)",
          }}>Overview</div>
          <h1 style={{
            fontSize: 22, fontWeight: 800, color: T.charcoal, letterSpacing: "-0.02em",
            fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
            lineHeight: 1,
          }}>
            Content{" "}
            <span style={{
              background: T.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Intelligence</span>
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* View toggle */}
          <div style={{
            display: "flex", background: T.white, borderRadius: 7,
            border: `1px solid ${T.neutral200}`, overflow: "hidden",
          }}>
            {[["cards", "⊞ Cards"], ["table", "≡ Table"]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v as any)} style={{
                padding: "5px 13px", border: "none", background: view === v ? T.gradient : "transparent",
                color: view === v ? T.white : T.neutral500,
                fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                fontFamily: "var(--font-lato,'Lato',sans-serif)",
              }}>{label}</button>
            ))}
          </div>
          {/* Range */}
          {["7d", "30d", "90d"].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: "5px 12px", borderRadius: 6,
              border: range === r ? `1px solid ${T.blue}` : `1px solid ${T.neutral200}`,
              background: range === r ? "rgba(33,124,235,0.08)" : T.white,
              color: range === r ? T.blue : T.neutral500,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-lato,'Lato',sans-serif)",
            }}>{r}</button>
          ))}
        </div>
      </div>

      <KPIStrip workflows={workflows} articles={articles} />
      <ActionRequired workflows={workflows} onNavigate={onNavigate} />

      {/* Main content */}
      {view === "cards" ? (
        <div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16,
          }}>
            {workflows.slice(0, 3).map(wf => (
              <WorkflowCard key={wf.id} workflow={wf} onNavigate={() => onNavigate(wf.id, wf.state)} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr) 340px", gap: 16, marginBottom: 16 }}>
            {workflows.slice(3, 5).map(wf => (
              <WorkflowCard key={wf.id} workflow={wf} onNavigate={() => onNavigate(wf.id, wf.state)} />
            ))}
            <ArticlesPanel articles={articles} />
          </div>
          {workflows.length > 5 && (
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
            }}>
              {workflows.slice(5).map(wf => (
                <WorkflowCard key={wf.id} workflow={wf} onNavigate={() => onNavigate(wf.id, wf.state)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
          <WorkflowTable workflows={workflows} onNavigate={onNavigate} />
          <ArticlesPanel articles={articles} />
        </div>
      )}

      {/* Status footer */}
      <div style={{
        marginTop: 20, display: "flex", gap: 18, paddingTop: 14,
        borderTop: `1px solid ${T.neutral200}`,
      }}>
        {[
          { label: "Generation Engine", status: "Operational", ok: true },
          { label: "Last Sync", status: "Just now", ok: true },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: s.ok ? T.success : T.error,
              boxShadow: s.ok ? `0 0 0 2px rgba(34,197,94,0.2)` : "none",
            }} />
            <span style={{ fontSize: 10, color: T.neutral800, fontFamily: "var(--font-lato,'Lato',sans-serif)" }}>{s.label}</span>
            <span style={{ fontSize: 10, color: T.neutral500, fontFamily: "var(--font-lato,'Lato',sans-serif)" }}>· {s.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

