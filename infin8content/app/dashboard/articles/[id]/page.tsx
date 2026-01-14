import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb, generateArticleBreadcrumbs } from '@/components/ui/breadcrumb'
import { ArticleQueueStatus } from '@/components/articles/article-queue-status'
import { ArticleContentViewer } from '@/components/articles/article-content-viewer'
import { EnhancedArticleContentViewer } from '@/components/articles/enhanced-article-content-viewer'
import { ArticleStatusMonitor } from '@/components/articles/article-status-monitor'
import { LayoutDiagnostic } from '@/components/layout-diagnostic'
import ArticleErrorBoundary from './article-error-boundary'
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
    .maybeSingle()

  console.log('[ArticleDetailPage] Article fetch result:', {
    articleId: id,
    hasData: !!articleData,
    error: error?.message,
    articleTitle: articleData?.title,
    articleStatus: articleData?.status,
    allFields: articleData ? Object.keys(articleData) : [],
    allData: JSON.stringify(articleData, null, 2)
  })

  // Additional authorization verification
  if (error || !articleData) {
    console.warn('Unauthorized article access attempt:', { 
      articleId: id, 
      userId: currentUser.id, 
      orgId: currentUser.org_id,
      error: error?.message || 'Article not found'
    });
    
    return (
      <>
        <LayoutDiagnostic />
        <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
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
        </div>
      </>
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
        .maybeSingle()
      
      console.log('[ArticleDetailPage] Sections fetch result:', {
        articleId: id,
        hasSections: !!articleWithSections?.sections,
        sectionCount: articleWithSections?.sections?.length || 0,
        error: fetchError?.message
      })

      if (fetchError) {
        console.error('Failed to fetch article sections:', fetchError)
        sectionsError = fetchError.message
      } else if (articleWithSections) {
        const typedData = articleWithSections as unknown as ArticleWithSections
        sections = typedData.sections || null
        
        // If article title is null, generate it from the first section title or keyword
        if (!article.title && sections && sections.length > 0) {
          article.title = sections[0].title || article.keyword || 'Untitled Article'
          console.log('[ArticleDetailPage] Generated title from first section:', article.title)
        }
      } else {
        console.warn('Article not found when fetching sections:', { articleId: id })
        sectionsError = 'Article not found'
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
      sectionsError = 'Failed to load article content'
    }
  }

  const isLoading = article.status === 'queued' || article.status === 'generating'

  console.log('[ArticleDetailPage] Rendering with state:', {
    articleTitle: article.title,
    articleStatus: article.status,
    isLoading,
    hasSections: !!sections && sections.length > 0,
    sectionsError,
    willShowContent: article.status === 'completed' && !sectionsError && sections && sections.length > 0
  })

  return (
    <ArticleErrorBoundary>
      <LayoutDiagnostic />
      
      <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-6">
            <Breadcrumb 
              items={generateArticleBreadcrumbs(article.title || 'Untitled Article', article.id)}
              className="text-xs sm:text-sm"
            />

            <div className="md:hidden">
              <Link
                href="/dashboard/articles"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-3 py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Articles
              </Link>
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                {article.title || 'Article Generation'}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Article ID: {article.id}
                </p>
                <Link
                  href="/dashboard/articles"
                  className="hidden md:inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-4 py-2 border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Articles
                </Link>
              </div>
            </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium">Keyword</p>
                    <p className="text-sm text-muted-foreground mt-1">{article.keyword}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Target Word Count</p>
                    <p className="text-sm text-muted-foreground mt-1">{article.target_word_count?.toLocaleString()} words</p>
                  </div>
                  {article.writing_style && (
                    <div>
                      <p className="text-sm font-medium">Writing Style</p>
                      <p className="text-sm text-muted-foreground mt-1">{article.writing_style}</p>
                    </div>
                  )}
                  {article.target_audience && (
                    <div>
                      <p className="text-sm font-medium">Target Audience</p>
                      <p className="text-sm text-muted-foreground mt-1">{article.target_audience}</p>
                    </div>
                  )}
                  {isLoading && (
                    <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground mt-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Article generation in progress...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {article.status === 'completed' && (
              <ArticleErrorBoundary
                fallback={
                  <Card className="border-destructive">
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <h3 className="text-lg font-semibold text-destructive mb-2">
                          Content Loading Error
                        </h3>
                        <p className="text-muted-foreground">
                          Unable to load article content. Please try refreshing the page.
                        </p>
                      </div>
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
                  <div className="space-y-4">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Article Content</h2>
                    <Card>
                      <CardContent className="p-6">
                        <EnhancedArticleContentViewer 
                          sections={sections}
                          articleId={article.id}
                          articleTitle={article.title || 'Untitled Article'}
                          primaryKeyword={article.keyword || ''}
                          secondaryKeywords={[]}
                          targetWordCount={article.target_word_count || 300}
                        />
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
              </ArticleErrorBoundary>
            )}
          </div>
        </div>
      </div>
    </ArticleErrorBoundary>
  )
}
