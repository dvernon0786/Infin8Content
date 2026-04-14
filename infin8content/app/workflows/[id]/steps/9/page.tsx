export const dynamic = 'force-dynamic'

import { requireWorkflowStepAccess } from '@/lib/guards/workflow-step-gate'
import { Loader2 } from 'lucide-react'

interface PageProps {
    params: { id: string }
}

/**
 * Step 9: Article Generation (Terminal View)
 * 
 * This page acts as a passthrough for the terminal workflow state.
 * The requireWorkflowStepAccess guard will automatically redirect 
 * completed or step_9_* workflows to the Articles dashboard.
 */
export default async function Step9Page({ params }: PageProps) {
    const { id } = await params

    // This will trigger the redirect in workflow-step-gate.ts
    await requireWorkflowStepAccess(id, 9)

    return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    )
}
