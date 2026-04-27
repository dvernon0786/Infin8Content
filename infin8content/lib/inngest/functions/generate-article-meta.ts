import { inngest } from '@/lib/inngest/client'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * generate-article-meta
 *
 * Triggered by: 'article/generation.completed' (already fired by generate-article.ts)
 *
 * Step 1 — generate-meta-description
 *   Calls Claude Haiku via OpenRouter to write a 140-155 char meta description.
 *   Skips if workflow_state.meta_description is already set (user-written).
 *
 * Step 2 — populate-featured-image
 *   Backfills workflow_state.featured_image_url from articles.cover_image_url.
 *   Derives alt text from title + keyword.
 *   Skips if user already set a featured image.
 *
 * Step 3 — sync-tags
 *   Auto-generates keyword-split + article-type tags.
 *   Merges with existing user tags (never removes user tags).
 *   Upserts all to org_tags for cross-article autocomplete.
 *
 * All steps are non-fatal — failures never block the article.
 */

export const generateArticleMeta = inngest.createFunction(
  {
    id: 'article/meta.generate',
    concurrency: { limit: 5, key: 'event.data.articleId' },
    retries: 1,
  },
  { event: 'article/generation.completed' },
  async ({ event, step }: any) => {
    const { articleId, organizationId } = event.data
    const supabase = createServiceRoleClient()

    // ── 0. Load article ──────────────────────────────────────────────────────

    const { article, sections } = await step.run('load-meta-context', async () => {
      const { data: artData, error } = await supabase
        .from('articles')
        .select('id, title, keyword, workflow_state, cover_image_url, org_id, article_type, status')
        .eq('id', articleId)
        .single()

      if (error || !artData) throw new Error(`[MetaAgent] Article ${articleId} not found`)

      if ((artData as any).status !== 'completed') {
        return { article: artData, sections: [], skipped: true }
      }

      const { data: secData } = await supabase
        .from('article_sections')
        .select('section_header, section_type, content_markdown')
        .eq('article_id', articleId)
        .order('section_order')
        .limit(4)

      return { article: artData, sections: secData ?? [], skipped: false }
    })

    if ((article as any).skipped) return { success: true, skipped: true }

    const ws = ((article as any).workflow_state as Record<string, any>) ?? {}

    // Re-read workflow_state before each write to avoid clobbering concurrent updates
    const freshWs = async (): Promise<Record<string, any>> => {
      const { data } = await supabase
        .from('articles').select('workflow_state').eq('id', articleId).single()
      return ((data as any)?.workflow_state as Record<string, any>) ?? {}
    }

    // ── 1. Meta description ──────────────────────────────────────────────────

    await step.run('generate-meta-description', async () => {
      if (ws.meta_description?.trim()) {
        console.log(`[MetaAgent] Meta already set for ${articleId}, skipping.`)
        return
      }

      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) { console.warn('[MetaAgent] No OPENROUTER_API_KEY — skipping'); return }

      try {
        const introContent = (sections as any[])
          .filter((s: any) => ['introduction', 'h2'].includes(s.section_type))
          .slice(0, 2)
          .map((s: any) => (s.content_markdown ?? '').slice(0, 350))
          .join('\n\n')

        const keyword = (article as any).keyword ?? ''
        const title   = (article as any).title ?? keyword

        const prompt = `You are an SEO expert. Write a concise, compelling meta description.

Article Title: ${title}
Target Keyword: ${keyword}
Article Intro:
${introContent}

Requirements:
- Exactly 140-155 characters long
- Include the keyword "${keyword}" naturally
- Action-oriented and value-driven
- No quotes, no markdown
- Return ONLY the meta description text, nothing else`

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'anthropic/claude-haiku-4-5',
            max_tokens: 200,
            temperature: 0.3,
            messages: [{ role: 'user', content: prompt }],
          }),
        })

        if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 200)}`)

        const data = await res.json()
        const raw  = (data?.choices?.[0]?.message?.content ?? '').trim()

        if (!raw || raw.length < 50) throw new Error(`Invalid meta: "${raw.slice(0, 60)}"`)

        const metaDescription = raw.slice(0, 160)
        const current = await freshWs()

        await supabase
          .from('articles')
          .update({ workflow_state: { ...current, meta_description: metaDescription } })
          .eq('id', articleId)

        console.log(`[MetaAgent] ✅ Meta written for ${articleId}: "${metaDescription.slice(0, 60)}…"`)
      } catch (err) {
        console.warn('[MetaAgent] Meta generation failed (non-fatal):', err instanceof Error ? err.message : err)
      }
    })

    // ── 2. Featured image backfill ───────────────────────────────────────────

    await step.run('populate-featured-image', async () => {
      const current = await freshWs()

      if (current.featured_image_url?.trim()) {
        console.log(`[MetaAgent] featured_image_url already set for ${articleId}, skipping.`)
        return
      }

      const coverUrl = (article as any).cover_image_url
      if (!coverUrl) { console.log(`[MetaAgent] No cover for ${articleId}, skipping.`); return }

      const title   = ((article as any).title ?? (article as any).keyword ?? '').trim()
      const keyword = ((article as any).keyword ?? '').trim()
      const rawAlt  = title
        ? `${title}${keyword && !title.toLowerCase().includes(keyword.toLowerCase()) ? ` - ${keyword}` : ''}`
        : keyword
      const altText = rawAlt.slice(0, 125)

      await supabase
        .from('articles')
        .update({
          workflow_state: {
            ...current,
            featured_image_url: coverUrl,
            featured_image_alt: altText,
          },
        })
        .eq('id', articleId)

      console.log(`[MetaAgent] ✅ Featured image backfilled for ${articleId}`)
    })

    // ── 3. Tags sync ─────────────────────────────────────────────────────────

    await step.run('sync-tags', async () => {
      const current     = await freshWs()
      const existing: string[] = current.tags ?? []
      const keyword     = ((article as any).keyword ?? '').toLowerCase()
      const articleType = ((article as any).article_type ?? 'standard') as string
      const orgId       = ((article as any).org_id ?? organizationId) as string

      const keywordTags = keyword
        .split(/[\s\-_,/]+/)
        .map((t: string) => t.replace(/[^a-z0-9]/g, '').trim())
        .filter((t: string) => t.length > 2)

      const typeTags = articleType !== 'standard' ? [articleType.replace(/_/g, '-')] : []

      const merged = Array.from(new Set([...existing, ...keywordTags, ...typeTags])).slice(0, 10)

      if (merged.length > existing.length) {
        await supabase
          .from('articles')
          .update({ workflow_state: { ...current, tags: merged } })
          .eq('id', articleId)
        console.log(`[MetaAgent] ✅ Tags updated for ${articleId}: [${merged.join(', ')}]`)
      }

      if (orgId && merged.length > 0) {
        const { error } = await supabase
          .from('org_tags')
          .upsert(merged.map((name: string) => ({ org_id: orgId, name })), {
            onConflict: 'org_id,name',
            ignoreDuplicates: true,
          })
        if (error) console.warn('[MetaAgent] org_tags upsert failed:', error.message)
        else console.log(`[MetaAgent] ✅ Synced ${merged.length} tags to org_tags`)
      }
    })

    return { success: true, articleId }
  }
)
