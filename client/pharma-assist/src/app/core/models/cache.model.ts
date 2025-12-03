// Cache Models
// For request caching and state management

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
  tags?: string[];
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  strategy: CacheStrategy;
}

export enum CacheStrategy {
  LRU = 'lru', // Least Recently Used
  LFU = 'lfu', // Least Frequently Used
  FIFO = 'fifo', // First In First Out
  TTL = 'ttl' // Time To Live (expire oldest first)
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  strategy: CacheStrategy.LRU
};

// API Response cache configurations by endpoint type
export const API_CACHE_CONFIGS: Record<string, Partial<CacheConfig>> = {
  products: { ttl: 2 * 60 * 1000 }, // 2 minutes - products change frequently
  customers: { ttl: 5 * 60 * 1000 }, // 5 minutes
  orders: { ttl: 1 * 60 * 1000 }, // 1 minute - orders are time-sensitive
  manufacturers: { ttl: 30 * 60 * 1000 }, // 30 minutes - rarely change
  categories: { ttl: 60 * 60 * 1000 }, // 1 hour - very stable
  settings: { ttl: 60 * 60 * 1000 }, // 1 hour
  lookup: { ttl: 24 * 60 * 60 * 1000 } // 24 hours - static lookup data
};

export interface StateSnapshot<T> {
  state: T;
  timestamp: number;
  version: number;
}

export interface MemoizedFn<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  clear: () => void;
  size: () => number;
}
