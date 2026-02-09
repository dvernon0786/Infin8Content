/**
 * Intent Audit Logs Archival Service
 * Story 37.4: Maintain Complete Audit Trail of All Decisions
 * 
 * This service handles the archival of Intent audit logs older than 1 year.
 * Archived logs are moved to a separate table for long-term storage.
 * The main table only contains logs from the last year for performance.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Archive Intent audit logs older than 1 year
 * 
 * This function moves audit logs older than 1 year from the main table
 * to the archive table. This maintains the complete audit trail while
 * keeping the main table performant.
 * 
 * @returns Promise that resolves to archival results
 * 
 * @example
 * ```ts
 * import { archiveOldIntentAuditLogs } from '@/lib/services/intent-engine/intent-audit-archiver';
 * 
 * const result = await archiveOldIntentAuditLogs();
 * console.log(`Archived ${result.archived_count} logs on ${result.archive_date}`);
 * ```
 */
export async function archiveOldIntentAuditLogs(): Promise<{
    archived_count: number;
    archive_date: string;
}> {
    try {
        const supabase = createServiceRoleClient();

        // Call the archive function
        const { data, error } = await supabase
            .rpc('archive_old_intent_audit_logs');

        if (error) {
            console.error('[Intent Audit Archiver] Failed to archive logs:', error);
            throw new Error(`Failed to archive audit logs: ${error.message}`);
        }

        // The function returns a table, so data is an array
        const result = data && data.length > 0 ? data[0] : { archived_count: 0, archive_date: new Date().toISOString() };

        console.log('[Intent Audit Archiver] Archive completed:', {
            archived_count: result.archived_count,
            archive_date: result.archive_date,
        });

        return {
            archived_count: result.archived_count || 0,
            archive_date: result.archive_date || new Date().toISOString(),
        };

    } catch (err) {
        console.error('[Intent Audit Archiver] Unexpected error:', err);
        throw err;
    }
}

/**
 * Get archival statistics
 * 
 * This function returns statistics about the audit logs, including
 * how many records are in the main table vs the archive table.
 * 
 * @returns Promise that resolves to archival statistics
 */
export async function getIntentAuditArchivalStats(): Promise<{
    main_table_count: number;
    archive_table_count: number;
    total_count: number;
    oldest_record: string | null;
    newest_record: string | null;
}> {
    try {
        const supabase = createServiceRoleClient();

        // Get counts from both tables
        const [mainResult, archiveResult, oldestResult, newestResult] = await Promise.all([
            supabase
                .from('intent_audit_logs')
                .select('*', { count: 'exact', head: true }),
            supabase
                .from('intent_audit_logs_archive')
                .select('*', { count: 'exact', head: true }),
            supabase
                .from('intent_audit_logs')
                .select('created_at')
                .order('created_at', { ascending: true })
                .limit(1)
                .single(),
            supabase
                .from('intent_audit_logs')
                .select('created_at')
                .order('created_at', { ascending: false })
                .limit(1)
                .single(),
        ]);

        const mainCount = mainResult.count || 0;
        const archiveCount = archiveResult.count || 0;
        const totalCount = mainCount + archiveCount;

        const oldestRecord = (oldestResult.data as any)?.created_at || null;
        const newestRecord = (newestResult.data as any)?.created_at || null;

        return {
            main_table_count: mainCount,
            archive_table_count: archiveCount,
            total_count: totalCount,
            oldest_record: oldestRecord,
            newest_record: newestRecord,
        };

    } catch (err) {
        console.error('[Intent Audit Archiver] Failed to get stats:', err);
        return {
            main_table_count: 0,
            archive_table_count: 0,
            total_count: 0,
            oldest_record: null,
            newest_record: null,
        };
    }
}

/**
 * Check if archival is needed
 * 
 * This function checks if there are any records older than 1 year
 * that need to be archived.
 * 
 * @returns Promise that resolves to boolean indicating if archival is needed
 */
export async function isArchivalNeeded(): Promise<boolean> {
    try {
        const supabase = createServiceRoleClient();
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

        const { count, error } = await supabase
            .from('intent_audit_logs')
            .select('*', { count: 'exact', head: true })
            .lt('created_at', cutoffDate.toISOString());

        if (error) {
            console.error('[Intent Audit Archiver] Failed to check archival need:', error);
            return false;
        }

        return (count || 0) > 0;

    } catch (err) {
        console.error('[Intent Audit Archiver] Unexpected error checking archival need:', err);
        return false;
    }
}
