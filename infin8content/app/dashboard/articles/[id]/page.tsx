// app/dashboard/articles/[id]/page.tsx
// SERVER COMPONENT — auth, data fetch, then mounts client UI.
// Does NOT add its own layout wrapper (dashboard layout already provides sidebar/header).

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import ArticleDetailClient, {
  type SerializedArticle,
  type SerializedSection,
} from './ArticleDetailClient'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PageProps {
  // Next.js 15: params is a Promise
  params: Promise<{ id: string }>
}

// ─── Server component ─────────────────────────────────────────────────--------

export default async function ArticleDetailPage({ params }: PageProps) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.org_id) {
    redirect('/login')
  }

  const supabase = await createClient()
  const { id } = await params

  // ── Fetch article ───────────────────────────────────────────────────────────
  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select('id, title, keyword, status, org_id, slug, workflow_state')
    .eq('id', id)
    .eq('org_id', currentUser.org_id)   // RLS-safe: ensure org ownership
    .single()

  if (articleError || !article) {
    redirect('/dashboard/articles')
  }

  // ── Fetch sections ──────────────────────────────────────────────────────────
  const { data: sections } = await supabase
    .from('article_sections')
    .select(
      'id, article_id, section_order, section_header, section_type, content_markdown, content_html, status'
    )
    .eq('article_id', id)
    .order('section_order', { ascending: true })

  // ── Serialize (no Date objects — all strings) ───────────────────────────────
  const initialArticle: SerializedArticle = {
    id:              article.id,
    title:           article.title ?? null,
    keyword:         (article as any).keyword ?? '',
    status:          article.status ?? 'draft',
    org_id:          article.org_id ?? '',
    slug:            (article as any).slug ?? null,
    workflow_state:  article.workflow_state ?? null,
  }

  const initialSections: SerializedSection[] = (sections ?? []).map((s: any) => ({
    id:               s.id,
    article_id:       s.article_id,
    section_order:    s.section_order,
    section_header:   s.section_header ?? '',
    section_type:     s.section_type ?? 'h2',
    content_markdown: s.content_markdown ?? null,
    content_html:     s.content_html ?? null,
    status:           s.status ?? 'pending',
  }))

  // ── Mount client component directly — no extra wrapper div ────────────────
  // The dashboard layout already provides the page container.
  // ArticleDetailClient manages its own height/scroll internally.
  return (
    <ArticleDetailClient
      initialArticle={initialArticle}
      initialSections={initialSections}
    />
  )
}
