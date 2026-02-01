/**
 * Intent Engine audit logging service for compliance tracking
 * Story 37.4: Maintain Complete Audit Trail of All Decisions
 * 
 * This service provides non-blocking audit logging for Intent Engine operations.
 * Logs are written asynchronously to avoid performance impact on the main request flow.
 * All audit records are immutable (WORM compliance) and organization-isolated.
 */

import { createClient } from '@/lib/supabase/server';
import type { CreateIntentAuditLogParams, IntentAuditLog } from '@/types/audit';

/**
 * Log an Intent Engine audit action
 * 
 * This function logs an Intent Engine audit action to the database asynchronously.
 * It extracts IP address and user agent from the request if available.
 * 
 * @param params - Intent audit log parameters
 * @returns Promise that resolves when the log is written (or rejects on error)
 * 
 * @example
 * ```ts
 * import { logIntentAction } from '@/lib/services/intent-engine/intent-audit-logger';
 * import { AuditAction } from '@/types/audit';
 * 
 * // In an API route or server action
 * await logIntentAction({
 *   organizationId: workflow.organization_id,
 *   workflowId: workflow.id,
 *   entityType: 'workflow',
 *   entityId: workflow.id,
 *   actorId: user.id,
 *   action: AuditAction.WORKFLOW_STEP_COMPLETED,
 *   details: { step: 'step_4_longtails', duration: 120 },
 * });
 * ```
 */
export async function logIntentAction(params: CreateIntentAuditLogParams): Promise<void> {
    const { 
        organizationId, 
        workflowId, 
        entityType, 
        entityId, 
        actorId, 
        action, 
        details = {}, 
        ipAddress, 
        userAgent 
    } = params;

    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('intent_audit_logs')
            .insert({
                organization_id: organizationId,
                workflow_id: workflowId ?? null,
                entity_type: entityType,
                entity_id: entityId,
                actor_id: actorId,
                action,
                details: details as any,
                ip_address: ipAddress ?? null,
                user_agent: userAgent ?? null,
            });

        if (error) {
            // Log error but don't throw - audit logging should not break the main flow
            console.error('[Intent Audit Logger] Failed to log action:', {
                action,
                organizationId,
                workflowId,
                entityType,
                entityId,
                actorId,
                error: error.message,
            });
        }
    } catch (err) {
        // Catch any unexpected errors and log them
        console.error('[Intent Audit Logger] Unexpected error:', err);
    }
}

/**
 * Log an Intent Engine audit action asynchronously (fire-and-forget)
 * 
 * This function logs an Intent Engine audit action without waiting for the result.
 * Use this when you want to log an action but don't want to wait for it to complete.
 * 
 * @param params - Intent audit log parameters
 * 
 * @example
 * ```ts
 * import { logIntentActionAsync } from '@/lib/services/intent-engine/intent-audit-logger';
 * import { AuditAction } from '@/types/audit';
 * 
 * // Fire-and-forget logging
 * logIntentActionAsync({
 *   organizationId: workflow.organization_id,
 *   workflowId: workflow.id,
 *   entityType: 'keyword',
 *   entityId: keyword.id,
 *   actorId: user.id,
 *   action: AuditAction.KEYWORD_SUBTOPICS_APPROVED,
 *   details: { keyword: keyword.keyword, feedback: 'Good subtopics' },
 * });
 * ```
 */
export function logIntentActionAsync(params: CreateIntentAuditLogParams): void {
    // Fire-and-forget: don't await, suppress unhandled promise rejection
    void logIntentAction(params).catch((err) => {
        console.error('[Intent Audit Logger] Async logging failed:', err);
    });
}

/**
 * Query Intent audit logs for an organization
 * 
 * This function retrieves Intent audit logs with optional filtering.
 * Only organization owners can access audit logs.
 * 
 * @param params - Query parameters
 * @returns Promise that resolves to array of audit logs
 * 
 * @example
 * ```ts
 * import { getIntentAuditLogs } from '@/lib/services/intent-engine/intent-audit-logger';
 * 
 * const logs = await getIntentAuditLogs({
 *   organizationId: org.id,
 *   workflowId: workflow.id,
 *   action: AuditAction.WORKFLOW_STEP_COMPLETED,
 *   limit: 50,
 *   offset: 0,
 * });
 * ```
 */
export async function getIntentAuditLogs(params: {
    organizationId: string;
    workflowId?: string;
    actorId?: string;
    action?: string;
    entityType?: 'workflow' | 'keyword' | 'article';
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
}): Promise<IntentAuditLog[]> {
    const {
        organizationId,
        workflowId,
        actorId,
        action,
        entityType,
        dateFrom,
        dateTo,
        limit = 100,
        offset = 0,
    } = params;

    try {
        const supabase = await createClient();

        let query = supabase
            .from('intent_audit_logs')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (workflowId) {
            query = query.eq('workflow_id', workflowId);
        }
        if (actorId) {
            query = query.eq('actor_id', actorId);
        }
        if (action) {
            query = query.eq('action', action);
        }
        if (entityType) {
            query = query.eq('entity_type', entityType);
        }
        if (dateFrom) {
            query = query.gte('created_at', dateFrom);
        }
        if (dateTo) {
            query = query.lte('created_at', dateTo);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[Intent Audit Logger] Failed to query logs:', {
                organizationId,
                error: error.message,
            });
            return [];
        }

        // Type assertion through unknown to ensure proper typing
        return (data as unknown) as IntentAuditLog[];
    } catch (err) {
        console.error('[Intent Audit Logger] Unexpected query error:', err);
        return [];
    }
}

/**
 * Get count of Intent audit logs for an organization
 * 
 * @param params - Query parameters (same as getIntentAuditLogs but without pagination)
 * @returns Promise that resolves to count of audit logs
 */
export async function getIntentAuditLogsCount(params: {
    organizationId: string;
    workflowId?: string;
    actorId?: string;
    action?: string;
    entityType?: 'workflow' | 'keyword' | 'article';
    dateFrom?: string;
    dateTo?: string;
}): Promise<number> {
    const {
        organizationId,
        workflowId,
        actorId,
        action,
        entityType,
        dateFrom,
        dateTo,
    } = params;

    try {
        const supabase = await createClient();

        let query = supabase
            .from('intent_audit_logs')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId);

        // Apply filters
        if (workflowId) {
            query = query.eq('workflow_id', workflowId);
        }
        if (actorId) {
            query = query.eq('actor_id', actorId);
        }
        if (action) {
            query = query.eq('action', action);
        }
        if (entityType) {
            query = query.eq('entity_type', entityType);
        }
        if (dateFrom) {
            query = query.gte('created_at', dateFrom);
        }
        if (dateTo) {
            query = query.lte('created_at', dateTo);
        }

        const { count, error } = await query;

        if (error) {
            console.error('[Intent Audit Logger] Failed to count logs:', {
                organizationId,
                error: error.message,
            });
            return 0;
        }

        return count || 0;
    } catch (err) {
        console.error('[Intent Audit Logger] Unexpected count error:', err);
        return 0;
    }
}
