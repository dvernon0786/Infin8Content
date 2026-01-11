'use client';

import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArticleStatusList } from '@/components/dashboard/article-status-list'
import { SearchInput } from '@/components/dashboard/search-input'
import { FilterDropdown } from '@/components/dashboard/filter-dropdown'
import { SortDropdown } from '@/components/dashboard/sort-dropdown'
import { ActiveFilters } from '@/components/dashboard/active-filters'
import { VirtualizedArticleList } from '@/components/dashboard/virtualized-article-list'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { useRealtimeArticles } from '@/hooks/use-realtime-articles'
import { Loader2, FileText, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Client component for interactive features
function ArticlesClient({ orgId }: { orgId: string }) {
  const { articles, isConnected, error, lastUpdated, refresh } = useRealtimeArticles({
    orgId,
    onError: (error) => {
      console.error('Real-time articles error:', error);
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
  } = useDashboardFilters(articles)

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Error Loading Articles
            </h3>
            <p className="text-muted-foreground">
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
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            value={search.query}
            onChange={setSearchQuery}
            onClear={clearSearch}
            placeholder="Search articles by title or keyword..."
            className="w-full"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <FilterDropdown
            value={filters}
            onChange={setFilters}
            availableStatuses={['queued', 'generating', 'completed', 'failed']}
          />
          <SortDropdown
            value={filters.sortBy}
            onChange={(sortBy) => setFilters({ ...filters, sortBy })}
          />
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <ActiveFilters
          filters={filters}
          search={search}
          onClearFilter={removeFilter}
          onClearAll={clearAll}
        />
      )}

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="text-sm text-muted-foreground">
          {filteredArticles.length === 0 
            ? 'No articles found'
            : filteredArticles.length === 1
            ? '1 article'
            : `${filteredArticles.length} articles`
          }
          {articles.length > 0 && filteredArticles.length !== articles.length && (
            <> of {articles.length} total</>
          )}
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground">
            Search: {metrics.searchTime?.toFixed(1)}ms | 
            Filter: {metrics.filterTime?.toFixed(1)}ms
          </div>
        )}
      </div>

      {/* Articles List */}
      {filteredArticles.length === 0 && articles.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No articles found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters to find articles.
              </p>
              <Button variant="outline" onClick={clearAll}>
                Clear all filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by generating your first article.
              </p>
              <Link href="/dashboard/articles/generate">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Article
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <VirtualizedArticleList
          articles={filteredArticles}
          itemHeight={160}
          height={600}
          overscanCount={5}
          className="border rounded-lg"
          selectedArticle={null}
          onArticleSelect={(id) => {
            // Navigate to article detail page
            window.location.href = `/dashboard/articles/${id}`
          }}
          onArticleNavigation={(id, e) => {
            if (e?.defaultPrevented) return
            window.location.href = `/dashboard/articles/${id}`
          }}
          onKeyDown={(id, e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              window.location.href = `/dashboard/articles/${id}`
            }
          }}
          showProgress={true}
        />
      )}
    </div>
  )
}

export default ArticlesClient
