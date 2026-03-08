/**
 * Centralized Pricing Plan Configuration
 */

export const PRICING_PLANS = {
    starter: {
        monthly: 49,
        annual: 39, // Monthly equivalent
    },

    pro: {
        monthly: 220,
        annual: 179, // Monthly equivalent
    },

    agency: {
        monthly: 399,
        annual: 299, // Monthly equivalent
    }
} as const;
