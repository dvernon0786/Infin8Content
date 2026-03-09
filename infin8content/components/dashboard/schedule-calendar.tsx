'use client'

/**
 * ScheduleCalendar
 *
 * A monthly calendar showing which days have articles scheduled for
 * generation, and which days have publish reminders set.
 *
 * Features:
 *   - Month navigation (prev / next)
 *   - Per-day dots: blue = scheduled for generation, green = publish reminder
 *   - Quota badge: "4 / 10 scheduled this month"
 *   - Click a future day → opens inline Schedule Panel
 *   - Schedule Panel: pick a draft article + optional publish-reminder date
 *   - After scheduling, refreshes article list
 *
 * File: components/dashboard/schedule-calendar.tsx
 *
 * Usage (in ArticlesClient or a dedicated /dashboard/schedule page):
 *
 *   <ScheduleGuard plan={plan}>
 *     <ScheduleCalendar
 *       orgId={orgId}
 *       plan={plan}
 *       articles={articles}
 *       onScheduled={refresh}
 *     />
 *   </ScheduleGuard>
 */

import { useState, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X, CalendarClock, Loader2 } from 'lucide-react'
import { PLAN_LIMITS, type PlanType } from '@/lib/config/plan-limits'
import type { DashboardArticle } from '@/lib/types/dashboard.types'

// ── Types ────────────────────────────────────────────────────────────────────

interface ScheduleCalendarProps {
    orgId: string
    plan: PlanType | string
    /** Full article list from useRealtimeArticles / dashboard hook */
    articles: DashboardArticle[]
    /** Called after a successful schedule so the parent can refresh */
    onScheduled?: () => void
}

