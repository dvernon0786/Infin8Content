import type { DashboardSummary } from "@/lib/services/intent-engine/workflow-dashboard-service"

interface ActiveServicesCardProps {
    summary: DashboardSummary
}

const ROWS = (summary: DashboardSummary) => [
    { icon: "🤖", bg: "#e6f0ff", label: "AutoBlogs",        count: 0 },
    { icon: "📊", bg: "#eafaf1", label: "SEO Reports",       count: 0 },
    { icon: "⚡", bg: "#fff8e6", label: "Workflows Active",  count: summary.in_progress_workflows },
    { icon: "🎯", bg: "#f3e6ff", label: "Site Optimizers",   count: 0 },
]

export function ActiveServicesCard({ summary }: ActiveServicesCardProps) {
    return (
        <div style={{
            background: "#fff",
            border: "1px solid #eaecf0",
            borderRadius: 12,
            padding: "18px 20px",
        }} data-tour="active-services">
            {/* Header */}
            <div style={{ marginBottom: 2 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a" }}>
                    <span style={{
                        display: "inline-block", width: 9, height: 9,
                        borderRadius: "50%", background: "#22c55e", marginRight: 5,
                    }} />
                    Active Services
                </div>
                <div style={{ fontSize: 12, color: "#9aa3b0", marginTop: 2, marginBottom: 14 }}>
                    Your automation at a glance
                </div>
            </div>

            {/* Rows */}
            {ROWS(summary).map((row) => (
                <div
                    key={row.label}
                    style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 0",
                        borderBottom: "1px solid #f3f4f6",
                        fontSize: 13, color: "#333",
                    }}
                >
                    <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: row.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, fontSize: 14,
                    }}>
                        {row.icon}
                    </div>
                    <span style={{ flex: 1 }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#c0c5cd" }}>{row.count}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </div>
            ))}
            {/* Remove border on last row via CSS-in-JS workaround — last child override */}
            <style>{`.active-svc-row:last-child { border-bottom: none !important; }`}</style>
        </div>
    )
}
