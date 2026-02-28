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

  async assemble(input: AssemblyInput): Promise<AssemblyOutput> {
    const start = Date.now()

    // Exact contract analytics events only
    logger.log('article.assembly.started', {
      articleId: input.articleId,
      organizationId: input.organizationId
    })

    return retryWithPolicy(async () => {
      // 1. Fetch total expected sections count
      const { count: expectedSectionCount, error: countError } = await this.supabaseAdmin
        .from('article_sections')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', input.articleId)
        .neq('status', 'failed') // 🔒 INTEGRITY: Exclude explicitly failed sections

      if (countError) throw countError

      const article = await this.loadArticle(input)
      const sections = await this.loadSections(input)

      // 🔴 ENTERPRISE VALIDATION: Ensure all sections are present before assembly
      if (!sections.length || sections.length !== expectedSectionCount) {
        throw new Error(`Assembly failed: Expected ${expectedSectionCount} sections, but found ${sections.length} completed sections.`)
      }

      // 🔍 ANALYTICS: Compute metrics from relational truth
      const totalMarkdown = sections.map((s: any) => s.content_markdown).join('\n\n')
      const wordCount = this.countWords(totalMarkdown)
      const readingTimeMinutes = Math.ceil(wordCount / 200)

      if (article.status !== 'generating') {
        throw new Error(`Assembly aborted: Article ${input.articleId} is in status '${article.status}', expected 'generating'.`)
      }

      // 📸 SNAPSHOT: Normalize sections into canonical JSONB structure for UI projection
      const sectionsJson = sections.map((s: any) => ({
        header: s.section_header,
        markdown: s.content_markdown,
        html: s.content_html,
        order: s.section_order
      }))

      // 🏷️ TITLE DERIVATION: If title is missing, derive it from first section or keyword
      let articleTitle = article.title
      if (!articleTitle) {
        articleTitle = sectionsJson[0]?.header || article.keyword || 'Untitled Article'
        logger.log('article.assembly.title_derived', { articleId: input.articleId, title: articleTitle })
      }

      // Persist ONLY the snapshot and metadata. No status mutation.
      await this.persistResult({
        articleId: input.articleId,
        sections: sectionsJson,
        wordCount,
        readingTimeMinutes,
        title: articleTitle !== article.title ? articleTitle : undefined
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
      .select('id, title, status, keyword')
      .eq('id', articleId)
      .eq('org_id', organizationId)
      .single()

    if (error || !data) {
      throw new Error('Article not found or access denied')
    }

    return data
  }

  private async loadSections({ articleId }: AssemblyInput) {
    const { data, error } = await this.supabaseAdmin
      .from('article_sections')
      .select('section_order, section_header, content_markdown, content_html')
      .eq('article_id', articleId)
      .eq('status', 'completed')
      .order('section_order', { ascending: true })

    if (error) {
      throw error
    }

    return (data || []).filter((s: any) => s.content_markdown?.trim())
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
    wordCount: number
    readingTimeMinutes: number
    title?: string
  }) {
    // 🔒 SINGLE SOURCE OF TRUTH: Update ONLY the snapshot and audit metadata.
    // Explicitly removed 'status: completed' to ensure Worker owns lifecycle.
    const updatePayload: any = {
      sections: args.sections,
      word_count: args.wordCount,
      reading_time_minutes: args.readingTimeMinutes,
      updated_at: new Date().toISOString()
    }

    if (args.title) {
      updatePayload.title = args.title
    }

    const { data, error } = await this.supabaseAdmin
      .from('articles')
      .update(updatePayload)
      .eq('id', args.articleId)
      .eq('status', 'generating') // 🔒 PRODUCTION GUARD: Prevent racing assembly updates
      .select('id')

    if (error) {
      throw error
    }

    // 🔴 OBSERVABILITY: If 0 rows affected, it means the article wasn't in 'generating' state (Race condition)
    if (!data || data.length === 0) {
      throw new Error(`Assembly persistence skipped: Article ${args.articleId} is no longer in 'generating' state.`)
    }
  }
}
