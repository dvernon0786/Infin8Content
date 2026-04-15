import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Reference — Infin8Content',
  description: 'Complete API reference for the Infin8Content REST API v1.',
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <h2 className="text-xl font-semibold border-b pb-2">{title}</h2>
      {children}
    </section>
  )
}

function Endpoint({
  method,
  path,
  description,
  scope,
  params,
  response,
  example,
}: {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT'
  path: string
  description: string
  scope?: string
  params?: { name: string; type: string; required?: boolean; description: string }[]
  response: string
  example?: string
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-green-100 text-green-700',
    DELETE: 'bg-red-100 text-red-700',
    PUT: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/40">
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${methodColors[method]}`}>
          {method}
        </span>
        <code className="text-sm font-mono">{path}</code>
      </div>
      <div className="px-4 py-3 space-y-3 text-sm">
        <p className="text-muted-foreground">{description}</p>
        {scope && (
          <p className="text-xs">
            <span className="font-medium">Required scope: </span>
            <code className="bg-muted px-1 py-0.5 rounded font-mono">{scope}</code>
          </p>
        )}
        {params && params.length > 0 && (
          <div>
            <p className="font-medium mb-1">Parameters</p>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 pr-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-1 pr-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-1 pr-4 font-medium text-muted-foreground">Required</th>
                  <th className="text-left py-1 font-medium text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {params.map((p) => (
                  <tr key={p.name} className="border-b last:border-0">
                    <td className="py-1 pr-4 font-mono">{p.name}</td>
                    <td className="py-1 pr-4 text-muted-foreground">{p.type}</td>
                    <td className="py-1 pr-4">{p.required ? 'Yes' : 'No'}</td>
                    <td className="py-1 text-muted-foreground">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div>
          <p className="font-medium mb-1">Response</p>
          <pre className="bg-muted rounded p-3 text-xs overflow-auto leading-relaxed">{response}</pre>
        </div>
        {example && (
          <div>
            <p className="font-medium mb-1">Example</p>
            <pre className="bg-muted rounded p-3 text-xs overflow-auto leading-relaxed">{example}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ApiDocsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">API Reference</h1>
          <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">v1</span>
        </div>
        <p className="text-muted-foreground text-lg">
          Programmatic access to articles, keywords, analytics, and publishing.
        </p>
      </div>

      {/* Quick nav */}
      <nav className="flex flex-wrap gap-3 text-sm">
        {[
          ['#authentication', 'Authentication'],
          ['#rate-limits', 'Rate Limits'],
          ['#errors', 'Errors'],
          ['#articles', 'Articles'],
          ['#keywords', 'Keywords'],
          ['#analytics', 'Analytics'],
          ['#api-keys', 'API Keys'],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="px-3 py-1 rounded border hover:bg-muted transition-colors"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* Authentication */}
      <Section id="authentication" title="Authentication">
        <p className="text-sm text-muted-foreground">
          All API requests must include your API key in the{' '}
          <code className="bg-muted px-1 rounded font-mono text-xs">Authorization</code> header as a
          Bearer token.
        </p>
        <pre className="bg-muted rounded p-4 text-xs overflow-auto">
{`curl https://infin8content.com/api/v1/articles \\
  -H "Authorization: Bearer inf8_live_YOUR_API_KEY"`}
        </pre>
        <p className="text-sm text-muted-foreground">
          Generate API keys from{' '}
          <a href="/settings/api" className="text-primary underline underline-offset-4">
            Settings → API Keys
          </a>
          . Keys are only shown once at creation — store them securely.
        </p>
        <div className="rounded border bg-amber-50 border-amber-200 px-4 py-3 text-sm text-amber-800 space-y-1">
          <p className="font-medium">Plan requirement</p>
          <p>API access requires the Pro or Agency plan. Trial and Starter plans receive a 403 response.</p>
        </div>
      </Section>

      {/* Rate Limits */}
      <Section id="rate-limits" title="Rate Limits">
        <p className="text-sm text-muted-foreground">
          Rate limits are enforced per API key, per calendar month.
        </p>
        <table className="w-full text-sm border-collapse border rounded overflow-hidden">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Plan</th>
              <th className="text-left px-4 py-2 font-medium">Monthly calls</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2">Pro</td>
              <td className="px-4 py-2 font-mono">10,000</td>
            </tr>
            <tr className="border-t">
              <td className="px-4 py-2">Agency</td>
              <td className="px-4 py-2 font-mono">100,000</td>
            </tr>
          </tbody>
        </table>
        <p className="text-sm text-muted-foreground">
          Every response includes these headers:
        </p>
        <pre className="bg-muted rounded p-3 text-xs overflow-auto">
{`X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9847
X-RateLimit-Reset: 2026-05-01T00:00:00.000Z`}
        </pre>
        <p className="text-sm text-muted-foreground">
          When the limit is exceeded you receive a{' '}
          <code className="bg-muted px-1 rounded font-mono text-xs">429 Too Many Requests</code> response.
          The limit resets at the start of the next calendar month (UTC).
        </p>
      </Section>

      {/* Errors */}
      <Section id="errors" title="Errors">
        <p className="text-sm text-muted-foreground">
          All errors follow a consistent structure:
        </p>
        <pre className="bg-muted rounded p-3 text-xs overflow-auto">
{`{
  "status": "error",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Monthly API call limit reached.",
  "actionableSteps": ["Upgrade your plan or wait until next month."],
  "timestamp": "2026-04-15T21:00:00.000Z"
}`}
        </pre>
        <table className="w-full text-sm border-collapse border rounded overflow-hidden">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 font-medium">HTTP status</th>
              <th className="text-left px-4 py-2 font-medium">Code</th>
              <th className="text-left px-4 py-2 font-medium">Meaning</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {[
              ['401', 'UNAUTHORIZED', 'Missing or invalid API key'],
              ['403', 'FORBIDDEN', 'Insufficient plan or scope'],
              ['404', 'NOT_FOUND', 'Resource not found'],
              ['422', 'VALIDATION_ERROR', 'Request body failed validation'],
              ['429', 'RATE_LIMIT_EXCEEDED', 'Monthly call limit reached'],
              ['500', 'INTERNAL_ERROR', 'Unexpected server error'],
            ].map(([status, code, meaning]) => (
              <tr key={code} className="border-t">
                <td className="px-4 py-2 font-mono">{status}</td>
                <td className="px-4 py-2 font-mono text-xs">{code}</td>
                <td className="px-4 py-2 text-muted-foreground">{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Articles */}
      <Section id="articles" title="Articles">
        <div className="space-y-4">
          <Endpoint
            method="GET"
            path="/api/v1/articles"
            description="List articles for your organization. Results are paginated."
            scope="articles:read"
            params={[
              { name: 'status', type: 'string', description: 'Filter by status: queued, generating, completed, failed' },
              { name: 'limit', type: 'number', description: 'Results per page (max 100, default 20)' },
              { name: 'offset', type: 'number', description: 'Pagination offset (default 0)' },
              { name: 'sort', type: 'string', description: 'Sort field: created_at (default) or updated_at' },
            ]}
            response={`{
  "status": "success",
  "data": {
    "articles": [
      {
        "id": "uuid",
        "title": "Article title",
        "slug": "article-slug",
        "status": "completed",
        "word_count": 2400,
        "created_at": "2026-04-15T10:00:00Z",
        "updated_at": "2026-04-15T10:30:00Z"
      }
    ],
    "total": 42,
    "limit": 20,
    "offset": 0
  },
  "timestamp": "2026-04-15T21:00:00Z"
}`}
            example={`curl "https://infin8content.com/api/v1/articles?status=completed&limit=10" \\
  -H "Authorization: Bearer inf8_live_..."`}
          />

          <Endpoint
            method="GET"
            path="/api/v1/articles/:id"
            description="Retrieve a single article including its full HTML content."
            scope="articles:read"
            response={`{
  "status": "success",
  "data": {
    "id": "uuid",
    "title": "Article title",
    "slug": "article-slug",
    "status": "completed",
    "html_content": "<h1>...</h1>...",
    "word_count": 2400,
    "created_at": "2026-04-15T10:00:00Z"
  },
  "timestamp": "2026-04-15T21:00:00Z"
}`}
          />

          <Endpoint
            method="POST"
            path="/api/v1/articles/generate"
            description="Queue a new article for generation. Returns 202 immediately; generation happens asynchronously."
            scope="articles:write"
            params={[
              { name: 'keyword', type: 'string', required: true, description: 'Primary keyword to write about' },
              { name: 'title', type: 'string', description: 'Override the generated title' },
              { name: 'workflow_id', type: 'string', description: 'Associate with an intent workflow' },
            ]}
            response={`{
  "status": "success",
  "data": {
    "article_id": "uuid",
    "status": "queued",
    "message": "Article queued for generation"
  },
  "timestamp": "2026-04-15T21:00:00Z"
}`}
            example={`curl -X POST https://infin8content.com/api/v1/articles/generate \\
  -H "Authorization: Bearer inf8_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"keyword": "best crm for startups"}'`}
          />

          <Endpoint
            method="POST"
            path="/api/v1/articles/:id/publish"
            description="Publish a completed article to a connected CMS integration."
            scope="articles:write"
            params={[
              { name: 'cms_connection_id', type: 'string', required: true, description: 'ID of the CMS connection to publish to' },
              { name: 'status', type: 'string', description: 'publish status: publish (default) or draft' },
            ]}
            response={`{
  "status": "success",
  "data": {
    "post_id": "12345",
    "url": "https://yourblog.com/best-crm-for-startups"
  },
  "timestamp": "2026-04-15T21:00:00Z"
}`}
          />
        </div>
      </Section>

      {/* Keywords */}
      <Section id="keywords" title="Keywords">
        <Endpoint
          method="POST"
          path="/api/v1/keywords/research"
          description="Research keyword opportunities for a seed keyword."
          scope="keywords:read"
          params={[
            { name: 'seed_keyword', type: 'string', required: true, description: 'Seed keyword to research' },
            { name: 'depth', type: 'string', description: 'Research depth: basic (10), standard (50, default), deep (200)' },
          ]}
          response={`{
  "status": "success",
  "data": {
    "keywords": [
      {
        "keyword": "crm software for small business",
        "search_volume": 8100,
        "keyword_difficulty": 42,
        "cpc": 3.20
      }
    ],
    "total_found": 50
  },
  "timestamp": "2026-04-15T21:00:00Z"
}`}
          example={`curl -X POST https://infin8content.com/api/v1/keywords/research \\
  -H "Authorization: Bearer inf8_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"seed_keyword": "crm software", "depth": "standard"}'`}
        />
      </Section>

      {/* Analytics */}
      <Section id="analytics" title="Analytics">
        <Endpoint
          method="GET"
          path="/api/v1/analytics/articles/:id"
          description="Get performance analytics for a specific article."
          scope="analytics:read"
          response={`{
  "status": "success",
  "data": {
    "article_id": "uuid",
    "title": "Article title",
    "publish_count": 2,
    "publish_history": [
      {
        "cms_platform": "wordpress",
        "published_at": "2026-04-15T12:00:00Z",
        "post_url": "https://yourblog.com/article-slug"
      }
    ]
  },
  "timestamp": "2026-04-15T21:00:00Z"
}`}
        />
      </Section>

      {/* API Keys */}
      <Section id="api-keys" title="API Key Management">
        <div className="space-y-4">
          <Endpoint
            method="GET"
            path="/api/v1/api-keys"
            description="List all API keys for your organization. Key values are never returned — only the prefix."
            response={`{
  "status": "success",
  "data": {
    "keys": [
      {
        "id": "uuid",
        "name": "Production key",
        "key_prefix": "inf8_liv",
        "scopes": ["articles:read", "articles:write"],
        "status": "active",
        "last_used_at": "2026-04-15T20:00:00Z",
        "expires_at": null
      }
    ]
  }
}`}
          />

          <Endpoint
            method="POST"
            path="/api/v1/api-keys"
            description="Create a new API key. The full key is returned ONCE in this response — store it immediately."
            params={[
              { name: 'name', type: 'string', required: true, description: 'Human-readable name for the key' },
              { name: 'scopes', type: 'string[]', required: true, description: 'Granted scopes: articles:read, articles:write, keywords:read, analytics:read' },
              { name: 'expires_at', type: 'string', description: 'ISO 8601 expiry datetime (optional)' },
            ]}
            response={`{
  "status": "success",
  "data": {
    "id": "uuid",
    "raw_key": "inf8_live_...",
    "key_prefix": "inf8_liv",
    "name": "Production key",
    "scopes": ["articles:read"]
  }
}`}
          />

          <Endpoint
            method="DELETE"
            path="/api/v1/api-keys/:id"
            description="Revoke an API key. This action is irreversible."
            response={`{
  "status": "success",
  "data": { "revoked": true }
}`}
          />
        </div>
      </Section>

      {/* SDK */}
      <section id="sdk" className="scroll-mt-6 space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">TypeScript SDK</h2>
        <p className="text-sm text-muted-foreground">
          The official SDK wraps the REST API with full TypeScript types.
        </p>
        <pre className="bg-muted rounded p-4 text-xs overflow-auto">
{`import { Infin8ContentClient } from '@infin8content/sdk'

const client = new Infin8ContentClient({ apiKey: 'inf8_live_...' })

// List completed articles
const { articles } = await client.articles.list({ status: 'completed', limit: 10 })

// Generate a new article
const { article_id } = await client.articles.generate({ keyword: 'best crm for startups' })

// Research keywords
const { keywords } = await client.keywords.research({ seed_keyword: 'crm software' })`}
        </pre>
        <p className="text-sm text-muted-foreground">
          Install via npm:{' '}
          <code className="bg-muted px-1 rounded font-mono text-xs">npm install @infin8content/sdk</code>
        </p>
      </section>
    </div>
  )
}
