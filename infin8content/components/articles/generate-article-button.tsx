'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface GenerateArticleButtonProps {
    articleId: string
}

export function GenerateArticleButton({ articleId }: GenerateArticleButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [quotaError, setQuotaError] = useState<{
        currentUsage: number
        limit: number
        plan: string
    } | null>(null)
    const [showQuotaDialog, setShowQuotaDialog] = useState(false)

    const handleGenerate = async () => {
        if (isLoading) return

        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/articles/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ articleId }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => null)
                if (res.status === 403 && data?.metric === 'article_generation') {
                    setQuotaError({
                        currentUsage: data.currentUsage,
                        limit: data.limit,
                        plan: data.plan
                    })
                    setShowQuotaDialog(true)
                    return
                }
                throw new Error(data?.error || 'Failed to start generation')
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="inline-flex flex-col gap-1">
            <button
                onClick={(e) => {
                    e.stopPropagation() // Prevent row click in list view
                    handleGenerate()
                }}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-primary-blue text-white hover:bg-primary-blue/90 disabled:opacity-50 transition shadow-sm"
            >
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isLoading ? 'Starting...' : 'Generate'}
            </button>

            {error && (
                <p className="text-[10px] text-destructive font-medium leading-none">
                    {error}
                </p>
            )}

            <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-orange-600">
                            <AlertCircle className="h-5 w-5" />
                            Monthly article limit reached
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            You&apos;ve generated <span className="font-bold text-foreground">{quotaError?.currentUsage} of {quotaError?.limit}</span> articles this month.
                            Your quota resets on the first day of next month.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowQuotaDialog(false)}
                            className="w-full sm:w-auto"
                        >
                            Close
                        </Button>
                        <Button
                            variant="primary"
                            className="w-full sm:w-auto bg-primary-blue hover:bg-primary-blue/90"
                            onClick={() => router.push('/dashboard/settings/billing')}
                        >
                            Upgrade to {quotaError?.plan === 'starter' ? 'Pro' : 'Agency'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