interface DayInfo {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    isPast: boolean
    scheduledArticles: DashboardArticle[]
    publishReminderArticles: DashboardArticle[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(d: Date): string {
    return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function buildCalendarGrid(year: number, month: number): Date[] {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay() // 0=Sun

    const days: Date[] = []
    // Pad with days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
        days.push(new Date(year, month, -i))
    }
    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push(new Date(year, month, d))
    }
    // Pad to complete last week
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
        for (let d = 1; d <= remaining; d++) {
            days.push(new Date(year, month + 1, d))
        }
    }
    return days
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Quota Badge ──────────────────────────────────────────────────────────────

function QuotaBadge({ used, limit }: { used: number; limit: number | null }) {
    if (limit === null) {
        return (
            <span className="text-[11px] font-lato font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Unlimited
            </span>
        )
    }
    const pct = Math.min(100, Math.round((used / limit) * 100))
    const danger = pct >= 90
    return (
        <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${danger ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className={`text-[11px] font-lato font-bold ${danger ? 'text-amber-600' : 'text-neutral-500'}`}>
                {used} / {limit} this month
            </span>
        </div>
    )
}

// ── Schedule Panel (inline modal) ────────────────────────────────────────────

interface SchedulePanelProps {
    selectedDate: Date
    draftArticles: DashboardArticle[]
    onClose: () => void
    onSuccess: () => void
}

function SchedulePanel({ selectedDate, draftArticles, onClose, onSuccess }: SchedulePanelProps) {
    const [selectedArticleId, setSelectedArticleId] = useState('')
    const [publishAt, setPublishAt] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const minPublishDate = toDateKey(selectedDate)

    async function handleSchedule() {
        if (!selectedArticleId) {
            setError('Please select an article to schedule.')
            return
        }
        setError(null)
        setLoading(true)

        // Set scheduled_at to midnight UTC on the selected day
        const scheduledAt = new Date(selectedDate)
        scheduledAt.setUTCHours(0, 0, 0, 0)

        try {
            const res = await fetch(`/api/articles/${selectedArticleId}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scheduled_at: scheduledAt.toISOString(),
                    ...(publishAt ? { publish_at: new Date(publishAt + 'T09:00:00Z').toISOString() } : {}),
                }),
            })

            const json = await res.json()

            if (!json.success) {
                setError(json.error || 'Failed to schedule article.')
                return
            }

            onSuccess()
            onClose()
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-white border-t border-neutral-200 rounded-b-xl shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-poppins font-bold text-neutral-900 text-[15px]">
                        Schedule for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <p className="font-lato text-neutral-500 text-xs mt-0.5">
                        Generation will trigger at midnight UTC on this date.
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors text-neutral-400"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-4">
                {/* Article selector */}
                <div>
                    <label className="block text-xs font-bold font-lato text-neutral-700 uppercase tracking-wider mb-1.5">
                        Article to Schedule
                    </label>
                    {draftArticles.length === 0 ? (
                        <p className="text-sm font-lato text-neutral-400 italic">
                            No draft articles available. Create an article first, then schedule it.
                        </p>
                    ) : (
                        <select
                            value={selectedArticleId}
                            onChange={e => setSelectedArticleId(e.target.value)}
                            className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm font-lato text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">— Select an article —</option>
                            {draftArticles.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.title}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Optional publish reminder */}
                <div>
                    <label className="block text-xs font-bold font-lato text-neutral-700 uppercase tracking-wider mb-1.5">
                        Publish Reminder Date
                        <span className="ml-1.5 text-neutral-400 font-normal normal-case tracking-normal">(optional)</span>
                    </label>
                    <input
                        type="date"
                        value={publishAt}
                        min={minPublishDate}
                        onChange={e => setPublishAt(e.target.value)}
                        className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm font-lato text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-neutral-400 font-lato mt-1">
                        We'll email you on this date to remind you to publish the draft.
                    </p>
                </div>

                {error && (
                    <div className="text-sm text-red-600 font-lato bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSchedule}
                    disabled={loading || draftArticles.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-200 text-white disabled:text-neutral-400 font-bold font-lato text-sm py-2.5 rounded-lg transition-colors"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                    {loading ? 'Scheduling…' : 'Schedule Article'}
                </button>
            </div>
        </div>
    )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ScheduleCalendar({ orgId: _orgId, plan, articles, onScheduled }: ScheduleCalendarProps) {
    const today = new Date()
    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    // Draft articles eligible for scheduling
    const draftArticles = useMemo(
        () => articles.filter(a => a.status === 'draft'),
        [articles]
    )

    // Calculate monthly scheduled count for quota badge
    const monthlyScheduledCount = useMemo(() => {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        return articles.filter(a => {
            const sa = (a as any).scheduled_at
            if (!sa) return false
            return (
                new Date(sa) >= startOfMonth &&
                ['queued', 'processing', 'completed'].includes(a.status)
            )
        }).length
    }, [articles, today])

    const scheduleLimit = PLAN_LIMITS.schedule_per_month[plan as PlanType] ?? null

    // Build index: dateKey → articles
    const scheduledByDay = useMemo(() => {
        const map = new Map<string, DashboardArticle[]>()
        for (const a of articles) {
            const sa = (a as any).scheduled_at
            if (sa) {
                const key = toDateKey(new Date(sa))
                if (!map.has(key)) map.set(key, [])
                map.get(key)!.push(a)
            }
        }
        return map
    }, [articles])

    const publishByDay = useMemo(() => {
        const map = new Map<string, DashboardArticle[]>()
        for (const a of articles) {
            const pa = (a as any).publish_at
            if (pa) {
                const key = toDateKey(new Date(pa))
                if (!map.has(key)) map.set(key, [])
                map.get(key)!.push(a)
            }
        }
        return map
    }, [articles])

    // Build full grid
    const gridDays: DayInfo[] = useMemo(() => {
        const rawDays = buildCalendarGrid(viewYear, viewMonth)
        const todayKey = toDateKey(today)
        return rawDays.map(date => ({
            date,
            isCurrentMonth: date.getMonth() === viewMonth,
            isToday: toDateKey(date) === todayKey,
            isPast: date < new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            scheduledArticles: scheduledByDay.get(toDateKey(date)) ?? [],
            publishReminderArticles: publishByDay.get(toDateKey(date)) ?? [],
        }))
    }, [viewYear, viewMonth, scheduledByDay, publishByDay, today])

    const goToPrevMonth = useCallback(() => {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
        else setViewMonth(m => m - 1)
        setSelectedDate(null)
    }, [viewMonth])

    const goToNextMonth = useCallback(() => {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
        else setViewMonth(m => m + 1)
        setSelectedDate(null)
    }, [viewMonth])

    function handleDayClick(day: DayInfo) {
        if (day.isPast || !day.isCurrentMonth) return
        setSelectedDate(prev =>
            prev && toDateKey(prev) === toDateKey(day.date) ? null : day.date
        )
    }

    const quotaExhausted = scheduleLimit !== null && monthlyScheduledCount >= scheduleLimit

    return (
        <div className="relative bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
                <div>
                    <h2 className="font-poppins font-bold text-neutral-900 text-[15px]">
                        Article Schedule
                    </h2>
                    <div className="mt-1">
                        <QuotaBadge used={monthlyScheduledCount} limit={scheduleLimit} />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevMonth}
                        className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors text-neutral-500"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-poppins font-bold text-neutral-900 text-sm w-36 text-center">
                        {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                    <button
                        onClick={goToNextMonth}
                        className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors text-neutral-500"
                        aria-label="Next month"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── Quota exhausted banner ─────────────────────────────────────────── */}
            {quotaExhausted && (
                <div className="px-5 py-2 bg-amber-50 border-b border-amber-200 text-[12px] font-lato text-amber-700 font-semibold">
                    ⚠ Monthly scheduling quota reached. New articles can be scheduled from the 1st of next month.
                </div>
            )}

            {/* ── Day-of-week labels ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-7 border-b border-neutral-100">
                {DAY_LABELS.map(d => (
                    <div key={d} className="text-center py-2 text-[10px] font-lato font-bold text-neutral-400 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>

            {/* ── Calendar grid ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-7">
                {gridDays.map((day, i) => {
                    const key = toDateKey(day.date)
                    const isSelected = selectedDate && toDateKey(selectedDate) === key
                    const isClickable = day.isCurrentMonth && !day.isPast && !quotaExhausted

                    return (
                        <button
                            key={i}
                            onClick={() => handleDayClick(day)}
                            disabled={!isClickable}
                            className={[
                                'relative flex flex-col items-center min-h-[56px] p-1.5 border-b border-r border-neutral-100 transition-colors text-left',
                                !day.isCurrentMonth ? 'opacity-30' : '',
                                day.isPast ? 'cursor-default' : '',
                                isSelected ? 'bg-blue-50' : isClickable ? 'hover:bg-neutral-50 cursor-pointer' : 'cursor-default',
                                day.isToday ? 'font-bold' : '',
                            ].join(' ')}
                            aria-label={`${day.date.toDateString()}${day.scheduledArticles.length ? ` — ${day.scheduledArticles.length} scheduled` : ''}`}
                        >
                            {/* Date number */}
                            <span className={[
                                'text-[12px] font-lato w-6 h-6 flex items-center justify-center rounded-full',
                                day.isToday
                                    ? 'bg-blue-600 text-white font-extrabold'
                                    : isSelected
                                        ? 'text-blue-700 font-bold'
                                        : 'text-neutral-700',
                            ].join(' ')}>
                                {day.date.getDate()}
                            </span>

                            {/* Dots */}
                            <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                                {day.scheduledArticles.slice(0, 3).map((_, di) => (
                                    <span key={`s${di}`} className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Scheduled for generation" />
                                ))}
                                {day.publishReminderArticles.slice(0, 3).map((_, di) => (
                                    <span key={`p${di}`} className="w-1.5 h-1.5 rounded-full bg-green-500" title="Publish reminder" />
                                ))}
                            </div>

                            {/* Overflow count */}
                            {day.scheduledArticles.length > 3 && (
                                <span className="text-[9px] text-neutral-400 font-lato">
                                    +{day.scheduledArticles.length - 3}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* ── Legend ─────────────────────────────────────────────────────────── */}
            <div className="px-5 py-3 border-t border-neutral-100 flex items-center gap-5">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    <span className="text-[11px] font-lato text-neutral-500">Generation scheduled</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    <span className="text-[11px] font-lato text-neutral-500">Publish reminder</span>
                </div>
                <div className="ml-auto text-[11px] font-lato text-neutral-400">
                    Click a future date to schedule
                </div>
            </div>

            {/* ── Schedule Panel ─────────────────────────────────────────────────── */}
            {selectedDate && (
                <SchedulePanel
                    selectedDate={selectedDate}
                    draftArticles={draftArticles}
                    onClose={() => setSelectedDate(null)}
                    onSuccess={() => {
                        setSelectedDate(null)
                        onScheduled?.()
                    }}
                />
            )}
        </div>
    )
}
