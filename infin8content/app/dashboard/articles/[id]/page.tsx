import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, generateArticleBreadcrumbs } from '@/components/ui/breadcrumb'
import { ArticleQueueStatus } from '@/components/articles/article-queue-status'
import { ArticleContentViewer } from '@/components/articles/article-content-viewer'
import { ArticleStatusMonitor } from '@/components/articles/article-status-monitor'
import { NavigationErrorBoundary } from '@/components/navigation/navigation-error-boundary'
import { redirect } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { ArticleMetadata, ArticleSection, ArticleWithSections } from '@/lib/types/article'

interface ArticleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { id } = await params
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.org_id) {
    redirect('/login')
  }

  const supabase = await createClient()

  // First, get basic article info with authorization check
  const { data: articleData, error } = await supabase
    .from('articles' as any)
    .select('id, title, keyword, status, target_word_count, writing_style, target_audience, created_at, updated_at, org_id')
    .eq('id', id)
    .eq('org_id', currentUser.org_id)
    .single()

  // Additional authorization verification
  if (error || !articleData) {
    // Log security incident for monitoring
    console.warn('Unauthorized article access attempt:', { 
      articleId: id, 
      userId: currentUser.id, 
      orgId: currentUser.org_id,
      error: error?.message 
    });
    
    return (
      <div className="flex flex-col gap-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You don't have permission to access this article or it doesn't exist.
            </p>
            {error && (
              <p className="text-xs text-muted-foreground mt-2">
                Error: {error.message}
              </p>
            )}
            <div className="mt-4">
              <Link
                href="/dashboard/articles"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Articles
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Verify org_id matches exactly (additional security layer)
  if (articleData && 'org_id' in articleData && articleData.org_id !== currentUser.org_id) {
    console.error('Security: Org ID mismatch', { 
      articleOrg: articleData.org_id, 
      userOrg: currentUser.org_id 
    });
    redirect('/dashboard/articles');
  }

  // Type assertion with proper interface - cast through unknown to avoid type overlap issues
  const article = articleData as unknown as ArticleMetadata

  // If article is completed, fetch sections in the same query if possible
  let sections: ArticleSection[] | null = null
  let sectionsError: string | null = null
  
  if (article.status === 'completed') {
    try {
      // Optimized: Single query with conditional section loading
      const { data: articleWithSections, error: fetchError } = await supabase
        .from('articles' as any)
        .select('sections')
        .eq('id', id)
        .eq('org_id', currentUser.org_id)
        .single()
      
      if (fetchError) {
        console.error('Failed to fetch article sections:', fetchError)
        sectionsError = fetchError.message
      } else if (articleWithSections) {
        const typedData = articleWithSections as unknown as ArticleWithSections
        sections = typedData.sections || null
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
      sectionsError = 'Failed to load article content'
    }
  }

  const isLoading = article.status === 'queued' || article.status === 'generating'

  return (
    <NavigationErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Article page error:', error, errorInfo);
        // In production, send to error reporting service
      }}
    >
      <div className="flex flex-col gap-6 min-h-screen">
        {/* Breadcrumb Navigation */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
          <Breadcrumb 
            items={generateArticleBreadcrumbs(article.title || 'Untitled Article', article.id)}
            className="text-xs sm:text-sm"
          />
        </div>

        {/* Mobile Back Button */}
        <div className="px-4 sm:px-6 lg:px-8 md:hidden">
          <Link
            href="/dashboard/articles"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2 -ml-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Articles
          </Link>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight break-words">
                {article.title || 'Article Generation'}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Article ID: {article.id}
                </p>
                {/* Desktop Back Button */}
                <Link
                  href="/dashboard/articles"
                  className="hidden md:inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-4 py-2 border border-blue-200 hover:bg-blue-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Articles
                </Link>
              </div>
            </div>

            {/* Queue Status */}
            {(article.status === 'queued' || article.status === 'generating') && (
              <ArticleQueueStatus organizationId={currentUser.org_id!} />
            )}

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="text-lg sm:text-xl">Article Status</CardTitle>
                  <ArticleStatusMonitor 
                    articleId={article.id} 
                    initialStatus={article.status}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Keyword</p>
                    <p className="text-sm text-muted-foreground break-words">{article.keyword}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Target Word Count</p>
                    <p className="text-sm text-muted-foreground">{article.target_word_count?.toLocaleString()} words</p>
                  </div>
                  {article.writing_style && (
                    <div>
                      <p className="text-sm font-medium">Writing Style</p>
                      <p className="text-sm text-muted-foreground break-words">{article.writing_style}</p>
                    </div>
                  )}
                  {article.target_audience && (
                    <div>
                      <p className="text-sm font-medium">Target Audience</p>
                      <p className="text-sm text-muted-foreground break-words">{article.target_audience}</p>
                    </div>
                  )}
                  {isLoading && (
                    <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Article generation in progress...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Article Content - Only show when completed */}
            {article.status === 'completed' && (
              <NavigationErrorBoundary
                fallback={
                  <Card className="border-destructive">
                    <CardContent className="pt-6">
                      <p className="text-sm text-destructive text-center py-4">
                        Failed to load article content. Please try refreshing the page.
                      </p>
                    </CardContent>
                  </Card>
                }
              >
                {sectionsError && (
                  <Card className="border-destructive">
                    <CardContent className="pt-6">
                      <p className="text-sm text-destructive text-center py-4">
                        Failed to load article content: {sectionsError}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {!sectionsError && sections && sections.length > 0 && (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-6">Article Content</h2>
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <ArticleContentViewer sections={sections} />
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!sectionsError && (!sections || sections.length === 0) && (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Article generation completed, but no content sections were found.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </NavigationErrorBoundary>
            )}
          </div>
        </div>
      </div>
    </NavigationErrorBoundary>
  )
}

