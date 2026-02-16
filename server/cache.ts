/**
 * Simple in-memory cache with TTL support.
 * Designed for high-traffic real estate site to reduce DB load.
 * 
 * Usage:
 *   const data = await cache.getOrSet("key", () => fetchFromDB(), 60);
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
    // Cleanup expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  /**
   * Get a cached value or compute and cache it.
   * @param key Cache key
   * @param fetcher Async function to compute the value if not cached
   * @param ttlSeconds Time-to-live in seconds (default: 60)
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 60): Promise<T> {
    const now = Date.now();
    const existing = this.store.get(key);
    
    if (existing && existing.expiresAt > now) {
      return existing.data as T;
    }

    const data = await fetcher();
    this.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * Set a value in cache with TTL.
   */
  set<T>(key: string, data: T, ttlSeconds = 60): void {
    // Evict oldest entries if at capacity
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Get a cached value (or undefined if expired/missing).
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  /**
   * Invalidate a specific key or all keys matching a prefix.
   */
  invalidate(keyOrPrefix: string): void {
    if (this.store.has(keyOrPrefix)) {
      this.store.delete(keyOrPrefix);
      return;
    }
    // Prefix-based invalidation
    const keysToDelete: string[] = [];
    this.store.forEach((_, key) => {
      if (key.startsWith(keyOrPrefix)) keysToDelete.push(key);
    });
    keysToDelete.forEach(k => this.store.delete(k));
  }

  /**
   * Clear all cached entries.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache statistics.
   */
  stats(): { size: number; maxSize: number } {
    return { size: this.store.size, maxSize: this.maxSize };
  }

  private cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];
    this.store.forEach((entry, key) => {
      if (entry.expiresAt < now) expired.push(key);
    });
    expired.forEach(k => this.store.delete(k));
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Singleton cache instance
export const cache = new MemoryCache(500);

// Cache TTL presets (in seconds)
export const CACHE_TTL = {
  /** Site config, settings — rarely changes (5 minutes) */
  CONFIG: 300,
  /** Property counts, stats — moderate freshness (2 minutes) */
  STATS: 120,
  /** Property listings — short cache for fresh results (30 seconds) */
  LISTINGS: 30,
  /** Individual property detail — moderate (1 minute) */
  DETAIL: 60,
  /** Cities, districts, amenities — rarely change (10 minutes) */
  REFERENCE_DATA: 600,
  /** Featured properties, homepage — moderate (2 minutes) */
  FEATURED: 120,
  /** Search results — short (15 seconds) */
  SEARCH: 15,
} as const;
