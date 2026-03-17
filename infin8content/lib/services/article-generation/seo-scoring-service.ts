/**
 * SEO Scoring Service
 * Algorithmic scoring — no LLM needed.
 * Scores the final assembled article across 4 dimensions.
 * Stores result in articles.article_plan.seo_score
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface SEOScoreResult {
  overall: number // 0–100 weighted average
  eeat: number // Author signals, citations, expertise markers
  geo: number // Entity clarity, definition blocks, citation quality
  aeo: number // FAQ quality, question headers, snippet readiness
  technical: number // Schema present, internal links, word count, keyword density
  internal_links_count: number
  schema_types: string[]
  word_count: number
  faq_count: number
  headers_as_questions: number
  scored_at: string
  recommendations: string[]
}

export async function scoreSEO(params: {
  articleId: string
  supabase: SupabaseClient
}): Promise<{ skipped: boolean; score?: SEOScoreResult }> {
  const { articleId, supabase } = params

  const [
    { data: article, error: articleError },
    { data: sections, error: sectionsError },
  ] = await Promise.all([
    supabase
      .from('articles')
      .select('id, title, keyword, word_count, article_plan, final_markdown')
      .eq('id', articleId)
      .single(),
    supabase
      .from('article_sections')
      .select('section_type, section_header, content_markdown, content_html')
      .eq('article_id', articleId)
      .eq('status', 'completed')
      .order('section_order'),
  ])

  if (articleError || sectionsError) {
    const reason = [
      articleError && `article: ${articleError.message}`,
      sectionsError && `sections: ${sectionsError.message}`,
    ].filter(Boolean).join(' | ')
    console.error('[SEOScore] Skipped due to Supabase error', { articleId, reason })
    return { skipped: true }
  }
  if (!article) return { skipped: true }

  const articlePlan = (article.article_plan as Record<string, any>) || {}
  const sectionsMarkdown = Array.isArray(sections) && sections.length
    ? sections.map((s: any) => (s.content_markdown as string) || '').join('\n\n')
    : ''
  const articleFinalMarkdown = ((article as any).final_markdown as string) || ''
  const content =
    articleFinalMarkdown ||
    (articlePlan.final_markdown as string) ||
    sectionsMarkdown ||
    ''
  const plan = article.article_plan as any

  const recommendations: string[] = []

  // ── E-E-A-T Score ──────────────────────────────────────────────────────────
  let eeat = 50
  const citationCount = (content.match(/https?:\/\//g) || []).length
  if (citationCount >= 5) eeat += 20
  else if (citationCount >= 3) eeat += 10
  else recommendations.push('Add at least 3 external citations from authoritative sources')

  const hasExpertPhrases = /\b(research shows|studies indicate|according to|experts recommend)\b/i.test(content)
  if (hasExpertPhrases) eeat += 15
  else recommendations.push('Include expert-attribution phrases (e.g. "research shows", "according to")')

  const wordCount: number =
    (article.word_count as number) || content.split(/\s+/).filter(Boolean).length
  if (wordCount >= 1500) eeat += 15
  else if (wordCount >= 800) eeat += 5
  else recommendations.push('Increase article length to at least 1,500 words for topical authority')

  eeat = Math.min(eeat, 100)

  // ── GEO Score ──────────────────────────────────────────────────────────────
  let geo = 40
  const hasDefinitionBlock =
    content.includes('refers to') ||
    content.includes('is defined as') ||
    content.includes('> **')
  if (hasDefinitionBlock) geo += 25
  else recommendations.push('Add a definition block for the primary entity in the introduction')

  const uniqueDomains = new Set(
    (content.match(/https?:\/\/([^/\s]+)/g) || []).map((u) => {
      try {
        return new URL(u).hostname
      } catch {
        return u
      }
    }),
  )
  if (uniqueDomains.size >= 3) geo += 20
  else recommendations.push('Cite at least 3 different external domains to improve source diversity')

  const semanticKeywords: string[] = plan?.semantic_keywords || []
  const semanticCoverage = semanticKeywords.filter((kw: string) =>
    content.toLowerCase().includes(kw.toLowerCase()),
  ).length
  if (semanticKeywords.length > 0) {
    geo += Math.round((semanticCoverage / semanticKeywords.length) * 15)
  }

  geo = Math.min(geo, 100)

  // ── AEO Score ──────────────────────────────────────────────────────────────
  let aeo = 30
  const faqSections = (sections || []).filter((s: any) => s.section_type === 'faq')
  const faqCount = faqSections.length

  if (faqCount >= 1) aeo += 25
  else recommendations.push('Add a FAQ section to target featured snippets and PAA boxes')

  const headersAsQuestions = (sections || []).filter((s: any) => {
    const h = s.section_header || ''
    return (
      h.endsWith('?') || /^(what|how|why|when|where|who|which|is|are|can|does)/i.test(h)
    )
  }).length

  const totalHeaders = (sections || []).length
  const questionRatio = totalHeaders > 0 ? headersAsQuestions / totalHeaders : 0
  aeo += Math.round(questionRatio * 25)

  if (questionRatio < 0.4)
    recommendations.push('Rewrite at least 40% of H2/H3 headers as questions for PAA targeting')

  const longFaqAnswers = faqSections.filter((s: any) => {
    const words = (s.content_markdown || '').split(/\s+/).filter(Boolean).length
    return words > 80
  }).length

  if (longFaqAnswers === 0 && faqCount > 0) aeo += 20
  else if (longFaqAnswers > 0)
    recommendations.push(
      `Trim ${longFaqAnswers} FAQ answer(s) to under 60 words for snippet eligibility`,
    )

  aeo = Math.min(aeo, 100)

  // ── Technical Score ────────────────────────────────────────────────────────
  let technical = 30
  const schemaTypes: string[] = articlePlan.schema_types || []
  const internalLinksCount =
    (content.match(/\[.*?\]\(\/[^)]+\)/g) || []).length +
    (content.match(/<a href="\/[^"]+"/g) || []).length

  if (schemaTypes.includes('Article')) technical += 20
  else recommendations.push('Generate Article JSON-LD schema markup')

  if (schemaTypes.includes('FAQPage')) technical += 15
  if (schemaTypes.includes('BreadcrumbList')) technical += 10

  if (internalLinksCount >= 3) technical += 15
  else if (internalLinksCount >= 1) technical += 8
  else recommendations.push('Add at least 3 internal links to related content')

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const keyword = ((article.keyword as string) || '').toLowerCase()
  if (keyword) {
    const keywordCount = (
      content.toLowerCase().match(new RegExp(escapeRegExp(keyword), 'g')) || []
    ).length
    const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0
    if (density >= 0.5 && density <= 2.5) technical += 10
    else if (density > 2.5)
      recommendations.push(
        'Reduce keyword density — currently over 2.5% which may trigger over-optimisation flags',
      )
    else recommendations.push('Increase keyword density to 0.5–2.5% of total word count')
  }

  technical = Math.min(technical, 100)

  // ── Overall (Weighted) ─────────────────────────────────────────────────────
  const overall = Math.round(eeat * 0.3 + geo * 0.25 + aeo * 0.25 + technical * 0.2)

  const score: SEOScoreResult = {
    overall,
    eeat,
    geo,
    aeo,
    technical,
    internal_links_count: internalLinksCount,
    schema_types: schemaTypes,
    word_count: wordCount,
    faq_count: faqCount,
    headers_as_questions: headersAsQuestions,
    scored_at: new Date().toISOString(),
    recommendations: recommendations.slice(0, 5),
  }

  await supabase
    .from('articles')
    .update({ article_plan: { ...articlePlan, seo_score: score } })
    .eq('id', articleId)

  console.log(
    `[SEOScore] ✅ overall:${overall} eeat:${eeat} geo:${geo} aeo:${aeo} tech:${technical}`,
  )
  return { skipped: false, score }
}
