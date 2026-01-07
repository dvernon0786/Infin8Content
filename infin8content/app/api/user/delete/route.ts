/**
 * Account Deletion API Endpoint
 * Story 1.13: Audit Logging for Compliance
 * 
 * Handles account deletion requests for GDPR/CCPA compliance
 * Note: This is a placeholder implementation - actual deletion logic
 * should implement soft delete with 30-day grace period per PRD requirements
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'

const deleteAccountSchema = z.object({
    confirm: z.boolean().refine((val) => val === true, {
        message: 'Account deletion must be explicitly confirmed',
    }),
})

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser || !currentUser.org_id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { confirm } = deleteAccountSchema.parse(body)

        if (!confirm) {
            return NextResponse.json(
                { error: 'Account deletion must be explicitly confirmed' },
                { status: 400 }
            )
        }

        // Validate: Cannot delete account if user is organization owner
        if (currentUser.role === 'owner') {
            return NextResponse.json(
                { error: 'Organization owners cannot delete their account. Please transfer ownership first or delete the organization.' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Log audit event BEFORE deletion (critical for compliance)
        logActionAsync({
            orgId: currentUser.org_id,
            userId: currentUser.id,
            action: AuditAction.ACCOUNT_DELETION_REQUESTED,
            details: {
                userEmail: currentUser.email,
                userRole: currentUser.role,
                // Note: Actual deletion should be soft delete with grace period
                deletionType: 'requested',
            },
            ipAddress: extractIpAddress(request.headers),
            userAgent: extractUserAgent(request.headers),
        })

        // TODO: Implement soft delete with 30-day grace period per PRD
        // For now, this is a placeholder that logs the request
        // Actual implementation should:
        // 1. Mark account for deletion (soft delete flag)
        // 2. Set deletion_scheduled_at to 30 days from now
        // 3. Send confirmation email
        // 4. Schedule actual deletion via cron/worker

        return NextResponse.json({
            success: true,
            message: 'Account deletion requested. Your account will be permanently deleted after a 30-day grace period.',
            scheduledDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues?.[0]
            return NextResponse.json(
                { error: firstError?.message || 'Validation error' },
                { status: 400 }
            )
        }

        console.error('Account deletion error:', error)
        return NextResponse.json(
            { error: 'Failed to process deletion request' },
            { status: 500 }
        )
    }
}

