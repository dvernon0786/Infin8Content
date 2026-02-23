'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface GenerateArticleButtonProps {
    articleId: string
}

export function GenerateArticleButton({ articleId }: GenerateArticleButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
                throw new Error(data?.error || 'Failed to start generation')
            }

            // Refresh page to update status immediately
            router.refresh()

        } catch (err: any) {
            setError(err.message || 'Something went wrong')
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
        </div>
    )
}
