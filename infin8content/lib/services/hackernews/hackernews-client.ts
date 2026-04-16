/**
 * HackerNews client — Story 13-1
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1  (no auth required)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0
 * Reference: https://github.com/HackerNews/API
 */

const ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'
const FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'

export interface HNStory {
  id: string               // Algolia objectID — used as source_id for dedup
  title: string
  url: string              // story URL (or HN discussion link as fallback)
  excerpt: string          // stripped story_text (up to 280 chars)
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

export async function searchHNStories(
  topic: string,
  opts: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = opts.daysBack   ?? 7
  const maxResults = opts.maxResults ?? 10
  try {
    return await _algolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia failed, falling back to Firebase:', (err as Error).message)
    return await _firebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ─────────────────────────────────────────────────────────

async function _algolia(topic: string, daysBack: number, max: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query:          topic,
    tags:           'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage:    String(Math.min(max, 50)),
  })

  const res = await fetch(`${ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal:  AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia ${res.status}`)

  const { hits = [] } = await res.json()

  return (hits as any[])
    .filter((h: any) => h.title && (h.url || h.objectID))
    .slice(0, max)
    .map((h: any): HNStory => ({
      id:             String(h.objectID),
      title:          _entities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        _strip(h.story_text ?? '').slice(0, 280) || `Hacker News: ${topic}`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ────────────────────────────────────────────

async function _firebase(topic: string, daysBack: number, max: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${FIREBASE_BASE}/newstories.json`, {
    signal: AbortSignal.timeout(10_000),
  })
  if (!listRes.ok) throw new Error(`Firebase ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 150).map(_fetchItem))

  const lower = topic.toLowerCase()
  const out: HNStory[] = []

  for (const r of items) {
    if (r.status !== 'fulfilled' || !r.value) continue
    const it = r.value
    if (it.type !== 'story' || !it.title || !it.url || it.time < cutoff) continue
    if (
      !it.title.toLowerCase().includes(lower) &&
      !(it.text ?? '').toLowerCase().includes(lower)
    ) continue
    out.push({
      id:             String(it.id),
      title:          _entities(it.title),
      url:            it.url,
      excerpt:        it.text ? _strip(it.text).slice(0, 280) : `Hacker News: ${it.title}`,
      published_date: new Date(it.time * 1000).toISOString(),
      author:         it.by ?? null,
      score:          it.score ?? 0,
      comments:       it.descendants ?? 0,
    })
    if (out.length >= max) break
  }
  return out.sort((a, b) => b.score - a.score)
}

async function _fetchItem(id: number): Promise<any | null> {
  try {
    const r = await fetch(`${FIREBASE_BASE}/item/${id}.json`, {
      signal: AbortSignal.timeout(5_000),
    })
    return r.ok ? r.json() : null
  } catch { return null }
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
