# Code Citations

## License: MIT
https://github.com/DHANANJAY1233/commerce/blob/659b9094bda6a3328a34596be5d89f7dddd50e34/lib/utils.ts

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/
```


## License: unknown
https://github.com/rickdog/chewbone/blob/8519f21bfa5bc5b431808671c66f01cba9cc4c2d/javascript/scrapbook.js

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/
```


## License: MIT
https://github.com/DHANANJAY1233/commerce/blob/659b9094bda6a3328a34596be5d89f7dddd50e34/lib/utils.ts

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/
```


## License: unknown
https://github.com/rickdog/chewbone/blob/8519f21bfa5bc5b431808671c66f01cba9cc4c2d/javascript/scrapbook.js

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/
```


## License: unknown
https://github.com/rickdog/chewbone/blob/8519f21bfa5bc5b431808671c66f01cba9cc4c2d/javascript/scrapbook.js

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/
```


## License: MIT
https://github.com/DHANANJAY1233/commerce/blob/659b9094bda6a3328a34596be5d89f7dddd50e34/lib/utils.ts

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/
```


## License: unknown
https://github.com/rickdog/chewbone/blob/8519f21bfa5bc5b431808671c66f01cba9cc4c2d/javascript/scrapbook.js

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/
```


## License: MIT
https://github.com/DHANANJAY1233/commerce/blob/659b9094bda6a3328a34596be5d89f7dddd50e34/lib/utils.ts

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/
```


## License: MIT
https://github.com/skanaar/nomnoml/blob/c8c0ea8617758daf1646630326e315e892794590/webapp/util.ts

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```


## License: AGPL-3.0
https://github.com/Br3nda/laconica/blob/ecac4b3fff2b3003bac29183c86cfc00f21d52c4/plugins/Realtime/realtimeupdate.js

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```


## License: MIT
https://github.com/skanaar/nomnoml/blob/c8c0ea8617758daf1646630326e315e892794590/webapp/util.ts

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```


## License: AGPL-3.0
https://github.com/Br3nda/laconica/blob/ecac4b3fff2b3003bac29183c86cfc00f21d52c4/plugins/Realtime/realtimeupdate.js

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```


## License: unknown
https://github.com/rickdog/chewbone/blob/8519f21bfa5bc5b431808671c66f01cba9cc4c2d/javascript/scrapbook.js

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```


## License: MIT
https://github.com/skanaar/nomnoml/blob/c8c0ea8617758daf1646630326e315e892794590/webapp/util.ts

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```


## License: AGPL-3.0
https://github.com/Br3nda/laconica/blob/ecac4b3fff2b3003bac29183c86cfc00f21d52c4/plugins/Realtime/realtimeupdate.js

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```


## License: unknown
https://github.com/rickdog/chewbone/blob/8519f21bfa5bc5b431808671c66f01cba9cc4c2d/javascript/scrapbook.js

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```


## License: MIT
https://github.com/skanaar/nomnoml/blob/c8c0ea8617758daf1646630326e315e892794590/webapp/util.ts

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```


## License: AGPL-3.0
https://github.com/Br3nda/laconica/blob/ecac4b3fff2b3003bac29183c86cfc00f21d52c4/plugins/Realtime/realtimeupdate.js

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```


## License: unknown
https://github.com/rickdog/chewbone/blob/8519f21bfa5bc5b431808671c66f01cba9cc4c2d/javascript/scrapbook.js

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```


## License: AGPL-3.0
https://github.com/Br3nda/laconica/blob/ecac4b3fff2b3003bac29183c86cfc00f21d52c4/plugins/Realtime/realtimeupdate.js

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```


## License: unknown
https://github.com/rickdog/chewbone/blob/8519f21bfa5bc5b431808671c66f01cba9cc4c2d/javascript/scrapbook.js

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```


## License: MIT
https://github.com/skanaar/nomnoml/blob/c8c0ea8617758daf1646630326e315e892794590/webapp/util.ts

```
You're in **Ask** mode — I can't write files directly. Here's the complete code you need to apply manually.

---

## File 1 — NEW: `lib/services/hackernews/hackernews-client.ts`

The official HN Firebase API has no search endpoint, so the canonical approach is Algolia's HN Search API (`hn.algolia.com`) with Firebase as a fallback. No API key required for either.

