/**
 * Shopify Blog publishing adapter.
 * Ref: https://shopify.dev/docs/api/admin-rest/2024-01/resources/article
 *
 * Credentials: { shop (subdomain), blog_id, access_token (decrypted) }
 */

import type { CMSAdapter, PublishInput, PublishResult, ConnectionTestResult } from './cms-adapter'

const TIMEOUT_MS = 30_000
const API_VERSION = '2024-01'

export class ShopifyAdapter implements CMSAdapter {
  constructor(private credentials: Record<string, string>) {}

  async publishPost(input: PublishInput): Promise<PublishResult> {
    const { shop, blog_id, access_token } = this.credentials

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(
        `https://${shop}.myshopify.com/admin/api/${API_VERSION}/blogs/${blog_id}/articles.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': access_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            article: {
              title: input.title,
              body_html: input.html,
              published: true,
              ...(input.excerpt ? { summary_html: input.excerpt } : {}),
            },
          }),
          signal: controller.signal,
        }
      )

      clearTimeout(timer)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ errors: res.statusText }))
        return this.errorResult(res.status, JSON.stringify(err.errors || err))
      }

      const json = await res.json()
      const article = json.article
      return {
        success: true,
        postId: String(article.id),
        url: `https://${shop}.myshopify.com/blogs/${article.blog_id}/${article.handle}`,
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
    const { shop, access_token } = this.credentials
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)

    try {
      const res = await fetch(
        `https://${shop}.myshopify.com/admin/api/${API_VERSION}/shop.json`,
        {
          headers: { 'X-Shopify-Access-Token': access_token },
          signal: controller.signal,
        }
      )
      clearTimeout(timer)

      if (!res.ok) {
        return { success: false, message: `Authentication failed (${res.status})` }
      }

      const json = await res.json()
      return {
        success: true,
        message: 'Connected to Shopify',
        site: { name: json.shop?.name, url: json.shop?.domain },
      }
    } catch (err: any) {
      clearTimeout(timer)
      return { success: false, message: err.message || 'Connection failed' }
    }
  }

  private errorResult(status: number, message: string): PublishResult {
    if (status === 401 || status === 403) {
      return { success: false, error: 'Shopify authentication failed. Check your access token.' }
    }
    if (status === 404) {
      return { success: false, error: 'Shopify blog not found. Check the blog ID.' }
    }
    return { success: false, error: `Shopify API error (${status}): ${message}` }
  }
}
