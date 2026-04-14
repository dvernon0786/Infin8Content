'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CMS_PLATFORMS, CMS_PLATFORM_LABELS } from '@/lib/services/publishing/cms-engine'
import type { CMSPlatform } from '@/lib/services/publishing/cms-engine'

interface CmsConnectionFormProps {
  existing?: {
    id: string
    platform: CMSPlatform
    name: string
    credentials: Record<string, string>
  }
  onSuccess: () => void
  onCancel?: () => void
}

type FieldDef = { key: string; label: string; type?: string; placeholder?: string; hint?: string }

const PLATFORM_FIELDS: Record<CMSPlatform, FieldDef[]> = {
  wordpress: [
    { key: 'url', label: 'Site URL', placeholder: 'https://yourblog.com', type: 'url' },
    { key: 'username', label: 'Username', placeholder: 'admin' },
    { key: 'application_password', label: 'Application Password', type: 'password', placeholder: 'xxxx xxxx xxxx xxxx', hint: 'Generate in WordPress → Users → Profile → Application Passwords' },
  ],
  webflow: [
    { key: 'api_token', label: 'API Token', type: 'password', placeholder: 'Webflow API token', hint: 'Generate in Webflow → Account Settings → API Access' },
    { key: 'collection_id', label: 'Collection ID', placeholder: 'CMS Collection ID' },
    { key: 'site_url', label: 'Site URL (optional)', placeholder: 'https://yoursite.webflow.io', type: 'url' },
  ],
  shopify: [
    { key: 'shop', label: 'Shop Subdomain', placeholder: 'mystore (without .myshopify.com)', hint: 'Just the subdomain, e.g. "mystore" for mystore.myshopify.com' },
    { key: 'blog_id', label: 'Blog ID', placeholder: 'Shopify Blog ID' },
    { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'Shopify Admin API access token' },
  ],
  ghost: [
    { key: 'url', label: 'Site URL', placeholder: 'https://yourblog.ghost.io', type: 'url' },
    { key: 'admin_api_key', label: 'Admin API Key', type: 'password', placeholder: 'id:secret_hex', hint: 'Found in Ghost Admin → Settings → Integrations → Add Custom Integration' },
  ],
  notion: [
    { key: 'token', label: 'Integration Token', type: 'password', placeholder: 'secret_...', hint: 'Create at https://www.notion.so/my-integrations' },
    { key: 'database_id', label: 'Database ID', placeholder: '32-character database ID', hint: 'Found in the Notion page URL after the workspace name' },
  ],
  custom: [
    { key: 'endpoint', label: 'API Endpoint', placeholder: 'https://api.yoursite.com/posts', type: 'url' },
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Bearer token or API key' },
    { key: 'method', label: 'HTTP Method (optional)', placeholder: 'POST', hint: 'Default: POST' },
  ],
}

export function CmsConnectionForm({ existing, onSuccess, onCancel }: CmsConnectionFormProps) {
  const [platform, setPlatform] = useState<CMSPlatform>(existing?.platform || 'wordpress')
  const [name, setName] = useState(existing?.name || '')
  const [fields, setFields] = useState<Record<string, string>>(
    existing?.credentials
      ? Object.fromEntries(
          Object.entries(existing.credentials).map(([k, v]) => [k, v === '••••••••' ? '' : v])
        )
      : {}
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!existing

  const handleFieldChange = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // For edit, only include fields that were actually filled in (non-empty)
    const credentials = isEdit
      ? Object.fromEntries(Object.entries(fields).filter(([, v]) => v.trim() !== ''))
      : fields

    try {
      const url = isEdit ? `/api/cms-connections/${existing.id}` : '/api/cms-connections'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? { name: name || undefined, credentials: Object.keys(credentials).length ? credentials : undefined }
            : { platform, name, credentials }
        ),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || (data.details?.message ? `${data.error}: ${data.details.message}` : 'Failed to save'))
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const platformFields = PLATFORM_FIELDS[platform]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Platform selector — locked on edit */}
      {!isEdit && (
        <div className="space-y-1.5">
          <Label>Platform</Label>
          <Select value={platform} onValueChange={v => { setPlatform(v as CMSPlatform); setFields({}) }}>
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {CMS_PLATFORMS.map(p => (
                <SelectItem key={p} value={p}>{CMS_PLATFORM_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Connection name */}
      <div className="space-y-1.5">
        <Label>Connection Name</Label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={`e.g. Main ${CMS_PLATFORM_LABELS[platform]} Blog`}
          required={!isEdit}
        />
      </div>

      {/* Dynamic credential fields */}
      {platformFields.map(field => (
        <div key={field.key} className="space-y-1.5">
          <Label>{field.label}</Label>
          <Input
            type={field.type || 'text'}
            value={fields[field.key] || ''}
            onChange={e => handleFieldChange(field.key, e.target.value)}
            placeholder={isEdit && existing?.credentials[field.key] === '••••••••' ? '(unchanged)' : field.placeholder}
            required={!isEdit}
            autoComplete={field.type === 'password' ? 'new-password' : 'off'}
          />
          {field.hint && (
            <p className="text-xs text-muted-foreground">{field.hint}</p>
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Testing & Saving...' : isEdit ? 'Update Connection' : `Connect ${CMS_PLATFORM_LABELS[platform]}`}
        </Button>
      </div>
    </form>
  )
}
