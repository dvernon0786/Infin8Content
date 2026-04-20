import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import ArticleDetailClient, {
  type SerializedArticle,
  type SerializedSection,
} from './ArticleDetailClient'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PageProps {
  params: { id: string }
}

// ─── Server component ─────────────────────────────────────────────────--------

export default async function ArticleDetailPage({ params }: PageProps) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.org_id) {
    redirect('/login')
  }

  const supabase = await createClient()
  const { id } = params

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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">

      {/* ── Page header (server-rendered, always visible) ───────────────── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 bg-white z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/articles"
            className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-poppins font-bold text-sm text-neutral-900 leading-tight truncate max-w-[400px]">
              {article.title ?? (article as any).keyword ?? 'Article'}
            </h1>
            <p className="text-[10px] font-lato text-neutral-400 uppercase tracking-wider">
              {article.status}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Publish button — only for completed articles */}
          {article.status === 'completed' && (
            <Link
              href={`/dashboard/articles/${id}/publish`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-lato text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Publish
            </Link>
          )}

          {/* Edit button — visible for all statuses */}
          <Link
            href={`/dashboard/articles/${id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-lato text-white rounded-md transition-colors"
            style={{ background: 'linear-gradient(to right, #217CEB, #4A42CC)' }}
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Link>
        </div>
      </div>

      {/* ── Client component (Original/Revision UI) ─────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <ArticleDetailClient
          initialArticle={initialArticle}
          initialSections={initialSections}
        />
      </div>
    </div>
  )
}
