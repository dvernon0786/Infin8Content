/**
 * Centralized Plan Limits Configuration
 * 
 * This file maintains the canonical source of truth for all plan-based 
 * restrictions across the application.
 */

export const PLAN_LIMITS = {
    // Existing monthly quotas
    article_generation: {
        starter: 10,
        pro: 50,
        agency: null,
    },
    keyword_research: {
        starter: 50,
        pro: 200, // Matching current hardcoded code limit
        agency: null,
    },
    cms_connection: {
        starter: 1,
        pro: 3,
        agency: null,
    },

    // New concurrency caps
    workflow_active: {
        starter: 1,
        pro: 5,
        agency: null,
    }
} as const;
