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

  async testConnection(): Promise<ConnectionTestResult> {
    // Custom APIs don't have a standard health-check endpoint.
    // We do a lightweight HEAD/GET to verify reachability and auth.
    const { endpoint, api_key } = this.credentials
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)

    try {
      const res = await fetch(endpoint, {
        method: 'HEAD',
        headers: { Authorization: `Bearer ${api_key}` },
        signal: controller.signal,
      })
      clearTimeout(timer)

      // 405 Method Not Allowed means the endpoint exists but doesn't support HEAD —
      // that's still a reachable endpoint, treat as success.
      if (res.ok || res.status === 405) {
        return { success: true, message: 'Custom API endpoint reachable' }
      }

      return { success: false, message: `Endpoint returned ${res.status}` }
    } catch (err: any) {
      clearTimeout(timer)
      return { success: false, message: err.message || 'Connection failed' }
    }
  }
}
