/**
 * Ghost Admin API publishing adapter.
 * Ref: https://docs.ghost.org/api/admin/
 *
 * Credentials: { url, admin_api_key (decrypted, format: "id:secret_hex") }
 *
 * Ghost uses JWT auth — we sign the token manually using Node's crypto
 * to avoid adding a dependency on @tryghost/admin-api.
 */

import crypto from 'crypto'
import type { CMSAdapter, PublishInput, PublishResult, ConnectionTestResult } from './cms-adapter'

const TIMEOUT_MS = 30_000

function buildGhostJwt(adminApiKey: string): string {
  const [keyId, hexSecret] = adminApiKey.split(':')
  if (!keyId || !hexSecret) {
    throw new Error('Ghost Admin API key must be in the format "id:secret_hex"')
  }

  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: keyId })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' })).toString('base64url')
  const signingInput = `${header}.${payload}`
  const secret = Buffer.from(hexSecret, 'hex')
  const signature = crypto.createHmac('sha256', secret).update(signingInput).digest('base64url')

  return `${signingInput}.${signature}`
}

export class GhostAdapter implements CMSAdapter {
  constructor(private credentials: Record<string, string>) {}

  async publishPost(input: PublishInput): Promise<PublishResult> {
    const { url, admin_api_key } = this.credentials

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const jwt = buildGhostJwt(admin_api_key)
      const res = await fetch(`${url}/ghost/api/admin/posts/`, {
        method: 'POST',
        headers: {
          Authorization: `Ghost ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          posts: [
            {
              title: input.title,
              html: input.html,
              status: 'published',
              ...(input.slug ? { slug: input.slug } : {}),
              ...(input.excerpt ? { custom_excerpt: input.excerpt } : {}),
            },
          ],
        }),
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ errors: [{ message: res.statusText }] }))
        return this.errorResult(res.status, err.errors?.[0]?.message || res.statusText)
      }

      const json = await res.json()
      const post = json.posts?.[0]
      return {
        success: true,
        postId: post?.id,
        url: post?.url,
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
    try {
      const { url, admin_api_key } = this.credentials
      const token = buildGhostJwt(admin_api_key)
      const res = await fetch(`${url}/ghost/api/admin/site/`, {
        headers: { Authorization: `Ghost ${token}` },
      })
      if (!res.ok) return { success: false, message: `HTTP ${res.status}` }
      const json = await res.json()
      return { success: true, message: `Connected to ${json.site?.title ?? 'Ghost'}` }
    } catch (err: any) {
      return { success: false, message: err.message ?? 'Connection failed' }
    }
  }

  private errorResult(status: number, message: string): PublishResult {
    if (status === 401 || status === 403) {
      return { success: false, error: 'Ghost authentication failed. Check your Admin API key.' }
    }
    if (status === 404) {
      return { success: false, error: 'Ghost API endpoint not found. Check the site URL.' }
    }
    return { success: false, error: `Ghost API error (${status}): ${message}` }
  }
}
