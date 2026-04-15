import { WebhooksPanel } from '@/components/settings/WebhooksPanel'

export const metadata = {
  title: 'Webhooks — Infin8Content',
  description: 'Configure outbound webhooks to receive real-time event notifications.',
}

export default function WebhooksSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Webhooks</h2>
        <p className="text-muted-foreground mt-1">
          Receive real-time POST notifications when articles are generated, published, or when events
          occur in your account.
        </p>
      </div>

      <WebhooksPanel />

      <div className="rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Verifying signatures</p>
        <p>
          Every webhook delivery includes an{' '}
          <code className="font-mono text-xs">X-Webhook-Signature</code> header of the form{' '}
          <code className="font-mono text-xs">sha256=&lt;hex-digest&gt;</code>. Compute
          HMAC-SHA256 of the raw request body using your endpoint secret and compare with
          constant-time equality.
        </p>
        <pre className="bg-muted rounded p-2 text-xs overflow-auto">
          {`// Node.js example
const crypto = require('crypto')

const sig = req.headers['x-webhook-signature']
const expected = 'sha256=' + crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex')

const isValid = crypto.timingSafeEqual(
  Buffer.from(sig), Buffer.from(expected)
)`}
        </pre>
      </div>
    </div>
  )
}
