'use client';

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { SearchInput } from '@/components/dashboard/search-input'
import { FilterDropdown } from '@/components/dashboard/filter-dropdown'
import { SortDropdown } from '@/components/dashboard/sort-dropdown'
import { ActiveFilters } from '@/components/dashboard/active-filters'
import { ScrollableArticleList } from '@/components/dashboard/scrollable-article-list'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { useRealtimeArticles } from '@/hooks/use-realtime-articles'
import { Loader2, FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ARTICLE_STATUSES, type DashboardArticle } from '@/lib/types/dashboard.types'
import { ScheduleGuard } from '@/components/guards/schedule-guard'
import { ScheduleCalendar } from '@/components/dashboard/schedule-calendar'
import { Button } from '@/components/ui/button'

// ─── Metrics ──────────────────────────────────────────────────────────────────


function ArticlesClient({ orgId, plan, articleUsage, generationLimit }: {
  orgId: string
  plan: string
  articleUsage?: number
  generationLimit?: number | null
}) {
  const router = useRouter();

  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'generated' | 'edited'>('all')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const { articles, isConnected, error, lastUpdated, refresh } = useRealtimeArticles({
    orgId,
    onDashboardUpdate: (event) => {
      setRecentlyUpdatedId(event.articleId);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setRecentlyUpdatedId(null);
        timerRef.current = null;
      }, 3000);
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

  const tabCounts = {
    all: articles.length,
    generated: articles.filter(a => a.status === 'completed').length,
    edited: 0,
  }

  const tabFilteredArticles = filteredArticles.filter(a => {
    if (activeTab === 'all') return true
    if (activeTab === 'generated') return a.status === 'completed'
    if (activeTab === 'edited') return false
    return true
  })


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
      {/* CTA Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 px-1">
          {[
          { label: 'Add SEO Articles', href: '/dashboard/articles/generate?type=seo', iconBg: '#eafaf1', color: '#22c55e', icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          )},
          { label: 'Add News Article', href: '/dashboard/articles/generate?type=news', iconBg: '#e6f0ff', color: '#0066FF', icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          )},
          { label: 'Add YouTube to Blogpost', href: '/dashboard/articles/generate?type=youtube', iconBg: '#fef2f2', color: '#ef4444', icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          )},
        ].map(card => (
          <Link key={card.label} href={card.href}>
            <div
              onMouseEnter={() => setHoveredCard(card.label)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`bg-white border rounded-[10px] p-4 flex items-center gap-4 cursor-pointer transition ${hoveredCard === card.label ? 'shadow-lg -translate-y-1' : ''}`}
            >
              <div className="w-11 h-11 rounded-md bg-neutral-50 flex items-center justify-center shrink-0">
                {card.icon}
              </div>
              <span className="text-sm font-semibold text-neutral-900">{card.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-neutral-200 pb-0 px-1">
        {(['all', 'generated', 'edited'] as const).map(tab => {
          const labels: Record<string,string> = { all: 'All', generated: 'Generated', edited: 'Edited' }
          const isActive = activeTab === tab
          // @ts-ignore
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 text-[13px] ${isActive ? 'font-semibold text-(--brand-electric-blue) border-b-2 border-(--brand-electric-blue)' : 'font-normal text-neutral-500 border-b-2 border-transparent'} bg-none cursor-pointer transition-colors whitespace-nowrap`}
            >
              {labels[tab]} ({tabCounts[tab as keyof typeof tabCounts]})
            </button>
          )
        })}
      </div>

      {/* Schedule (populated-state position) */}
      <div className="mb-6 px-1">
        <ScheduleGuard plan={plan}>
            <ScheduleCalendar
              orgId={orgId}
              plan={plan}
              articles={articles}
              onScheduled={refresh}
              articleUsage={articleUsage}
              generationLimit={generationLimit}
            />
        </ScheduleGuard>
      </div>

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

      {/* Results summary removed per redesign (counts are now in tabs/CTA) */}

      {/* Articles List */}
      <div className="flex-1 min-h-[50vh]">
        {/* Table header */}
        <div className="grid grid-cols-[32px_1fr_200px_160px_120px_auto] items-center p-2.5 border-b border-neutral-200 bg-gray-50 rounded-t-md">
          <input type="checkbox" className="w-3.5 h-3.5 accent-(--brand-electric-blue)" />
          <span className="text-xs font-semibold text-neutral-500">Article</span>
          <span className="text-xs font-semibold text-neutral-500">Input</span>
          <span className="text-xs font-semibold text-neutral-500">Date</span>
          <span className="text-xs font-semibold text-neutral-500">Language</span>
          <span />
        </div>

        {/* Table body wrapper */}
        <div className="border border-neutral-200 border-t-0 rounded-b-md overflow-hidden bg-white">
          {tabFilteredArticles.length === 0 ? (
            <div className="py-20 px-5 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-lg border border-neutral-200 bg-white flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9aa3b0" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <p className="text-sm font-semibold text-neutral-900 mb-1">No articles found</p>
              <p className="text-sm text-neutral-400 mb-5 text-center max-w-70">
                {articles.length > 0 ? 'Try adjusting your filters' : 'When you create articles, they will show up here.'}
              </p>
              {articles.length === 0 && (
                <Link href="/dashboard">
                  <Button className="bg-(--brand-electric-blue) text-white rounded-full px-5 py-2 text-sm font-semibold flex items-center gap-2">Generate Articles →</Button>
                </Link>
              )}
            </div>
          ) : (
            <ScrollableArticleList
              articles={tabFilteredArticles}
              className="h-full"
              plan={plan}
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

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border border-t-0 border-neutral-200 bg-white text-sm text-neutral-600">
          <div>Viewing {tabFilteredArticles.length} results.</div>
          <div className="flex items-center gap-2">
            <button disabled className="px-3 py-1 rounded bg-neutral-100 text-neutral-500 cursor-not-allowed">Prev</button>
            <button disabled className="px-3 py-1 rounded bg-neutral-100 text-neutral-500 cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>

      

      {/* System status footer removed per redesign */}
    </div>
  )
}

export default ArticlesClient;
