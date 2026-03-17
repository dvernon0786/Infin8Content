import type { CMSAdapter, PublishInput, PublishResult, ConnectionTestResult } from './cms-adapter'

export class WordPressAdapter implements CMSAdapter {
  constructor(private creds: Record<string, string>) {}

  private get authHeader(): string {
    return 'Basic ' + Buffer.from(
      `${this.creds.username}:${this.creds.application_password}`
    ).toString('base64')
  }

  private get baseUrl(): string {
    return (this.creds.site_url || '').replace(/\/$/, '')
  }

  async publishPost(input: PublishInput): Promise<PublishResult> {
    const res = await fetch(`${this.baseUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: { Authorization: this.authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:   input.title,
        content: input.html,
        slug:    input.slug,
        excerpt: input.excerpt ?? '',
        status:  'publish',
      }),
    })
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.message ?? `HTTP ${res.status}` }
    return { success: true, postId: String(json.id), url: json.link }
  }

  // ✅ Fix 5: returns { success, message } — matches ConnectionTestResult
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const res = await fetch(`${this.baseUrl}/wp-json/wp/v2/users/me`, {
        headers: { Authorization: this.authHeader },
      })
      if (!res.ok) return { success: false, message: `Auth failed: HTTP ${res.status}` }
      const json = await res.json()
      return { success: true, message: `Connected as ${json.name ?? 'WordPress user'}` }
    } catch (err: any) {
      return { success: false, message: err.message ?? 'Connection failed' }
    }
  }
}
