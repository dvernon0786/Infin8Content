/**
 * Centralized Plan Limits Configuration
 * 
 * This file maintains the canonical source of truth for all plan-based 
 * restrictions across the application.
 */

export const PLAN_LIMITS = {
    // Existing monthly quotas
    article_generation: {
        trial: 1,
        starter: 30,
        pro: 150,
        agency: null,
    },
    keyword_research: {
        trial: 5,
        starter: 50,
        pro: 200, // Matching current hardcoded code limit
        agency: null,
    },
    cms_connection: {
        trial: 0,
        starter: 1,
        pro: 3,
        agency: null,
    },

    // New concurrency caps
    workflow_active: {
        trial: 1,
        starter: 1,
        pro: 5,
        agency: null,
    }
} as const;
