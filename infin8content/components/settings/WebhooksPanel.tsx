'use client'

/**
 * components/settings/WebhooksPanel.tsx
 * Epic 11, Story 11.4 — Webhook endpoint management UI
 *
 * Features:
 * - List active outbound webhook endpoints
 * - Create new endpoint modal (name, HTTPS URL, events, optional custom secret)
 * - One-time secret display (same pattern as ApiKeysPanel)
 * - Enable/disable and delete endpoints
 * - Send test delivery button
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Plus, Trash2, AlertCircle, Check, Send, Webhook } from 'lucide-react'

const SUPPORTED_EVENTS = [
  { value: 'article.generated', label: 'Article generated' },
  { value: 'article.published', label: 'Article published' },
  { value: 'article.failed', label: 'Article generation failed' },
  { value: 'keyword_research.completed', label: 'Keyword research completed' },
  { value: 'usage_limit.approaching', label: 'Usage limit approaching (90%)' },
] as const

type WebhookEvent = (typeof SUPPORTED_EVENTS)[number]['value']

interface WebhookEndpoint {
  id: string
  name: string
  url: string
  events: WebhookEvent[]
  status: 'active' | 'disabled'
  success_count: number
  failure_count: number
  last_triggered_at?: string
  created_at: string
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── One-time secret display ───────────────────────────────────────────────────

function NewSecretDialog({ secret, onClose }: { secret: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  return (
    <Dialog open onOpenChange={() => confirmed && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Webhook Secret</DialogTitle>
          <DialogDescription>
            This is the signing secret for your webhook endpoint. Use it to verify the
            <code className="mx-1 font-mono text-small">X-Webhook-Signature</code> header on incoming
            deliveries.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-400 bg-amber-50 text-amber-900">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This secret will not be shown again. Store it securely now.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2 rounded-md border bg-muted p-3 font-mono text-small break-all">
          <span className="flex-1">{secret}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              await navigator.clipboard.writeText(secret)
              setCopied(true)
            }}
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <label className="flex items-center gap-2 font-lato text-small cursor-pointer select-none">
          <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} />
          I have copied the webhook secret
        </label>

        <DialogFooter>
          <Button onClick={onClose} disabled={!confirmed}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Create endpoint modal ─────────────────────────────────────────────────────

function CreateEndpointModal({ onCreated }: { onCreated: (secret: string) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>(['article.generated'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleEvent = (event: WebhookEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  const handleCreate = async () => {
    setError('')
    if (!name.trim()) return setError('Name is required')
    if (!url.trim()) return setError('URL is required')
    if (!url.startsWith('https://')) return setError('URL must start with https://')
    if (!selectedEvents.length) return setError('Select at least one event')
    setLoading(true)

    try {
      const res = await fetch('/api/webhook-endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), url: url.trim(), events: selectedEvents }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create endpoint')
        return
      }
      setOpen(false)
      onCreated(data.secret)
      setName('')
      setUrl('')
      setSelectedEvents(['article.generated'])
    } catch {
      setError('Network error — please retry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Endpoint
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Infin8Content will send signed POST requests to this URL when events occur.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="wh-name">Name *</Label>
              <Input id="wh-name" placeholder="e.g. Production Server" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="wh-url">URL * (must be https://)</Label>
              <Input id="wh-url" placeholder="https://yoursite.com/api/webhooks/infin8" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div>
              <Label>Events *</Label>
              <div className="mt-2 space-y-2">
                {SUPPORTED_EVENTS.map((e) => (
                  <label key={e.value} className="flex items-center gap-2 font-lato text-small cursor-pointer">
                    <Checkbox
                      checked={selectedEvents.includes(e.value)}
                      onCheckedChange={() => toggleEvent(e.value)}
                    />
                    {e.label}
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="font-lato text-small text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating…' : 'Create Endpoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function WebhooksPanel() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, string>>({})

  const loadEndpoints = useCallback(async () => {
    try {
      const res = await fetch('/api/webhook-endpoints')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load endpoints'); return }
      setEndpoints(data.endpoints)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadEndpoints() }, [loadEndpoints])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook endpoint? All delivery history will be lost.')) return
    await fetch(`/api/webhook-endpoints/${id}`, { method: 'DELETE' })
    loadEndpoints()
  }

  const handleTest = async (id: string) => {
    setTesting(id)
    try {
      const res = await fetch(`/api/webhook-endpoints/${id}/test`, { method: 'POST' })
      const data = await res.json()
      setTestResult((prev) => ({
        ...prev,
        [id]: data.success ? `✓ Delivered (HTTP ${data.http_status})` : `✗ Failed: ${data.error}`,
      }))
    } catch {
      setTestResult((prev) => ({ ...prev, [id]: '✗ Network error' }))
    } finally {
      setTesting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-poppins text-h3-mobile font-semibold text-neutral-900 flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhook Endpoints
          </h3>
          <p className="font-lato text-small text-neutral-600 mt-1">
            Receive real-time notifications when events happen in your account.
          </p>
        </div>
        <CreateEndpointModal onCreated={(secret) => { setNewSecret(secret); loadEndpoints() }} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <p className="font-lato text-small text-neutral-600">Loading…</p>
      ) : endpoints.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center font-lato text-small text-neutral-600">
          No webhook endpoints yet. Add one to start receiving event notifications.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deliveries</TableHead>
              <TableHead>Last Triggered</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.map((ep) => (
              <TableRow key={ep.id}>
                <TableCell className="font-medium">{ep.name}</TableCell>
                <TableCell>
                  <span className="font-mono text-small text-neutral-600 truncate max-w-50 block">
                    {ep.url}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {ep.events.map((e) => (
                      <Badge key={e} variant="secondary" className="text-small">{e}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={ep.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {ep.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-lato text-small">
                  <span className="text-green-600">{ep.success_count} ✓</span>
                  {ep.failure_count > 0 && <span className="text-destructive ml-2">{ep.failure_count} ✗</span>}
                </TableCell>
                <TableCell className="font-lato text-small text-neutral-600">{formatDate(ep.last_triggered_at)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {testResult[ep.id] && (
                      <span className="font-lato text-small text-neutral-600">{testResult[ep.id]}</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTest(ep.id)}
                      disabled={testing === ep.id}
                      title="Send test delivery"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(ep.id)}
                      title="Delete endpoint"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {newSecret && (
        <NewSecretDialog secret={newSecret} onClose={() => setNewSecret(null)} />
      )}
    </div>
  )
}
