/**
 * Webflow CMS publishing adapter.
 * Ref: https://developers.webflow.com/
 *
 * Credentials: { api_token (decrypted), collection_id, site_url }
 */

import type { CMSAdapter, PublishInput, PublishResult, ConnectionTestResult } from './cms-adapter'

const TIMEOUT_MS = 30_000

export class WebflowAdapter implements CMSAdapter {
  constructor(private credentials: Record<string, string>) {}

  async publishPost(input: PublishInput): Promise<PublishResult> {
    const { api_token, collection_id, site_url } = this.credentials

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const slug =
        input.slug ||
        input.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

      const res = await fetch(
        `https://api.webflow.com/v2/collections/${collection_id}/items/live`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${api_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isArchived: false,
            isDraft: false,
            fieldData: {
              name: input.title,
              slug,
              'post-body': input.html,
              ...(input.excerpt ? { 'post-summary': input.excerpt } : {}),
            },
          }),
          signal: controller.signal,
        }
      )

      clearTimeout(timer)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        return this.errorResult(res.status, err.message || res.statusText)
      }

      const json = await res.json()
      return {
        success: true,
        postId: json.id,
        url: site_url ? `${site_url}/${json.fieldData?.slug || slug}` : undefined,
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
    const { api_token } = this.credentials
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)

    try {
      const res = await fetch('https://api.webflow.com/v2/token/authorized_by', {
        headers: { Authorization: `Bearer ${api_token}` },
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (!res.ok) {
        return { success: false, message: `Authentication failed (${res.status})` }
      }

      const json = await res.json()
      return {
        success: true,
        message: 'Connected to Webflow',
        site: { name: json.displayName || 'Webflow' },
      }
    } catch (err: any) {
      clearTimeout(timer)
      return { success: false, message: err.message || 'Connection failed' }
    }
  }

  private errorResult(status: number, message: string): PublishResult {
    if (status === 401 || status === 403) {
      return { success: false, error: 'Webflow authentication failed. Check your API token.' }
    }
    if (status === 404) {
      return { success: false, error: 'Webflow collection not found. Check the collection ID.' }
    }
    return { success: false, error: `Webflow API error (${status}): ${message}` }
  }
}
