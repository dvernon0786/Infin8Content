import { redirect } from 'next/navigation'
import ArticleEditClient from './ArticleEditClient'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'

interface PageProps {
  params: { id: string }
}

export default async function ArticleEditPage({ params }: PageProps) {
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.org_id) {
    redirect('/login')
  }

  const supabase = await createClient()
  const { id } = await params

  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select('id, title, keyword, status, org_id, slug, workflow_state')
    .eq('id', id)
    .eq('org_id', currentUser.org_id)
    .single()

  if (articleError || !article) {
    redirect('/dashboard/articles')
  }

  const { data: sections } = await supabase
    .from('article_sections')
    .select('id, article_id, section_order, section_header, section_type, content_markdown, content_html, status')
    .eq('article_id', id)
    .order('section_order', { ascending: true })

  const initialArticle = {
    id:              article.id,
    title:           article.title ?? null,
    keyword:         (article as any).keyword ?? '',
    status:          article.status ?? 'draft',
    org_id:          article.org_id ?? '',
    slug:            (article as any).slug ?? null,
    workflow_state:  article.workflow_state ?? null,
  }

  const initialSections = (sections ?? []).map((s: any) => ({
    id:               s.id,
    article_id:       s.article_id,
    section_order:    s.section_order,
    section_header:   s.section_header ?? '',
    section_type:     s.section_type ?? 'h2',
    content_markdown: s.content_markdown ?? null,
    content_html:     s.content_html ?? null,
    status:           s.status ?? 'pending',
  }))

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <ArticleEditClient
        initialArticle={initialArticle}
        initialSections={initialSections}
        initialWorkflowState={article.workflow_state ?? null}
      />
    </div>
  )
}
