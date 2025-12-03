import { Injectable, signal, computed } from '@angular/core';
import {
  CacheEntry,
  CacheConfig,
  CacheStrategy,
  CacheStats,
  DEFAULT_CACHE_CONFIG,
  API_CACHE_CONFIGS,
  MemoizedFn
} from '../models/cache.model';

/**
 * Cache Service
 * Provides in-memory caching with various eviction strategies
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder: string[] = []; // For LRU
  private accessCounts = new Map<string, number>(); // For LFU

  // Stats
  private hits = signal(0);
  private misses = signal(0);

  stats = computed<CacheStats>(() => ({
    hits: this.hits(),
    misses: this.misses(),
    size: this.cache.size,
    hitRate: this.hits() / (this.hits() + this.misses()) || 0
  }));

  /**
   * Get an item from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses.update(v => v + 1);
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.misses.update(v => v + 1);
      return null;
    }

    // Update access tracking
    this.recordAccess(key);
    this.hits.update(v => v + 1);

    return entry.data as T;
  }

  /**
   * Set an item in cache
   */
  set<T>(
    key: string,
    data: T,
    config: Partial<CacheConfig> = {},
    tags?: string[]
  ): void {
    const fullConfig = { ...DEFAULT_CACHE_CONFIG, ...config };

    // Evict if at capacity
    if (this.cache.size >= fullConfig.maxSize && !this.cache.has(key)) {
      this.evict(fullConfig.strategy);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + fullConfig.ttl,
      key,
      tags
    };

    this.cache.set(key, entry);
    this.recordAccess(key);
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessCounts.delete(key);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.accessCounts.clear();
    this.hits.set(0);
    this.misses.set(0);
  }

  /**
   * Clear entries with specific tag
   */
  clearByTag(tag: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.tags?.includes(tag)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Clear entries matching a key pattern
   */
  clearByPattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Get or set - fetch from cache or compute if not present
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    config?: Partial<CacheConfig>,
    tags?: string[]
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, config, tags);
    return data;
  }

  /**
   * Get cache config for an endpoint type
   */
  getConfigForEndpoint(endpoint: string): Partial<CacheConfig> {
    // Find matching config
    for (const [pattern, config] of Object.entries(API_CACHE_CONFIGS)) {
      if (endpoint.includes(pattern)) {
        return config;
      }
    }
    return {};
  }

  /**
   * Generate cache key for API request
   */
  generateKey(url: string, params?: Record<string, any>): string {
    const paramStr = params
      ? '_' + Object.entries(params)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join('&')
      : '';
    return `api:${url}${paramStr}`;
  }

  /**
   * Record access for LRU/LFU tracking
   */
  private recordAccess(key: string): void {
    // LRU tracking
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);

    // LFU tracking
    const count = this.accessCounts.get(key) || 0;
    this.accessCounts.set(key, count + 1);
  }

  /**
   * Evict one entry based on strategy
   */
  private evict(strategy: CacheStrategy): void {
    let keyToEvict: string | undefined;

    switch (strategy) {
      case CacheStrategy.LRU:
        keyToEvict = this.accessOrder[0];
        break;

      case CacheStrategy.LFU:
        let minCount = Infinity;
        this.accessCounts.forEach((count, key) => {
          if (count < minCount) {
            minCount = count;
            keyToEvict = key;
          }
        });
        break;

      case CacheStrategy.FIFO:
        const firstKey = this.cache.keys().next().value;
        keyToEvict = firstKey;
        break;

      case CacheStrategy.TTL:
        let oldestExpiry = Infinity;
        this.cache.forEach((entry, key) => {
          if (entry.expiresAt < oldestExpiry) {
            oldestExpiry = entry.expiresAt;
            keyToEvict = key;
          }
        });
        break;
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
    }
  }

  /**
   * Remove all expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        this.delete(key);
        removed++;
      }
    });

    return removed;
  }

  /**
   * Create a memoized function
   */
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    config?: Partial<CacheConfig>
  ): MemoizedFn<T> {
    const localCache = new Map<string, { value: ReturnType<T>; expiresAt: number }>();
    const ttl = config?.ttl ?? DEFAULT_CACHE_CONFIG.ttl;

    const memoized = ((...args: Parameters<T>): ReturnType<T> => {
      const key = keyGenerator
        ? keyGenerator(...args)
        : JSON.stringify(args);

      const cached = localCache.get(key);
      if (cached && Date.now() < cached.expiresAt) {
        return cached.value;
      }

      const result = fn(...args);
      localCache.set(key, { value: result, expiresAt: Date.now() + ttl });
      return result;
    }) as MemoizedFn<T>;

    memoized.clear = () => localCache.clear();
    memoized.size = () => localCache.size;

    return memoized;
  }
}
