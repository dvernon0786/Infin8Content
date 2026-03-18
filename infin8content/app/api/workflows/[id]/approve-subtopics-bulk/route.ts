import { NextRequest, NextResponse } from 'next/server'
import { processBulkSubtopicApproval } from '@/lib/services/keyword-engine/subtopic-approval-processor'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: workflowId } = await params
        // Bulk approve: endpoint no longer requires an array of IDs.
        // The service will approve all remaining 'not_started' keywords for the workflow.
        const result = await processBulkSubtopicApproval(
            workflowId,
            request.headers
        )

        if (!result?.success) {
            const errorResult = result as any
            return NextResponse.json(
                { error: errorResult?.error || 'Bulk approval failed' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: result.message
        })
    } catch (err: any) {
        console.error('Bulk subtopic approval error:', err)

        // Handle specific error cases
        if (err instanceof Error) {
            if (err.message.includes('Authentication required')) {
                return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
            }
            if (err.message.includes('Admin access required')) {
                return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
            }
        }

        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}
