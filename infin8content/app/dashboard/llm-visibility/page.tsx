"use client"

/**
 * app/dashboard/llm-visibility/page.tsx
 *
 * Full LLM Brand Visibility Tracker dashboard.
 * Matches the Arvow UI: visibility score, sparkline, model rank table,
 * competitor SOV, per-prompt drill-down, and prompt management.
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts'
import {
  Plus, RefreshCw, ChevronRight, ExternalLink, Zap,
  TrendingUp, TrendingDown, Eye, MessageSquare, Globe,
  AlertCircle, CheckCircle2, Minus, BarChart2, Upload,
  Sparkles, X, ChevronDown,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

const MODEL_LABELS: Record<string, string> = {
  'gpt-4o-mini': 'ChatGPT',
  'sonar': 'Perplexity',
  'claude-3-5-haiku': 'Claude',
  'gemini-flash': 'Gemini',
}

const CATEGORY_COLORS: Record<string, string> = {
  informational: '#217CEB',
  commercial: '#4A42CC',
  competitor: '#F59E0B',
}

const CATEGORY_LABELS: Record<string, string> = {
  informational: 'Informational',
  commercial: 'Commercial',
  competitor: 'Competitor',
}

function sentimentIcon(s: string | null) {
  if (s === 'positive') return <CheckCircle2 size={13} className="text-green-500" />
  if (s === 'negative') return <AlertCircle size={13} className="text-red-500" />
  return <Minus size={13} className="text-neutral-400" />
}

function deltaChip(delta: number) {
  if (delta > 0) return (
    <span className="inline-flex items-center gap-0.5 text-green-600 text-xs font-semibold">
      <TrendingUp size={11} />+{delta.toFixed(1)}%
    </span>
  )
  if (delta < 0) return (
    <span className="inline-flex items-center gap-0.5 text-red-500 text-xs font-semibold">
      <TrendingDown size={11} />{delta.toFixed(1)}%
    </span>
  )
  return <span className="text-neutral-400 text-xs">—</span>
}

// ── Mock data (replace with real API calls) ───────────────────────────────────

const MOCK_SNAPSHOTS = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  return {
    snapshot_date: date.toISOString().slice(0, 10),
    visibility_score: 65 + Math.sin(i / 4) * 12 + Math.random() * 6,
  }
})

const MOCK_SNAPSHOT = {
  visibility_score: 78.53,
  total_mentions: 214,
  total_runs: 360,
  sentiment_positive: 142,
  sentiment_neutral: 58,
  sentiment_negative: 14,
  kpi_ai_search: 20,
  frequency_label: 'FREQUENT',
  total_volume: 2400000,
  per_model_stats: {
    'ChatGPT': { visibility: 98.91, mentions: 214 },
    'Gemini': { visibility: 95.91, mentions: 182 },
    'Claude': { visibility: 92.91, mentions: 82 },
    'Perplexity': { visibility: 89.91, mentions: 38 },
  },
  competitor_sov: {
    'AlphaWave': { score: 71.2, delta: -2.9 },
    'Biosynthesia': { score: 68.4, delta: -4.4 },
    'BuildingBlocks': { score: 58.8, delta: 8.7 },
    'Calescence': { score: 55.9, delta: 9.2 },
    'Cubekit': { score: 32.1, delta: -9.2 },
  },
}

const MOCK_PROMPTS = [
  { id: '1', prompt_text: 'best AI content writing tools for SEO', category: 'commercial', is_active: true, visibility_rate: 92, runs: [{ model: 'ChatGPT', mentioned: true, sentiment: 'positive' }, { model: 'Claude', mentioned: true, sentiment: 'neutral' }, { model: 'Perplexity', mentioned: false, sentiment: null }] },
  { id: '2', prompt_text: 'how to automate long-form blog generation', category: 'informational', is_active: true, visibility_rate: 78, runs: [] },
  { id: '3', prompt_text: 'AI writing tool alternatives comparison', category: 'competitor', is_active: true, visibility_rate: 61, runs: [] },
  { id: '4', prompt_text: 'content marketing automation platform', category: 'commercial', is_active: true, visibility_rate: 55, runs: [] },
  { id: '5', prompt_text: 'what is Infin8Content', category: 'informational', is_active: true, visibility_rate: 84, runs: [] },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, iconColor }: {
  label: string; value: string; sub?: string; icon: any; iconColor: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={15} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-neutral-900 font-poppins">{value}</div>
        {sub && <div className="text-xs text-neutral-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function ModelRankTable({ stats }: { stats: Record<string, { visibility: number; mentions: number }> }) {
  const rows = Object.entries(stats).sort((a, b) => b[1].visibility - a[1].visibility)
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-neutral-800">Rank by LLM</span>
        <span className="text-xs text-neutral-400">Today</span>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-3 text-xs text-neutral-400 uppercase tracking-widest pb-1 border-b border-neutral-50">
          <span>LLM</span><span className="text-right">Visibility</span><span className="text-right">Mentions</span>
        </div>
        {rows.map(([model, s], i) => (
          <div key={model} className="grid grid-cols-3 items-center py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-300 font-mono w-4">{i + 1}</span>
              <span className="text-sm font-medium text-neutral-700">{model}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-neutral-900">{s.visibility.toFixed(2)}%</span>
            </div>
            <div className="text-right">
              <span className="text-sm text-neutral-500">{s.mentions}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompetitorTable({ sov }: { sov: Record<string, { score: number; delta: number }> }) {
  const rows = Object.entries(sov).sort((a, b) => b[1].score - a[1].score)
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <div className="text-sm font-semibold text-neutral-800 mb-4">Brand Industry Ranking</div>
      <div className="space-y-2">
        {rows.map(([name, s]) => (
          <div key={name} className="flex items-center justify-between py-1.5 border-b border-neutral-50 last:border-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold">
                {name[0]}
              </div>
              <span className="text-sm text-neutral-700">{name}</span>
            </div>
            <div className="flex items-center gap-3">
              {deltaChip(s.delta)}
              <span className="text-sm text-neutral-400 w-12 text-right">{s.score.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SentimentBar({ pos, neu, neg }: { pos: number; neu: number; neg: number }) {
  const total = pos + neu + neg || 1
  const pPos = (pos / total) * 100
  const pNeu = (neu / total) * 100
  const pNeg = (neg / total) * 100
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <div className="text-sm font-semibold text-neutral-800 mb-4">Sentiment Breakdown</div>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-4">
        <div className="bg-green-400 rounded-l-full" style={{ width: `${pPos}%` }} />
        <div className="bg-neutral-200" style={{ width: `${pNeu}%` }} />
        <div className="bg-red-400 rounded-r-full" style={{ width: `${pNeg}%` }} />
      </div>
      <div className="flex justify-between text-xs text-neutral-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Positive ({pos})</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-200 inline-block" />Neutral ({neu})</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Negative ({neg})</span>
      </div>
    </div>
  )
}

function PromptRow({ prompt, onDrillDown }: { prompt: any; onDrillDown: (p: any) => void }) {
  const rate = prompt.visibility_rate ?? 0
  return (
    <div
      className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors group border border-transparent hover:border-neutral-100"
      onClick={() => onDrillDown(prompt)}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm text-neutral-800 truncate font-medium">{prompt.prompt_text}</div>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
            style={{
              background: CATEGORY_COLORS[prompt.category] + '18',
              color: CATEGORY_COLORS[prompt.category],
            }}
          >
            {CATEGORY_LABELS[prompt.category]}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-16 bg-neutral-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${rate}%`,
              background: 'linear-gradient(to right, #217CEB, #4A42CC)',
            }}
          />
        </div>
        <span className="text-xs font-semibold text-neutral-600 w-8 text-right">{rate}%</span>
        <ChevronRight size={14} className="text-neutral-300 group-hover:text-blue-500 transition-colors" />
      </div>
    </div>
  )
}

function DrillDownModal({ prompt, onClose }: { prompt: any; onClose: () => void }) {
  const mockRuns = [
    {
      model: 'ChatGPT', mentioned: true, sentiment: 'positive', position: 'list',
      raw_response: `Infin8Content is one of the top AI content platforms for teams who need high-quality, research-backed articles at scale. It stands out for its brand voice engine and SEO integration.\n\nOther tools worth considering: Jasper, Copy.ai, and Surfer SEO for optimization.`,
      cited_urls: ['https://infin8content.com', 'https://g2.com/products/infin8content'],
    },
    {
      model: 'Claude', mentioned: true, sentiment: 'neutral', position: 'paragraph',
      raw_response: `For content generation at scale, teams often use tools like Infin8Content, Jasper, or Copy.ai depending on their workflow needs. Each has different strengths around SEO and brand consistency.`,
      cited_urls: [],
    },
    {
      model: 'Perplexity', mentioned: false, sentiment: null, position: 'not_found',
      raw_response: `The best AI content tools in 2026 include Jasper AI, Copy.ai, Writesonic, and Surfer SEO. These platforms offer strong content generation with SEO optimization features built in.`,
      cited_urls: ['https://jasper.ai', 'https://copy.ai'],
    },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-neutral-900">{prompt.prompt_text}</div>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1 inline-block"
              style={{ background: CATEGORY_COLORS[prompt.category] + '18', color: CATEGORY_COLORS[prompt.category] }}
            >
              {CATEGORY_LABELS[prompt.category]}
            </span>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 shrink-0 mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Runs */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {mockRuns.map(run => (
            <div
              key={run.model}
              className={`rounded-xl border p-4 ${run.mentioned ? 'border-blue-100 bg-blue-50/40' : 'border-neutral-100 bg-neutral-50'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-800">{run.model}</span>
                  {run.mentioned ? (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Mentioned</span>
                  ) : (
                    <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-semibold">Not found</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {sentimentIcon(run.sentiment)}
                  {run.sentiment && <span className="text-xs text-neutral-500 capitalize">{run.sentiment}</span>}
                </div>
              </div>

              {/* Response text with brand highlighted */}
              <div className="text-xs text-neutral-600 leading-relaxed bg-white rounded-lg p-3 border border-neutral-100 font-mono whitespace-pre-wrap">
                {run.raw_response.split(/(Infin8Content)/gi).map((part, i) =>
                  part.toLowerCase() === 'infin8content'
                    ? <mark key={i} className="bg-yellow-100 text-yellow-800 rounded px-0.5 not-italic">{part}</mark>
                    : part
                )}
              </div>

              {/* Cited URLs */}
              {run.cited_urls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {run.cited_urls.map(url => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-500 flex items-center gap-0.5 hover:underline"
                    >
                      <ExternalLink size={9} />{new URL(url).hostname}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AddPromptModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: any) => void }) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<'informational' | 'commercial' | 'competitor'>('commercial')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-900">Add tracking prompt</span>
          <button onClick={onClose}><X size={18} className="text-neutral-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5 block">Prompt</label>
            <textarea
              className="w-full border border-neutral-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-blue-400"
              rows={3}
              placeholder="e.g. best AI content writing tools for SEO teams"
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1.5 block">Category</label>
            <div className="flex gap-2">
              {(['informational', 'commercial', 'competitor'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border transition-all"
                  style={category === cat
                    ? { background: CATEGORY_COLORS[cat] + '18', color: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] }
                    : { background: 'white', color: '#9CA3AF', borderColor: '#E5E7EB' }
                  }
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-600 font-semibold hover:bg-neutral-50">
            Cancel
          </button>
          <button
            onClick={() => { if (text.trim()) { onAdd({ promptText: text, category }); onClose() } }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(to right, #217CEB, #4A42CC)' }}
          >
            Add prompt
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function LlmVisibilityPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [drillPrompt, setDrillPrompt] = useState<any>(null)
  const [showAddPrompt, setShowAddPrompt] = useState(false)
  const [prompts, setPrompts] = useState(MOCK_PROMPTS)
  const snap = MOCK_SNAPSHOT
  const chartData = MOCK_SNAPSHOTS.map(s => ({
    date: s.snapshot_date.slice(5),
    score: Number(s.visibility_score.toFixed(1)),
  }))

  const handleRerun = async () => {
    setIsRunning(true)
    // POST /api/llm-visibility/projects/[id]/rerun
    await new Promise(r => setTimeout(r, 2000))
    setIsRunning(false)
  }

  const handleAddPrompt = (p: any) => {
    setPrompts(prev => [
      { id: String(Date.now()), prompt_text: p.promptText, category: p.category, is_active: true, visibility_rate: 0, runs: [] },
      ...prev,
    ])
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Drill-down modal */}
      {drillPrompt && <DrillDownModal prompt={drillPrompt} onClose={() => setDrillPrompt(null)} />}
      {showAddPrompt && <AddPromptModal onClose={() => setShowAddPrompt(false)} onAdd={handleAddPrompt} />}

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 font-poppins">AI Visibility Tracker</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Track how ChatGPT, Claude, Perplexity, and Gemini mention your brand
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRerun}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-all"
            >
              <RefreshCw size={14} className={isRunning ? 'animate-spin' : ''} />
              {isRunning ? 'Running…' : 'Re-run now'}
            </button>
            <button
              onClick={() => setShowAddPrompt(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(to right, #217CEB, #4A42CC)' }}
            >
              <Plus size={14} />Add prompt
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* LEFT — Visibility score + chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-100 p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-1">Visibility Score</div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-neutral-900 font-poppins">{snap.visibility_score.toFixed(2)}%</span>
                  <span className="text-sm text-green-500 flex items-center gap-1 font-semibold">
                    <TrendingUp size={13} />13.4 vs last week
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                {['7d', '30d', '90d'].map(r => (
                  <button key={r} className="text-xs px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 font-medium">
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Sparkline */}
            <div className="h-36 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#217CEB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#217CEB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: 'white', border: '0.5px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'Visibility']}
                  />
                  <Area type="monotone" dataKey="score" stroke="#217CEB" strokeWidth={2} fill="url(#visGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-neutral-50">
              <div>
                <div className="text-xs text-neutral-400 mb-0.5">Total Volume</div>
                <div className="text-lg font-bold text-neutral-800 font-poppins">
                  {(snap.total_volume / 1000000).toFixed(1)}m
                </div>
                <div className="w-full bg-neutral-100 h-1 rounded-full mt-1">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-400 mb-0.5">Frequency</div>
                <div className="text-sm font-bold text-neutral-800 mt-1">
                  <span
                    className="px-2 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      background: snap.frequency_label === 'FREQUENT' ? '#D1FAE5' : '#FEF3C7',
                      color: snap.frequency_label === 'FREQUENT' ? '#065F46' : '#92400E',
                    }}
                  >
                    {snap.frequency_label}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-400 mb-0.5">KPI AI Search</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="12" fill="none" stroke="#F3F4F6" strokeWidth="4" />
                      <circle
                        cx="16" cy="16" r="12" fill="none" stroke="#EF4444" strokeWidth="4"
                        strokeDasharray={`${(snap.kpi_ai_search / 100) * 75.4} 75.4`}
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-neutral-800">{snap.kpi_ai_search}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Model rank */}
          <ModelRankTable stats={snap.per_model_stats} />
        </div>

        {/* Second row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <SentimentBar
            pos={snap.sentiment_positive}
            neu={snap.sentiment_neutral}
            neg={snap.sentiment_negative}
          />
          <div className="lg:col-span-2">
            <CompetitorTable sov={snap.competitor_sov} />
          </div>
        </div>

        {/* Prompt management */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-sm font-semibold text-neutral-900">Tracked Prompts</div>
              <div className="text-xs text-neutral-400 mt-0.5">{prompts.length} active prompts · Click any to see AI responses</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-medium">
                <Upload size={12} />Bulk import
              </button>
              <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-medium">
                <Sparkles size={12} />Auto-suggest
              </button>
              <button
                onClick={() => setShowAddPrompt(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-white font-medium"
                style={{ background: 'linear-gradient(to right, #217CEB, #4A42CC)' }}
              >
                <Plus size={12} />Add prompt
              </button>
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 mb-4">
            {['all', 'informational', 'commercial', 'competitor'].map(cat => (
              <button
                key={cat}
                className="text-xs px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-500 hover:bg-neutral-50 font-medium capitalize"
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            {prompts.map(prompt => (
              <PromptRow key={prompt.id} prompt={prompt} onDrillDown={setDrillPrompt} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
