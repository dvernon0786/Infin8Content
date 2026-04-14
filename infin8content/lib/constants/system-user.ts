/**
 * System User Constants
 * 
 * Centralized system user identification for audit logging and background processes.
 * This eliminates magic string duplication and provides enterprise-grade consistency.
 * 
 * Note: System user uses 'admin' role as it's a valid role in the users_role_check constraint.
 * The email clearly identifies this as a system account for audit purposes.
 */

export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000'
export const SYSTEM_USER_EMAIL = 'system@internal.local'
export const SYSTEM_USER_ROLE = 'admin' // Valid role that satisfies users_role_check constraint
