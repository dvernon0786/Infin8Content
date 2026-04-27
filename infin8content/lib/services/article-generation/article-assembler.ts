import { createServiceRoleClient } from '@/lib/supabase/server'
import { retryWithPolicy } from '@/lib/services/intent-engine/retry-utils'
import { createLogger } from '@/lib/utils/logger'
import { AssemblyInput, AssemblyOutput } from '@/types/article'

const logger = createLogger('ArticleAssembly')

class ArticlePersistenceNoopError extends Error {
  public readonly retryable = false
  constructor(articleId: string) {
    super(`Article persistence noop: no rows updated for articleId=${articleId}`)
    this.name = 'ArticlePersistenceNoopError'
  }
}

/**
 * ArticleAssembler
 * 
 * Responsible for gathering completed sections and building the final article content.
 * Follows the Single Lock Authority model: it does NOT mutate article status.
 */
export class ArticleAssembler {
  private supabaseAdmin: any

  constructor() {
    this.supabaseAdmin = createServiceRoleClient()
  }

  async assemble(input: AssemblyInput & { allowReassembly?: boolean }): Promise<AssemblyOutput> {
    const start = Date.now()

    // Exact contract analytics events only
    logger.log('article.assembly.started', {
      articleId: input.articleId,
      organizationId: input.organizationId
    })

    const article = await this.loadArticle(input)
    const sections = await this.loadSections(input)

    // H: allowReassembly check before sections check
    if (!input.allowReassembly && article.status !== 'processing') {
      throw new Error(`Assembly aborted: Article ${input.articleId} is in status '${article.status}', expected 'processing'.`)
    }

    // I: sections.length check moved outside retryWithPolicy
    if (!sections.length) {
      throw new Error(`Assembly failed: No completed sections found for article ${input.articleId}.`)
    }

    return retryWithPolicy(async () => {
      // 🔍 ANALYTICS: Compute metrics from relational truth
      const totalMarkdown = sections.map((s: any) => s.content_markdown).join('\n\n')
      const wordCount = this.countWords(totalMarkdown)
      const readingTimeMinutes = Math.ceil(wordCount / 200)

      // 📸 SNAPSHOT: Normalize sections into canonical JSONB structure for UI projection
      const sectionsJson = sections.map((s: any) => ({
        header: s.section_header,
        markdown: s.content_markdown,
        html: s.content_html,
        order: s.section_order,
        type: s.section_type,
        section_image_url: s.section_image_url ?? null
      }))

      // 🏷️ TITLE DERIVATION: If title is missing, derive it from first section or keyword
      let articleTitle = article.title
      if (!articleTitle) {
        articleTitle = sectionsJson[0]?.header || article.keyword || 'Untitled Article'
        logger.log('article.assembly.title_derived', { articleId: input.articleId, title: articleTitle })
      }

      const finalMarkdown = this.buildFinalMarkdown(
        {
          title: articleTitle,
          keyword: article.keyword,
          id: input.articleId,
          organization_id: input.organizationId,
          cover_image_url: article.cover_image_url,
          cta_text: article.cta_text,
          cta_url: article.cta_url,
          slug: (article as any).slug ?? null,
          org_website_url: article.org_website_url ?? null,
          article_type: (article as any).article_type ?? null,
          video_url: (article as any).video_url ?? null,
        },
        sectionsJson
      )

      // SEO scoring removed: column no longer exists in DB

      // Persist ONLY the snapshot and metadata. No status mutation.
      await this.persistResult({
        articleId: input.articleId,
        sections: sectionsJson,
        finalMarkdown,
        wordCount,
        readingTimeMinutes,
        title: articleTitle !== article.title ? articleTitle : undefined,
        skipStatusGuard: input.allowReassembly,
        // seoScore removed
      })

      // Exact contract analytics events only
      logger.log('article.assembly.completed', {
        articleId: input.articleId,
        organizationId: input.organizationId,
        wordCount,
        readingTimeMinutes,
        durationMs: Date.now() - start
      })

      return {
        wordCount,
        readingTimeMinutes
      }
    })
  }

