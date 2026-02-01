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

    // Seed keyword approval actions
    WORKFLOW_SEED_KEYWORDS_APPROVED: 'workflow.seed_keywords.approved',
    WORKFLOW_SEED_KEYWORDS_REJECTED: 'workflow.seed_keywords.rejected',

    // Keyword filtering actions
    WORKFLOW_KEYWORD_FILTERING_STARTED: 'workflow.keyword_filtering.started',
    WORKFLOW_KEYWORD_FILTERING_COMPLETED: 'workflow.keyword_filtering.completed',
    WORKFLOW_KEYWORD_FILTERING_FAILED: 'workflow.keyword_filtering.failed',

    // Topic clustering actions
    WORKFLOW_TOPIC_CLUSTERING_STARTED: 'workflow.topic_clustering.started',
    WORKFLOW_TOPIC_CLUSTERING_COMPLETED: 'workflow.topic_clustering.completed',
    WORKFLOW_TOPIC_CLUSTERING_FAILED: 'workflow.topic_clustering.failed',

    // Cluster validation actions
    WORKFLOW_CLUSTER_VALIDATION_STARTED: 'workflow.cluster_validation.started',
    WORKFLOW_CLUSTER_VALIDATION_COMPLETED: 'workflow.cluster_validation.completed',
    WORKFLOW_CLUSTER_VALIDATION_FAILED: 'workflow.cluster_validation.failed',

    // Keyword subtopic approval actions
    KEYWORD_SUBTOPICS_APPROVED: 'keyword.subtopics.approved',
    KEYWORD_SUBTOPICS_REJECTED: 'keyword.subtopics.rejected',
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
