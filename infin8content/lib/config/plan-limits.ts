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

    /**
     * schedule_per_month
     *
     * How many articles a plan can queue for scheduled generation per
     * calendar month.  Trial plans cannot schedule at all (0).
     * Paid plan limits intentionally match article_generation so a user
     * can schedule their full monthly allowance up front.
     * null = unlimited (agency).
     */
    schedule_per_month: {
        trial: 0,       // scheduling is a paid feature — blocked in UI + API
        starter: 10,
        pro: 50,
        agency: null,   // unlimited
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
        agency: null,
    },

    llm_visibility_prompts: {
        trial: 0,
        starter: 20,
        pro: 75,
        agency: 200,
    },

    llm_visibility_projects: {
        trial: 0,
        starter: 1,
        pro: 3,
        agency: 10,
    },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS.article_generation;
