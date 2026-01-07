/**
 * Payment Configuration Constants
 * Centralized configuration for payment-related settings
 */

/**
 * Grace period duration in days
 * Users have this many days to resolve payment issues before account suspension
 */
export const GRACE_PERIOD_DAYS = 7

/**
 * Grace period duration in milliseconds
 * Calculated from GRACE_PERIOD_DAYS
 */
export const GRACE_PERIOD_DURATION_MS = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000

