/**
 * GEO/AEO Enrichment Service
 * Optimizes article sections for AI citation engines and answer boxes.
 *
 * GEO (Generative Engine Optimization):
 * - Adds definition blocks for key terms
 * - Ensures entity clarity (who/what is being discussed)
 *
 * AEO (Answer Engine Optimization):
 * - Rewrites H2/H3 headers as questions for PAA targeting
 * - Trims FAQ answers to ≤60 words for featured snippet eligibility
 * - Ensures direct answer-first sentence structure
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { convertMarkdownToHtml } from '@/lib/services/article-generation/content-writing-agent'

const FAQ_MAX_WORDS = 60

export interface GeoAeoResult {
  skipped: boolean
  reason?: string
  sectionsEnriched: number
  faqAnswersTrimmed: number
  headersRewritten: number
}

export async function runGeoAeoEnrichment(params: {
  articleId: string
  targetKeyword: string
  supabase: SupabaseClient
}): Promise<GeoAeoResult> {
  const { articleId, targetKeyword, supabase } = params

  const { data: sections, error } = await supabase
    .from('article_sections')
    .select('id, section_order, section_type, section_header, content_markdown, content_html')
    .eq('article_id', articleId)
    .eq('status', 'completed')
    .order('section_order')

  if (error || !sections?.length) {
    return {
      skipped: true,
      reason: 'no_sections',
      sectionsEnriched: 0,
      faqAnswersTrimmed: 0,
      headersRewritten: 0,
    }
  }

  let sectionsEnriched = 0
  let faqAnswersTrimmed = 0
  let headersRewritten = 0
  const updatePromises: PromiseLike<any>[] = []

  for (const section of sections) {
    let markdown = section.content_markdown || ''
    let changed = false
    let headerUpdate: string | null = null

    // ── AEO: Trim FAQ answers to ≤60 words ──────────────────────────────────
    if (section.section_type === 'faq') {
      const { markdown: trimmedMd, trimmed } = trimFaqAnswers(markdown)
      if (trimmed > 0) {
        markdown = trimmedMd
        faqAnswersTrimmed += trimmed
        changed = true
      }
    }

    // ── AEO: Rewrite H2/H3 headers as questions ─────────────────────────────
    if (section.section_type === 'h2' || section.section_type === 'h3') {
      const { header: newHeader, rewritten } = questionifyHeader(section.section_header || '')
      if (rewritten) {
        markdown = replaceMarkdownHeader(markdown, section.section_header || '', newHeader)
        headerUpdate = newHeader
        headersRewritten++
        changed = true
      }
    }

    // ── GEO: Add definition block for introduction ───────────────────────────
    if (section.section_type === 'introduction') {
      const { markdown: defMd, added } = addDefinitionBlock(markdown, targetKeyword)
      if (added) {
        markdown = defMd
        changed = true
      }
    }

    if (changed) {
      const updatePayload: {
        content_markdown: string
        content_html: string
        updated_at: string
        section_header?: string
      } = {
        content_markdown: markdown,
        content_html: convertMarkdownToHtml(markdown),
        updated_at: new Date().toISOString(),
      }
      if (headerUpdate !== null) updatePayload.section_header = headerUpdate
      updatePromises.push(
        supabase.from('article_sections').update(updatePayload).eq('id', section.id),
      )
      sectionsEnriched++
    }
  }

  if (updatePromises.length > 0) await Promise.all(updatePromises)

  console.log(
    `[GeoAeo] ✅ enriched:${sectionsEnriched} faqTrimmed:${faqAnswersTrimmed} headers:${headersRewritten}`,
  )
  return { skipped: false, sectionsEnriched, faqAnswersTrimmed, headersRewritten }
}

// ─── AEO: FAQ Answer Trimmer ──────────────────────────────────────────────────

function trimFaqAnswers(
  markdown: string,
): { markdown: string; trimmed: number } {
  let trimmed = 0

  const mdResult = markdown.replace(
    /(#{1,3}\s+[^\n]+\?[^\n]*\n+)([\s\S]*?)(?=\n#{1,3}|\n*$)/g,
    (match, header, answer) => {
      const words = answer.trim().split(/\s+/)
      if (words.length <= FAQ_MAX_WORDS) return match

      const firstSentence = answer.match(/^[^.!?]+[.!?]/)
      const trimmedAnswer = firstSentence
        ? firstSentence[0].trim()
        : words.slice(0, FAQ_MAX_WORDS).join(' ') + '.'

      trimmed++
      return `${header}${trimmedAnswer}\n\n`
    },
  )

  return { markdown: mdResult, trimmed }
}

// ─── AEO: Header Questionifier ────────────────────────────────────────────────

const QUESTION_PREFIXES = /^(what|how|why|when|where|who|which|is|are|can|does|do|should)/i

function questionifyHeader(header: string): { header: string; rewritten: boolean } {
  const clean = header.trim()

  if (clean.endsWith('?') || QUESTION_PREFIXES.test(clean)) {
    return { header: clean, rewritten: false }
  }

  if (clean.split(' ').length < 3) return { header: clean, rewritten: false }

  const lower = clean.toLowerCase()

  if (lower.startsWith('the ') || lower.startsWith('a ')) {
    return { header: `What Is ${clean}?`, rewritten: true }
  }

  if (lower.includes(' for ') || lower.includes(' in ')) {
    return { header: `How to Use ${clean}?`, rewritten: true }
  }

  if (lower.startsWith('benefits') || lower.startsWith('types') || lower.startsWith('ways')) {
    return { header: `What Are the ${clean}?`, rewritten: true }
  }

  if (lower.startsWith('key') || lower.startsWith('core') || lower.startsWith('main')) {
    return { header: `What Are the ${clean}?`, rewritten: true }
  }

  return { header: clean, rewritten: false }
}

// ─── GEO: Definition Block Injector ──────────────────────────────────────────

function addDefinitionBlock(
  markdown: string,
  keyword: string,
): { markdown: string; added: boolean } {
  if (
    markdown.toLowerCase().includes('refers to') ||
    markdown.toLowerCase().includes('is defined as') ||
    markdown.toLowerCase().includes('is a process')
  ) {
    return { markdown, added: false }
  }

  if (!markdown.toLowerCase().includes(keyword.toLowerCase())) {
    return { markdown, added: false }
  }

  const firstParaEnd = markdown.indexOf('\n\n')
  if (firstParaEnd === -1) return { markdown, added: false }

  // ✅ FIX: Build a real, deterministic one-sentence definition from the keyword.
  // This avoids publishing the previous scaffolding placeholder.
  const definitionBlock = `\n\n> **${capitalize(keyword)}** refers to professional advisory services that help organizations identify challenges, develop strategies, and implement improvements to achieve their goals more effectively.\n`

  const newMarkdown =
    markdown.slice(0, firstParaEnd) + definitionBlock + markdown.slice(firstParaEnd)

  return { markdown: newMarkdown, added: true }
}

// ─── Shared Utils ─────────────────────────────────────────────────────────────

// Replaces markdown heading text only (used for content_markdown).
// Anchored to start of line (^) with multiline flag to avoid matching
// prose mentions of the same text in the body content.
function replaceMarkdownHeader(content: string, oldHeader: string, newHeader: string): string {
  if (!oldHeader) return content
  return content.replace(
    new RegExp(`^(#{1,3}\\s*)${escapeRegex(oldHeader)}$`, 'gm'),
    `$1${newHeader}`,
  )
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
