"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { WordPressIntegrationForm } from "./WordPressIntegrationForm"
import { Globe, Trash2, Edit2, Loader2, Plus, ExternalLink, ShieldCheck } from "lucide-react"

interface Integration {
    url: string
    username: string
    connected_at: string
    last_validated_at: string
    site_name?: string
    user_name?: string
}

export function IntegrationsManager() {
    const [integrations, setIntegrations] = useState<Record<string, Integration>>({})
    const [loading, setLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [editType, setEditType] = useState<string | null>(null)
    const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)

    const fetchIntegrations = async () => {
        try {
            const res = await fetch('/api/dashboard/integrations')
            const data = await res.json()
            if (data.integrations) {
                setIntegrations(data.integrations)
            }
        } catch (err) {
            console.error('Failed to fetch integrations:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIntegrations()
    }, [])

    const handleDelete = async (type: string) => {
        if (!confirm(`Are you sure you want to disconnect ${type}? This will stop auto-publishing.`)) return

        setIsDeleting(type)
        try {
            const res = await fetch(`/api/dashboard/integrations?type=${type}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                const newIntegrations = { ...integrations }
                delete newIntegrations[type]
                setIntegrations(newIntegrations)
            }
        } catch (err) {
            console.error('Failed to delete integration:', err)
        } finally {
            setIsDeleting(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            </div>
        )
    }

    const hasIntegrations = Object.keys(integrations).length > 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-poppins font-semibold text-neutral-900">CMS Integrations</h2>
                    <p className="text-neutral-600 font-lato">Manage your connected publishing platforms</p>
                </div>

                {!integrations.wordpress && (
                    <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="font-lato">
                                <Plus className="w-4 h-4 mr-2" />
                                Connect New Site
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Connect WordPress</DialogTitle>
                                <DialogDescription>
                                    Enter your WordPress credentials to enable direct publishing.
                                </DialogDescription>
                            </DialogHeader>
                            <WordPressIntegrationForm
                                onSuccess={() => {
                                    fetchIntegrations()
                                    setIsNewDialogOpen(false)
                                }}
                                onCancel={() => setIsNewDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {!hasIntegrations ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                            <Globe className="w-8 h-8 text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-poppins font-medium text-neutral-900">No Integrations Connected</h3>
                        <p className="text-neutral-500 font-lato max-w-sm mt-2 mb-6">
                            Connect your WordPress site to start publishing generated articles automatically.
                        </p>
                        <Button variant="outline" onClick={() => setIsNewDialogOpen(true)}>
                            Get Started
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {Object.entries(integrations).map(([type, integration]) => (
                        <Card key={type} className="overflow-hidden">
                            <div className="flex items-center p-6 gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                    <Globe className="w-6 h-6 text-primary" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-poppins font-semibold text-neutral-900 truncate">
                                            {integration.site_name || 'WordPress Site'}
                                        </h3>
                                        <Badge variant="success" className="bg-green-50 text-green-700 border-green-100">
                                            Connected
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-neutral-500 font-lato">
                                        <span className="flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" />
                                            {integration.url}
                                        </span>
                                        <span className="flex items-center gap-1 border-l pl-3">
                                            <ShieldCheck className="w-3 h-3 text-neutral-400" />
                                            {integration.username}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Dialog open={editType === type} onOpenChange={(open) => !open && setEditType(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => setEditType(type)}>
                                                <Edit2 className="w-4 h-4 text-neutral-500" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-xl">
                                            <DialogHeader>
                                                <DialogTitle>Edit {type} Integration</DialogTitle>
                                                <DialogDescription>
                                                    Update your connection credentials for {integration.url}.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <WordPressIntegrationForm
                                                initialData={{
                                                    url: integration.url,
                                                    username: integration.username
                                                }}
                                                onSuccess={() => {
                                                    fetchIntegrations()
                                                    setEditType(null)
                                                }}
                                                onCancel={() => setEditType(null)}
                                            />
                                        </DialogContent>
                                    </Dialog>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(type)}
                                        disabled={isDeleting === type}
                                    >
                                        {isDeleting === type ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                        ) : (
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-neutral-50 px-6 py-3 border-t flex items-center justify-between text-xs text-neutral-400 font-lato">
                                <span>Connected on {new Date(integration.connected_at).toLocaleDateString()}</span>
                                <span>Last verified {new Date(integration.last_validated_at || integration.connected_at).toLocaleDateString()}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
