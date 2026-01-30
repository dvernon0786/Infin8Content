/**
 * Outline Schema Validation
 * Story 4a.5: LLM Content Generation with OpenRouter Integration
 * 
 * Defines the authoritative contract for article outlines.
 * All outline generators (placeholder or AI) must produce output matching this schema.
 */

import { z } from 'zod'

/**
 * Zod schema for outline validation
 * 
 * Non-negotiable guarantees:
 * - introduction.title: required, non-empty
 * - introduction.h3_subsections: required, at least 1 item
 * - h2_sections: required, at least 1 section
 * - Each h2_sections[i].h3_subsections: required, at least 1 item
 * - conclusion.title: required, non-empty
 * - faq: optional (can be null)
 */
export const OutlineSchema = z.object({
  introduction: z.object({
    title: z.string().min(1, 'Introduction title required'),
    h3_subsections: z
      .array(z.string().min(1, 'H3 subsection cannot be empty'))
      .min(1, 'Introduction must have at least one H3 subsection'),
  }),

  h2_sections: z
    .array(
      z.object({
        title: z.string().min(1, 'H2 title required'),
        h3_subsections: z
          .array(z.string().min(1, 'H3 subsection cannot be empty'))
          .min(1, 'Each H2 section must have at least one H3 subsection'),
      })
    )
    .min(1, 'At least one H2 section required'),

  conclusion: z.object({
    title: z.string().min(1, 'Conclusion title required'),
  }),

  faq: z
    .object({
      title: z.string().min(1, 'FAQ title required'),
      included: z.boolean(),
    })
    .nullable(),
})

/**
 * Type derived from schema
 * Ensures type safety matches validation
 */
export type ValidatedOutline = z.infer<typeof OutlineSchema>

/**
 * Validate outline against schema
 * 
 * @param data - Raw outline data to validate
 * @returns Validated outline or throws with detailed error
 * @throws Error with field-level validation messages
 */
export function validateOutline(data: unknown): ValidatedOutline {
  const result = OutlineSchema.safeParse(data)

  if (!result.success) {
    const errors = result.error.issues
      .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Outline validation failed: ${errors}`)
  }

  return result.data
}

/**
 * Check if outline is valid without throwing
 * 
 * @param data - Raw outline data to validate
 * @returns true if valid, false otherwise
 */
export function isValidOutline(data: unknown): data is ValidatedOutline {
  return OutlineSchema.safeParse(data).success
}
