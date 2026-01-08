import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArticleQueueStatus } from '@/components/articles/article-queue-status'
import { ArticleContentViewer } from '@/components/articles/article-content-viewer'
import { redirect } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { ArticleMetadata, ArticleSection, ArticleWithSections } from '@/lib/types/article'

interface ArticleDetailPageProps {
  params: Promise<{ id: string }>
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  queued: 'secondary',
  generating: 'default',
  completed: 'default',
  failed: 'destructive',
  cancelled: 'secondary',
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { id } = await params
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.org_id) {
    redirect('/login')
  }

  const supabase = await createClient()

  // First, get basic article info (excluding large JSONB columns to prevent timeout)
  const { data: articleData, error } = await supabase
    .from('articles' as any)
    .select('id, title, keyword, status, target_word_count, writing_style, target_audience, created_at, updated_at, org_id')
    .eq('id', id)
    .eq('org_id', currentUser.org_id)
    .single()

  if (error || !articleData) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Article Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The article you're looking for doesn't exist or you don't have access to it.
            </p>
            {error && (
              <p className="text-xs text-muted-foreground mt-2">
                Error: {error.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Type assertion with proper interface - cast through unknown to avoid type overlap issues
  const article = articleData as unknown as ArticleMetadata

  // If article is completed, fetch sections separately to display content
  let sections: ArticleSection[] | null = null
  let sectionsError: string | null = null
  
  if (article.status === 'completed') {
    const { data: articleWithSections, error: fetchError } = await supabase
      .from('articles' as any)
      .select('sections')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      console.error('Failed to fetch article sections:', fetchError)
      sectionsError = fetchError.message
    } else if (articleWithSections) {
      const typedData = articleWithSections as unknown as ArticleWithSections
      sections = typedData.sections || null
    }
  }

  const isLoading = article.status === 'queued' || article.status === 'generating'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {article.title || 'Article Generation'}
        </h1>
        <p className="text-muted-foreground">
          Article ID: {article.id}
        </p>
      </div>

      {/* Queue Status */}
      {(article.status === 'queued' || article.status === 'generating') && (
        <ArticleQueueStatus organizationId={currentUser.org_id!} />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Article Status</CardTitle>
            <Badge variant={statusColors[article.status] || 'secondary'}>
              {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Keyword</p>
              <p className="text-sm text-muted-foreground">{article.keyword}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Target Word Count</p>
              <p className="text-sm text-muted-foreground">{article.target_word_count?.toLocaleString()} words</p>
            </div>
            {article.writing_style && (
              <div>
                <p className="text-sm font-medium">Writing Style</p>
                <p className="text-sm text-muted-foreground">{article.writing_style}</p>
              </div>
            )}
            {article.target_audience && (
              <div>
                <p className="text-sm font-medium">Target Audience</p>
                <p className="text-sm text-muted-foreground">{article.target_audience}</p>
              </div>
            )}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Article generation in progress...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Article Content - Only show when completed */}
      {article.status === 'completed' && (
        <>
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
              <h2 className="text-2xl font-bold tracking-tight mb-6">Article Content</h2>
              <ArticleContentViewer sections={sections} />
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
        </>
      )}
    </div>
  )
}

