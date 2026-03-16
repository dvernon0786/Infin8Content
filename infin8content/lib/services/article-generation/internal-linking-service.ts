/**
 * Internal Linking Service
 * Injects contextually relevant internal links into article sections.
 *
 * Link sources (priority order):
 * 1. Manual links  → organizations.settings.manual_link_map
 * 2. Crawled links → organizations.settings.crawled_link_map (30-day cache)
 * 3. DB articles   → articles WHERE org_id = X AND status = 'completed'
 *
 * Crawling is handled by the separate `website/crawl.links` Inngest function.
 * Article generation NEVER blocks on a live crawl — always uses cached data.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const DATAFORSEO_API = 'https://api.dataforseo.com/v3'
const CRAWL_CACHE_TTL_DAYS = 30
const MAX_POLL_ATTEMPTS = 12
const POLL_INTERVAL_MS = 5000
const WORDS_PER_LINK = 300 // SEO best practice: 1 internal link per 300 words

export interface LinkEntry {
  url: string
  anchor_text: string
  title: string
  source: 'db' | 'crawl' | 'manual'
}

export interface InternalLinkingResult {
  sectionsUpdated: number
  linksInjected: number
  skipped: boolean
  reason?: string
}

// ─── Main Entry Point (called from generate-article.ts step) ──────────────────

export async function runInternalLinking(params: {
  articleId: string
  orgId: string
  currentKeyword: string
  maxLinks: number
  supabase: SupabaseClient
}): Promise<InternalLinkingResult> {
  const { articleId, orgId, currentKeyword, maxLinks, supabase } = params

  const linkMap = await buildLinkMap(orgId, articleId, supabase)

  if (linkMap.length === 0) {
    return { sectionsUpdated: 0, linksInjected: 0, skipped: true, reason: 'no_links_available' }
  }

  const { data: sections, error } = await supabase
    .from('article_sections')
    .select('id, section_order, section_type, content_markdown, content_html')
    .eq('article_id', articleId)
    .eq('status', 'completed')
    .order('section_order')

  if (error || !sections?.length) {
    return { sectionsUpdated: 0, linksInjected: 0, skipped: true, reason: 'no_completed_sections' }
  }

  const totalWords = sections.reduce((acc, s) => acc + countWords(s.content_markdown || ''), 0)
  const linkBudget = Math.min(maxLinks, Math.floor(totalWords / WORDS_PER_LINK))

  if (linkBudget === 0) {
    return { sectionsUpdated: 0, linksInjected: 0, skipped: true, reason: 'article_too_short' }
  }

  let totalInjected = 0
  let sectionsUpdated = 0
  const usedAnchors = new Set<string>()

  for (const section of sections) {
    if (totalInjected >= linkBudget) break
    // Keep intro and conclusion clean — no internal links
    if (section.section_type === 'introduction' || section.section_type === 'conclusion') continue

    const { markdown, html, injected } = injectLinksIntoSection({
      markdown: section.content_markdown || '',
      html: section.content_html || '',
      linkMap,
      usedAnchors,
      budget: linkBudget - totalInjected,
      currentKeyword,
    })

    if (injected > 0) {
      await supabase
        .from('article_sections')
        .update({
          content_markdown: markdown,
          content_html: html,
          updated_at: new Date().toISOString(),
        })
        .eq('id', section.id)

      totalInjected += injected
      sectionsUpdated++
    }
  }

  console.log(`[InternalLinking] ✅ ${totalInjected} links → ${sectionsUpdated} sections (budget: ${linkBudget})`)
  return { sectionsUpdated, linksInjected: totalInjected, skipped: false }
}

// ─── Link Map Builder ──────────────────────────────────────────────────────────

async function buildLinkMap(
  orgId: string,
  currentArticleId: string,
  supabase: SupabaseClient
): Promise<LinkEntry[]> {
  const [dbLinks, settings] = await Promise.all([
    getDBArticleLinks(orgId, currentArticleId, supabase),
    getOrgSettings(orgId, supabase),
  ])

  const manualLinks: LinkEntry[] = ((settings?.manual_link_map as any[]) || []).map((l: any) => ({
    ...l,
    source: 'manual' as const,
  }))

  const crawledLinks: LinkEntry[] = getCachedCrawlLinks(settings)

  // Priority: manual > crawled > db (deduped by anchor_text)
  const merged = deduplicateByAnchor([...manualLinks, ...crawledLinks, ...dbLinks])

  console.log(
    `[InternalLinking] LinkMap → manual:${manualLinks.length} crawled:${crawledLinks.length} db:${dbLinks.length} merged:${merged.length}`
  )
  return merged
}

async function getDBArticleLinks(
  orgId: string,
  currentArticleId: string,
  supabase: SupabaseClient
): Promise<LinkEntry[]> {
  const { data } = await supabase
    .from('articles')
    .select('slug, title, keyword')
    .eq('org_id', orgId)
    .eq('status', 'completed')
    .neq('id', currentArticleId)
    .not('slug', 'is', null)
    .not('keyword', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data) return []

  return data.map((a: any) => ({
    url: `/blog/${a.slug}`,
    anchor_text: a.keyword,
    title: a.title,
    source: 'db' as const,
  }))
}

// ─── Link Injection Engine ─────────────────────────────────────────────────────

function injectLinksIntoSection(params: {
  markdown: string
  html: string
  linkMap: LinkEntry[]
  usedAnchors: Set<string>
  budget: number
  currentKeyword: string
}): { markdown: string; html: string; injected: number } {
  const { linkMap, usedAnchors, budget, currentKeyword } = params
  let markdown = params.markdown
  let html = params.html
  let injected = 0

  for (const link of linkMap) {
    if (injected >= budget) break

    const anchor = link.anchor_text.toLowerCase().trim()

    if (usedAnchors.has(anchor)) continue
    if (anchor === currentKeyword.toLowerCase().trim()) continue // never link primary keyword
    if (anchor.length < 4) continue

    // Markdown: match bare text NOT already inside [text](url) syntax
    const mdRegex = new RegExp(
      `(?<!\\[)(?<!\\]\\()\\b(${escapeRegex(link.anchor_text)})\\b(?![^\\[]*\\])`,
      'i'
    )

    if (mdRegex.test(markdown)) {
      markdown = markdown.replace(mdRegex, `[$1](${link.url})`)

      // HTML: match first occurrence NOT already inside an <a> tag
      const htmlRegex = new RegExp(
        `(?!(?:[^<]|<(?!/?a\\b))*?<\\/a>)\\b(${escapeRegex(link.anchor_text)})\\b`,
        'i'
      )
      html = html.replace(htmlRegex, `<a href="${link.url}" title="${link.title}">$1</a>`)

      usedAnchors.add(anchor)
      injected++
    }
  }

  return { markdown, html, injected }
}

// ─── DataForSEO On-Page Crawl ──────────────────────────────────────────────────

/**
 * Full DataForSEO On-Page crawl — caches results in organizations.settings.
 * Called ONLY by the separate `website/crawl.links` Inngest function.
 * Cost: ~$0.000125/page (Basic mode). 200-page site ≈ $0.025.
 */
