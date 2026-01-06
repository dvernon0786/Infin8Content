/**
 * Audit logging service for compliance tracking
 * Story 1.13: Audit Logging for Compliance
 * 
 * This service provides non-blocking audit logging for sensitive operations.
 * Logs are written asynchronously to avoid performance impact on the main request flow.
 */

import { createClient } from '@/lib/supabase/server';
import type { CreateAuditLogParams } from '@/types/audit';

/**
 * Log an audit action
 * 
 * This function logs an audit action to the database asynchronously.
 * It extracts IP address and user agent from the request if available.
 * 
 * @param params - Audit log parameters
 * @returns Promise that resolves when the log is written (or rejects on error)
 * 
 * @example
 * ```ts
 * import { logAction } from '@/lib/services/audit-logger';
 * import { AuditAction } from '@/types/audit';
 * 
 * // In an API route or server action
 * await logAction({
 *   orgId: user.org_id,
 *   userId: user.id,
 *   action: AuditAction.TEAM_INVITATION_SENT,
 *   details: { invitedEmail: 'user@example.com', role: 'editor' },
 * });
 * ```
 */
export async function logAction(params: CreateAuditLogParams): Promise<void> {
    const { orgId, userId, action, details = {}, ipAddress, userAgent } = params;

    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('audit_logs')
            .insert({
                org_id: orgId,
                user_id: userId ?? null,
                action,
                details,
                ip_address: ipAddress ?? null,
                user_agent: userAgent ?? null,
            });

        if (error) {
            // Log error but don't throw - audit logging should not break the main flow
            console.error('[Audit Logger] Failed to log action:', {
                action,
                orgId,
                userId,
                error: error.message,
            });
        }
    } catch (err) {
        // Catch any unexpected errors and log them
        console.error('[Audit Logger] Unexpected error:', err);
    }
}

/**
 * Log an audit action asynchronously (fire-and-forget)
 * 
 * This function logs an audit action without waiting for the result.
 * Use this when you want to log an action but don't want to wait for it to complete.
 * 
 * @param params - Audit log parameters
 * 
 * @example
 * ```ts
 * import { logActionAsync } from '@/lib/services/audit-logger';
 * import { AuditAction } from '@/types/audit';
 * 
 * // Fire-and-forget logging
 * logActionAsync({
 *   orgId: user.org_id,
 *   userId: user.id,
 *   action: AuditAction.BILLING_PAYMENT_SUCCEEDED,
 *   details: { amount: 1000, currency: 'usd' },
 * });
 * ```
 */
export function logActionAsync(params: CreateAuditLogParams): void {
    // Fire-and-forget: don't await, suppress unhandled promise rejection
    void logAction(params).catch((err) => {
        console.error('[Audit Logger] Async logging failed:', err);
    });
}

/**
 * Extract IP address from request headers
 * 
 * Checks common headers used by proxies and load balancers.
 * 
 * @param headers - Request headers (from Next.js headers() or Request)
 * @returns IP address or null if not found
 */
export function extractIpAddress(headers: Headers): string | null {
    // Check common headers in order of preference
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare
    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    return null;
}

/**
 * Extract user agent from request headers
 * 
 * @param headers - Request headers (from Next.js headers() or Request)
 * @returns User agent string or null if not found
 */
export function extractUserAgent(headers: Headers): string | null {
    return headers.get('user-agent');
}
