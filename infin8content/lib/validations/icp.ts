/**
 * ICP (Ideal Customer Profile) validation schemas
 * Story 33.2: Configure Organization ICP Settings
 */

import { z } from 'zod'
import { icpValidationRules } from '@/types/icp'

/**
 * Schema for creating ICP settings
 * Validates all required fields with proper constraints
 */
export const createICPSettingsSchema = z.object({
  target_industries: z.array(z.string().min(1).max(50))
    .min(icpValidationRules.target_industries.min, 'At least one target industry is required')
    .max(icpValidationRules.target_industries.max, `Maximum ${icpValidationRules.target_industries.max} target industries allowed`)
    .refine(
      (industries) => industries.every(industry => industry.trim().length > 0),
      { message: 'Target industries cannot be empty strings' }
    ),
  buyer_roles: z.array(z.string().min(1).max(50))
    .min(icpValidationRules.buyer_roles.min, 'At least one buyer role is required')
    .max(icpValidationRules.buyer_roles.max, `Maximum ${icpValidationRules.buyer_roles.max} buyer roles allowed`)
    .refine(
      (roles) => roles.every(role => role.trim().length > 0),
      { message: 'Buyer roles cannot be empty strings' }
    ),
  pain_points: z.array(z.string().min(1).max(200))
    .min(icpValidationRules.pain_points.min, 'At least one pain point is required')
    .max(icpValidationRules.pain_points.max, `Maximum ${icpValidationRules.pain_points.max} pain points allowed`)
    .refine(
      (points) => points.every(point => point.trim().length > 0),
      { message: 'Pain points cannot be empty strings' }
    ),
  value_proposition: z.string()
    .min(icpValidationRules.value_proposition.min, `Value proposition must be at least ${icpValidationRules.value_proposition.min} characters`)
    .max(icpValidationRules.value_proposition.max, `Value proposition must be less than ${icpValidationRules.value_proposition.max} characters`)
    .trim()
    .refine(
      (value) => value.length > 0,
      { message: 'Value proposition cannot be empty' }
    )
})

/**
 * Schema for updating ICP settings
 * All fields are optional but at least one must be provided
 */
export const updateICPSettingsSchema = z.object({
  target_industries: z.array(z.string().min(1).max(50))
    .min(icpValidationRules.target_industries.min, 'At least one target industry is required')
    .max(icpValidationRules.target_industries.max, `Maximum ${icpValidationRules.target_industries.max} target industries allowed`)
    .refine(
      (industries) => industries.every(industry => industry.trim().length > 0),
      { message: 'Target industries cannot be empty strings' }
    )
    .optional(),
  buyer_roles: z.array(z.string().min(1).max(50))
    .min(icpValidationRules.buyer_roles.min, 'At least one buyer role is required')
    .max(icpValidationRules.buyer_roles.max, `Maximum ${icpValidationRules.buyer_roles.max} buyer roles allowed`)
    .refine(
      (roles) => roles.every(role => role.trim().length > 0),
      { message: 'Buyer roles cannot be empty strings' }
    )
    .optional(),
  pain_points: z.array(z.string().min(1).max(200))
    .min(icpValidationRules.pain_points.min, 'At least one pain point is required')
    .max(icpValidationRules.pain_points.max, `Maximum ${icpValidationRules.pain_points.max} pain points allowed`)
    .refine(
      (points) => points.every(point => point.trim().length > 0),
      { message: 'Pain points cannot be empty strings' }
    )
    .optional(),
  value_proposition: z.string()
    .min(icpValidationRules.value_proposition.min, `Value proposition must be at least ${icpValidationRules.value_proposition.min} characters`)
    .max(icpValidationRules.value_proposition.max, `Value proposition must be less than ${icpValidationRules.value_proposition.max} characters`)
    .trim()
    .refine(
      (value) => value.length > 0,
      { message: 'Value proposition cannot be empty' }
    )
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
)

/**
 * Schema for organization ID validation
 */
export const organizationIdSchema = z.string().uuid('Invalid organization ID format')

/**
 * Type exports for use in components and services
 */
export type CreateICPSettingsInput = z.infer<typeof createICPSettingsSchema>
export type UpdateICPSettingsInput = z.infer<typeof updateICPSettingsSchema>
export type OrganizationIdInput = z.infer<typeof organizationIdSchema>

/**
 * Validation error messages
 */
export const ICPValidationErrors = {
  INVALID_ORG_ID: 'Invalid organization ID format',
  AUTH_REQUIRED: 'Authentication required',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions. Admin role required.',
  AT_LEAST_ONE_FIELD: 'At least one field must be provided for update',
  EMPTY_STRINGS_NOT_ALLOWED: 'Empty strings are not allowed in array fields'
} as const
