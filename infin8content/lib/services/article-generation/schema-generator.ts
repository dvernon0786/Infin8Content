/**
 * Schema Markup Generator
 * Generates JSON-LD structured data for Article, FAQPage, and BreadcrumbList.
 * Stores output in articles.article_plan.schema_markup
 * No LLM needed — built algorithmically from existing article data.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ArticlePlannerOutput } from '@/types/article'

export interface SchemaGeneratorResult {
  skipped: boolean
  reason?: string
  schemasGenerated: string[]
}

export async function generateSchemaMarkup(params: {
  articleId: string
  orgId: string
  supabase: SupabaseClient
}): Promise<SchemaGeneratorResult> {
  const { articleId, orgId, supabase } = params

  // Load article + org for context
  const [
    { data: article, error: articleError },
    { data: org, error: orgError },
    { data: sections },
  ] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, keyword, article_plan, created_at, generation_completed_at, updated_at')
      .eq('id', articleId)
      .single(),
    supabase
      .from('organizations')
      .select('name, website_url')
      .eq('id', orgId)
      .single(),
    supabase
      .from('article_sections')
      .select('section_type, section_header, content_markdown')
      .eq('article_id', articleId)
      .eq('status', 'completed')
      .order('section_order'),
  ])

  if (articleError || orgError) {
    console.warn('[SchemaGenerator] Skipped due to query error', {
      articleId,
      articleError: articleError?.message,
      orgError: orgError?.message,
    })
    return { skipped: true, reason: 'query_error', schemasGenerated: [] }
  }
  if (!article || !org) {
    return { skipped: true, reason: 'missing_context', schemasGenerated: [] }
  }

  // Idempotency: skip if already generated
  if ((article.article_plan as any)?.schema_markup) {
    return { skipped: true, reason: 'already_generated', schemasGenerated: [] }
  }

  const plan = article.article_plan as ArticlePlannerOutput | null
  const baseUrl = ((org as any).website_url || '').replace(/\/$/, '')
  const articleSlug = plan?.target_keyword
    ? plan.target_keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : null
  const articleUrl = baseUrl && articleSlug ? `${baseUrl}/blog/${articleSlug}` : null
  const schemasGenerated: string[] = []
  const jsonLdBlocks: object[] = []

  // ── 1. Article Schema ────────────────────────────────────────────────────────
  const articleSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    keywords: plan?.semantic_keywords?.join(', ') || (article as any).keyword || '',
    datePublished: (article as any).generation_completed_at || article.created_at,
    dateModified: (article as any).updated_at || new Date().toISOString(),
    publisher: {
      '@type': 'Organization',
      name: org.name,
    },
  }
  if (articleUrl) articleSchema['url'] = articleUrl
  jsonLdBlocks.push(articleSchema)
  schemasGenerated.push('Article')

  // ── 2. FAQPage Schema (only if FAQ sections exist) ───────────────────────────
  const faqSections = (sections || []).filter((s: any) => s.section_type === 'faq')
  if (faqSections.length > 0) {
    const faqs = faqSections
      .map((s: any) => extractFaqPairs(s.content_markdown || ''))
      .flat()
      .filter((f: any) => f.question && f.answer)
      .slice(0, 8) // Schema.org recommends max 8

    if (faqs.length > 0) {
      jsonLdBlocks.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f: any) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: truncate(f.answer, 300) },
        })),
      })
      schemasGenerated.push('FAQPage')
    }
  }

  // ── 3. BreadcrumbList Schema ─────────────────────────────────────────────────
  if (baseUrl && articleSlug) {
    jsonLdBlocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
        {
          '@type': 'ListItem',
          position: 3,
          name: article.title,
          item: `${baseUrl}/blog/${articleSlug}`,
        },
      ],
    })
    schemasGenerated.push('BreadcrumbList')
  }

  // ── Render as <script> tags ──────────────────────────────────────────────────
  // Escape </script sequences to prevent XSS when embedding JSON-LD in HTML pages.
  const serializeJsonLd = (schema: unknown): string =>
    JSON.stringify(schema, null, 2).replace(/<\/script/gi, '<\/script')

  const schemaMarkup = jsonLdBlocks
    .map(
      (schema) =>
        `<script type="application/ld+json">\n${serializeJsonLd(schema)}\n</script>`,
    )
    .join('\n\n')

  // ── Persist to article_plan ──────────────────────────────────────────────────
  const existingPlan = (article.article_plan as Record<string, any>) || {}
  const updatedPlan = {
    ...existingPlan,
    schema_markup: schemaMarkup,
    schema_types: schemasGenerated,
    schema_generated_at: new Date().toISOString(),
  }

  await supabase
    .from('articles')
    .update({ article_plan: updatedPlan })
    .eq('id', articleId)

  console.log(
    `[SchemaGenerator] ✅ Generated: ${schemasGenerated.join(', ')} for article ${articleId}`,
  )
  return { skipped: false, schemasGenerated }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Extracts Q&A pairs from FAQ markdown.
 * Handles patterns like: ### Question?\nAnswer text
 */
function extractFaqPairs(markdown: string): { question: string; answer: string }[] {
  const pairs: { question: string; answer: string }[] = []
  const blocks = markdown.split(/\n(?=#{1,3}\s)/).filter(Boolean)

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(Boolean)
    if (lines.length < 2) continue

    const headerLine = lines[0].replace(/^#{1,3}\s*/, '').trim()
    if (
      !headerLine.includes('?') &&
      !headerLine.match(/^(what|how|why|when|where|who|is|are|can|does)/i)
    )
      continue

    const answerLines = lines
      .slice(1)
      .join(' ')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim()
    if (answerLines.length > 20) {
      pairs.push({ question: headerLine, answer: answerLines })
    }
  }
  return pairs
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '...'
}
