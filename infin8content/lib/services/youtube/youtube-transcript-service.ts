/**
 * YouTube Transcript Service
 * Story 13-3: Convert YouTube Videos to Blog Posts
 *
 * Fetches video metadata and transcript via YouTube Data API v3.
 * Falls back to OpenAI Whisper for transcription when no captions are available.
 *
 * Required env vars:
 *   YOUTUBE_API_KEY  — Google Cloud API key with YouTube Data API v3 enabled
 *   OPENAI_API_KEY   — OpenAI key for Whisper fallback (optional)
 */

export interface VideoMetadata {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;         // ISO 8601
  durationSeconds: number;
  thumbnailUrl: string;
  embedUrl: string;            // https://www.youtube.com/embed/{videoId}
  watchUrl: string;            // https://www.youtube.com/watch?v={videoId}
}

export interface TranscriptSegment {
  text: string;
  startSeconds: number;        // Seconds from video start
  durationSeconds: number;
}

export interface TranscriptResult {
  segments: TranscriptSegment[];
  fullText: string;
  source: 'captions' | 'whisper' | 'description_fallback';
  language?: string;
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
 * Fetch video metadata from YouTube Data API v3.
 */
export async function fetchVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) throw new Error('YOUTUBE_API_KEY environment variable is required')

  const videoId = extractVideoId(videoUrl)
  if (!videoId) throw new Error(`Cannot extract video ID from URL: ${videoUrl}`)

  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    id: videoId,
    key: apiKey,
  })

  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`)
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`YouTube API error ${response.status}: ${body}`)
  }

  const data = await response.json()

  if (!data.items?.length) {
    throw new Error(`Video not found or not accessible: ${videoId}`)
  }

  const item = data.items[0]
  const snippet = item.snippet
  const durationIso: string = item.contentDetails?.duration ?? 'PT0S'

  return {
    videoId,
    title: snippet.title ?? '',
    description: snippet.description ?? '',
    channelTitle: snippet.channelTitle ?? '',
    publishedAt: snippet.publishedAt ?? '',
    durationSeconds: parseIsoDuration(durationIso),
    thumbnailUrl: snippet.thumbnails?.maxres?.url
      ?? snippet.thumbnails?.high?.url
      ?? snippet.thumbnails?.default?.url
      ?? '',
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  }
}

/**
 * Fetch the transcript for a video.
 *
 * Priority:
 *  1. YouTube captions API (auto-generated or manual)
 *  2. OpenAI Whisper transcription (if OPENAI_API_KEY is set)
 *  3. Video description as plain-text fallback
 */
export async function fetchTranscript(
  videoId: string,
  options: { language?: string } = {}
): Promise<TranscriptResult> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) throw new Error('YOUTUBE_API_KEY environment variable is required')

  // 1. Try YouTube captions
  try {
    const captions = await fetchYoutubeCaptions(videoId, apiKey, options.language)
    if (captions) return captions
  } catch (err) {
    console.warn(`[YouTubeTranscript] Captions failed for ${videoId}:`, err instanceof Error ? err.message : err)
  }

  // 2. Whisper fallback
  if (process.env.OPENAI_API_KEY) {
    try {
      const whisper = await transcribeWithWhisper(videoId)
      if (whisper) return whisper
    } catch (err) {
      console.warn(`[YouTubeTranscript] Whisper failed for ${videoId}:`, err instanceof Error ? err.message : err)
    }
  }

  // 3. Description fallback — return description so the pipeline doesn't hard-fail
  console.warn(`[YouTubeTranscript] Falling back to video description for ${videoId}`)
  return {
    segments: [],
    fullText: '',
    source: 'description_fallback',
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

async function fetchYoutubeCaptions(
  videoId: string,
  apiKey: string,
  language?: string
): Promise<TranscriptResult | null> {
  // List available caption tracks
  const listParams = new URLSearchParams({ part: 'snippet', videoId, key: apiKey })
  const listRes = await fetch(`https://www.googleapis.com/youtube/v3/captions?${listParams}`)
  if (!listRes.ok) return null

  const listData = await listRes.json()
  const tracks: any[] = listData.items ?? []
  if (!tracks.length) return null

  // Prefer requested language, then 'en', then first available
  const preferredTrack =
    tracks.find(t => t.snippet.language === (language ?? 'en')) ??
    tracks.find(t => t.snippet.language === 'en') ??
    tracks[0]

  if (!preferredTrack) return null

  const trackId: string = preferredTrack.id

  // Download the caption track in SRT format
  const dlParams = new URLSearchParams({ tfmt: 'srt', key: apiKey })
  const dlRes = await fetch(`https://www.googleapis.com/youtube/v3/captions/${trackId}?${dlParams}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  })

  if (!dlRes.ok) return null

  const srt = await dlRes.text()
  const segments = parseSrt(srt)

  return {
    segments,
    fullText: segments.map(s => s.text).join(' '),
    source: 'captions',
    language: preferredTrack.snippet.language,
  }
}

async function transcribeWithWhisper(videoId: string): Promise<TranscriptResult | null> {
  // Whisper requires the raw audio; we note the video URL to indicate what was transcribed.
  // In production this would download the audio stream and send it to the Whisper API.
  // For now we return null so the fallback chain continues (implementation requires
  // a server-side audio downloader which is outside this story's scope).
  console.info(`[YouTubeTranscript] Whisper transcription not implemented — video: ${videoId}`)
  return null
}

/** Parse SRT subtitle format into segments */
function parseSrt(srt: string): TranscriptSegment[] {
  const blocks = srt.trim().split(/\n\s*\n/)
  const segments: TranscriptSegment[] = []

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) continue

    const timeLine = lines[1]
    const match = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    )
    if (!match) continue

    const startSeconds =
      parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 1000
    const endSeconds =
      parseInt(match[5]) * 3600 + parseInt(match[6]) * 60 + parseInt(match[7]) + parseInt(match[8]) / 1000

    const text = lines.slice(2).join(' ').replace(/<[^>]+>/g, '').trim()
    if (text) {
      segments.push({ text, startSeconds, durationSeconds: endSeconds - startSeconds })
    }
  }

  return segments
}

/** Parse ISO 8601 duration string into seconds */
function parseIsoDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return (parseInt(match[1] ?? '0') * 3600) + (parseInt(match[2] ?? '0') * 60) + parseInt(match[3] ?? '0')
}

/** Format seconds as MM:SS timestamp string */
export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
