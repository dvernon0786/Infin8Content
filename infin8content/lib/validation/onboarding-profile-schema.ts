import { z } from "zod"

/**
 * Business Description Schema
 * 
 * Constraints:
 * - Min 20 chars: Prevents useless inputs like "Marketing"
 * - Max 500 chars: Prevents prompt bloat, keeps descriptions concise
 * - LLM-safe: Ensures meaningful, focused descriptions
 */
export const businessDescriptionSchema = z
  .string()
  .min(20, "Business description is too short")
  .max(500, "Business description must be 500 characters or fewer")

/**
 * Target Audiences Schema
 * 
 * Constraints:
 * - Min 1 entry: At least one target audience required
 * - Max 5 entries: Prevents audience fragmentation
 * - Min 10 chars per entry: Prevents vague entries
 * - Max 80 chars per entry: Keeps phrases concise
 * - LLM-safe: Structured phrases for better AI processing
 */
export const targetAudiencesSchema = z
  .array(
    z
      .string()
      .min(10, "Audience description is too short")
      .max(80, "Each audience must be 80 characters or fewer")
  )
  .min(1, "At least one target audience is required")
  .max(5, "You can add up to 5 target audiences only")

/**
 * Semantic Guard for Target Audiences
 * 
 * Blocks useless generic entries like "everyone" or "all businesses"
 * Enforces specific, actionable audience definitions
 */
export const refinedTargetAudiencesSchema = targetAudiencesSchema.refine(
  (audiences) =>
    audiences.every(
      (a) =>
        !/^(everyone|anyone|all businesses|general public|people|users|customers)$/i.test(a.trim())
    ),
  {
    message:
      "Target audiences must be specific (e.g. role + context, not 'everyone')",
  }
)

/**
 * Combined Onboarding Profile Schema
 * 
 * Validates the complete onboarding profile data
 * Ensures all constraints are met for LLM safety
 */
export const onboardingProfileSchema = z.object({
  business_description: businessDescriptionSchema,
  target_audiences: refinedTargetAudiencesSchema,
})

/**
 * Type exports for TypeScript
 */
export type OnboardingProfile = z.infer<typeof onboardingProfileSchema>
export type BusinessDescription = z.infer<typeof businessDescriptionSchema>
export type TargetAudiences = z.infer<typeof targetAudiencesSchema>

/**
 * Utility functions for data normalization
 */
export function normalizeUrl(url: string): string {
  if (!url) return url
  return url.startsWith("http") ? url.replace(/\/$/, "") : `https://${url}`
}

export function deduplicateAudiences(audiences: string[]): string[] {
  return Array.from(
    new Set(audiences.map(a => a.trim().toLowerCase()))
  )
}

/**
 * Validation helper functions
 */
export function validateBusinessDescription(description: string) {
  return businessDescriptionSchema.safeParse(description)
}

export function validateTargetAudiences(audiences: string[]) {
  return refinedTargetAudiencesSchema.safeParse(audiences)
}

export function validateOnboardingProfile(profile: {
  business_description: string
  target_audiences: string[]
}) {
  return onboardingProfileSchema.safeParse(profile)
}
