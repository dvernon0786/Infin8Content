"use client"

import { useMemo } from "react"
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts"
import type { DashboardArticle } from "@/lib/types/dashboard.types"

interface ContentActivityChartProps {
    articles: DashboardArticle[]
}

function toYMD(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null
    return new Date(dateStr).toISOString().slice(0, 10)
}

function buildWindow(): string[] {
    const days: string[] = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        days.push(d.toISOString().slice(0, 10))
    }
    return days
}

function formatLabel(ymd: string): string {
    const d = new Date(ymd + "T00:00:00")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function ContentActivityChart({ articles }: ContentActivityChartProps) {
    const data = useMemo(() => {
        const window = buildWindow()

        // Count by day
        const generated: Record<string, number> = {}
        const published: Record<string, number> = {}

        for (const ymd of window) {
            generated[ymd] = 0
            published[ymd] = 0
        }

        for (const article of articles) {
            const genDay = toYMD(article.created_at)
            if (genDay && genDay in generated) {
                generated[genDay]++
            }
            // Treat articles with a `publish_at` timestamp as published for dashboard metrics
            if (article.publish_at) {
                const pubDay = toYMD(article.publish_at ?? null)
                if (pubDay && pubDay in published) {
                    published[pubDay]++
                }
            }
        }

        return window.map((ymd) => ({
            date: formatLabel(ymd),
            generated: generated[ymd],
            published: published[ymd],
        }))
    }, [articles])

    return (
        <div style={{
            background: "#fff",
            border: "1px solid #eaecf0",
            borderRadius: 12,
            padding: "18px 20px",
        }}>
            {/* Card header with legend */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a" }}>Content Activity</div>
                    <div style={{ fontSize: 12, color: "#9aa3b0", marginTop: 2 }}>Your publishing trends over time</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: "#9aa3b0" }}>
                    <span>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#0066FF", marginRight: 4 }} />
                        Generated
                    </span>
                    <span>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#22c55e", marginRight: 4 }} />
                        Published
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div style={{ height: 160, marginTop: 10 }}>
                <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={data} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke="#f0f2f5" vertical={false} />
                        <XAxis
                            dataKey="date"
                            interval={2}
                            tick={{ fill: "#b0b8c6", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fill: "#b0b8c6", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="generated"
                            stroke="#0066FF"
                            strokeWidth={1.5}
                            dot={false}
                            activeDot={{ r: 3 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="published"
                            stroke="#22c55e"
                            strokeWidth={1.5}
                            dot={false}
                            activeDot={{ r: 3 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
