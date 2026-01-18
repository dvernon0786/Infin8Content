// Research Infrastructure Foundation
// Story 3.0: Research Infrastructure Foundation
// Tier-1 Producer story for research data structures

import { createClient } from '@supabase/supabase-js';

// Use any type for Database to bypass temporary typing issues
type DatabaseAny = any;

export interface ResearchProject {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface KeywordResearchResult {
  id: string;
  organization_id: string;
  user_id: string;
  research_project_id?: string;
  keyword: string;
  search_volume?: number;
  keyword_difficulty?: number;
  cpc?: number;
  competition_level?: 'low' | 'medium' | 'high';
  trend_data: Record<string, any>;
  research_date: string;
  api_source: string;
  api_cost: number;
  cached_until: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchSource {
  id: string;
  organization_id: string;
  keyword_research_result_id: string;
  source_url: string;
  source_title?: string;
  source_description?: string;
  relevance_score: number;
  publication_date?: string;
  author?: string;
  domain?: string;
  research_date: string;
  api_source: string;
  api_cost: number;
  created_at: string;
  updated_at: string;
}

export interface ResearchApiUsage {
  id: string;
  organization_id: string;
  user_id: string;
  api_source: string;
  endpoint: string;
  request_count: number;
  total_cost: number;
  usage_date: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchCache {
  id: string;
  cache_key: string;
  cache_data: Record<string, any>;
  cache_type: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export class ResearchService {
  private supabase: any;
  private adminSupabase: any;

  constructor(supabaseUrl: string, supabaseKey: string, adminSupabaseUrl: string, adminSupabaseKey: string) {
    this.supabase = createClient<DatabaseAny>(supabaseUrl, supabaseKey);
    this.adminSupabase = createClient<DatabaseAny>(adminSupabaseUrl, adminSupabaseKey);
  }

  // Research Projects
  async createResearchProject(
    organizationId: string,
    userId: string,
    title: string,
    description?: string
  ): Promise<ResearchProject> {
    const { data, error } = await this.supabase
      .from('research_projects')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        title,
        description,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create research project: ${error.message}`);
    return data;
  }

  async getResearchProjects(
    organizationId: string,
    userId: string
  ): Promise<ResearchProject[]> {
    const { data, error } = await this.supabase
      .from('research_projects')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get research projects: ${error.message}`);
    return data || [];
  }

  async updateResearchProject(
    projectId: string,
    updates: Partial<Pick<ResearchProject, 'title' | 'description' | 'status'>>
  ): Promise<ResearchProject> {
    const { data, error } = await this.supabase
      .from('research_projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update research project: ${error.message}`);
    return data;
  }

  async deleteResearchProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('research_projects')
      .delete()
      .eq('id', projectId);

    if (error) throw new Error(`Failed to delete research project: ${error.message}`);
  }

  // Keyword Research Results
  async createKeywordResearchResult(
    organizationId: string,
    userId: string,
    keyword: string,
    researchData: Partial<Omit<KeywordResearchResult, 'id' | 'organization_id' | 'user_id' | 'keyword' | 'created_at' | 'updated_at'>>,
    researchProjectId?: string
  ): Promise<KeywordResearchResult> {
    const { data, error } = await this.supabase
      .from('keyword_research_results')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        keyword,
        research_project_id: researchProjectId,
        ...researchData
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create keyword research result: ${error.message}`);
    return data;
  }

  async getKeywordResearchResults(
    organizationId: string,
    userId: string,
    researchProjectId?: string
  ): Promise<KeywordResearchResult[]> {
    let query = this.supabase
      .from('keyword_research_results')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (researchProjectId) {
      query = query.eq('research_project_id', researchProjectId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get keyword research results: ${error.message}`);
    return data || [];
  }

  async getCachedKeywordResearchResult(
    organizationId: string,
    keyword: string,
    apiSource: string
  ): Promise<KeywordResearchResult | null> {
    const { data, error } = await this.supabase
      .from('keyword_research_results')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('keyword', keyword)
      .eq('api_source', apiSource)
      .gt('cached_until', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get cached keyword research result: ${error.message}`);
    }

    return data || null;
  }

  // Research Sources
  async createResearchSources(
    sources: Omit<ResearchSource, 'id' | 'organization_id' | 'created_at' | 'updated_at'>[]
  ): Promise<ResearchSource[]> {
    const { data, error } = await this.supabase
      .from('research_sources')
      .insert(sources)
      .select();

    if (error) throw new Error(`Failed to create research sources: ${error.message}`);
    return data || [];
  }

  async getResearchSources(
    organizationId: string,
    keywordResearchResultId: string
  ): Promise<ResearchSource[]> {
    const { data, error } = await this.supabase
      .from('research_sources')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('keyword_research_result_id', keywordResearchResultId)
      .order('relevance_score', { ascending: false });

    if (error) throw new Error(`Failed to get research sources: ${error.message}`);
    return data || [];
  }

  // API Usage Tracking
  async trackApiUsage(
    organizationId: string,
    userId: string,
    apiSource: string,
    endpoint: string,
    cost: number
  ): Promise<void> {
    const usageDate = new Date().toISOString().split('T')[0];
    
    const { error } = await this.supabase.rpc('increment_api_usage', {
      p_organization_id: organizationId,
      p_user_id: userId,
      p_api_source: apiSource,
      p_endpoint: endpoint,
      p_cost: cost,
      p_usage_date: usageDate
    });

    if (error) throw new Error(`Failed to track API usage: ${error.message}`);
  }

  async getApiUsage(
    organizationId: string,
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ResearchApiUsage[]> {
    let query = this.supabase
      .from('research_api_usage')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('usage_date', startDate);
    }
    if (endDate) {
      query = query.lte('usage_date', endDate);
    }

    const { data, error } = await query.order('usage_date', { ascending: false });

    if (error) throw new Error(`Failed to get API usage: ${error.message}`);
    return data || [];
  }

  // Research Cache
  async setCache(
    key: string,
    data: Record<string, any>,
    type: string,
    ttlSeconds: number
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    
    const { error } = await this.supabase
      .from('research_cache')
      .upsert({
        cache_key: key,
        cache_data: data,
        cache_type: type,
        expires_at: expiresAt
      });

    if (error) throw new Error(`Failed to set cache: ${error.message}`);
  }

  async getCache(key: string): Promise<Record<string, any> | null> {
    const { data, error } = await this.supabase
      .from('research_cache')
      .select('cache_data')
      .eq('cache_key', key)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get cache: ${error.message}`);
    }

    return data?.cache_data || null;
  }

  async clearExpiredCache(): Promise<void> {
    const { error } = await this.supabase
      .from('research_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) throw new Error(`Failed to clear expired cache: ${error.message}`);
  }
}

// Singleton instance
export const researchService = new ResearchService(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
