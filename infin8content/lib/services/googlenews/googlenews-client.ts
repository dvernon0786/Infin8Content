/**
 * Google News RSS client — Story 13-1
 * Queries the public Google News RSS feed (no API key required).
 * Requires: npm install fast-xml-parser
 */

import { XMLParser } from 'fast-xml-parser'

export interface GNStory {
  id: string               // Stable dedup key: hash(title::pubDate)
  title: string
  url: string
  excerpt: string          // description stripped of HTML (up to 280 chars)
  published_date: string | null
  author: string | null    // source/publisher name
  score: number            // always 0 — RSS has no upvote data
  comments: number         // always 0
}

const _xmlParser = new XMLParser({ ignoreAttributes: false, textNodeName: '_text' })

export async function searchGoogleNews(
  topic: string,
  opts: {
    language?:     string   // ISO 639-1, e.g. 'en', 'es'
    country?:      string   // ISO 3166-1 alpha-2, e.g. 'US', 'GB'
    daysBack?:     number
    maxResults?:   number
    resolveLinks?: boolean  // follow Google redirect → real publisher URL (slower)
  } = {}
): Promise<GNStory[]> {
  const lang       = (opts.language ?? 'en').slice(0, 2).toLowerCase()
  const country    = (opts.country  ?? 'US').slice(0, 2).toUpperCase()
  const daysBack   = opts.daysBack   ?? 7
  const maxResults = opts.maxResults ?? 10
  const hl         = `${lang}-${country}`
  const ceid       = `${country}:${lang}`
  const cutoff     = Date.now() - daysBack * 86400 * 1000

  const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=${hl}&gl=${country}&ceid=${ceid}`

  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Infin8Content-NewsPoller/1.0)' },
    signal:  AbortSignal.timeout(12_000),
  })
  if (!res.ok) throw new Error(`Google News RSS ${res.status} for topic "${topic}"`)

  const xml      = await res.text()
  const parsed   = _xmlParser.parse(xml)
  const rawItems: any[] = parsed?.rss?.channel?.item ?? []

  const filtered = rawItems
    .filter((it: any) => {
      if (!it.pubDate) return true
      return new Date(it.pubDate).getTime() >= cutoff
    })
    .slice(0, maxResults)

  const stories: GNStory[] = await Promise.all(
    filtered.map(async (it: any): Promise<GNStory> => {
      const rawLink  = String(it.link ?? '')
      const url      = opts.resolveLinks ? await _resolveLink(rawLink) : rawLink
      const title    = _strip(String(it.title ?? ''))
      const excerpt  = _strip(String(it.description ?? '')).slice(0, 280) || `Google News: ${title}`
      const pubDate  = it.pubDate ? new Date(it.pubDate).toISOString() : null
      const source   = it.source?._text ?? (typeof it.source === 'string' ? it.source : null)

      // Fix #3: use title+pubDate as composite key — stable when Google redirect URL varies between polls
      const stableKey = _hash(`${title}::${pubDate ?? rawLink}`)

      return {
        id:             stableKey,
        title:          _entities(title),
        url,
        excerpt,
        published_date: pubDate,
        author:         source,
        score:          0,
        comments:       0,
      }
    })
  )

  return stories
}

async function _resolveLink(link: string): Promise<string> {
  try {
    const r = await fetch(link, {
      method:   'HEAD',
      redirect: 'follow',
      signal:   AbortSignal.timeout(5_000),
    })
    return r.url || link
  } catch { return link }
}

// Deterministic 32-bit polynomial hash → base-36 string
function _hash(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36).padStart(8, '0')
}

function _strip(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function _entities(s: string) {
  return s
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
}
