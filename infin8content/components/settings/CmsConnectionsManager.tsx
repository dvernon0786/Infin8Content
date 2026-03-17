'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2, RefreshCw, CheckCircle, XCircle, Globe } from 'lucide-react'
import { CmsConnectionForm } from './CmsConnectionForm'
import { CMS_PLATFORM_LABELS } from '@/lib/services/publishing/cms-engine'
import type { CMSPlatform } from '@/lib/services/publishing/cms-engine'

interface CmsConnection {
  id: string
  platform: CMSPlatform
  name: string
  status: string
  credentials: Record<string, string>
  created_at: string
  updated_at: string
}

interface CmsConnectionsManagerProps {
  orgId: string
}

export function CmsConnectionsManager({ orgId }: CmsConnectionsManagerProps) {
  const [connections, setConnections] = useState<CmsConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingConnection, setEditingConnection] = useState<CmsConnection | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message?: string }>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadConnections = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/cms-connections')
      if (!res.ok) throw new Error('Failed to load connections')
      const data = await res.json()
      setConnections(data.connections || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load connections')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  const handleTest = async (connId: string) => {
    setTestingId(connId)
    setTestResults(prev => ({ ...prev, [connId]: undefined! }))
    try {
      const res = await fetch(`/api/cms-connections/${connId}/test`, { method: 'POST' })
      const data = await res.json()
      setTestResults(prev => ({ ...prev, [connId]: data }))
    } catch {
      setTestResults(prev => ({ ...prev, [connId]: { success: false, message: 'Network error' } }))
    } finally {
      setTestingId(null)
    }
  }

  const handleDelete = async (connId: string) => {
    if (!confirm('Delete this CMS connection? This cannot be undone.')) return
    setDeletingId(connId)
    try {
      const res = await fetch(`/api/cms-connections/${connId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setConnections(prev => prev.filter(c => c.id !== connId))
    } catch (err: any) {
      alert(err.message || 'Failed to delete connection')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaved = () => {
    setShowForm(false)
    setEditingConnection(null)
    loadConnections()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Existing connections */}
      {connections.length > 0 && (
        <div className="space-y-3">
          {connections.map(conn => {
            const testResult = testResults[conn.id]
            const platformUrl = conn.credentials?.url || conn.credentials?.site_url

            return (
              <Card key={conn.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Globe className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{conn.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {CMS_PLATFORM_LABELS[conn.platform]}
                          </Badge>
                          <Badge variant="secondary" className="text-xs text-green-700 bg-green-50">
                            Active
                          </Badge>
                        </div>
                        {platformUrl && (
                          <p className="text-sm text-gray-500 mt-0.5 truncate">{platformUrl}</p>
                        )}
                        {testResult && (
                          <div className={`flex items-center gap-1 mt-1 text-xs ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                            {testResult.success
                              ? <><CheckCircle className="h-3 w-3" /> Connected</>
                              : <><XCircle className="h-3 w-3" /> {testResult.message || 'Failed'}</>
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTest(conn.id)}
                        disabled={testingId === conn.id}
                        title="Test connection"
                      >
                        {testingId === conn.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <RefreshCw className="h-3.5 w-3.5" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingConnection(conn); setShowForm(true) }}
                        title="Edit connection"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(conn.id)}
                        disabled={deletingId === conn.id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete connection"
                      >
                        {deletingId === conn.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {connections.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-10 text-center">
            <Globe className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No CMS connections yet.</p>
            <p className="text-gray-400 text-xs mt-1">Connect a platform to start publishing your articles.</p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit form */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingConnection ? `Edit ${editingConnection.name}` : 'Add New Connection'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CmsConnectionForm
              existing={editingConnection || undefined}
              onSuccess={handleSaved}
              onCancel={() => { setShowForm(false); setEditingConnection(null) }}
            />
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Connection
        </Button>
      )}
    </div>
  )
}
