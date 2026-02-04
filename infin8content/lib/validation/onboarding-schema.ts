import { z } from 'zod'

/**
 * Validation schemas for onboarding API endpoints
 * Provides server-side validation for all onboarding step inputs
 */

// Business information schema
export const businessSchema = z.object({
  website_url: z.string().url('Invalid URL format').max(255, 'URL must be less than 255 characters').optional().nullable(),
  business_description: z.string().min(10, 'Business description must be at least 10 characters').max(500, 'Business description must be less than 500 characters').optional().nullable(),
  target_audiences: z.array(z.string().min(2, 'Audience must be at least 2 characters').max(50, 'Audience must be less than 50 characters')).max(10, 'Maximum 10 audiences allowed').optional(),
})

// Competitors information schema
export const competitorsSchema = z.object({
  competitors: z.array(z.object({
    name: z.string().min(2, 'Competitor name must be at least 2 characters').max(100, 'Competitor name must be less than 100 characters'),
    url: z.string().url('Invalid competitor URL format').max(255, 'URL must be less than 255 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  })).min(1, 'At least one competitor is required').max(10, 'Maximum 10 competitors allowed'),
})

// Blog configuration schema
export const blogSchema = z.object({
  blog_name: z.string().min(3, 'Blog name must be at least 3 characters').max(100, 'Blog name must be less than 100 characters'),
  blog_description: z.string().min(10, 'Blog description must be at least 10 characters').max(500, 'Blog description must be less than 500 characters'),
  blog_category: z.string().min(2, 'Blog category must be at least 2 characters').max(50, 'Blog category must be less than 50 characters'),
  post_frequency: z.enum(['daily', 'weekly', 'monthly'], {
    errorMap: () => ({ message: 'Post frequency must be one of: daily, weekly, monthly' })
  }),
})

// Content defaults schema
export const contentDefaultsSchema = z.object({
  language: z.string().min(2, 'Language must be at least 2 characters').max(10, 'Language must be less than 10 characters'),
  tone: z.enum(['professional', 'casual', 'formal', 'friendly'], {
    errorMap: () => ({ message: 'Tone must be one of: professional, casual, formal, friendly' })
  }),
  style: z.enum(['informative', 'persuasive', 'educational'], {
    errorMap: () => ({ message: 'Style must be one of: informative, persuasive, educational' })
  }),
  target_word_count: z.number().int('Word count must be an integer').min(500, 'Word count must be at least 500').max(10000, 'Word count must be less than 10,000'),
  auto_publish: z.boolean(),
})

// Keyword settings schema
export const keywordSettingsSchema = z.object({
  target_region: z.string().min(2, 'Target region must be at least 2 characters').max(50, 'Target region must be less than 50 characters'),
  language_code: z.string().min(2, 'Language code must be at least 2 characters').max(10, 'Language code must be less than 10 characters'),
  auto_generate_keywords: z.boolean(),
  monthly_keyword_limit: z.number().int('Monthly keyword limit must be an integer').min(1, 'Monthly keyword limit must be at least 1').max(1000, 'Monthly keyword limit must be less than 1000'),
})

// Integration configuration schema
export const integrationSchema = z.object({
  wordpress_url: z.string().url('Invalid WordPress URL format').max(255, 'URL must be less than 255 characters').optional(),
  wordpress_username: z.string().min(2, 'WordPress username must be at least 2 characters').max(100, 'WordPress username must be less than 100 characters').optional(),
  webflow_url: z.string().url('Invalid Webflow URL format').max(255, 'URL must be less than 255 characters').optional(),
  other_integrations: z.record(z.any()).optional(),
})

// Complete onboarding schema (no input required)
export const completeSchema = z.object({})

// Export all schemas for use in API routes
export const onboardingSchemas = {
  business: businessSchema,
  competitors: competitorsSchema,
  blog: blogSchema,
  contentDefaults: contentDefaultsSchema,
  keywordSettings: keywordSettingsSchema,
  integration: integrationSchema,
  complete: completeSchema,
}

// Export types for frontend consumption
export type BusinessInput = z.infer<typeof businessSchema>
export type CompetitorsInput = z.infer<typeof competitorsSchema>
export type BlogInput = z.infer<typeof blogSchema>
export type ContentDefaultsInput = z.infer<typeof contentDefaultsSchema>
export type KeywordSettingsInput = z.infer<typeof keywordSettingsSchema>
export type IntegrationInput = z.infer<typeof integrationSchema>
export type CompleteInput = z.infer<typeof completeSchema>
