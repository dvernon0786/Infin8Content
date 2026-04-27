/**
 * YouTube Transcript Client
 * Story 13-3: Convert YouTube Videos to Blog Posts
 *
 * Thin TypeScript client for the Python transcript microservice
 * (services/transcript-service/). No YouTube Data API key required.
 *
 * Required env var:
 *   TRANSCRIPT_SERVICE_URL — URL of the running transcript microservice
 *   Local dev:   http://localhost:8001
 *   Production:  Railway private networking URL (e.g. http://transcript-service.railway.internal:PORT)
 */

export interface TranscriptResult {
  videoId: string
  fullText: string
  language: string
  source: 'captions' | 'none'
  error?: string
}

/**
 * Extract a YouTube video ID from various URL formats.
 * Accepts: watch URLs, short URLs (youtu.be), embed URLs, shorts URLs.
 * Returns null if the URL cannot be parsed.
 */
export function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('?')[0] || null
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.replace('/shorts/', '').split('?')[0] || null
      }
      const v = parsed.searchParams.get('v')
      if (v) return v
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.replace('/embed/', '').split('?')[0] || null
      }
    }
  } catch {
    // Not a valid URL
  }
  return null
}

/**
 * Format a number of seconds into a human-readable timestamp (MM:SS or H:MM:SS).
 */
export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Fetch transcript for a YouTube video URL via the transcript microservice.
 * Language fallback chain: requested → en → any auto-generated (handled server-side).
 * Times out after 15 seconds.
 */
export async function fetchTranscript(
  videoUrl: string,
  language = 'en'
): Promise<TranscriptResult> {
  const serviceUrl = process.env.TRANSCRIPT_SERVICE_URL
  if (!serviceUrl) throw new Error('TRANSCRIPT_SERVICE_URL is not set')

  const params = new URLSearchParams({ url: videoUrl, language })
  const res = await fetch(`${serviceUrl}/transcript?${params}`, {
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Transcript service error ${res.status}: ${body}`)
  }

  const data = await res.json()
  // Normalize snake_case from Python service to camelCase
  return {
    videoId: data.video_id,
    fullText: data.full_text,
    language: data.language,
    source: data.source,
    error: data.error,
  }
}