  private async loadArticle({ articleId, organizationId }: AssemblyInput) {
    const { data, error } = await this.supabaseAdmin
      .from('articles')
      .select('id, title, status, keyword, cover_image_url, org_id, article_type, video_url')
      .eq('id', articleId)
      .eq('org_id', organizationId)
      .single()

    if (error || !data) {
      throw new Error('Article not found or access denied')
    }

    // Fetch org separately — don't let a join failure block assembly
    const { data: orgData, error: orgError } = await this.supabaseAdmin
      .from('organizations')
      .select('cta_text, cta_url, website_url')
      .eq('id', (data as any).org_id)
      .maybeSingle()

    if (orgError) {
      logger.error('article.assembly.org_load_error', {
        articleId,
        orgId: (data as any).org_id,
        error: orgError,
        errorMessage: (orgError as any)?.message ?? String(orgError),
      })
    }

    return {
      ...data,
      cta_text: (orgData as any)?.cta_text ?? null,
      cta_url: (orgData as any)?.cta_url ?? null,
      org_website_url: (orgData as any)?.website_url ?? null,
    }
  }

  private async loadSections({ articleId }: AssemblyInput) {
    const { data, error } = await this.supabaseAdmin
      .from('article_sections')
      .select('section_order, section_header, section_type, content_markdown, content_html, section_image_url')
      .eq('article_id', articleId)
      .eq('status', 'completed')
      .order('section_order', { ascending: true })

    if (error) {
      throw error
    }

    // Log empty sections for observability but don't silently drop them
    const rawSections = data || []
    const emptySections = rawSections.filter((s: any) => !s.content_markdown?.trim())
    if (emptySections.length > 0) {
      logger.log('article.assembly.empty_sections_detected', {
        articleId,
        emptySectionOrders: emptySections.map((s: any) => s.section_order)
      })
    }

    return rawSections.filter((s: any) => s.content_markdown?.trim())
  }