export async function crawlAndCacheWebsiteLinks(params: {
  websiteUrl: string
  orgId: string
  supabase: SupabaseClient
}): Promise<{ success: boolean; pagesFound: number }> {
  const { websiteUrl, orgId, supabase } = params
  const auth = getDataForSEOAuth()

  if (!auth) {
    console.warn('[InternalLinking] DATAFORSEO_LOGIN/PASSWORD not set, skipping crawl.')
    return { success: false, pagesFound: 0 }
  }

  try {
    // 1. POST crawl task
    const taskRes = await fetch(`${DATAFORSEO_API}/on_page/task_post`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{
        target: websiteUrl,
        max_crawl_pages: 200,
        load_resources: false,
        enable_javascript: false,
        store_raw_html: false,
        check_spell: false,
        crawl_delay: 500,
      }]),
    })

    const taskData = await taskRes.json()
    const taskId = taskData?.tasks?.[0]?.id
    if (!taskId) throw new Error(`task_post failed: ${JSON.stringify(taskData)}`)

    console.log(`[InternalLinking] Crawl task started: ${taskId}`)

    // 2. Poll for completion
    let crawlFinished = false
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await sleep(POLL_INTERVAL_MS)

      const summaryRes = await fetch(`${DATAFORSEO_API}/on_page/summary/${taskId}`, {
        headers: { Authorization: `Basic ${auth}` },
      })
      const summaryData = await summaryRes.json()
      const progress = summaryData?.tasks?.[0]?.result?.[0]?.crawl_progress

      console.log(`[InternalLinking] Crawl progress: ${progress} (${i + 1}/${MAX_POLL_ATTEMPTS})`)
      if (progress === 'finished') { crawlFinished = true; break }
    }

    if (!crawlFinished) {
      console.warn('[InternalLinking] Crawl timed out, will retry next generation.')
      return { success: false, pagesFound: 0 }
    }

    // 3. Fetch pages
    const pagesRes = await fetch(`${DATAFORSEO_API}/on_page/pages`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([{
        id: taskId,
        limit: 200,
        filters: [['resource_type', '=', 'html'], ['status_code', '=', 200]],
      }]),
    })
    const pagesData = await pagesRes.json()
    const pages: any[] = pagesData?.tasks?.[0]?.result?.[0]?.items || []

    const links: LinkEntry[] = pages
      .filter((p: any) => p.url && p.meta?.title)
      .map((p: any) => ({
        url: p.url,
        anchor_text: extractKeywordFromUrl(p.url) || p.meta?.title || '',
        title: p.meta?.title || '',
        source: 'crawl' as const,
      }))
      .filter((l) => l.anchor_text.length > 3)

    // 4. Cache in organizations.settings (merge, don't overwrite)
    const { data: orgData } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .single()

    const updatedSettings = {
      ...(orgData?.settings || {}),
      crawled_link_map: links,
      crawled_at: new Date().toISOString(),
      website_url: websiteUrl,
    }

    await supabase
      .from('organizations')
      .update({ settings: updatedSettings })
      .eq('id', orgId)

    console.log(`[InternalLinking] ✅ Crawl cached: ${links.length} pages for org ${orgId}`)
    return { success: true, pagesFound: links.length }

  } catch (err) {
    console.error('[InternalLinking] Crawl error:', err)
    return { success: false, pagesFound: 0 }
  }
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function getCachedCrawlLinks(settings: any): LinkEntry[] {
  if (!settings?.crawled_link_map || !settings?.crawled_at) return []
  const ageInDays = (Date.now() - new Date(settings.crawled_at).getTime()) / 86_400_000
  if (ageInDays > CRAWL_CACHE_TTL_DAYS) {
    console.log('[InternalLinking] Crawl cache expired (>30 days).')
    return []
  }
  return settings.crawled_link_map as LinkEntry[]
}

async function getOrgSettings(orgId: string, supabase: SupabaseClient): Promise<any> {
  const { data } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', orgId)
    .single()
  return data?.settings || {}
}

function deduplicateByAnchor(links: LinkEntry[]): LinkEntry[] {
  const seen = new Set<string>()
  return links.filter((l) => {
    const key = l.anchor_text.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function extractKeywordFromUrl(url: string): string {
  try {
    const segment = new URL(url).pathname.split('/').filter(Boolean).pop() || ''
    return segment.replace(/-/g, ' ')
  } catch { return '' }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getDataForSEOAuth(): string | null {
  const login = process.env.DATAFORSEO_LOGIN
  const password = process.env.DATAFORSEO_PASSWORD
  if (!login || !password) return null
  return Buffer.from(`${login}:${password}`).toString('base64')
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
