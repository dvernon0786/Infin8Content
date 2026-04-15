import { ApiKeysPanel } from '@/components/settings/ApiKeysPanel'

export const metadata = {
  title: 'API Access — Infin8Content',
  description: 'Manage API keys for programmatic access to your content.',
}

export default function ApiSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">API Access</h2>
        <p className="text-muted-foreground mt-1">
          Use API keys to integrate Infin8Content with your own tools and workflows.
        </p>
      </div>

      <ApiKeysPanel />

      <div className="rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Using the API</p>
        <p>
          Include your API key in the <code className="font-mono text-xs">Authorization</code> header:
        </p>
        <pre className="bg-muted rounded p-2 text-xs overflow-auto">
          {`curl https://infin8content.com/api/v1/articles \\
  -H "Authorization: Bearer inf8_live_..."`}
        </pre>
        <p>
          <a
            href="/docs/api"
            className="text-primary underline underline-offset-4 hover:no-underline"
          >
            View full API documentation →
          </a>
        </p>
      </div>
    </div>
  )
}
