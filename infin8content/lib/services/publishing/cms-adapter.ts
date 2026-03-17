/**
 * Base interfaces for the CMS publishing adapter layer.
 * Each platform adapter must implement CMSAdapter.
 */

export interface PublishInput {
  title: string
  html: string
  slug?: string
  excerpt?: string
  coverImage?: string
}

export interface PublishResult {
  success: boolean
  postId?: string
  url?: string
  error?: string
}

export interface ConnectionTestResult {
  success: boolean
  message?: string
  site?: {
    name?: string
    url?: string
    description?: string
  }
}

export interface CMSAdapter {
  publishPost(input: PublishInput): Promise<PublishResult>
  testConnection(): Promise<ConnectionTestResult>
}
