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

const CRAWL_CACHE_TTL_DAYS = 30
const SITEMAP_PATHS = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap/sitemap.xml', '/page-sitemap.xml', '/post-sitemap.xml']
const MAX_PAGES = 200
const FETCH_TIMEOUT_MS = 8_000
const PAGE_CONCURRENCY = 10 // fetch titles in parallel batches
const WORDS_PER_LINK = 300 // SEO best practice: 1 internal link per 300 words

/**
 * Allow only relative paths or http/https absolute URLs.
 * Returns null for any unsafe scheme (e.g. javascript:, data:).
 */
function sanitizeUrl(rawUrl: string): string | null {
  if (!rawUrl) return null
  const trimmed = rawUrl.trim()
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed
  }
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
  } catch {
    // invalid URL
  }
  return null
}

/** Escape a string for safe use inside HTML attribute values. */
function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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
      const { error: updateError } = await supabase
        .from('article_sections')
        .update({
          content_markdown: markdown,
          content_html: html,
          updated_at: new Date().toISOString(),
        })
        .eq('id', section.id)

      if (updateError) {
        console.error(
          `[InternalLinking] ❌ Failed to persist links for section ${section.id}:`,
          updateError
        )
        continue
      }

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
  const settings = await getOrgSettings(orgId, supabase)
  const dbLinks = await getDBArticleLinks(orgId, currentArticleId, supabase, settings)

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
  supabase: SupabaseClient,
  orgSettings: any
): Promise<LinkEntry[]> {
  const { data } = await supabase
    .from('articles')
    .select('slug, title, keyword, publish_references')
    .eq('org_id', orgId)
    .eq('status', 'completed')
    .neq('id', currentArticleId)
    .not('slug', 'is', null)
    .not('keyword', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data) return []

  const baseUrl = (orgSettings?.website_url || '').replace(/\/$/, '')

  return data.map((a: any) => {
    const canonicalUrl =
      a?.publish_references && typeof a.publish_references === 'object'
        ? (a.publish_references as any).platform_url
        : undefined
    return {
      url: canonicalUrl || (baseUrl ? `${baseUrl}/blog/${a.slug}` : `/blog/${a.slug}`),
      anchor_text: a.keyword,
      title: a.title,
      source: 'db' as const,
    }
  })
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
      html = html.replace(htmlRegex, `<a href="${escapeHtmlAttr(link.url)}" title="${escapeHtmlAttr(link.title)}">$1</a>`)

      usedAnchors.add(anchor)
      injected++
    }
  }

  return { markdown, html, injected }
}

// ─── Sitemap Crawler (replaces DataForSEO) ────────────────────────────────────

/**
 * Crawl a website via its sitemap and cache the link map in organizations.settings.
 * Called ONLY by the `website/crawl.links` Inngest function — never during article generation.
 * Free, no API key, no polling. Works for any site that publishes a sitemap.
 */
export async function crawlAndCacheWebsiteLinks(params: {
  websiteUrl: string
  orgId: string
  supabase: SupabaseClient
}): Promise<{ success: boolean; pagesFound: number }> {
  const { websiteUrl, orgId, supabase } = params

  const base = websiteUrl.replace(/\/$/, '')

  // ── Short-circuit: skip if cache is still fresh ───────────────────────────
  const existingSettings = await getOrgSettings(orgId, supabase)
  if (existingSettings?.crawled_at && existingSettings?.website_url === websiteUrl) {
    const ageInDays = (Date.now() - new Date(existingSettings.crawled_at).getTime()) / 86_400_000
    if (ageInDays < CRAWL_CACHE_TTL_DAYS) {
      const pagesFound = (existingSettings.crawled_link_map as LinkEntry[] | undefined)?.length ?? 0
      console.log(`[InternalLinking] Cache still fresh (${ageInDays.toFixed(1)}d), skipping crawl.`)
      return { success: true, pagesFound }
    }
  }

  try {
    // ── 1. Discover sitemap ───────────────────────────────────────────────────
    const sitemapXml = await fetchSitemap(base)
    if (!sitemapXml) {
      console.warn(`[InternalLinking] No sitemap found for ${base} — crawl skipped.`)
      return { success: false, pagesFound: 0 }
    }

    // ── 2. Parse URLs from sitemap (handles sitemap index recursion) ──────────
    const urls = (await parseSitemapUrls(sitemapXml, base)).slice(0, MAX_PAGES)
    console.log(`[InternalLinking] Sitemap: ${urls.length} URLs found for ${base}`)

    if (urls.length === 0) {
      return { success: false, pagesFound: 0 }
    }

    // ── 3. Fetch page titles in parallel batches ───────────────────────────────
    const links: LinkEntry[] = []

    for (let i = 0; i < urls.length; i += PAGE_CONCURRENCY) {
      const batch = urls.slice(i, i + PAGE_CONCURRENCY)
      const results = await Promise.allSettled(batch.map(fetchPageTitle))

      for (let j = 0; j < results.length; j++) {
        const result = results[j]
        const url = batch[j]

        if (result.status === 'fulfilled' && result.value) {
          const { title } = result.value
          const anchorText = extractKeywordFromUrl(url) || title
          if (anchorText.length > 3) {
            links.push({
              url,
              anchor_text: anchorText,
              title,
              source: 'crawl',
            })
          }
        }
      }
    }

    // ── 4. Cache in organizations.settings ────────────────────────────────────
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

    console.log(`[InternalLinking] ✅ Sitemap crawl cached: ${links.length} pages for org ${orgId}`)
    return { success: true, pagesFound: links.length }

  } catch (err) {
    console.error('[InternalLinking] Sitemap crawl error:', err)
    return { success: false, pagesFound: 0 }
  }
}

