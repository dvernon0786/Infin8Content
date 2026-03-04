'use client';

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArticleStatusList } from '@/components/dashboard/article-status-list'
import { SearchInput } from '@/components/dashboard/search-input'
import { FilterDropdown } from '@/components/dashboard/filter-dropdown'
import { SortDropdown } from '@/components/dashboard/sort-dropdown'
import { ActiveFilters } from '@/components/dashboard/active-filters'
import { ScrollableArticleList } from '@/components/dashboard/scrollable-article-list'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { useRealtimeArticles } from '@/hooks/use-realtime-articles'
import { Loader2, FileText, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ARTICLE_STATUSES, type DashboardArticle } from '@/lib/types/dashboard.types'

// ─── Brand Tokens ─────────────────────────────────────────────────────────────
const T = {
  blue: "#217CEB",
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
  gradient: "linear-gradient(90deg, #217CEB 0%, #4A42CC 100%)",
  info: "#0EA5E9",
}

// ─── Metrics ──────────────────────────────────────────────────────────────────
function MetricCard({ label, value, alert, icon }: { label: string; value: string | number; alert?: boolean; icon?: string }) {
  return (
    <div style={{
      background: T.white,
      borderRadius: 10,
      border: `1px solid ${alert ? "rgba(245,158,11,0.3)" : T.neutral200}`,
      padding: "14px 16px",
      position: "relative", overflow: "hidden",
      boxShadow: alert ? "0 4px 12px rgba(245,158,11,0.1)" : "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: alert ? "linear-gradient(90deg, #F59E0B, #EF4444)" : T.gradient,
        opacity: alert ? 1 : 0.6,
      }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <span style={{
            fontSize: 10, color: T.neutral500, textTransform: "uppercase",
            letterSpacing: "0.08em", fontWeight: 700,
            fontFamily: "var(--font-lato,'Lato',sans-serif)",
          }}>{label}</span>
          {icon && <span style={{ fontSize: 13, color: alert ? T.warning : T.neutral200 }}>{icon}</span>}
        </div>
        <div style={{
          fontSize: 26, fontWeight: 800, lineHeight: 1, marginBottom: 5,
          fontFamily: "var(--font-poppins,'Poppins',sans-serif)",
          ...(alert ? { color: T.warning } : { color: T.charcoal })
        }}>{value}</div>
      </div>
    </div>
  )
}

function ArticlesKPI({ articles }: { articles: DashboardArticle[] }) {
  const total = articles.length
  const completed = articles.filter(a => a.status === 'completed').length
  const generating = articles.filter(a => (a.status as string) === 'generating' || (a.status as string).endsWith('_running')).length
  const failed = articles.filter(a => (a.status as string) === 'failed' || (a.status as string).endsWith('_failed')).length

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
      <MetricCard label="Total Articles" value={total} icon="▤" />
      <MetricCard label="Completed" value={completed} icon="✓" />
      <MetricCard label="Generating" value={generating} icon="◈" alert={generating > 0} />
      <MetricCard label="Failed" value={failed} icon="⚠" alert={failed > 0} />
      <MetricCard label="Completion Rate" value={`${completionRate}%`} icon="◉" />
    </div>
  )
}
function ArticlesClient({ orgId }: { orgId: string }) {
  const router = useRouter();

  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null);

  const { articles, isConnected, error, lastUpdated, refresh } = useRealtimeArticles({
    orgId,
    onDashboardUpdate: (event) => {
      setRecentlyUpdatedId(event.articleId);
      // Clear highlight after 3 seconds
      setTimeout(() => setRecentlyUpdatedId(null), 3000);
    }
  })

  const {
    search,
    filters,
    filteredArticles,
    activeFilters,
    metrics,
    setSearchQuery,
    setFilters,
    clearSearch,
    clearFilters,
    clearAll,
    removeFilter,
    hasActiveFilters,
  } = useDashboardFilters(articles);

  const blockedArticles = articles.filter(a => (a.status as string) === 'failed' || (a.status as string).endsWith('_failed'))

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="font-poppins text-neutral-900 text-h3-desktop mb-2">
              Unable to load articles
            </h3>
            <p className="font-lato text-neutral-600">
              {error.message || 'Unable to load articles. Please try refreshing the page.'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected && articles.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-neutral-600" />
            <p className="font-lato text-neutral-600 text-small">
              Loading articles…
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      <ArticlesKPI articles={articles} />

      {/* Action Banner */}
      {blockedArticles.length > 0 && (
        <div style={{
          padding: "12px 16px", background: "rgba(239,68,68,0.04)",
          border: `1px solid rgba(239,68,68,0.15)`, borderRadius: 8,
          marginBottom: 24, display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: T.error,
            animation: "i8c-pulse 2s infinite"
          }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.error }}>
            {blockedArticles.length} Article{blockedArticles.length > 1 ? 's' : ''} Failed — Action Required
          </span>
          <button
            onClick={() => setFilters({ ...filters, status: ['failed'] })}
            style={{
              marginLeft: "auto", padding: "6px 14px", borderRadius: 6,
              background: T.error, color: T.white, border: "none",
              fontSize: 11, fontWeight: 800, cursor: "pointer"
            }}
          >Review Failures →</button>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex items-center gap-3 p-2 px-3 border rounded-lg bg-white mb-6">
        <div className="flex-1">
          <SearchInput
            value={search.query}
            onChange={setSearchQuery}
            onClear={clearSearch}
            placeholder="Search articles..."
            className="border-none bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="h-6 w-px bg-neutral-200" />
        <FilterDropdown
          value={filters}
          onChange={setFilters}
          availableStatuses={ARTICLE_STATUSES}
        />
        <SortDropdown
          value={filters.sortBy}
          onChange={(sortBy) => setFilters({ ...filters, sortBy })}
        />
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="mb-4">
          <ActiveFilters
            filters={filters}
            search={search}
            onClearFilter={removeFilter}
            onClearAll={clearAll}
          />
        </div>
      )}

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-3">
        <div className="font-lato text-neutral-600 text-xs font-semibold uppercase tracking-wider">
          Showing {filteredArticles.length} of {articles.length} Articles
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="font-lato text-neutral-400 text-[10px] uppercase tracking-widest font-bold">
            PFM: {metrics.filterTime?.toFixed(1)}ms
          </div>
        )}
      </div>

      {/* Articles List */}
      <div className="flex-1 bg-white border rounded-xl overflow-hidden shadow-sm" style={{ minHeight: "50vh" }}>
        {filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <FileText className="h-12 w-12 text-neutral-300 mb-4" />
            <h3 className="font-poppins text-neutral-900 font-semibold mb-1">No articles found</h3>
            <p className="font-lato text-neutral-500 text-sm max-w-[200px]">
              {articles.length > 0 ? "Try adjusting your filters" : "Start by generating your first article"}
            </p>
          </div>
        ) : (
          <ScrollableArticleList
            articles={filteredArticles}
            className="h-full border-none rounded-none"
            selectedArticle={null}
            highlightArticleId={recentlyUpdatedId}
            onArticleSelect={(id) => id && router.push(`/dashboard/articles/${id}`)}
            onArticleNavigation={(id) => router.push(`/dashboard/articles/${id}`)}
            onKeyDown={(id, e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                router.push(`/dashboard/articles/${id}`)
              }
            }}
            onTouchStart={() => { }}
            onTouchMove={() => { }}
            onTouchEnd={(id) => {
              router.push(`/dashboard/articles/${id}`)
            }}
          />
        )}
      </div>

      {/* System Status Footer */}
      <div style={{
        marginTop: 24, padding: "16px 0", borderTop: `1px solid ${T.neutral200}`,
        display: "flex", gap: 18
      }}>
        {[
          { label: "Realtime", status: isConnected ? "Live" : "Polling", ok: isConnected },
          { label: "Last Sync", status: lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Never", ok: true },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: s.ok ? T.success : T.warning,
              boxShadow: s.ok ? "0 0 0 2px rgba(34,197,94,0.2)" : "0 0 0 2px rgba(245,158,11,0.2)",
            }} />
            <span style={{ fontSize: 10, color: T.charcoal, fontFamily: "var(--font-lato,'Lato',sans-serif)", fontWeight: 700 }}>{s.label}</span>
            <span style={{ fontSize: 10, color: T.neutral500, fontFamily: "var(--font-lato,'Lato',sans-serif)" }}>· {s.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ArticlesClient;
