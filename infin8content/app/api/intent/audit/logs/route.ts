/**
 * Intent Engine Audit Logs API Endpoint
 * Story 37.4: Maintain Complete Audit Trail of All Decisions
 * 
 * This endpoint provides read-only access to Intent Engine audit logs.
 * Only organization owners can access audit logs for their organization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/get-current-user';
import { getIntentAuditLogs, getIntentAuditLogsCount } from '@/lib/services/intent-engine/intent-audit-logger';
import { extractIpAddress, extractUserAgent } from '@/lib/services/audit-logger';

export async function GET(request: NextRequest) {
    try {
        // Get current user and verify authentication
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.org_id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const workflowId = searchParams.get('workflow_id') || undefined;
        const actorId = searchParams.get('actor_id') || undefined;
        const action = searchParams.get('action') || undefined;
        const entityType = searchParams.get('entity_type') as 'workflow' | 'keyword' | 'article' || undefined;
        const dateFrom = searchParams.get('date_from') || undefined;
        const dateTo = searchParams.get('date_to') || undefined;
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000); // Cap at 1000
        const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
        const includeCount = searchParams.get('include_count') === 'true';

        // Validate entity_type if provided
        if (entityType && !['workflow', 'keyword', 'article'].includes(entityType)) {
            return NextResponse.json(
                { error: 'Invalid entity_type. Must be one of: workflow, keyword, article' },
                { status: 400 }
            );
        }

        // Validate dates if provided
        if (dateFrom && isNaN(Date.parse(dateFrom))) {
            return NextResponse.json(
                { error: 'Invalid date_from format. Use ISO 8601 format.' },
                { status: 400 }
            );
        }
        if (dateTo && isNaN(Date.parse(dateTo))) {
            return NextResponse.json(
                { error: 'Invalid date_to format. Use ISO 8601 format.' },
                { status: 400 }
            );
        }

        // Query audit logs
        const logs = await getIntentAuditLogs({
            organizationId: currentUser.org_id,
            workflowId,
            actorId,
            action,
            entityType,
            dateFrom,
            dateTo,
            limit,
            offset,
        });

        // Get total count if requested
        let totalCount: number | undefined;
        if (includeCount) {
            totalCount = await getIntentAuditLogsCount({
                organizationId: currentUser.org_id,
                workflowId,
                actorId,
                action,
                entityType,
                dateFrom,
                dateTo,
            });
        }

        // Log the audit query itself
        const logIntentAction = (await import('@/lib/services/intent-engine/intent-audit-logger')).logIntentActionAsync;
        logIntentAction({
            organizationId: currentUser.org_id,
            entityType: 'workflow',
            entityId: currentUser.org_id, // Using org_id as entity_id for audit queries
            actorId: currentUser.id,
            action: 'audit.queries.executed',
            details: {
                workflowId,
                actorId,
                action,
                entityType,
                dateFrom,
                dateTo,
                limit,
                offset,
                resultCount: logs.length,
                totalCount,
            },
            ipAddress: extractIpAddress(request.headers),
            userAgent: extractUserAgent(request.headers),
        });

        // Return response
        const response: any = {
            logs,
            pagination: {
                limit,
                offset,
                hasMore: logs.length === limit,
            },
        };

        if (includeCount && totalCount !== undefined) {
            response.pagination.totalCount = totalCount;
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('[Intent Audit Logs API] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
