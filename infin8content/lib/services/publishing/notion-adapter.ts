/**
 * Notion publishing adapter.
 * Ref: https://developers.notion.com/
 *
 * Credentials: { token (decrypted), database_id }
 *
 * Notion doesn't accept raw HTML — this adapter converts HTML to
 * Notion block objects (minimal inline converter: h1-h3, p, ul, ol, pre/code).
 */

import type { CMSAdapter, PublishInput, PublishResult, ConnectionTestResult } from './cms-adapter'

const TIMEOUT_MS = 30_000
const NOTION_VERSION = '2022-06-28'

// ---------------------------------------------------------------------------
// Minimal HTML → Notion blocks converter
// ---------------------------------------------------------------------------
type NotionBlock = Record<string, unknown>

function htmlToNotionBlocks(html: string): NotionBlock[] {
  const blocks: NotionBlock[] = []

  // Strip scripts/styles for safety
  const clean = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  // Split on block-level tags
  const segments = clean.split(/(?=<(?:h[1-6]|p|ul|ol|pre|blockquote|div|hr)\b)/i)

  for (const segment of segments) {
    const tag = (segment.match(/^<([a-z][a-z0-9]*)/i) || [])[1]?.toLowerCase()

    if (!tag) continue

    const text = segment.replace(/<[^>]+>/g, '').trim()
    if (!text && tag !== 'hr') continue

    switch (tag) {
      case 'h1':
        blocks.push({ object: 'block', type: 'heading_1', heading_1: richText(text) })
        break
      case 'h2':
        blocks.push({ object: 'block', type: 'heading_2', heading_2: richText(text) })
        break
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        blocks.push({ object: 'block', type: 'heading_3', heading_3: richText(text) })
        break
      case 'ul': {
        const items = segment.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || []
        for (const item of items) {
          const itemText = item.replace(/<[^>]+>/g, '').trim()
          if (itemText) {
            blocks.push({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: richText(itemText) })
          }
        }
        break
      }
      case 'ol': {
        const items = segment.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || []
        for (const item of items) {
          const itemText = item.replace(/<[^>]+>/g, '').trim()
          if (itemText) {
            blocks.push({ object: 'block', type: 'numbered_list_item', numbered_list_item: richText(itemText) })
          }
        }
        break
      }
      case 'pre':
        blocks.push({ object: 'block', type: 'code', code: { ...richText(text), language: 'plain text' } })
        break
      case 'hr':
        blocks.push({ object: 'block', type: 'divider', divider: {} })
        break
      default:
        if (text) {
          blocks.push({ object: 'block', type: 'paragraph', paragraph: richText(text) })
        }
    }
  }

  // Notion API limits: max 100 blocks per request
  return blocks.slice(0, 100)
}

function richText(content: string) {
  return { rich_text: [{ type: 'text', text: { content } }] }
}

// ---------------------------------------------------------------------------

export class NotionAdapter implements CMSAdapter {
  constructor(private credentials: Record<string, string>) {}

  async publishPost(input: PublishInput): Promise<PublishResult> {
    const { token, database_id } = this.credentials

    const blocks = htmlToNotionBlocks(input.html)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      // Create the page
      const res = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { database_id },
          properties: {
            title: {
              title: [{ type: 'text', text: { content: input.title } }],
            },
          },
          children: blocks,
        }),
        signal: controller.signal,
      })

      clearTimeout(timer)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        return this.errorResult(res.status, err.message || res.statusText)
      }

      const json = await res.json()
      return {
        success: true,
        postId: json.id,
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
    const { token, database_id } = this.credentials
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)

    try {
      const res = await fetch(`https://api.notion.com/v1/databases/${database_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': NOTION_VERSION,
        },
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (!res.ok) {
        return { success: false, message: `Authentication failed (${res.status})` }
      }

      const json = await res.json()
      return {
        success: true,
        message: 'Connected to Notion',
        site: { name: json.title?.[0]?.text?.content || 'Notion Database' },
      }
    } catch (err: any) {
      clearTimeout(timer)
      return { success: false, message: err.message || 'Connection failed' }
    }
  }

  private errorResult(status: number, message: string): PublishResult {
    if (status === 401) {
      return { success: false, error: 'Notion authentication failed. Check your integration token.' }
    }
    if (status === 404) {
      return { success: false, error: 'Notion database not found. Check the database ID and ensure the integration has access.' }
    }
    return { success: false, error: `Notion API error (${status}): ${message}` }
  }
}
