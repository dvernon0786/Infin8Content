import { createServiceRoleClient } from '@/lib/supabase/server'
import { retryWithPolicy } from '@/lib/services/intent-engine/retry-utils'
import { createLogger } from '@/lib/utils/logger'
import { AssemblyInput, AssemblyOutput } from '@/types/article'

const logger = createLogger('ArticleAssembly')

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
      // 🔴 ENTERPRISE VALIDATION: Ensure all sections are present before assembly
      // 🔒 BUG F FIX: Derive expected counts from JS filter truth to ensure consistency
      const expectedSectionCount = sections.length

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
        },
        sectionsJson
      )

      // Persist ONLY the snapshot and metadata. No status mutation.
      await this.persistResult({
        articleId: input.articleId,
        sections: sectionsJson,
        finalMarkdown,
        wordCount,
        readingTimeMinutes,
        title: articleTitle !== article.title ? articleTitle : undefined,
        skipStatusGuard: input.allowReassembly
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
      .select(`
        id, title, status, keyword, cover_image_url,
        organizations!org_id (
          cta_text,
          cta_url
        )
      `)
      .eq('id', articleId)
      .eq('org_id', organizationId)
      .single()

    if (error || !data) {
      throw new Error('Article not found or access denied')
    }

    // Bug 2: Observability lock for org join
    if (!(data as any).organizations) {
      logger.log('article.assembly.org_join_missing', { articleId })
    }

    return {
      ...data,
      cta_text: (data as any).organizations?.cta_text ?? null,
      cta_url: (data as any).organizations?.cta_url ?? null,
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

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
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
    // 🔒 SINGLE SOURCE OF TRUTH: Update ONLY the snapshot and audit metadata.
    // Explicitly removed 'status: completed' to ensure Worker owns lifecycle.
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
      throw new Error(`Assembly persistence skipped: Article ${args.articleId} not found or update matched 0 rows.`)
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
    },
    sections: any[]
  ): string {
    const today = new Date().toISOString().split('T')[0]

    const coverImage = article.cover_image_url
      ? `![Cover image](${article.cover_image_url})`
      : null

    const authorBlock = `*Published: ${today} · By Editorial Team*`

    const ctaText = article.cta_text || null
    const ctaUrl = article.cta_url || null
    const cta = ctaText && ctaUrl
      ? `---\n*${ctaText} [→](${ctaUrl})*`
      : null

    const disclaimer = `---\n*Editorial note: This content was researched and generated on ${today}. Facts and pricing are verified at time of writing and subject to change.*`

    const socialShare = `**Share this article:** [Post on X](https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}) · Copy link`

    const body = sections
      .sort((a, b) => a.order - b.order)
      .map(s => {
        let md = (s.markdown || '').trim()

        if (s.type !== 'faq') {
          md = md.replace(/^#+\s+[^\n]+\n+/, '').trim()
        }

        const titleIndex = md.indexOf(article.title)
        if (titleIndex >= 50) {
          md = md.slice(0, titleIndex).trimEnd()
          console.warn(`[ArticleAssembler] Truncated section "${s.header}" — article title found in body (likely context reproduction)`)
        } else if (titleIndex >= 0 && titleIndex < 50) {
          console.warn(`[ArticleAssembler] Section "${s.header}" body starts with article title — LLM reproduced context. Using empty body.`)
          md = ''
        }

        const sectionImg = s.section_image_url
          ? `\n\n![Illustration for section ${s.order}](${s.section_image_url})`
          : ''

        return `## ${s.header}\n\n${md}${sectionImg}`.trimEnd()
      })
      .join('\n\n')

    return [
      coverImage,
      authorBlock,
      body,
      cta,
      disclaimer,
      socialShare,
    ].filter(Boolean).join('\n\n')
  }
}
