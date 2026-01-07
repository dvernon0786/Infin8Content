import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArticleQueueStatus } from '@/components/articles/article-queue-status'
import { redirect } from 'next/navigation'
import { Loader2 } from 'lucide-react'

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

  // Type assertion needed until database types are regenerated after migration
  // TODO: Remove type assertion after running: supabase gen types typescript --project-id ybsgllsnaqkpxgdjdvcz > lib/supabase/database.types.ts
  const { data: article, error } = await (supabase
    .from('articles' as any)
    .select('*')
    .eq('id', id)
    .eq('org_id', currentUser.org_id)
    .single() as unknown as Promise<{ data: any; error: any }>)

  if (error || !article) {
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
          </CardContent>
        </Card>
      </div>
    )
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
    </div>
  )
}

