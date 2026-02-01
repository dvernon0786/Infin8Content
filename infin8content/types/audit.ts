/**
 * Audit logging types for compliance tracking
 * Story 1.13: Audit Logging for Compliance
 */

/**
 * Enum of all auditable actions in the system
 * Using const object for type safety and autocompletion
 */
export const AuditAction = {
    // Billing actions
    BILLING_SUBSCRIPTION_CREATED: 'billing.subscription.created',
    BILLING_SUBSCRIPTION_UPDATED: 'billing.subscription.updated',
    BILLING_SUBSCRIPTION_CANCELED: 'billing.subscription.canceled',
    BILLING_PAYMENT_SUCCEEDED: 'billing.payment.succeeded',
    BILLING_PAYMENT_FAILED: 'billing.payment.failed',

    // Team actions
    TEAM_INVITATION_SENT: 'team.invitation.sent',
    TEAM_INVITATION_ACCEPTED: 'team.invitation.accepted',
    TEAM_INVITATION_REVOKED: 'team.invitation.revoked',
    TEAM_MEMBER_REMOVED: 'team.member.removed',

    // Role actions
    ROLE_ASSIGNED: 'role.assigned',
    ROLE_CHANGED: 'role.changed',

    // Data actions
    DATA_EXPORT_REQUESTED: 'data.export.requested',
    ACCOUNT_DELETION_REQUESTED: 'account.deletion.requested',

    // Article actions
    ARTICLE_GENERATION_STARTED: 'article.generation.started',
    ARTICLE_GENERATION_COMPLETED: 'article.generation.completed',
    ARTICLE_GENERATION_FAILED: 'article.generation.failed',

    // Intent workflow actions
    INTENT_WORKFLOW_CREATED: 'intent.workflow.created',
    INTENT_WORKFLOW_UPDATED: 'intent.workflow.updated',
    INTENT_WORKFLOW_DELETED: 'intent.workflow.deleted',

    // ICP settings actions
    ICP_SETTINGS_CREATED: 'icp.settings.created',
    ICP_SETTINGS_UPDATED: 'icp.settings.updated',
    ICP_SETTINGS_DELETED: 'icp.settings.deleted',
    ICP_SETTINGS_VIEWED: 'icp.settings.viewed',

    // Competitor actions
    COMPETITOR_CREATED: 'competitor.created',
    COMPETITOR_UPDATED: 'competitor.updated',
    COMPETITOR_DELETED: 'competitor.deleted',
    COMPETITORS_VIEWED: 'competitors.viewed',

    // Feature flag actions
    FEATURE_FLAG_TOGGLED: 'feature.flag.toggled',

    // Workflow step actions
    WORKFLOW_COMPETITOR_SEED_KEYWORDS_STARTED: 'workflow.competitor_seed_keywords.started',
    WORKFLOW_COMPETITOR_SEED_KEYWORDS_COMPLETED: 'workflow.competitor_seed_keywords.completed',
    WORKFLOW_LONGTAIL_KEYWORDS_STARTED: 'workflow.longtail_keywords.started',
    WORKFLOW_LONGTAIL_KEYWORDS_COMPLETED: 'workflow.longtail_keywords.completed',
    WORKFLOW_LONGTAIL_KEYWORDS_FAILED: 'workflow.longtail_keywords.failed',
} as const;

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction];

/**
 * Audit log entry structure
 */
export interface AuditLog {
    id: string;
    created_at: string;
    org_id: string;
    user_id: string | null;
    action: AuditActionType;
    details: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
}

/**
 * Parameters for creating an audit log entry
 */
export interface CreateAuditLogParams {
    orgId: string;
    userId?: string | null;
    action: AuditActionType;
    details?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
}
