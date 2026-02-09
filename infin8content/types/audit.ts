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
    WORKFLOW_CANCELLED: 'workflow.cancelled',

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

    // Human approval actions
    WORKFLOW_HUMAN_APPROVAL_STARTED: 'workflow.human_approval.started',
    WORKFLOW_HUMAN_APPROVAL_APPROVED: 'workflow.human_approval.approved',
    WORKFLOW_HUMAN_APPROVAL_REJECTED: 'workflow.human_approval.rejected',

    // Article queuing actions (Story 38.1)
    WORKFLOW_ARTICLE_QUEUING_STARTED: 'workflow.article_queuing.started',
    WORKFLOW_ARTICLE_QUEUING_COMPLETED: 'workflow.article_queuing.completed',
    WORKFLOW_ARTICLE_QUEUING_FAILED: 'workflow.article_queuing.failed',

    // Research agent actions (Story B-2)
    RESEARCH_AGENT_SECTION_STARTED: 'research_agent.section.started',
    RESEARCH_AGENT_SECTION_COMPLETED: 'research_agent.section.completed',
    RESEARCH_AGENT_SECTION_FAILED: 'research_agent.section.failed',

    // Article generation progress tracking actions (Story 38.2)
    WORKFLOW_ARTICLE_GENERATION_PROGRESS_QUERIED: 'workflow.article_generation.progress_queried',
    WORKFLOW_ARTICLE_GENERATION_PROGRESS_ERROR: 'workflow.article_generation.progress_error',

    // ICP Gate enforcement actions (Story 39-1)
    WORKFLOW_GATE_ICP_ALLOWED: 'workflow.gate.icp.allowed',
    WORKFLOW_GATE_ICP_BLOCKED: 'workflow.gate.icp.blocked',

    // Competitor Gate enforcement actions (Story 39-2)
    WORKFLOW_GATE_COMPETITORS_ALLOWED: 'workflow.gate.competitors_allowed',
    WORKFLOW_GATE_COMPETITORS_BLOCKED: 'workflow.gate.competitors_blocked',
    WORKFLOW_GATE_COMPETITORS_ERROR: 'workflow.gate.competitors_error',

    // Seed Approval Gate enforcement actions (Story 39-3)
    WORKFLOW_GATE_SEEDS_ALLOWED: 'workflow.gate.seeds_allowed',
    WORKFLOW_GATE_SEEDS_BLOCKED: 'workflow.gate.seeds_blocked',
    WORKFLOW_GATE_SEEDS_ERROR: 'workflow.gate.seeds_error',

    // Longtail Gate enforcement actions (Story 39-4)
    WORKFLOW_GATE_LONGTAILS_ALLOWED: 'workflow.gate.longtails_allowed',
    WORKFLOW_GATE_LONGTAILS_BLOCKED: 'workflow.gate.longtails_blocked',
    WORKFLOW_GATE_LONGTAILS_ERROR: 'workflow.gate.longtails_error',

    // Subtopic Approval Gate enforcement actions (Story 39-5)
    WORKFLOW_GATE_SUBTOPICS_ALLOWED: 'workflow.gate.subtopics_allowed',
    WORKFLOW_GATE_SUBTOPICS_BLOCKED: 'workflow.gate.subtopics_blocked',
    WORKFLOW_GATE_SUBTOPICS_ERROR: 'workflow.gate.subtopics_error',

    // Onboarding validation actions (Story A-6)
    ONBOARDING_VALIDATION_SUCCEEDED: 'onboarding.validation.succeeded',
    ONBOARDING_VALIDATION_FAILED: 'onboarding.validation.failed',

    // Article linking actions (Story 38.3)
    WORKFLOW_ARTICLES_LINKING_STARTED: 'workflow.articles.linking.started',
    WORKFLOW_ARTICLE_LINKED: 'workflow.article.linked',
    WORKFLOW_ARTICLE_LINK_FAILED: 'workflow.article.link_failed',
    WORKFLOW_ARTICLES_LINKING_COMPLETED: 'workflow.articles.linking.completed',
    WORKFLOW_ARTICLES_LINKING_FAILED: 'workflow.articles.linking.failed',

    // Intent Engine specific audit events (Story 37.4)
    WORKFLOW_CREATED: 'workflow.created',
    WORKFLOW_ARCHIVED: 'workflow.archived',
    WORKFLOW_SUPERSEDED: 'workflow.superseded',
    WORKFLOW_STEP_COMPLETED: 'workflow.step.completed',
    WORKFLOW_STEP_FAILED: 'workflow.step.failed',
    WORKFLOW_STEP_BLOCKED: 'workflow.step.blocked',
    WORKFLOW_APPROVAL_APPROVED: 'workflow.approval.approved',
    WORKFLOW_APPROVAL_REJECTED: 'workflow.approval.rejected',
    ARTICLE_QUEUED: 'article.queued',
    ARTICLE_GENERATED: 'article.generated',
    ARTICLE_FAILED: 'article.failed',
    SYSTEM_ERROR: 'system.error',
    SYSTEM_RETRY_EXHAUSTED: 'system.retry_exhausted',

    // Dashboard actions (Story 39.6)
    DASHBOARD_VIEWED: 'dashboard.viewed',

    // Blocking conditions actions (Story 39.7)
    WORKFLOW_BLOCKING_CONDITIONS_QUERIED: 'workflow.blocking_conditions.queried',
    WORKFLOW_BLOCKING_CONDITION_RESOLVED: 'workflow.blocking_condition.resolved',
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

/**
 * Intent audit log entry structure (Story 37.4)
 */
export interface IntentAuditLog {
    id: string;
    organization_id: string;
    workflow_id: string | null;
    entity_type: 'workflow' | 'keyword' | 'article';
    entity_id: string;
    actor_id: string;
    action: string;
    details: Record<string, unknown>;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

/**
 * Parameters for creating an intent audit log entry (Story 37.4)
 */
export interface CreateIntentAuditLogParams {
    organizationId: string;
    workflowId?: string | null;
    entityType: 'workflow' | 'keyword' | 'article';
    entityId: string;
    actorId: string;
    action: string;
    details?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
}