```ts
/**
 * HackerNews client — Story 13-1 (Generate News Articles from Latest Events)
 *
 * Primary:  Algolia HN Search API  https://hn.algolia.com/api/v1/search  (topic + time, no auth)
 * Fallback: HN Firebase API        https://hacker-news.firebaseio.com/v0/ (real-time newstories)
 *
 * Reference: https://github.com/HackerNews/API
 */

const HN_FIREBASE_BASE = 'https://hacker-news.firebaseio.com/v0'
const HN_ALGOLIA_BASE  = 'https://hn.algolia.com/api/v1'

export interface HNStory {
  title: string
  url: string
  excerpt: string
  published_date: string | null
  author: string | null
  score: number
  comments: number
}

/**
 * Search HackerNews stories by topic within a rolling time window.
 * Uses Algolia search; falls back to Firebase newstories if Algolia is unreachable.
 */
export async function searchHNStories(
  topic: string,
  options: { daysBack?: number; maxResults?: number } = {}
): Promise<HNStory[]> {
  const daysBack   = options.daysBack   ?? 7
  const maxResults = options.maxResults ?? 10
  try {
    return await searchViaAlgolia(topic, daysBack, maxResults)
  } catch (err) {
    console.warn('[HackerNews] Algolia search failed, falling back to Firebase newstories:', err instanceof Error ? err.message : err)
    return await fetchRecentStoriesFromFirebase(topic, daysBack, maxResults)
  }
}

// ── Algolia (primary) ────────────────────────────────────────────────────────

async function searchViaAlgolia(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const params = new URLSearchParams({
    query: topic,
    tags: 'story',
    numericFilters: `created_at_i>${cutoff}`,
    hitsPerPage: String(Math.min(maxResults, 50)),
  })

  const res = await fetch(`${HN_ALGOLIA_BASE}/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Algolia HN search error: ${res.status} ${res.statusText}`)

  const { hits = [] } = await res.json()
  return (hits as any[])
    .filter(h => h.title && (h.url || h.objectID))
    .slice(0, maxResults)
    .map(h => ({
      title:          decodeHtmlEntities(h.title),
      url:            h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      excerpt:        stripHtml(h.story_text ?? '').slice(0, 280) || `${topic} — discussed on Hacker News`,
      published_date: h.created_at ? new Date(h.created_at).toISOString() : null,
      author:         h.author ?? null,
      score:          h.points ?? 0,
      comments:       h.num_comments ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
}

// ── Firebase newstories (fallback) ───────────────────────────────────────────

async function fetchRecentStoriesFromFirebase(topic: string, daysBack: number, maxResults: number): Promise<HNStory[]> {
  const cutoff = Math.floor(Date.now() / 1000) - daysBack * 86400
  const listRes = await fetch(`${HN_FIREBASE_BASE}/newstories.json`, { signal: AbortSignal.timeout(10_000) })
  if (!listRes.ok) throw new Error(`HN Firebase API error: ${listRes.status}`)

  const ids: number[] = await listRes.json()
  const items = await Promise.allSettled(ids.slice(0, 100).map(fetchItem))

  const lowerTopic = topic.toLowerCase()
  const stories: HNStory[] = []

  for (const result of items) {
    if (result.status !== 'fulfilled' || !result.value) continue
    const item = result.value
    if (item.type !== 'story' || !item.title || !item.url) continue
    if (item.time < cutoff) continue
    const matchesTitle = item.title.toLowerCase().includes(lowerTopic)
    const matchesText  = (item.text ?? '').toLowerCase().includes(lowerTopic)
    if (!matchesTitle && !matchesText) continue
    stories.push({
      title:          decodeHtmlEntities(item.title),
      url:            item.url,
      excerpt:        item.text ? stripHtml(item.text).slice(0, 280) : `${item.title} — Hacker News`,
      published_date: new Date(item.time * 1000).toISOString(),
      author:         item.by ?? null,
      score:          item.score ?? 0,
      comments:       item.descendants ?? 0,
    })
    if (stories.length >= maxResults) break
  }
  return stories.sort((a, b) => b.score - a.score)
}

async function fetchItem(id: number): Promise<any | null> {
  try {
    const res = await fetch(`${HN_FIREBASE_BASE}/item/${id}.json`, { signal: AbortSignal.timeout(5_000) })
    return res.ok ? res.json() : null
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39
```

