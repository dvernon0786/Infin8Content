/**
 * WordPress Adapter — implements CMSAdapter interface.
 *
 * Backward-compat note: CmsConnectionForm.tsx stores the site URL under
 * credential key `url`. This adapter reads `site_url ?? url` so both
 * existing connections (key: url) and new connections (key: site_url) work.
 */

import type { CMSAdapter, PublishInput, PublishResult, ConnectionTestResult } from './cms-adapter'

interface WPPostResponse {
  id: number
  link: string
  status: string
}

const TIMEOUT_MS = 30_000

export class WordPressAdapter implements CMSAdapter {
  constructor(private credentials: Record<string, string>) {}

  async publishPost(input: PublishInput): Promise<PublishResult> {
    const { username, application_password } = this.credentials
    // Backward compat: CmsConnectionForm stores URL as `url`; new form uses `site_url`
    const site_url = this.credentials.site_url ?? this.credentials.url

    if (!username || !application_password || !site_url) {
      return {
        success: false,
        error: 'WordPress credentials incomplete. Required: site_url (or url), username, application_password.',
      }
    }

    const apiUrl = `${site_url.replace(/\/+$/, '')}/wp-json/wp/v2/posts`
    const auth = Buffer.from(`${username}:${application_password}`).toString('base64')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          title: input.title,
          content: input.html,        // PublishInput.html → WP `content` field
          status: 'publish',
          ...(input.slug ? { slug: input.slug } : {}),
          ...(input.excerpt ? { excerpt: input.excerpt } : {}),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        return this.handleError(response.status, errorText)
      }

      const data: WPPostResponse = await response.json()
      return {
        success: true,
        url: data.link,
        postId: String(data.id),
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        return { success: false, error: 'Request timeout (30s limit exceeded)' }
      }
      return { success: false, error: err.message || 'Unknown error occurred' }
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const { username, application_password } = this.credentials
    // Backward compat: same key fallback as publishPost
    const site_url = this.credentials.site_url ?? this.credentials.url

    if (!username || !application_password || !site_url) {
      return { success: false, message: 'Missing required credentials' }
    }

    const testUrl = `${site_url.replace(/\/+$/, '')}/wp-json/wp/v2/posts?per_page=1`
    const auth = Buffer.from(`${username}:${application_password}`).toString('base64')

    try {
      const response = await fetch(testUrl, {
        headers: { Authorization: `Basic ${auth}` },
        signal: AbortSignal.timeout(10_000),
      })

      if (!response.ok) {
        return { success: false, message: `HTTP ${response.status} — check credentials and site URL` }
      }

      return { success: true, message: `Connected to ${site_url}` }
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection test failed' }
    }
  }

  private handleError(status: number, errorText: string): PublishResult {
    switch (status) {
      case 401:
        return { success: false, error: 'Authentication failed. Check your username and application password.' }
      case 403:
        return { success: false, error: 'Access forbidden. The application password may lack publish permissions.' }
      case 404:
        return { success: false, error: 'REST API not found. Check your site URL and ensure the WordPress REST API is enabled.' }
      case 429:
        return { success: false, error: 'Rate limit exceeded. Please try again later.' }
      case 500:
        return { success: false, error: 'WordPress server error. Please try again later.' }
      default:
        return { success: false, error: `WordPress API error (${status}): ${errorText}` }
    }
  }
}
