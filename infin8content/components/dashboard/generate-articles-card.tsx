"use client"

import Link from "next/link"

const CARDS = [
    {
        id: "seo",
        bg: "#e6f0ff",
        accent: "#0066FF",
        emoji: "🔍",
        label: "SEO Article",
        desc: "Optimized for search",
        href: "/dashboard/articles/generate?type=seo",
    },
    {
        id: "news",
        bg: "#eafaf1",
        accent: "#22c55e",
        emoji: "📰",
        label: "News Article",
        desc: "Real-world events",
        href: "/dashboard/articles/generate?type=news",
    },
    {
        id: "youtube",
        bg: "#fff0e6",
        accent: "#f97316",
        emoji: "▶",
        label: "YouTube",
        desc: "Video to blog post",
        href: "/dashboard/articles/generate?type=youtube",
    },
]

function ArticleThumb({ bg, accent }: { bg: string; accent: string }) {
    return (
        <div style={{
            height: 72, background: bg,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 10,
        }}>
            <svg width="38" height="38" viewBox="0 0 48 48" fill="none">
                <rect x="6" y="8" width="26" height="4" rx="2" fill={accent} opacity=".35"/>
                <rect x="6" y="16" width="18" height="3" rx="1.5" fill={accent} opacity=".25"/>
                <rect x="6" y="23" width="22" height="3" rx="1.5" fill={accent} opacity=".25"/>
                <rect x="32" y="14" width="10" height="10" rx="2" fill={accent} opacity=".45"/>
            </svg>
        </div>
    )
}

export function GenerateArticlesCard() {
    return (
        <div style={{
            background: "#fff",
            border: "1px solid #eaecf0",
            borderRadius: 12,
            padding: "18px 20px",
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a" }}>Generate Articles</div>
                    <div style={{ fontSize: 12, color: "#9aa3b0", marginTop: 2 }}>Create new content for your sites</div>
                </div>
                <Link
                    href="/dashboard/articles"
                    style={{ fontSize: 12, color: "#0066FF", fontWeight: 600, whiteSpace: "nowrap", textDecoration: "none", marginTop: 2 }}
                >
                    View all →
                </Link>
            </div>

            {/* 3-column grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {CARDS.map((card) => (
                    <Link
                        key={card.id}
                        href={card.href}
                        style={{ textDecoration: "none", display: "block" }}
                    >
                        <div
                            style={{
                                borderRadius: 9, overflow: "hidden",
                                border: "1px solid #eaecf0",
                                cursor: "pointer",
                                transition: "box-shadow 0.15s, transform 0.15s",
                            }}
                            onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLElement
                                el.style.boxShadow = "0 3px 14px rgba(0,102,255,.12)"
                                el.style.transform = "translateY(-1px)"
                            }}
                            onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLElement
                                el.style.boxShadow = "none"
                                el.style.transform = "translateY(0)"
                            }}
                        >
                            <ArticleThumb bg={card.bg} accent={card.accent} />
                            <div style={{ padding: "8px 10px 10px", background: "#fff" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#0a0a0a" }}>
                                    <span style={{ fontSize: 13 }}>{card.emoji}</span>
                                    {card.label}
                                </div>
                                <div style={{ fontSize: 11, color: "#9aa3b0", marginTop: 1 }}>{card.desc}</div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
