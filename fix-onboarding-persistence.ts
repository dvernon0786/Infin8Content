/**
 * CRITICAL FIX: Onboarding Persistence Logic
 * 
 * This function ensures ALL onboarding data is written to canonical fields
 * before marking onboarding as complete.
 * 
 * ROOT CAUSE: Onboarding was setting onboarding_completed = true
 * without actually persisting the business data.
 */

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Canonical field schemas
const businessInfoSchema = z.object({
  website_url: z.string().url().nullable(),
  business_description: z.string().min(10).nullable(),
  target_audiences: z.array(z.string().min(2)).nullable(),
})

const keywordSettingsSchema = z.object({
  target_region: z.string().min(2),
  language_code: z.string().min(2),
  auto_generate_keywords: z.boolean(),
  monthly_keyword_limit: z.number().min(1).max(1000),
})

const contentDefaultsSchema = z.object({
  language: z.string().min(2),
  tone: z.enum(['professional', 'casual', 'formal', 'friendly']),
  style: z.enum(['informative', 'persuasive', 'educational']),
  target_word_count: z.number().min(500).max(10000),
  auto_publish: z.boolean(),
})

const competitorSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
  description: z.string().optional(),
})

/**
 * PERSIST ONBOARDING DATA TO CANONICAL FIELDS
 * This is the ONLY correct way to store onboarding data
 */
export async function persistOnboardingData(
  organizationId: string,
  onboardingData: {
    business_info: {
      website_url?: string
      business_description?: string
      target_audiences?: string[]
    }
    keyword_settings: {
      target_region: string
      language_code: string
      auto_generate_keywords: boolean
      monthly_keyword_limit: number
    }
    content_defaults: {
      language: string
      tone: 'professional' | 'casual' | 'formal' | 'friendly'
      style: 'informative' | 'persuasive' | 'educational'
      target_word_count: number
      auto_publish: boolean
    }
    competitors: Array<{
      name: string
      url: string
      description?: string
    }
    blog_config?: {
      blog_name?: string
      blog_description?: string
      blog_category?: string
      post_frequency?: 'daily' | 'weekly' | 'monthly'
    }
  }
) {
  const supabase = await createClient()
  
  console.log(`[ONBOARDING FIX] Persisting data for organization: ${organizationId}`)
  
  try {
    // Validate all inputs
    const validatedBusiness = businessInfoSchema.parse(onboardingData.business_info)
    const validatedKeywords = keywordSettingsSchema.parse(onboardingData.keyword_settings)
    const validatedContent = contentDefaultsSchema.parse(onboardingData.content_defaults)
    const validatedCompetitors = z.array(competitorSchema).parse(onboardingData.competitors)
    
    // STEP 1: Write to canonical organization columns
    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        // Direct columns - NOT JSONB
        website_url: validatedBusiness.website_url,
        business_description: validatedBusiness.business_description,
        target_audiences: validatedBusiness.target_audiences,
        
        // Structured JSONB fields
        keyword_settings: validatedKeywords,
        content_defaults: validatedContent,
        
        // Blog config (only blog-specific fields)
        blog_config: {
          ...(onboardingData.blog_config || {}),
          // NOTE: competitors are NOT stored here
        },
        
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
    
    if (orgError) {
      throw new Error(`Failed to update organization: ${orgError.message}`)
    }
    
    // STEP 2: Write competitors to dedicated table (NOT blog_config)
    // First, clear existing competitors for this org
    const { error: deleteError } = await supabase
      .from('organization_competitors')
      .delete()
      .eq('organization_id', organizationId)
    
    if (deleteError) {
      throw new Error(`Failed to clear existing competitors: ${deleteError.message}`)
    }
    
    // Then insert new competitors
    if (validatedCompetitors.length > 0) {
      const competitorInserts = validatedCompetitors.map(comp => ({
        organization_id: organizationId,
        name: comp.name,
        url: comp.url,
        domain: new URL(comp.url).hostname,
        description: comp.description || null,
        is_active: true,
        created_at: new Date().toISOString(),
      }))
      
      const { error: compError } = await supabase
        .from('organization_competitors')
        .insert(competitorInserts)
      
      if (compError) {
        throw new Error(`Failed to insert competitors: ${compError.message}`)
      }
    }
    
    // STEP 3: Derive onboarding completion (NEVER set manually)
    const { data: org, error: checkError } = await supabase
      .from('organizations')
      .select(`
        website_url,
        business_description,
        target_audiences,
        keyword_settings,
        content_defaults
      `)
      .eq('id', organizationId)
      .single()
    
    if (checkError || !org) {
      throw new Error(`Failed to verify organization data: ${checkError?.message}`)
    }
    
    // DERIVE completion status deterministically
    const isOnboardingComplete = (
      org.website_url !== null &&
      org.business_description !== null &&
      org.target_audiences !== null &&
      org.target_audiences.length > 0 &&
      org.keyword_settings &&
      Object.keys(org.keyword_settings).length > 0 &&
      org.content_defaults &&
      Object.keys(org.content_defaults).length > 0 &&
      validatedCompetitors.length > 0
    )
    
    // Update completion status based on actual data
    const { error: completionError } = await supabase
      .from('organizations')
      .update({
        onboarding_completed: isOnboardingComplete,
        onboarding_completed_at: isOnboardingComplete ? new Date().toISOString() : null,
        onboarding_version: 'v2-fixed', // Mark as fixed version
      })
      .eq('id', organizationId)
    
    if (completionError) {
      throw new Error(`Failed to update completion status: ${completionError.message}`)
    }
    
    console.log(`[ONBOARDING FIX] Success - Complete: ${isOnboardingComplete}`)
    
    return {
      success: true,
      onboarding_completed: isOnboardingComplete,
      data_validated: {
        business_info: validatedBusiness,
        keyword_settings: validatedKeywords,
        content_defaults: validatedContent,
        competitors: validatedCompetitors,
      }
    }
    
  } catch (error) {
    console.error(`[ONBOARDING FIX] Error:`, error)
    throw error
  }
}

/**
 * BACKFILL FUNCTION: Fix existing broken onboarding data
 */
export async function backfillOnboardingData(organizationId: string) {
  const supabase = await createClient()
  
  console.log(`[ONBOARDING BACKFILL] Fixing organization: ${organizationId}`)
  
  // Get current org state
  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()
  
  if (error || !org) {
    throw new Error(`Organization not found: ${error?.message}`)
  }
  
  // Extract what we can from existing data
  const wordpressUrl = org.blog_config?.integrations?.wordpress?.url
  
  // Create minimal valid onboarding data
  const backfillData = {
    business_info: {
      website_url: wordpressUrl || org.website_url || 'https://example.com',
      business_description: org.business_description || 'Business description pending update',
      target_audiences: org.target_audiences || ['General audience'],
    },
    keyword_settings: {
      target_region: 'United States',
      language_code: 'en',
      auto_generate_keywords: true,
      monthly_keyword_limit: 100,
    },
    content_defaults: {
      language: 'en',
      tone: 'professional',
      style: 'informative',
      target_word_count: 1500,
      auto_publish: false,
    },
    competitors: [], // Start empty - user must add
    blog_config: org.blog_config || {},
  }
  
  return await persistOnboardingData(organizationId, backfillData)
}
