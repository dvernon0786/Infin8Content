/**
 * WordPress publishing adapter.
 * Wraps the existing WordPressAdapter to conform to the CMSAdapter interface.
 *
 * Credentials: { url, username, application_password (decrypted) }
 */

import { WordPressAdapter } from '../wordpress-adapter'
import type { CMSAdapter, PublishInput, PublishResult, ConnectionTestResult } from './cms-adapter'

export class WordPressPublishingAdapter implements CMSAdapter {
  private inner: WordPressAdapter

  constructor(private credentials: Record<string, string>) {
    this.inner = new WordPressAdapter({
      site_url: credentials.url,
      username: credentials.username,
      application_password: credentials.application_password,
    })
  }

  async publishPost(input: PublishInput): Promise<PublishResult> {
    const result = await this.inner.publishPost({
      title: input.title,
      content: input.html,
      status: 'publish',
    })

    return {
      success: result.success,
      postId: result.postId !== undefined ? String(result.postId) : undefined,
      url: result.url,
      error: result.error,
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const result = await this.inner.testConnection()
    if (result.success) {
      return { success: true, message: 'Connected to WordPress' }
    }
    return { success: false, message: result.error || 'Connection failed' }
  }
}
