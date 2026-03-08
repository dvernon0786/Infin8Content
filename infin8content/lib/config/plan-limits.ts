/**
 * Centralized Plan Limits Configuration
 * 
 * This file maintains the canonical source of truth for all plan-based 
 * restrictions across the application.
 */

export const PLAN_LIMITS = {
    article_generation: {
        trial: 1,
        starter: 10,
        pro: 50,
        agency: 150,
    },

    keyword_research: {
        trial: 5,
        starter: 50,
        pro: 200,
        agency: null,
    },

    cms_connection: {
        trial: 0,
        starter: 1,
        pro: 3,
        agency: null,
    },

    workflow_active: {
        trial: null,
        starter: 1,
        pro: 5,
        agency: null,
    },

    image_storage_gb: {
        trial: 1,
        starter: 5,
        pro: 25,
        agency: 100,
    },

    api_calls: {
        trial: 50,
        starter: 100,
        pro: 1000,
        agency: null
    }
} as const;

export type PlanType = keyof typeof PLAN_LIMITS.article_generation;
