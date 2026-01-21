'use client';

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
  console.log('🔧 ArticlesClient initializing with orgId:', orgId);
  
  try {
    const { articles, isConnected, error, lastUpdated, refresh } = useRealtimeArticles({
      orgId,
      onError: (error) => {
        console.error('🚨 Real-time articles error:', error);
      }
    })
    
    console.log('📊 useRealtimeArticles result:', {
      articlesCount: articles?.length || 0,
      isConnected,
      error: error?.message,
      lastUpdated
    });
    
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
    } = useDashboardFilters(articles || []);
    
    console.log('🔍 useDashboardFilters result:', {
      search,
      filters,
      filteredArticlesCount: filteredArticles?.length || 0,
      activeFiltersCount: activeFilters?.length || 0
    });

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
        <div className="font-lato text-neutral-600 text-small">
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
          <div className="font-lato text-neutral-500 text-xs">
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
              <FileText className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="font-poppins text-neutral-900 text-h3-desktop mb-2">No articles found</h3>
              <p className="font-lato text-neutral-600 text-body mb-4">
                Try adjusting your search or filters to find articles.
              </p>
              <Button variant="outline" className="font-lato text-neutral-600 hover:text-[--brand-electric-blue]" onClick={clearAll}>
                Clear all filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="font-poppins text-neutral-900 text-h3-desktop mb-2">No articles yet</h3>
              <p className="font-lato text-neutral-600 text-body mb-4">
                Generate your first article to begin content production.
              </p>
              <Link href="/dashboard/articles/generate">
                <Button
                  variant="ghost"
                  className="font-lato text-neutral-600 hover:text-[--brand-electric-blue]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate article
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
          onTouchStart={(id, e, element) => {
            // Handle touch start for mobile navigation
            console.log('Touch start:', id);
          }}
          onTouchMove={(id, e, element) => {
            // Handle touch move for mobile navigation
            console.log('Touch move:', id);
          }}
          onTouchEnd={(id, e, element) => {
            // Navigate on touch end for mobile
            window.location.href = `/dashboard/articles/${id}`
          }}
          showProgress={true}
        />
      )}
    </div>
  )
  } catch (error) {
    console.error('🚨 ArticlesClient error:', error);
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="font-poppins text-neutral-900 text-h3-desktop mb-2">
              Component Error
            </h3>
            <p className="font-lato text-neutral-600">
              An unexpected error occurred. Please refresh the page.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
}

export default ArticlesClient