  private countWords(markdown: string): number {
    const contentLines = markdown.split('\n')
      .filter(line => !line.startsWith('#') && !line.startsWith('- [') && line.trim())

    const contentText = contentLines.join(' ')
    return contentText
      .replace(/[#*_>\-\n`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean).length
  }


  private async persistResult(args: {
    articleId: string
    sections: any[]
    finalMarkdown: string
    wordCount: number
    readingTimeMinutes: number
    title?: string
    skipStatusGuard?: boolean
  }) {

    const updatePayload: any = {
      sections: args.sections,
      final_markdown: args.finalMarkdown,
      word_count: args.wordCount,
      reading_time_minutes: args.readingTimeMinutes,
      updated_at: new Date().toISOString()
    }

    if (args.title) {
      updatePayload.title = args.title
    }

    let query = this.supabaseAdmin
      .from('articles')
      .update(updatePayload)
      .eq('id', args.articleId)

    if (!args.skipStatusGuard) {
      query = query.eq('status', 'processing') // 🔒 PRODUCTION GUARD: Prevent racing assembly updates
    }

    const { data, error } = await query.select('id')

    if (error) {
      throw error
    }

    // 🔴 OBSERVABILITY: If 0 rows affected, it means the article wasn't found or update matched 0 rows (Race condition)
    if (!data || data.length === 0) {
      logger.error('article.assembly.persistence_noop', { articleId: args.articleId })
      throw new ArticlePersistenceNoopError(args.articleId)
    }
  }

  private buildFinalMarkdown(
    article: {
      title: string
      keyword: string
      id: string
      organization_id: string
      cover_image_url?: string | null
      cta_text?: string | null
      cta_url?: string | null
      org_website_url?: string | null
      slug?: string | null
      article_type?: string | null
      video_url?: string | null
    },
    sections: any[]
  ): string {
    const today = new Date().toISOString().split('T')[0]

    const coverImage = article.cover_image_url
      ? `![Cover image](${article.cover_image_url})`
      : null

    const authorBlock = `*Published: ${today} · By Editorial Team*`

    const CTA_TEMPLATE_BLOCKLIST = [
      'flowtic',
      'your company',
      'company name',
      'your brand',
      'your business',
      '[company]',
      '{{', // any unfilled template variable
    ]

    const rawCtaText = article.cta_text || null
    const ctaText = rawCtaText &&
      !CTA_TEMPLATE_BLOCKLIST.some(t => rawCtaText.toLowerCase().includes(t))
      ? rawCtaText
      : null

    const ctaUrl = article.cta_url || null
    const cta = ctaText && ctaUrl
      ? `---\n*${ctaText} [→](${ctaUrl})*`
      : null

    const disclaimer = `---\n*Editorial note: This content was researched and generated on ${today}. Facts and pricing are verified at time of writing and subject to change.*`

    const articleCanonicalUrl = (() => {
      const base = ((article as any).org_website_url || '').replace(/\/$/, '')
      const derive = (input: any) => (input || '')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 120)

      const slug = (article as any).slug || derive((article as any).keyword) || derive((article as any).title)
      if (!base || !slug) return null
      return `${base}/blog/${slug}`
    })()

    const socialShare = [
      `**Share this article:**`,
      `[Post on X](https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}${articleCanonicalUrl ? `&url=${encodeURIComponent(articleCanonicalUrl)}` : ''})`,
      articleCanonicalUrl ? `[Copy link](${articleCanonicalUrl})` : null
    ].filter(Boolean).join(' · ')

    const body = sections
      .sort((a, b) => a.order - b.order)
      .map(s => {
        let md = (s.markdown || '').trim()

        if (s.type !== 'faq') {
          md = md.replace(/^#+\s+[^\n]+\n+/, '').trim()
        }

        // 🔒 NB_TITLE_EMPTY FIX: Only perform context cleanup if title is populated
        const titleToSearch = article.title?.trim()
        const titleIndex = titleToSearch ? md.indexOf(titleToSearch) : -1

        if (titleIndex >= 50) {
          md = md.slice(0, titleIndex).trimEnd()
          console.warn(`[ArticleAssembler] Truncated section "${s.header}" — article title found in body (likely context reproduction)`)
        } else if (titleToSearch && titleIndex >= 0 && titleIndex < 50) {
          console.warn(`[ArticleAssembler] Section "${s.header}" body starts with article title — LLM reproduced context. Using empty body.`)
          md = ''
        }

        const rawImgUrl = s.section_image_url
        const sectionImg = (rawImgUrl && rawImgUrl !== 'null' && rawImgUrl.startsWith('http'))
          ? `\n\n![Illustration for section ${s.order}](${rawImgUrl})`
          : ''

        return `## ${s.header}\n\n${md}${sectionImg}`.trimEnd()
      })
      .join('\n\n')

    return [
      coverImage,
      `# ${article.title}`,
      authorBlock,
      body,
      cta,
      disclaimer,
      socialShare,
      buildStructuredDataBlock(article, today),
    ].filter(Boolean).join('\n\n')
  }
}

// ---------------------------------------------------------------------------
// Epic 13: Structured data (JSON-LD) injection helpers
// ---------------------------------------------------------------------------

function buildStructuredDataBlock(
  article: {
    title: string
    keyword: string
    cover_image_url?: string | null
    org_website_url?: string | null
    slug?: string | null
    article_type?: string | null
    video_url?: string | null
  },
  today: string
): string | null {
  const articleType = article.article_type ?? 'standard'
  if (articleType === 'standard' || articleType === 'listicle_comparison') return null

  const canonicalUrl = (() => {
    const base = (article.org_website_url || '').replace(/\/$/, '')
    const slug = (article.slug || article.title || '')
      .toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 120)
    if (!base || !slug) return null
    return `${base}/blog/${slug}`
  })()

  if (articleType === 'news') {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      datePublished: today,
      dateModified: today,
      author: { '@type': 'Person', name: 'Editorial Team' },
      publisher: {
        '@type': 'Organization',
        name: 'Infin8Content',
        logo: { '@type': 'ImageObject', url: '' }
      },
      ...(article.cover_image_url ? { image: article.cover_image_url } : {}),
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
    }
    return `\n\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`
  }

  if (articleType === 'video_conversion' && article.video_url) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: article.title,
      description: article.title,
      contentUrl: article.video_url,
      uploadDate: today,
      ...(article.cover_image_url ? { thumbnailUrl: article.cover_image_url } : {}),
    }
    return `\n\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`
  }

  return null
}
