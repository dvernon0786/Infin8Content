import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Breadcrumb, generateArticleBreadcrumbs } from '@/components/ui/breadcrumb'
import { ArticleContentViewer, ArticleMarkdownViewer } from '@/components/articles/article-content-viewer'
import { ArticleStatusMonitor } from '@/components/articles/article-status-monitor'
import { PublishToCmsButton } from '@/components/articles/PublishToCmsButton'
import { PublishHistory } from '@/components/articles/publish-history'
import { PublishToSocialButton } from '@/components/articles/PublishToSocialButton'
import { SocialAnalytics } from '@/components/articles/SocialAnalytics'
import { GenerateArticleButton } from '@/components/articles/generate-article-button'
import { TrialUpgradeCard } from '@/components/articles/trial-upgrade-card'
import ArticleErrorBoundary from './article-error-boundary'
import { redirect } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { ArticleMetadata, SnapshotSection, ArticleWithSections } from '@/lib/types/article'

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
    .from('articles')
    .select('id, title, keyword, status, target_word_count, writing_style, target_audience, created_at, updated_at, org_id, intent_workflow_id, cms_status, slug')
    .eq('id', id)
    .eq('org_id', currentUser.org_id)
    .maybeSingle()

  console.log('[ArticleDetailPage] Article fetch result:', {
    articleId: id,
    hasData: !!articleData,
    error: error?.message,
    articleTitle: (articleData as any)?.title,
    articleStatus: (articleData as any)?.status,
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
      <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="font-poppins text-neutral-900 text-h3-desktop">
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-lato text-neutral-600 text-body">
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
                  className="inline-flex items-center gap-2 font-lato text-neutral-600 hover:text-[--color-primary-blue]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Articles
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
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
  let sections: SnapshotSection[] | null = null
  let sectionsError: string | null = null
  let articleWithSections: any = null

  if (article.status === 'completed') {
    try {
      // Optimized: Single query with conditional section loading
      const { data, error: fetchError } = await supabase
        .from('articles' as any)
        .select('sections, final_markdown')
        .eq('id', id)
        .eq('org_id', currentUser.org_id)
        .maybeSingle()

      articleWithSections = data

      console.log('[ArticleDetailPage] Sections fetch result:', {
        articleId: id,
        hasSections: !!(articleWithSections as any)?.sections,
        sectionCount: (articleWithSections as any)?.sections?.length || 0,
        error: fetchError?.message
      })

      if (fetchError) {
        console.error('Failed to fetch article sections:', fetchError)
        sectionsError = fetchError.message
      } else if (articleWithSections) {
        sections = articleWithSections.sections || null
        // Note: Title derivation has been moved upstream to the ArticleAssembler.
        // We strictly use the server's persisted title or a base keyword fallback.
        if (!article.title) {
          article.title = article.keyword || 'Untitled Article'
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

  // Trial Upgrade info
  const planType = (currentUser.organizations as any)?.plan || (currentUser.organizations as any)?.plan_type || 'starter'
  const isTrial = planType.toLowerCase() === 'trial'

  let lockedArticlesCount = 0
  let lockedArticleTitles: string[] = []

  if (isTrial && article.intent_workflow_id && article.status === 'completed') {
    const { data: lockedData, count } = await supabase
      .from('articles')
      .select('keyword', { count: 'exact' })
      .eq('intent_workflow_id', article.intent_workflow_id)
      .neq('id', id)
      .limit(3)

    lockedArticlesCount = count || 0
    lockedArticleTitles = (lockedData as any[])?.map(a => a.keyword) || []
  }

  const isLoading = article.status === 'queued' || article.status === 'processing'

  // Compute publishing eligibility server-side (supports both env flag names)
  const isPublishEnabled =
    process.env.PUBLISH_TO_CMS_ENABLED === 'true' ||
    process.env.WORDPRESS_PUBLISH_ENABLED === 'true'
  const canPublish = isPublishEnabled && article.status === 'completed' && !isTrial;

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
                className="inline-flex items-center gap-2 font-lato text-neutral-600 hover:text-[--color-primary-blue] focus:outline-none focus:ring-2 focus:ring-[--brand-electric-blue]/50 focus:ring-offset-2 rounded px-3 py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Articles
              </Link>
            </div>

            <div className="space-y-4">
              <h1 className="font-poppins text-neutral-900 text-h2-desktop">
                {article.title || 'Article Generation'}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="font-lato text-neutral-600 text-body">
                  Article ID: {article.id}
                </p>
                <Link
                  href="/dashboard/articles"
                  className="hidden md:inline-flex items-center gap-2 font-lato text-neutral-600 hover:text-[--color-primary-blue] focus:outline-none focus:ring-2 focus:ring-[--brand-electric-blue]/50 focus:ring-offset-2 rounded px-4 py-2 border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Articles
                </Link>
              </div>
            </div>


            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="font-poppins text-neutral-900 text-h3-desktop">
                    Article status
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    {article.status === 'queued' && (
                      <GenerateArticleButton articleId={article.id} />
                    )}
                    <ArticleStatusMonitor
                      articleId={article.id}
                      initialStatus={article.status}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-lato text-neutral-900 text-small font-medium">
                      Keyword
                    </p>
                    <p className="font-lato text-neutral-600 text-small mt-1">{article.keyword}</p>
                  </div>
                  <div>
                    <p className="font-lato text-neutral-900 text-small font-medium">
                      Target Word Count
                    </p>
                    <p className="font-lato text-neutral-600 text-small mt-1">{article.target_word_count?.toLocaleString()} words</p>
                  </div>
                  {article.writing_style && (
                    <div>
                      <p className="font-lato text-neutral-900 text-small font-medium">
                        Writing Style
                      </p>
                      <p className="font-lato text-neutral-600 text-small mt-1">{article.writing_style}</p>
                    </div>
                  )}
                  {article.target_audience && (
                    <div>
                      <p className="font-lato text-neutral-900 text-small font-medium">
                        Target Audience
                      </p>
                      <p className="font-lato text-neutral-600 text-small mt-1">{article.target_audience}</p>
                    </div>
                  )}
                  {isLoading && (
                    <div className="col-span-full flex items-center gap-2 font-lato text-neutral-600 text-small mt-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Article generation in progress...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CMS Publish Button - multi-platform, only shown when article is complete */}
            {canPublish && (
              <PublishToCmsButton
                articleId={article.id}
                articleStatus={article.status}
              />
            )}

            {/* Publish History — shows all platforms this article has been published to */}
            {article.status === 'completed' && !isTrial && (
              <Card>
                <CardContent className="pt-5 pb-5">
                  <PublishHistory articleId={article.id} />
                </CardContent>
              </Card>
            )}

            {/* Social Publishing */}
            {article.status === 'completed' && !isTrial && (
              <PublishToSocialButton
                articleId={article.id}
                articleTitle={article.title ?? ''}
                articleStatus={article.status}
                cmsStatus={(article as any).cms_status}
              />
            )}

            {/* Social Analytics — only renders when publish_references row exists */}
            {article.status === 'completed' && !isTrial && (
              <SocialAnalytics articleId={article.id} />
            )}

            {/* Trial Upgrade Nudge */}
            {isTrial && article.status === 'completed' && (lockedArticlesCount > 0) && (
              <div className="mb-8">
                <TrialUpgradeCard
                  lockedCount={lockedArticlesCount}
                  lockedTitles={lockedArticleTitles}
                />
              </div>
            )}

            <ArticleErrorBoundary
              fallback={
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <h3 className="font-poppins text-neutral-900 text-h3-desktop mb-2">
                        Content Loading Error
                      </h3>
                      <p className="font-lato text-neutral-600 text-body">
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
                    <p className="font-lato text-neutral-600 text-body text-center py-4">
                      Failed to load article content: {sectionsError}
                    </p>
                  </CardContent>
                </Card>
              )}

              {!sectionsError && sections && sections.length > 0 && (
                <div className="space-y-4">
                  <h2 className="font-poppins text-neutral-900 text-h3-desktop">Article content</h2>
                  <Card>
                    <CardContent className="p-6 sm:p-10">
                      <div className="max-w-3xl mx-auto">
                        {(articleWithSections as any)?.final_markdown ? (
                          <ArticleMarkdownViewer markdown={(articleWithSections as any).final_markdown} />
                        ) : (
                          <ArticleContentViewer
                            sections={sections}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!sectionsError && (!sections || sections.length === 0) && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="font-lato text-neutral-600 text-body text-center py-8">
                      Article generation completed, but no content sections were found.
                    </p>
                  </CardContent>
                </Card>
              )}
            </ArticleErrorBoundary>


          </div>
        </div>
      </div>
    </ArticleErrorBoundary>
  )
}
