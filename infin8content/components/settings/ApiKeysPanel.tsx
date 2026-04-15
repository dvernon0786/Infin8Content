'use client'

/**
 * components/settings/ApiKeysPanel.tsx
 * Epic 11, Story 11.3 — API Key management UI for settings page
 *
 * Features:
 * - List of existing API keys (prefix, name, scopes, status, last used)
 * - Generate new key modal (name, scopes, optional expiry)
 * - One-time copy dialog after generation — "I've copied it" gate
 * - Revoke key confirmation dialog
 * - Pro/Agency plan gate (403 from API shows upgrade prompt)
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
import { Copy, Key, Plus, Trash2, AlertCircle, Check } from 'lucide-react'

const ALL_SCOPES = [
  { value: 'articles:read', label: 'Read articles' },
  { value: 'articles:write', label: 'Create & publish articles' },
  { value: 'keywords:read', label: 'Read keyword research' },
  { value: 'analytics:read', label: 'Read analytics' },
] as const

type Scope = (typeof ALL_SCOPES)[number]['value']

interface ApiKey {
  id: string
  name: string
  description?: string
  key_prefix: string
  scopes: Scope[]
  status: 'active' | 'revoked' | 'expired'
  expires_at?: string
  last_used_at?: string
  usage_count: number
  created_at: string
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── One-time key copy dialog ──────────────────────────────────────────────────

function NewKeyCopyDialog({
  rawKey,
  onClose,
}: {
  rawKey: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawKey)
    setCopied(true)
  }

  return (
    <Dialog open onOpenChange={() => confirmed && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>API Key Created</DialogTitle>
          <DialogDescription>
            This is the only time your secret API key will be shown. Copy it now and store it
            securely — we cannot retrieve it later.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-400 bg-amber-50 text-amber-900">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Store this key somewhere safe. It will not be visible again after you close this dialog.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2 rounded-md border bg-muted p-3 font-mono text-sm break-all">
          <span className="flex-1">{rawKey}</span>
          <Button variant="ghost" size="icon" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} />
          I have copied and securely stored my API key
        </label>

        <DialogFooter>
          <Button onClick={onClose} disabled={!confirmed}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Create key modal ──────────────────────────────────────────────────────────

function CreateKeyModal({ onCreated }: { onCreated: (rawKey: string) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<Scope[]>(['articles:read'])
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleScope = (scope: Scope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  const handleCreate = async () => {
    setError('')
    if (!name.trim()) return setError('Name is required')
    if (!selectedScopes.length) return setError('Select at least one scope')
    setLoading(true)

    try {
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          scopes: selectedScopes,
          expires_at: expiresAt || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create key')
        return
      }

      setOpen(false)
      onCreated(data.key.raw_key)
      setName('')
      setDescription('')
      setSelectedScopes(['articles:read'])
      setExpiresAt('')
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
        Generate API Key
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>
              API keys allow external systems to access your content programmatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="key-name">Name *</Label>
              <Input
                id="key-name"
                placeholder="e.g. Production Site"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="key-desc">Description</Label>
              <Input
                id="key-desc"
                placeholder="What is this key used for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Label>Scopes *</Label>
              <div className="mt-2 space-y-2">
                {ALL_SCOPES.map((scope) => (
                  <label key={scope.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={selectedScopes.includes(scope.value)}
                      onCheckedChange={() => toggleScope(scope.value)}
                    />
                    <span className="font-mono text-xs text-muted-foreground mr-1">{scope.value}</span>
                    {scope.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="key-expiry">Expiry (optional)</Label>
              <Input
                id="key-expiry"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating…' : 'Create Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Revoke confirmation dialog ────────────────────────────────────────────────

function RevokeDialog({
  keyId,
  keyName,
  onRevoked,
  onClose,
}: {
  keyId: string
  keyName: string
  onRevoked: () => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRevoke = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/api-keys/${keyId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to revoke key')
        return
      }
      onRevoked()
    } catch {
      setError('Network error — please retry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Revoke API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke <strong>{keyName}</strong>? Any systems using this key
            will immediately lose access. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={handleRevoke} disabled={loading}>
            {loading ? 'Revoking…' : 'Revoke Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function ApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newRawKey, setNewRawKey] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<{ id: string; name: string } | null>(null)
  const [planError, setPlanError] = useState(false)

  const loadKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/api-keys')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load API keys')
        return
      }
      setKeys(data.keys)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadKeys() }, [loadKeys])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Programmatic access to your content. Pro &amp; Agency plans only.
          </p>
        </div>
        <CreateKeyModal
          onCreated={(raw) => {
            setNewRawKey(raw)
            loadKeys()
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : keys.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No API keys yet. Generate one to get started.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead>Scopes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell>
                  <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                    {k.key_prefix}…
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {k.scopes.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs font-mono">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      k.status === 'active' ? 'default' : 'destructive'
                    }
                    className="capitalize"
                  >
                    {k.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(k.last_used_at)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(k.expires_at)}
                </TableCell>
                <TableCell>
                  {k.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setRevoking({ id: k.id, name: k.name })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* One-time key display */}
      {newRawKey && (
        <NewKeyCopyDialog rawKey={newRawKey} onClose={() => setNewRawKey(null)} />
      )}

      {/* Revoke confirmation */}
      {revoking && (
        <RevokeDialog
          keyId={revoking.id}
          keyName={revoking.name}
          onRevoked={() => {
            setRevoking(null)
            loadKeys()
          }}
          onClose={() => setRevoking(null)}
        />
      )}
    </div>
  )
}
