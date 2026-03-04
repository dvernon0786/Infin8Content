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

// ─── Metrics ──────────────────────────────────────────────────────────────────
function MetricCard({ label, value, alert, icon }: { label: string; value: string | number; alert?: boolean; icon?: string }) {
  return (
    <div className={`bg-white rounded-[10px] border px-3.5 py-2.5 relative overflow-hidden ${alert ? 'border-amber-500/30 shadow-[0_4px_12px_rgba(245,158,11,0.1)]' : 'border-neutral-200 shadow-sm'}`}>
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${alert ? 'bg-gradient-to-r from-amber-500 to-red-500 opacity-100' : 'bg-gradient-brand opacity-60'}`} />
      <div className="relative">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold font-lato">
            {label}
          </span>
          {icon && <span className={`text-[13px] ${alert ? 'text-amber-500' : 'text-neutral-200'}`}>{icon}</span>}
        </div>
        <div className={`text-[22px] font-extrabold leading-none mb-1 font-poppins ${alert ? 'text-amber-500' : 'text-neutral-800'}`}>
          {value}
        </div>
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
    <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 mb-6">
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
        <div className="px-4 py-3 bg-red-500/5 border border-red-500/15 rounded-lg mb-6 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-[i8c-pulse_2s_infinite]" />
          <span className="text-[13px] font-bold text-red-500">
            {blockedArticles.length} Article{blockedArticles.length > 1 ? 's' : ''} Failed — Action Required
          </span>
          <button
            onClick={() => {
              clearSearch()
              setFilters({ status: ['failed'], sortBy: filters.sortBy })
            }}
            className="ml-auto px-3.5 py-1.5 rounded-md bg-red-500 text-white border-none text-[11px] font-extrabold cursor-pointer"
          >Review Failures →</button>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex items-center gap-4 px-4 py-2 border border-neutral-200 bg-white rounded-md shadow-sm mb-4">
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
      <div className="flex justify-between items-center mb-4 px-1">
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
      <div className="flex-1 min-h-[50vh]">
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
            className="h-full"
            highlightArticleId={recentlyUpdatedId}
            onArticleNavigation={(id, e) => {
              if (e) e.preventDefault()
              router.push(`/dashboard/articles/${id}`)
            }}
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
      <div className="mt-4 py-4 border-t border-neutral-200 flex items-center gap-[18px]">
        {[
          { label: "Realtime", status: isConnected ? "Live" : "Polling", ok: isConnected },
          { label: "Last Sync", status: lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "Never", ok: true },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className={`w-1 h-1 rounded-full ${s.ok ? 'bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)]' : 'bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]'}`} />
            <span className="text-[10px] text-neutral-800 font-lato font-bold">{s.label}</span>
            <span className="text-[10px] text-neutral-500 font-lato">· {s.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ArticlesClient;
