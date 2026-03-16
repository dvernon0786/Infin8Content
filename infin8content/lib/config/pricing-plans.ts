/**
 * Centralized Pricing Plan Configuration
 */

export const PRICING_PLANS = {
    starter: {
        monthly: 49,
        annual: 41.5, // Monthly equivalent for $498/year
    },

    pro: {
        monthly: 220,
        annual: 175, // Monthly equivalent for $2100/year
    },

    agency: {
        monthly: 399,
        annual: 299, // Monthly equivalent for $3588/year
    }
} as const;
