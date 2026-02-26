import { NextRequest, NextResponse } from 'next/server'
import { processBulkSubtopicApproval } from '@/lib/services/keyword-engine/subtopic-approval-processor'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: workflowId } = await params
        const body = await request.json()

        if (!Array.isArray(body.approvedKeywordIds)) {
            return NextResponse.json({ error: 'Invalid payload: approvedKeywordIds must be an array' }, { status: 400 })
        }

        const result = await processBulkSubtopicApproval(
            workflowId,
            body.approvedKeywordIds,
            request.headers
        )

        if (!result?.success) {
            const errorResult = result as any
            return NextResponse.json(
                { error: errorResult?.error || 'Bulk approval failed' },
                { status: 500 }
            )
        }

        return NextResponse.redirect(
            new URL('/dashboard/articles', request.url)
        )
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
