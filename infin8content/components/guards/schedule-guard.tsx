'use client'

/**
 * ScheduleGuard
 *
 * Wraps the ScheduleCalendar. Trial plan users see an upgrade prompt
 * instead of the calendar. All other plans pass through.
 *
 * File: components/guards/schedule-guard.tsx
 *
 * Usage:
 *   <ScheduleGuard plan={currentUser.plan}>
 *     <ScheduleCalendar ... />
 *   </ScheduleGuard>
 */

import { type PlanType } from '@/lib/config/plan-limits'
import Link from 'next/link'

interface ScheduleGuardProps {
    plan: PlanType | string
    children: React.ReactNode
}

export function ScheduleGuard({ plan, children }: ScheduleGuardProps) {
    const isTrial = plan === 'trial'

    if (!isTrial) return <>{children}</>

    return (
        <div className="relative rounded-xl border border-neutral-200 overflow-hidden">
            {/* Blurred preview of calendar behind the gate */}
            <div className="opacity-30 pointer-events-none select-none blur-sm" aria-hidden>
                <div className="h-64 bg-neutral-50 grid grid-cols-7 gap-px p-4">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div key={i} className="rounded bg-white border border-neutral-100 h-8" />
                    ))}
                </div>
            </div>

            {/* Gate overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] px-6 text-center">
                <div className="mb-3 text-3xl">📅</div>
                <h3 className="font-poppins font-bold text-neutral-900 text-lg mb-1">
                    Article Scheduling
                </h3>
                <p className="font-lato text-neutral-600 text-sm max-w-[280px] mb-5">
                    Schedule articles for automatic background generation, then get notified
                    when your draft is ready to publish. Available on Starter and above.
                </p>
                <Link
                    href="/payment"
                    className="inline-block bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                    Upgrade to Starter →
                </Link>
                <p className="mt-3 text-[11px] text-neutral-400 font-lato">
                    10 scheduled articles/month on Starter · 50 on Pro · Unlimited on Agency
                </p>
            </div>
        </div>
    )
}
