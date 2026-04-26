'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeArticles } from '@/hooks/use-realtime-articles'
import { WorkflowCard, PipelineTrack, StatusBadge, STATE_TO_STEP_NUM } from './WorkflowCard'
import type { DashboardResponse, WorkflowDashboardItem, DashboardSummary } from '@/lib/services/intent-engine/workflow-dashboard-service'
import { Loader2 } from 'lucide-react'

// ─── Brand Tokens ─────────────────────────────────────────────────────────────
const T = {
  blue: "#0066FF",
  purple: "#4A42CC",
  charcoal: "#2C2C2E",
  lightGray: "#F4F4F6",
  white: "#FFFFFF",
  neutral200: "#E5E5E7",
  neutral500: "#71717A",
  neutral600: "#52525B",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  gradient: "linear-gradient(90deg, #0066FF 0%, #4A42CC 100%)",
}

// ─── Atoms ────────────────────────────────────────────────────────────────────
function ProgressBar({ value, color }: { value: number; color?: string }) {
  const c = color ?? T.blue
  return (
    <div style={{ height: 5, background: T.neutral200, borderRadius: 3, overflow: "hidden" }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        height: "100%", borderRadius: 3,
        background: c === T.blue ? `linear-gradient(90deg, ${c}, ${T.purple})` : c,
        transition: "width 0.5s ease",
        boxShadow: `0 0 6px ${c}50`,
      }} />
    </div>
  )
}

function ArticleBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    published: { label: "Published", color: "#22C55E", bg: "rgba(34,197,94,0.09)" },
    draft: { label: "Draft", color: T.neutral500, bg: T.lightGray },
    generating: { label: "Generating", color: T.warning, bg: "rgba(245,158,11,0.09)" },
    failed: { label: "Failed", color: T.error, bg: "rgba(239,68,68,0.09)" },
  }
  const s = map[status] ?? map.draft
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700,
      letterSpacing: "0.06em", textTransform: "uppercase",
      background: s.bg, color: s.color,
      fontFamily: "var(--font-lato,'Lato',sans-serif)",
    }}>{s.label}</span>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: T.white, borderRadius: 12, border: `1px solid ${T.neutral200}`,
      overflow: "hidden", padding: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{ height: 3, background: T.neutral200 }} />
      <div style={{ padding: "16px 18px 14px" }}>
        <div style={{ height: 14, width: "65%", background: T.neutral200, borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 10, width: "40%", background: T.lightGray, borderRadius: 4, marginBottom: 16 }} />
        <div style={{ height: 5, background: T.neutral200, borderRadius: 3, marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: 36, background: T.lightGray, borderRadius: 6 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────
// BUG FIX #10: uses data.summary where available instead of re-deriving (Single Authority)
function KPIStrip({ workflows, articles, summary }: {
  workflows: WorkflowDashboardItem[];
  articles: any[];
  summary?: DashboardSummary;
}) {
  // Use backend summary as the primary source of truth
  const activeCount = summary?.in_progress_workflows ?? workflows.filter(w => {
    const base = w.state.replace(/_(running|failed|queued)$/, '')
    return base !== 'completed' && base !== 'cancelled'
  }).length
  const totalKeywords = summary?.total_keywords ?? workflows.reduce((acc, w) => acc + (w.keywords ?? 0), 0)
  const pendingApprovals = summary?.pending_approvals ?? workflows.filter(w => {
    const base = w.state.replace(/_(running|failed|queued)$/, '')
    return base === 'step_3_seeds' || base === 'step_8_subtopics'
  }).length
  const avgProgress = summary?.avg_completion_percentage ?? (workflows.length > 0
    ? Math.round(workflows.reduce((acc, w) => acc + (w.progress_percentage ?? 0), 0) / workflows.length)
    : 0)
  const totalArticles = summary?.total_articles ?? articles.length

  const kpis = [
    { label: "Active Workflows", value: activeCount.toString(), sub: `${workflows.length} total`, alert: false, icon: "⬡", trend: false },
    { label: "Total Keywords", value: totalKeywords.toLocaleString(), sub: "Across all workflows", alert: false, icon: "⌖", trend: true },
    { label: "Articles Generated", value: totalArticles.toString(), sub: "Live articles", alert: false, icon: "▤", trend: true },
    { label: "Pending Approvals", value: pendingApprovals.toString(), sub: pendingApprovals > 0 ? "Blocking progress" : "All clear", alert: pendingApprovals > 0, icon: "◈", trend: false },
    { label: "Avg. Completion", value: `${avgProgress}%`, sub: "Across all workflows", alert: false, icon: "◉", trend: true },
  ]

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
      {kpis.map((k) => (
        <div key={k.label} style={{
          background: T.white,
          borderRadius: 10,
          border: `1px solid ${k.alert ? "rgba(245,158,11,0.3)" : T.neutral200}`,
          padding: "14px 16px",
          position: "relative", overflow: "hidden",
          boxShadow: k.alert ? "0 4px 12px rgba(245,158,11,0.1)" : "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: k.alert ? "linear-gradient(90deg, #F59E0B, #EF4444)" : T.gradient,
            opacity: k.alert ? 1 : 0.6,
          }} />
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
              ...(k.alert
                ? { color: T.warning }
                : { background: T.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
              ),
            }}>{k.value}</div>
            <div style={{
              fontSize: 11, color: k.alert ? "rgba(245,158,11,0.8)" : T.neutral500,
              fontFamily: "var(--font-lato,'Lato',sans-serif)",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {k.trend && !k.alert && <span style={{ color: T.success, fontWeight: 700 }}>↑</span>}
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
function ActionRequired({ workflows, onNavigate }: {
  workflows: WorkflowDashboardItem[]
  onNavigate: (id: string, state: string) => void
}) {
  const pending = workflows.filter(w => {
    const base = w.state.replace(/_(running|failed|queued)$/, '')
    return base === 'step_3_seeds' || base === 'step_8_subtopics'
  })
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
        const base = wf.state.replace(/_(running|failed|queued)$/, '')
        const approvalType = base === 'step_3_seeds' ? 'Seed Keywords' : 'Subtopics'
        const stepNum = STATE_TO_STEP_NUM[base] ?? 1

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
              <div style={{ fontSize: 11, color: T.neutral500, fontFamily: "var(--font-lato,'Lato',sans-serif)" }}>
                Step {stepNum} of 9 ·{" "}
                <span style={{ color: T.warning, fontWeight: 600 }}>Waiting on {approvalType}</span>
                <span style={{ margin: "0 6px", color: T.neutral200 }}>·</span>
                <span suppressHydrationWarning>{new Date(wf.updated_at).toLocaleDateString()}</span>
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
              }}
            >
              Review Now →
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Workflow Table ───────────────────────────────────────────────────────────
function WorkflowTable({ workflows, onNavigate, onNew }: {
  workflows: WorkflowDashboardItem[]
  onNavigate: (id: string, state: string) => void
  onNew: () => void  // BUG FIX: wired handler for New Workflow button
}) {
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
        <button onClick={onNew} style={{
          padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.blue}`,
          background: T.gradient, color: T.white, fontSize: 11, fontWeight: 700, cursor: "pointer",
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
            const base = wf.state.replace(/_(running|failed|queued)$/, '')
            const isGate = base === 'step_3_seeds' || base === 'step_8_subtopics'
            const isDone = base === "completed"
            const stepNum = STATE_TO_STEP_NUM[base] ?? 1
            // BUG FIX #3: always integer
            const progress = Math.round(wf.progress_percentage ?? 0)

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
                      <ProgressBar value={progress} color={isDone ? T.success : isGate ? T.warning : T.blue} />
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: T.neutral500, minWidth: 28,
                      fontFamily: "var(--font-lato,'Lato',sans-serif)",
                    }}>{progress}%</span>
                  </div>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
                    background: T.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>{(wf.keywords ?? 0).toLocaleString()}</span>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: T.neutral600,
                    fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
                  }}>{wf.articles ?? 0}</span>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{
                    fontSize: 11, color: T.neutral500,
                    fontFamily: "var(--font-lato,'Lato',sans-serif)",
                  }} suppressHydrationWarning>{new Date(wf.updated_at).toLocaleDateString()}</span>
                </td>
                <td style={{ padding: "11px 14px" }}>
                  {isGate ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigate(wf.id, wf.state) }}
                      style={{
                        padding: "5px 11px", borderRadius: 5,
                        border: `1px solid ${T.warning}`,
                        background: "rgba(245,158,11,0.07)", color: T.warning,
                        fontSize: 10, fontWeight: 800, cursor: "pointer",
                        textTransform: "uppercase", letterSpacing: "0.06em",
                        fontFamily: "var(--font-lato,'Lato',sans-serif)",
                      }}
                    >Approve</button>
                  ) : isDone ? (
                    <span style={{ fontSize: 10, color: T.success, fontWeight: 700 }}>✓ Done</span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigate(wf.id, wf.state) }}
                      style={{
                        padding: "5px 11px", borderRadius: 5,
                        border: "1px solid rgba(33,124,235,0.2)",
                        background: "rgba(33,124,235,0.05)", color: T.blue,
                        fontSize: 10, fontWeight: 700, cursor: "pointer",
                        fontFamily: "var(--font-lato,'Lato',sans-serif)",
                      }}
                    >View →</button>
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
  const visible = articles.slice(0, 5)

  return (
    <div style={{
      background: T.white, border: `1px solid ${T.neutral200}`,
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
        {articles.length > 0 && (
          <button
            onClick={() => router.push('/dashboard/articles')}
            style={{
              fontSize: 11, color: T.blue, fontWeight: 600, cursor: "pointer",
              background: "none", border: "none",
              fontFamily: "var(--font-lato,'Lato',sans-serif)",
            }}
          >View all {articles.length} →</button>
        )}
      </div>
      {visible.map((a, i) => (
        <div key={a.id} style={{
          padding: "11px 18px", display: "flex", alignItems: "center", gap: 10,
          borderBottom: i < visible.length - 1 ? `1px solid ${T.neutral200}` : "none",
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
            }}>{a.keyword}</div>
          </div>
          <ArticleBadge status={a.status} />
        </div>
      ))}
      {articles.length === 0 && (
        <div style={{ padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: T.neutral500, marginBottom: 4, fontFamily: "var(--font-poppins,'Poppins',sans-serif)" }}>
            No articles yet
          </div>
          <div style={{ fontSize: 11, color: T.neutral200, fontFamily: "var(--font-lato,'Lato',sans-serif)" }}>
            Articles will appear once workflows reach generation
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Card Grid — BUG FIX #9: handles any workflow count correctly ─────────────
function CardGrid({ workflows, articles, onNavigate }: {
  workflows: WorkflowDashboardItem[]
  articles: any[]
  onNavigate: (id: string, state: string) => void
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: 24,
    }}>
      {workflows.map(wf => (
        <WorkflowCard key={wf.id} workflow={wf} onNavigate={() => onNavigate(wf.id, wf.state)} />
      ))}
      <ArticlesPanel articles={articles} />
    </div>
  )
}

// ─── WorkflowDashboard ────────────────────────────────────────────────────────
export function WorkflowDashboard({ orgId }: { orgId: string }) {
  const router = useRouter()
  // BUG FIX #8: use ref to hold the supabase client instance stably
  const supabaseRef = useRef(createClient())

  // Real-time expansion (Zero Drift Protocol)
  const workflowSubRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null)
  const keywordSubRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null)
  const articleSubRef = useRef<ReturnType<typeof supabaseRef.current.channel> | null>(null)

  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  // BUG FIX #5: add error state
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [view, setView] = useState<"cards" | "table">("cards")
  // BUG FIX #6: range is passed to API (Single Authority)
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d")

  const fetchDashboard = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null)
      const res = await fetch(`/api/intent/workflows/dashboard?range=${range}`, { signal })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json: DashboardResponse = await res.json()
      setData(json)
      setLastSync(new Date())
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('[WorkflowDashboard] fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      if (!signal || !signal.aborted) setLoading(false)
    }
  }, [range])

  const { articles, isConnected } = useRealtimeArticles({
    orgId,
    onDashboardUpdate: () => fetchDashboard()
  })

  const onNavigate = useCallback((id: string, state: string) => {
    const base = state.replace(/_(running|failed|queued)$/, '')
    if (base === 'completed') {
      router.push(`/workflows/${id}/completed`)
      return
    }
    const stepNum = STATE_TO_STEP_NUM[base] ?? 1
    router.push(`/workflows/${id}/steps/${stepNum}`)
  }, [router])

  // BUG FIX #7 + #8: stable deps, cleanup before re-subscribe
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetchDashboard(controller.signal)

    // ─── Zero Drift: Expanded Real-time Subscriptions ───

    // 1. Workflows
    workflowSubRef.current?.unsubscribe()
    workflowSubRef.current = supabaseRef.current
      .channel(`intent_workflows_dashboard_wf_${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'intent_workflows', filter: `organization_id=eq.${orgId}` }, () => fetchDashboard())
      .subscribe()

    // 2. Keywords (count changes)
    keywordSubRef.current?.unsubscribe()
    keywordSubRef.current = supabaseRef.current
      .channel(`intent_workflows_dashboard_kw_${orgId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'keywords',
        filter: `organization_id=eq.${orgId}`
      }, () => fetchDashboard())
      .subscribe()

    // NOTE: Articles subscription is now handled by onDashboardUpdate in useRealtimeArticles

    return () => {
      controller.abort()
      workflowSubRef.current?.unsubscribe()
      keywordSubRef.current?.unsubscribe()
      articleSubRef.current?.unsubscribe()
    }
  }, [fetchDashboard, orgId])

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div style={{ padding: 24, background: T.lightGray, minHeight: "100%" }}>
        {/* KPI skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.neutral200}`, padding: "14px 16px", height: 90 }} />
          ))}
        </div>
        {/* Card skeletons */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "60vh", gap: 12,
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.error, fontFamily: "var(--font-poppins,'Poppins',sans-serif)" }}>
          Failed to load dashboard
        </div>
        <div style={{ fontSize: 12, color: T.neutral500, fontFamily: "var(--font-lato,'Lato',sans-serif)" }}>
          {error}
        </div>
        <button
          onClick={() => fetchDashboard()}
          style={{
            padding: "8px 20px", borderRadius: 6, background: T.gradient,
            color: T.white, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
            fontFamily: "var(--font-lato,'Lato',sans-serif)",
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  const workflows = data?.workflows ?? []

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 24, background: T.lightGray }} data-tour="workflow-dashboard">
      {/* BUG FIX #1: keyframes moved to globals.css (Zero Drift) */}

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
            fontFamily: "var(--font-poppins,'Poppins',sans-serif)", lineHeight: 1,
          }}>
            Content{" "}
            <span style={{ background: T.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Intelligence
            </span>
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* View toggle */}
          <div style={{
            display: "flex", background: T.white, borderRadius: 7,
            border: `1px solid ${T.neutral200}`, overflow: "hidden",
          }}>
            {(["cards", "table"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "5px 13px", border: "none",
                background: view === v ? T.gradient : "transparent",
                color: view === v ? T.white : T.neutral500,
                fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                fontFamily: "var(--font-lato,'Lato',sans-serif)",
              }}>
                {v === "cards" ? "⊞ Cards" : "≡ Table"}
              </button>
            ))}
          </div>
          {/* BUG FIX #6: range buttons now trigger a real re-fetch via useEffect → fetchDashboard dep */}
          {(["7d", "30d", "90d"] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: "5px 12px", borderRadius: 6,
              border: range === r ? `1px solid ${T.blue}` : `1px solid ${T.neutral200}`,
              background: range === r ? "rgba(33,124,235,0.08)" : T.white,
              color: range === r ? T.blue : T.neutral500,
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-lato,'Lato',sans-serif)",
            }}>{r}</button>
          ))}
          <button
            onClick={() => router.push('/workflows/new')}
            style={{
              padding: "5px 14px", borderRadius: 6, border: `1px solid ${T.blue}`,
              background: T.gradient, color: T.white, fontSize: 11, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(33,124,235,0.2)",
              fontFamily: "var(--font-lato,'Lato',sans-serif)",
            }}
          >+ New Workflow</button>
        </div>
      </div>

      {/* Stale data warning */}
      {error && data && (
        <div style={{
          padding: "8px 16px", marginBottom: 16, borderRadius: 8,
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, color: T.error, fontFamily: "var(--font-lato,'Lato',sans-serif)" }}>
            ⚠ Showing cached data — latest sync failed
          </span>
          <button onClick={() => fetchDashboard()} style={{
            fontSize: 11, color: T.error, background: "none", border: "none", cursor: "pointer",
            fontWeight: 700, fontFamily: "var(--font-lato,'Lato',sans-serif)",
          }}>Retry</button>
        </div>
      )}

      <KPIStrip workflows={workflows} articles={articles} summary={data?.summary} />
      <ActionRequired workflows={workflows} onNavigate={onNavigate} />

      {/* Main content */}
      {view === "cards" ? (
        <CardGrid workflows={workflows} articles={articles} onNavigate={onNavigate} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
          <WorkflowTable
            workflows={workflows}
            onNavigate={onNavigate}
            onNew={() => router.push('/workflows/new')}
          />
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
          { label: "Realtime", status: isConnected ? "Live" : "Polling", ok: isConnected },
          { label: "Last Sync", status: lastSync ? lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now", ok: !!lastSync },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: s.ok ? T.success : T.warning,
              boxShadow: s.ok ? "0 0 0 2px rgba(34,197,94,0.2)" : "0 0 0 2px rgba(245,158,11,0.2)",
            }} />
            <span style={{ fontSize: 10, color: T.charcoal, fontFamily: "var(--font-lato,'Lato',sans-serif)" }}>
              {s.label}
            </span>
            <span style={{ fontSize: 10, color: T.neutral500, fontFamily: "var(--font-lato,'Lato',sans-serif)" }}>
              · {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
