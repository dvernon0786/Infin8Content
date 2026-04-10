'use client'

import { CheckCircle2, Circle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Step {
    label: string
    completed: boolean
}

interface TrialChecklistProps {
    hasWorkflow: boolean
    hasCompletedArticle: boolean
}

export function TrialChecklist({ hasWorkflow, hasCompletedArticle }: TrialChecklistProps) {
    const steps: Step[] = [
        { label: 'Create your first workflow', completed: hasWorkflow },
        { label: 'Generate your first article', completed: hasCompletedArticle },
        { label: 'Unlock remaining articles', completed: false },
    ]

    const completedCount = steps.filter(s => s.completed).length
    const progress = Math.round((completedCount / steps.length) * 100)

    return (
        <Card className="border-[--brand-electric-blue]/20 bg-linear-to-r from-[--brand-electric-blue]/5 to-white">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <p className="font-poppins font-semibold text-sm text-neutral-900">
                        Your First Content Success
                    </p>
                    <span className="font-lato text-xs text-neutral-500">
                        {completedCount} / {steps.length} completed
                    </span>
                </div>

                <div className="space-y-2 mb-4">
                    {steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                            {step.completed
                                ? <CheckCircle2 className="h-4 w-4 text-[--brand-electric-blue] shrink-0" />
                                : <Circle className="h-4 w-4 text-neutral-300 shrink-0" />
                            }
                            <span className={`font-lato text-sm ${step.completed ? 'text-neutral-500 line-through' : 'text-neutral-700'}`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden mb-4">
                    <div
                        className="h-full bg-[--brand-electric-blue] rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {hasCompletedArticle && (
                    <Button size="sm" asChild className="w-full bg-[--brand-electric-blue] text-white">
                        <Link href="/dashboard/settings/billing">
                            Unlock Remaining Articles
                        </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
