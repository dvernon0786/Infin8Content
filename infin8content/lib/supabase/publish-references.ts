// Publish References Service
// Story 5-1: Publish Article to WordPress (Minimal One-Click Export)
// Handles database operations for publish references table

import { createClient } from '@supabase/supabase-js';
import { Database } from '../supabase/database.types';

export interface PublishReference {
  id: string;
  article_id: string;
  cms_type: 'wordpress';
  published_url: string;
  external_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePublishReferenceData {
  article_id: string;
  cms_type: 'wordpress';
  published_url: string;
  external_id?: string;
}

// Lazy initialise Supabase client to avoid import-time crashes
function getSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Check if an article has already been published to a specific CMS
 * @param articleId - The article ID to check
 * @param cmsType - The CMS type (currently only 'wordpress')
 * @returns The existing publish reference or null
 */
export async function getPublishReference(
  articleId: string,
  cmsType: 'wordpress' = 'wordpress'
): Promise<PublishReference | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('publish_references')
      .select('*')
      .eq('article_id', articleId)
      .eq('cms_type', cmsType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - article not published yet
        return null;
      }
      throw error;
    }

    return data as unknown as PublishReference;
  } catch (error) {
    console.error('Error checking publish reference:', error);
    throw error;
  }
}

/**
 * Create a new publish reference
 * @param publishData - The publish reference data
 * @returns The created publish reference
 */
export async function createPublishReference(
  publishData: CreatePublishReferenceData
): Promise<PublishReference> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('publish_references')
      .insert(publishData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as unknown as PublishReference;
  } catch (error) {
    console.error('Error creating publish reference:', error);
    throw error;
  }
}

/**
 * Get all publish references for an article
 * @param articleId - The article ID
 * @returns Array of publish references
 */
export async function getPublishReferencesForArticle(
  articleId: string
): Promise<PublishReference[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('publish_references')
      .select('*')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data as unknown) as PublishReference[] || [];
  } catch (error) {
    console.error('Error getting publish references for article:', error);
    throw error;
  }
}

/**
 * Delete a publish reference
 * @param id - The publish reference ID
 * @returns Success status
 */
export async function deletePublishReference(id: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('publish_references')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting publish reference:', error);
    throw error;
  }
}
