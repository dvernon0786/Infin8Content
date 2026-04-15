/**
 * @infin8content/sdk — TypeScript SDK for the Infin8Content API
 *
 * Usage:
 *   import { Infin8ContentClient } from '@infin8content/sdk'
 *
 *   const client = new Infin8ContentClient({ apiKey: 'inf8_live_...' })
 *   const { articles } = await client.articles.list({ status: 'published', limit: 10 })
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientOptions {
  apiKey: string
  /** Defaults to https://infin8content.com */
  baseUrl?: string
  /** Fetch timeout in ms (default: 30000) */
  timeout?: number
}

export interface PaginatedRequest {
  limit?: number
  offset?: number
  sort?: 'created_at' | 'updated_at' | 'title'
}

export interface Article {
  id: string
  title: string
  status: string
  keyword: string
  created_at: string
  updated_at: string
  content?: string
  metadata?: Record<string, unknown>
}

export interface ArticleList {
  articles: Article[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

export interface GenerateArticleRequest {
  keyword: string
  length?: number
  style?: string
  custom_instructions?: string
}

export interface GenerateArticleResult {
  article_id: string
  status: 'queued'
  estimated_time: string
}

export interface PublishArticleRequest {
  cms_connection_id: string
  status?: 'draft' | 'publish'
}

export interface PublishArticleResult {
  status: string
  published_url: string
  post_id: string | number
  already_published: boolean
}

export interface KeywordResearchRequest {
  keyword: string
  depth?: 'basic' | 'standard' | 'deep'
  filters?: {
    min_volume?: number
    max_difficulty?: number
  }
}

export interface KeywordResearchResult {
  keyword: string
  depth: string
  status: string
  total: number
  keywords: Array<{
    id: string
    keyword: string
    seed_keyword: string
    search_volume: number
    intent: string
  }>
}

export interface ArticleAnalytics {
  article_id: string
  title: string
  keyword: string
  status: string
  created_at: string
  updated_at: string
  generations: { metadata: Record<string, unknown> }
  publish_history: Array<{
    id: string
    platform: string
    platform_url?: string
    published_at: string
  }>
}

export interface ApiError {
  code: string
  message: string
  actionableSteps?: string[]
}

export class Infin8ContentError extends Error {
  readonly code: string
  readonly status: number
  readonly actionableSteps?: string[]

  constructor(apiError: ApiError, status: number) {
    super(apiError.message)
    this.name = 'Infin8ContentError'
    this.code = apiError.code
    this.status = status
    this.actionableSteps = apiError.actionableSteps
  }
}

// ─── HTTP client ──────────────────────────────────────────────────────────────

class HttpClient {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly timeout: number

  constructor(opts: Required<ClientOptions>) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
    this.timeout = opts.timeout
  }

  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v))
      }
    }
    return url.toString()
  }

  async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    options: {
      params?: Record<string, string | number | undefined>
      body?: unknown
    } = {}
  ): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    let response: Response
    try {
      response = await fetch(this.buildUrl(path, options.params), {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      })
    } catch (err: any) {
      throw new Error(err.name === 'AbortError' ? `Request timed out after ${this.timeout}ms` : err.message)
    } finally {
      clearTimeout(timer)
    }

    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      const err: ApiError = json.error ?? { code: 'UNKNOWN_ERROR', message: response.statusText }
      throw new Infin8ContentError(err, response.status)
    }

    return json.data as T
  }

  get = <T>(path: string, params?: Record<string, string | number | undefined>) =>
    this.request<T>('GET', path, { params })

  post = <T>(path: string, body?: unknown) => this.request<T>('POST', path, { body })

  delete = <T>(path: string) => this.request<T>('DELETE', path)
}

// ─── Resource classes ─────────────────────────────────────────────────────────

class ArticlesResource {
  constructor(private readonly http: HttpClient) {}

  list(params?: PaginatedRequest & { status?: string }): Promise<ArticleList> {
    return this.http.get('/api/v1/articles', params as any)
  }

  get(id: string): Promise<Article> {
    return this.http.get(`/api/v1/articles/${id}`)
  }

  generate(req: GenerateArticleRequest): Promise<GenerateArticleResult> {
    return this.http.post('/api/v1/articles/generate', req)
  }

  publish(articleId: string, req: PublishArticleRequest): Promise<PublishArticleResult> {
    return this.http.post(`/api/v1/articles/${articleId}/publish`, req)
  }
}

class KeywordsResource {
  constructor(private readonly http: HttpClient) {}

  research(req: KeywordResearchRequest): Promise<KeywordResearchResult> {
    return this.http.post('/api/v1/keywords/research', req)
  }
}

class AnalyticsResource {
  constructor(private readonly http: HttpClient) {}

  getArticle(articleId: string): Promise<ArticleAnalytics> {
    return this.http.get(`/api/v1/analytics/articles/${articleId}`)
  }
}

// ─── Main client ──────────────────────────────────────────────────────────────

export class Infin8ContentClient {
  readonly articles: ArticlesResource
  readonly keywords: KeywordsResource
  readonly analytics: AnalyticsResource

  constructor(opts: ClientOptions) {
    const http = new HttpClient({
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl ?? 'https://infin8content.com',
      timeout: opts.timeout ?? 30_000,
    })
    this.articles = new ArticlesResource(http)
    this.keywords = new KeywordsResource(http)
    this.analytics = new AnalyticsResource(http)
  }
}

// ─── Default export ───────────────────────────────────────────────────────────

export default Infin8ContentClient
