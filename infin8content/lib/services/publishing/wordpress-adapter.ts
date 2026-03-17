import type { CMSAdapter, PublishInput, PublishResult, ConnectionTestResult } from './cms-adapter'

export class WordPressAdapter implements CMSAdapter {
  constructor(private creds: Record<string, string>) {}
  private get authHeader(): string {
    return 'Basic ' + Buffer.from(
      `${this.creds.username}:${this.creds.application_password}`
    ).toString('base64')
  }

  /**
   * Resolve and validate the base site URL from credentials.
   * Supports both `site_url` (new) and `url` (existing connections).
   */
  private get siteUrl(): string | null {
    const raw = (this.creds.url ?? this.creds.site_url) as string | undefined
    if (!raw) return null
    try {
      const parsed = new URL(raw)
      return parsed.href.replace(/\/+$/, '')
    } catch {
      return null
    }
  }

  async publishPost(input: PublishInput): Promise<PublishResult> {
    const baseUrl = this.siteUrl
    if (!baseUrl) return { success: false, error: 'Invalid WordPress site URL' }

    const controller = new AbortController()
    const timeoutMs = 15000
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: { Authorization: this.authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:   input.title,
          content: input.html,
          slug:    input.slug,
          excerpt: input.excerpt ?? '',
          status:  'publish',
        }),
        signal: controller.signal,
      })
      const json = await res.json()
      if (!res.ok) return { success: false, error: json.message ?? `HTTP ${res.status}` }
      return { success: true, postId: String(json.id), url: json.link }
    } catch (err: any) {
      if (err && err.name === 'AbortError') return { success: false, error: 'Request to WordPress timed out' }
      return { success: false, error: err?.message ?? 'Failed to publish post' }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const baseUrl = this.siteUrl
    if (!baseUrl) return { success: false, message: 'Invalid WordPress site URL' }

    const controller = new AbortController()
    const timeoutMs = 10000
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
        headers: { Authorization: this.authHeader },
        signal: controller.signal,
      })
      if (!res.ok) return { success: false, message: `Auth failed: HTTP ${res.status}` }
      const json = await res.json()
      return { success: true, message: `Connected as ${json.name ?? 'WordPress user'}` }
    } catch (err: any) {
      if (err && err.name === 'AbortError') return { success: false, message: 'Request timeout (10s)' }
      return { success: false, message: err.message ?? 'Connection failed' }
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
