import { createServiceRoleClient } from '@/lib/supabase/server'
import { retryWithPolicy } from '@/lib/services/intent-engine/retry-utils'
import { createLogger } from '@/lib/utils/logger'
import { AssemblyInput, TOCEntry, AssemblyOutput } from '@/types/article'

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

      const toc = this.buildTOC(sections)
      const markdown = this.buildMarkdown(article.title, toc, sections)
      const html = this.buildHTML(article.title, toc, sections)

      const wordCount = this.countWords(markdown)
      const readingTimeMinutes = Math.ceil(wordCount / 200)

      // Normalize sections into canonical JSONB structure
      const sectionsJson = sections.map((s: any) => ({
        header: s.section_header,
        markdown: s.content_markdown,
        html: s.content_html,
        order: s.section_order
      }))

      await this.persistResult({
        articleId: input.articleId,
        sections: sectionsJson
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
        markdown,
        html,
        wordCount,
        readingTimeMinutes,
        tableOfContents: toc
      }
    })
  }

  private async loadArticle({ articleId, organizationId }: AssemblyInput) {
    const { data, error } = await this.supabaseAdmin
      .from('articles')
      .select('id, title, status')
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

  private buildTOC(sections: { section_header: string }[]): TOCEntry[] {
    return sections.map(section => {
      const anchor = this.slugify(section.section_header)
      return {
        level: 2,
        header: section.section_header,
        anchor
      }
    })
  }

  private buildMarkdown(
    title: string,
    toc: TOCEntry[],
    sections: { section_header: string; content_markdown: string }[]
  ): string {
    const tocBlock = toc
      .map(t => `- [${t.header}](#${t.anchor})`)
      .join('\n')

    const body = sections
      .map(
        s =>
          `## ${s.section_header}\n\n${s.content_markdown.trim()}\n`
      )
      .join('\n')

    return `# ${title}\n\n## Table of Contents\n${tocBlock}\n\n${body}`
  }

  private buildHTML(
    title: string,
    toc: TOCEntry[],
    sections: { section_header: string; content_html: string }[]
  ): string {
    const tocHtml = toc
      .map(
        t =>
          `<li><a href="#${t.anchor}">${t.header}</a></li>`
      )
      .join('')

    const body = sections
      .map(
        s => `
<section id="${this.slugify(s.section_header)}">
  <h2>${s.section_header}</h2>
  ${s.content_html}
</section>`
      )
      .join('\n')

    return `
<h1>${title}</h1>
<nav>
  <ul>${tocHtml}</ul>
</nav>
${body}
`.trim()
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
  }) {
    // SINGLE AUTHORITY: Update sections and set terminal generation_completed_at.
    // The FSM transition to 'completed' happens in the Inngest worker.
    const { data, error } = await this.supabaseAdmin
      .from('articles')
      .update({
        sections: args.sections,
        status: 'completed', // Assembler marks the ARTICLE row as completed
        generation_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
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
