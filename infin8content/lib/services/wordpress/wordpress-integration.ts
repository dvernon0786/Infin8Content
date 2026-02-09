export interface WordPressCredentials {
  url: string
  username: string
  application_password: string
}

export interface WordPressPost {
  title: string
  content: string
  status?: 'publish' | 'draft' | 'pending'
  excerpt?: string
  categories?: number[]
  tags?: number[]
  featured_media?: number
}

export interface WordPressResponse {
  id: number
  slug: string
  link: string
  status: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  date: string
  modified: string
}

export class WordPressIntegration {
  private credentials: WordPressCredentials

  constructor(credentials: WordPressCredentials) {
    this.credentials = credentials
  }

  private getAuthHeader(): string {
    const auth = Buffer.from(`${this.credentials.username}:${this.credentials.application_password}`).toString('base64')
    return `Basic ${auth}`
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    const url = `${this.credentials.url}/wp-json/wp/v2${endpoint}`
    const headers = {
      'Authorization': this.getAuthHeader(),
      'Content-Type': 'application/json',
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`WordPress API Error: ${response.status} - ${errorData.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('WordPress API request failed:', error)
      throw error
    }
  }

  /**
   * Test WordPress connection
   * Uses safe endpoint that doesn't require privileged capabilities
   * Per WordPress REST API docs: /posts requires edit_posts (default for authors/editors)
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Safe, capability-light endpoint - works with Application Passwords
      await this.makeRequest('/posts?per_page=1&_fields=id')

      return {
        success: true,
        message: 'Connection successful'
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to connect to WordPress'
      }
    }
  }

  /**
   * Get site info
   * Uses public /wp-json endpoint - no auth required, always available
   */
  async getSiteInfo(): Promise<{ name: string; description: string; url: string }> {
    try {
      const site = await fetch(`${this.credentials.url}/wp-json`).then(res => res.json())

      return {
        name: site.name || 'WordPress Site',
        description: site.description || '',
        url: this.credentials.url
      }
    } catch (error) {
      // Fallback if /wp-json is unavailable
      return {
        name: 'WordPress Site',
        description: '',
        url: this.credentials.url
      }
    }
  }

  /**
   * Create or update a post
   */
  async createPost(post: WordPressPost, postId?: number): Promise<WordPressResponse> {
    const endpoint = postId ? `/posts/${postId}` : '/posts'
    const method = postId ? 'POST' : 'POST' // WordPress uses POST for both create and update

    const postData = {
      title: post.title,
      content: post.content,
      status: post.status || 'draft',
      excerpt: post.excerpt || '',
      categories: post.categories || [],
      tags: post.tags || [],
      featured_media: post.featured_media || 0,
    }

    return await this.makeRequest(endpoint, method, postData)
  }

  /**
   * Get post by ID
   */
  async getPost(postId: number): Promise<WordPressResponse> {
    return await this.makeRequest(`/posts/${postId}`)
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<Array<{ id: number; name: string; slug: string; count: number }>> {
    return await this.makeRequest('/categories?per_page=100')
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<Array<{ id: number; name: string; slug: string; count: number }>> {
    return await this.makeRequest('/tags?per_page=100')
  }
}