// ─── Sitemap Helpers ──────────────────────────────────────────────────────────

/**
 * Try each known sitemap path in order, return the first XML response found.
 * Also checks robots.txt for a Sitemap: directive as a final fallback.
 */
async function fetchSitemap(base: string): Promise<string | null> {
  // Try standard paths first
  for (const path of SITEMAP_PATHS) {
    try {
      const res = await fetch(`${base}${path}`, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { 'User-Agent': 'Infin8Content-LinkCrawler/1.0' },
      })
      if (res.ok) {
        const text = await res.text()
        if (text.includes('<urlset') || text.includes('<sitemapindex')) {
          return text
        }
      }
    } catch {
      // try next path
    }
  }

  // Fallback: check robots.txt for Sitemap: directive
  try {
    const robotsRes = await fetch(`${base}/robots.txt`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': 'Infin8Content-LinkCrawler/1.0' },
    })
    if (robotsRes.ok) {
      const robotsTxt = await robotsRes.text()
      const match = robotsTxt.match(/^Sitemap:\s*(.+)$/im)
      if (match?.[1]) {
        const sitemapUrl = match[1].trim()
        const sitemapRes = await fetch(sitemapUrl, {
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          headers: { 'User-Agent': 'Infin8Content-LinkCrawler/1.0' },
        })
        if (sitemapRes.ok) {
          const text = await sitemapRes.text()
          if (text.includes('<urlset') || text.includes('<sitemapindex')) {
            return text
          }
        }
      }
    }
  } catch {
    // robots.txt not found or unreadable
  }

  return null
}

/**
 * Parse <loc> URLs from a sitemap or sitemap index.
 * For sitemap indexes: fetches each child sitemap and collects all URLs.
 * Filters to HTML-likely URLs only (excludes images, feeds, etc.).
 */
async function parseSitemapUrls(xml: string, base: string): Promise<string[]> {
  // Sitemap index — fetch child sitemaps recursively
  if (xml.includes('<sitemapindex')) {
    const childUrls: string[] = []
    const locMatches = xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)
    for (const match of locMatches) {
      const childUrl = match[1].trim().replace(/&amp;/g, '&')
      if (!childUrl.startsWith('http')) continue
      try {
        const res = await fetch(childUrl, {
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          headers: { 'User-Agent': 'Infin8Content-LinkCrawler/1.0' },
        })
        if (res.ok) {
          const childXml = await res.text()
          const childPages = parseUrlset(childXml)
          childUrls.push(...childPages)
          if (childUrls.length >= MAX_PAGES) break
        }
      } catch { /* skip failed child */ }
    }
    return [...new Set(childUrls)]
  }
  return parseUrlset(xml)
}

function parseUrlset(xml: string): string[] {
  const urls: string[] = []
  const locMatches = xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)
  for (const match of locMatches) {
    const url = match[1].trim()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
    if (/\.(jpg|jpeg|png|gif|webp|svg|pdf|xml|json|css|js)(\?|$)/i.test(url)) continue
    if (/\/(tag|tags|category|categories|page\/\d+|feed)\//i.test(url)) continue
    if (!url.startsWith('http')) continue
    urls.push(url)
  }
  return [...new Set(urls)]
}

/**
 * Fetch a single page and extract its title from <title> or og:title.
 * Returns null on any failure — callers handle this gracefully.
 */
async function fetchPageTitle(url: string): Promise<{ title: string } | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'Infin8Content-LinkCrawler/1.0',
        // Range header removed for compatibility
      },
    })

    if (!res.ok) return null

    const html = await res.text()

    // og:title takes priority (usually cleaner, no site suffix)
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1]

    if (ogTitle?.trim()) return { title: ogTitle.trim() }

    // Fall back to <title> tag, strip common suffixes like " | Site Name"
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
    if (titleTag) {
      const cleaned = titleTag
        .replace(/\s*[|\-–—]\s*.{1,60}$/, '') // strip "| Site Name" suffix
        .trim()
      if (cleaned.length > 3) return { title: cleaned }
    }

    return null
  } catch {
    return null
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

// ─── Testable Export ────────────────────────────────────────────────────────────
/**
 * Thin wrapper that exposes `injectLinksIntoSection` to unit tests without
 * changing any runtime behavior.
 */
export function __testInjectLinks(params: {
  markdown: string
  html: string
  linkMap: LinkEntry[]
  usedAnchors?: Set<string>
  budget: number
  currentKeyword: string
}): { markdown: string; html: string; injected: number; usedAnchors: Set<string> } {
  const usedAnchors = params.usedAnchors ?? new Set<string>()
  const result = injectLinksIntoSection({
    markdown: params.markdown,
    html: params.html,
    linkMap: params.linkMap,
    usedAnchors,
    budget: params.budget,
    currentKeyword: params.currentKeyword,
  })
  return { ...result, usedAnchors }
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

