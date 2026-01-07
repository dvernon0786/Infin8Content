/**
 * User Data Export API Endpoint
 * Story 1.13: Audit Logging for Compliance
 * 
 * Exports all user data in JSON format for GDPR/CCPA compliance
 */

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/get-current-user'
import { createClient } from '@/lib/supabase/server'
import { logActionAsync, extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger'
import { AuditAction } from '@/types/audit'

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser || !currentUser.org_id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const supabase = await createClient()

        // Export all user data
        const exportData = {
            user: {
                id: currentUser.id,
                email: currentUser.email,
                first_name: currentUser.first_name,
                role: currentUser.role,
                org_id: currentUser.org_id,
            },
            organization: currentUser.organizations,
            exported_at: new Date().toISOString(),
        }

        // Log audit event for compliance
        logActionAsync({
            orgId: currentUser.org_id,
            userId: currentUser.id,
            action: AuditAction.DATA_EXPORT_REQUESTED,
            details: {
                exportType: 'user_data',
                format: 'json',
            },
            ipAddress: extractIpAddress(request.headers),
            userAgent: extractUserAgent(request.headers),
        })

        // Return JSON file
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="user-data-export-${new Date().toISOString().split('T')[0]}.json"`,
            },
        })
    } catch (error) {
        console.error('Data export error:', error)
        return NextResponse.json(
            { error: 'Failed to export data' },
            { status: 500 }
        )
    }
}

