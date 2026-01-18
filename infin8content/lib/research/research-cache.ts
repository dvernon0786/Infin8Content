// Research Cache Service
// Story 3.0: Research Infrastructure Foundation
// Tier-1 Producer story for research data structures

import { researchService } from './research-service';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export interface CacheEntry<T> {
  data: T;
  expires_at: string;
  tags?: string[];
  created_at: string;
}

export class ResearchCache {
  private static instance: ResearchCache;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  static getInstance(): ResearchCache {
    if (!ResearchCache.instance) {
      ResearchCache.instance = new ResearchCache();
    }
    return ResearchCache.instance;
  }

  async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const ttl = options.ttl || 24 * 60 * 60; // Default 24 hours
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    const entry: CacheEntry<T> = {
      data,
      expires_at: expiresAt,
      tags: options.tags,
      created_at: new Date().toISOString()
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store in database cache
    await researchService.setCache(key, data as Record<string, any>, 'research', ttl);
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && new Date(memoryEntry.expires_at) > new Date()) {
      return memoryEntry.data as T;
    }

    // Check database cache
    const dbData = await researchService.getCache(key);
    if (dbData) {
      // Update memory cache
      const entry: CacheEntry<T> = {
        data: dbData as T,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      };
      
      this.memoryCache.set(key, entry);
      return entry.data;
    }

    return null;
  }

  async invalidate(key: string): Promise<void> {
    // Remove from memory cache
    this.memoryCache.delete(key);

    // Note: Database cache entries are automatically cleaned up when expired
    // For immediate invalidation, we would need to add a delete method to researchService
  }

  async invalidateByTag(tag: string): Promise<void> {
    // Invalidate entries with specific tag
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags && entry.tags.includes(tag)) {
        this.memoryCache.delete(key);
      }
    }

    // Database cache would need tag-based invalidation support
    // For now, we rely on TTL expiration
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Invalidate entries matching pattern
    const regex = new RegExp(pattern);
    for (const [key] of this.memoryCache.entries()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Database cache would need pattern-based invalidation support
    // For now, we rely on TTL expiration
  }

  private cleanupExpiredEntries(): void {
    const now = new Date();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (new Date(entry.expires_at) <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear database cache
    await researchService.clearExpiredCache();
  }

  getStats(): {
    memoryCacheSize: number;
    memoryCacheEntries: Array<{ key: string; expires_at: string; tags?: string[] }>;
  } {
    const entries = Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
      key,
      expires_at: entry.expires_at,
      tags: entry.tags
    }));

    return {
      memoryCacheSize: this.memoryCache.size,
      memoryCacheEntries: entries
    };
  }

  async preloadCache(keys: string[]): Promise<void> {
    // Preload frequently accessed keys into memory cache
    const promises = keys.map(async (key) => {
      const data = await researchService.getCache(key);
      if (data) {
        const entry: CacheEntry<any> = {
          data,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        };
        this.memoryCache.set(key, entry);
      }
    });

    await Promise.all(promises);
  }

  generateKey(...parts: string[]): string {
    return parts.join(':');
  }

  // Cache helpers for specific research data types
  async cacheKeywordResearch(
    keyword: string,
    apiSource: string,
    data: any,
    ttl: number = 24 * 60 * 60
  ): Promise<void> {
    const key = this.generateKey('keyword_research', keyword, apiSource);
    await this.set(key, data, { ttl, tags: ['keyword_research', apiSource] });
  }

  async getCachedKeywordResearch(
    keyword: string,
    apiSource: string
  ): Promise<any | null> {
    const key = this.generateKey('keyword_research', keyword, apiSource);
    return await this.get(key);
  }

  async cacheSources(
    keyword: string,
    apiSource: string,
    data: any,
    ttl: number = 24 * 60 * 60
  ): Promise<void> {
    const key = this.generateKey('sources', keyword, apiSource);
    await this.set(key, data, { ttl, tags: ['sources', apiSource] });
  }

  async getCachedSources(
    keyword: string,
    apiSource: string
  ): Promise<any | null> {
    const key = this.generateKey('sources', keyword, apiSource);
    return await this.get(key);
  }

  async cacheApiUsage(
    organizationId: string,
    date: string,
    data: any,
    ttl: number = 7 * 24 * 60 * 60 // 7 days
  ): Promise<void> {
    const key = this.generateKey('api_usage', organizationId, date);
    await this.set(key, data, { ttl, tags: ['api_usage'] });
  }

  async getCachedApiUsage(
    organizationId: string,
    date: string
  ): Promise<any | null> {
    const key = this.generateKey('api_usage', organizationId, date);
    return await this.get(key);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.memoryCache.clear();
  }
}

// Singleton instance
export const researchCache = ResearchCache.getInstance();
