// Cache Manager
// Story 20-2: Batch Research Optimizer
// Tier-1 Producer story for research optimization

import { researchCache } from '../research-cache';

export interface CacheEntry<T> {
  key: string;
  data: T;
  expiresAt: Date;
  createdAt: Date;
  accessCount: number;
  lastAccessed: Date;
  size: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  oldestEntry?: Date;
  newestEntry?: Date;
  averageAccessCount: number;
}

export interface CacheConfig {
  maxSize: number;
  maxAge: number; // in milliseconds
  cleanupInterval: number; // in milliseconds
  compressionThreshold: number; // size in bytes
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: {
    hits: number;
    misses: number;
    totalSize: number;
  } = {
    hits: 0,
    misses: 0,
    totalSize: 0
  };
  
  private config: CacheConfig = {
    maxSize: 1000,
    maxAge: 30 * 60 * 1000, // 30 minutes
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    compressionThreshold: 10240 // 10KB
  };
  
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...this.config, ...config };
    this.startCleanupTimer();
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ttl || this.config.maxAge));
    const size = this.calculateSize(data);
    
    // Check if we need to make space
    if (this.cache.size >= this.config.maxSize) {
      await this.evictLeastRecentlyUsed();
    }
    
    const entry: CacheEntry<T> = {
      key,
      data,
      expiresAt,
      createdAt: now,
      accessCount: 1,
      lastAccessed: now,
      size
    };
    
    this.cache.set(key, entry);
    this.stats.totalSize += size;
    
    // Also store in research cache for persistence
    await researchCache.setCache(key, data, 'batch_research', ttl || this.config.maxAge / 1000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.misses++;
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = new Date();
    
    this.stats.hits++;
    return entry.data;
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      return false;
    }
    
    return true;
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    this.cache.delete(key);
    this.stats.totalSize -= entry.size;
    
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
    
    await researchCache.clear();
  }

  async cleanupExpired(): Promise<void> {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      const entry = this.cache.get(key);
      if (entry) {
        this.cache.delete(key);
        this.stats.totalSize -= entry.size;
      }
    }
    
    // Also cleanup research cache
    await researchCache.clearExpiredCache();
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    let lruKey: string | null = null;
    let lruTime = new Date();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      const entry = this.cache.get(lruKey);
      if (entry) {
        this.cache.delete(lruKey);
        this.stats.totalSize -= entry.size;
      }
    }
  }

  private async evictLeastFrequentlyUsed(): Promise<void> {
    let lfuKey: string | null = null;
    let lfuCount = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < lfuCount) {
        lfuCount = entry.accessCount;
        lfuKey = key;
      }
    }
    
    if (lfuKey) {
      const entry = this.cache.get(lfuKey);
      if (entry) {
        this.cache.delete(lfuKey);
        this.stats.totalSize -= entry.size;
      }
    }
  }

  private async evictBySize(): Promise<void> {
    let largestKey: string | null = null;
    let largestSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.size > largestSize) {
        largestSize = entry.size;
        largestKey = key;
      }
    }
    
    if (largestKey) {
      const entry = this.cache.get(largestKey);
      if (entry) {
        this.cache.delete(largestKey);
        this.stats.totalSize -= entry.size;
      }
    }
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;
    
    let oldestEntry: Date | undefined;
    let newestEntry: Date | undefined;
    let totalAccessCount = 0;
    
    for (const entry of this.cache.values()) {
      if (!oldestEntry || entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }
      if (!newestEntry || entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt;
      }
      totalAccessCount += entry.accessCount;
    }
    
    const averageAccessCount = this.cache.size > 0 ? totalAccessCount / this.cache.size : 0;
    
    return {
      totalEntries: this.cache.size,
      totalSize: this.stats.totalSize,
      hitRate,
      missRate,
      oldestEntry,
      newestEntry,
      averageAccessCount
    };
  }

  async getEntry(key: string): Promise<CacheEntry<any> | null> {
    const entry = this.cache.get(key);
    
    if (!entry || entry.expiresAt < new Date()) {
      return null;
    }
    
    return entry;
  }

  async getAllEntries(): Promise<CacheEntry<any>[]> {
    const now = new Date();
    const validEntries: CacheEntry<any>[] = [];
    
    for (const entry of this.cache.values()) {
      if (entry.expiresAt >= now) {
        validEntries.push(entry);
      }
    }
    
    return validEntries;
  }

  async warmup<T>(entries: Array<{ key: string; data: T; ttl?: number }>): Promise<void> {
    const promises = entries.map(entry => this.set(entry.key, entry.data, entry.ttl));
    await Promise.all(promises);
  }

  private calculateSize(data: any): number {
    // Rough estimation of object size in bytes
    try {
      const serialized = JSON.stringify(data);
      return serialized.length * 2; // Approximate UTF-16 byte size
    } catch {
      return 1024; // Default 1KB if serialization fails
    }
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired().catch(error => {
        console.error('Cache cleanup error:', error);
      });
    }, this.config.cleanupInterval);
  }

  async optimizeMemory(): Promise<void> {
    const stats = this.getStats();
    
    // If cache is getting full, start more aggressive cleanup
    if (stats.totalSize > this.config.maxSize * 0.8) {
      // Evict entries with low access count
      const lowAccessThreshold = 2;
      const keysToEvict: string[] = [];
      
      for (const [key, entry] of this.cache.entries()) {
        if (entry.accessCount <= lowAccessThreshold) {
          keysToEvict.push(key);
        }
      }
      
      for (const key of keysToEvict) {
        await this.delete(key);
      }
    }
  }

  async compressLargeEntries(): Promise<void> {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.size > this.config.compressionThreshold) {
        // In a real implementation, you would compress the data
        // For now, we'll just remove large entries to save memory
        await this.delete(key);
      }
    }
  }

  async preloadFromResearchCache(): Promise<void> {
    // Preload frequently accessed keys from research cache
    const commonKeys = [
      'batch_research:keyword_research',
      'batch_research:sources',
      'batch_research:api_usage'
    ];
    
    for (const key of commonKeys) {
      const data = await researchCache.getCache(key);
      if (data) {
        await this.set(key, data, this.config.maxAge / 1000);
      }
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, totalSize: 0 };
  }

  // Advanced cache operations
  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {};
    
    const promises = keys.map(async (key) => {
      const value = await this.get<T>(key);
      return { key, value };
    });
    
    const resolved = await Promise.all(promises);
    
    resolved.forEach(({ key, value }) => {
      results[key] = value;
    });
    
    return results;
  }

  async setMultiple<T>(entries: Record<string, T>, ttl?: number): Promise<void> {
    const promises = Object.entries(entries).map(([key, data]) => 
      this.set(key, data, ttl)
    );
    
    await Promise.all(promises);
  }

  async invalidatePattern(pattern: string | RegExp): Promise<number> {
    const keysToInvalidate: string[] = [];
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToInvalidate.push(key);
      }
    }
    
    for (const key of keysToInvalidate) {
      await this.delete(key);
    }
    
    return keysToInvalidate.length;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = await factory();
    await this.set(key, value, ttl);
    
    return value;
  }

  // Cache warming strategies
  async warmupByPattern(pattern: string, dataFactory: (key: string) => Promise<any>): Promise<void> {
    const keys = Array.from(this.cache.keys()).filter(key => 
      typeof pattern === 'string' ? key.includes(pattern) : new RegExp(pattern).test(key)
    );
    
    for (const key of keys) {
      const data = await dataFactory(key);
      await this.set(key, data);
    }
  }

  async warmupByAccessCount(): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => b[1].accessCount - a[1].accessCount)
      .slice(0, Math.min(10, entries.length));
    
    for (const [key, entry] of entries) {
      // Refresh TTL for frequently accessed entries
      const ttl = (entry.expiresAt.getTime() - Date.now()) / 1000;
      if (ttl > 0) {
        await this.set(key, entry.data, ttl);
      }
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();