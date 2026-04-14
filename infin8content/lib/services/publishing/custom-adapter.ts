/**
 * Custom API publishing adapter.
 * Sends a generic JSON POST to the configured endpoint.
 *
 * Credentials: { endpoint, method? (default POST), api_key (decrypted) }
 */

import type { CMSAdapter, PublishInput, PublishResult, ConnectionTestResult } from './cms-adapter'

const TIMEOUT_MS = 30_000

export class CustomAdapter implements CMSAdapter {
  constructor(private credentials: Record<string, string>) {}

  async publishPost(input: PublishInput): Promise<PublishResult> {
    const { endpoint, method = 'POST', api_key } = this.credentials

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: input.title,
          content: input.html,
          ...(input.slug ? { slug: input.slug } : {}),
          ...(input.excerpt ? { excerpt: input.excerpt } : {}),
        }),
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        return {
          success: false,
          error: `Custom API error (${res.status}): ${err.message || res.statusText}`,
        }
      }

      const json = await res.json().catch(() => ({}))
      return {
        success: true,
        postId: json.id !== undefined ? String(json.id) : undefined,
        url: json.url,
      }
    } catch (err: any) {
      clearTimeout(timer)
      if (err.name === 'AbortError') {
        return { success: false, error: 'Request timeout (30s)' }
      }
      return { success: false, error: err.message || 'Unknown error' }
    }
  }

  // ✅ Fix 5: returns { success, message }
  async testConnection(): Promise<ConnectionTestResult> {
    // Custom endpoints cannot be probed safely without a dedicated health endpoint
    if (!this.credentials.endpoint?.startsWith('https://')) {
      return { success: false, message: 'Endpoint must start with https://' }
    }
    return { success: true, message: 'Custom endpoint accepted (not probed)' }
  }
}
