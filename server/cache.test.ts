import { describe, it, expect, beforeEach, vi } from "vitest";
import { cache, CACHE_TTL } from "./cache";

describe("MemoryCache", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("should cache and return data via getOrSet", async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { value: "test" };
    };

    const result1 = await cache.getOrSet("key1", fetcher, 60);
    expect(result1).toEqual({ value: "test" });
    expect(callCount).toBe(1);

    // Second call should use cache, not call fetcher
    const result2 = await cache.getOrSet("key1", fetcher, 60);
    expect(result2).toEqual({ value: "test" });
    expect(callCount).toBe(1); // Still 1 — cache hit
  });

  it("should expire entries after TTL", async () => {
    vi.useFakeTimers();
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return `result-${callCount}`;
    };

    await cache.getOrSet("ttl-test", fetcher, 2); // 2 second TTL
    expect(callCount).toBe(1);

    // Still cached
    await cache.getOrSet("ttl-test", fetcher, 2);
    expect(callCount).toBe(1);

    // Advance time past TTL
    vi.advanceTimersByTime(3000);

    await cache.getOrSet("ttl-test", fetcher, 2);
    expect(callCount).toBe(2); // Re-fetched after expiry

    vi.useRealTimers();
  });

  it("should invalidate by exact key", async () => {
    cache.set("key-a", "value-a", 60);
    cache.set("key-b", "value-b", 60);

    expect(cache.get("key-a")).toBe("value-a");
    cache.invalidate("key-a");
    expect(cache.get("key-a")).toBeUndefined();
    expect(cache.get("key-b")).toBe("value-b"); // Not affected
  });

  it("should invalidate by prefix", async () => {
    cache.set("properties:search:1", "data1", 60);
    cache.set("properties:search:2", "data2", 60);
    cache.set("cities:all", "data3", 60);

    cache.invalidate("properties:");
    expect(cache.get("properties:search:1")).toBeUndefined();
    expect(cache.get("properties:search:2")).toBeUndefined();
    expect(cache.get("cities:all")).toBe("data3"); // Not affected
  });

  it("should clear all entries", () => {
    cache.set("a", 1, 60);
    cache.set("b", 2, 60);
    cache.set("c", 3, 60);

    expect(cache.stats().size).toBe(3);
    cache.clear();
    expect(cache.stats().size).toBe(0);
  });

  it("should report correct stats", () => {
    expect(cache.stats().size).toBe(0);
    cache.set("x", "y", 60);
    expect(cache.stats().size).toBe(1);
    expect(cache.stats().maxSize).toBe(500);
  });

  it("should have correct TTL presets", () => {
    expect(CACHE_TTL.CONFIG).toBe(300);
    expect(CACHE_TTL.STATS).toBe(120);
    expect(CACHE_TTL.LISTINGS).toBe(30);
    expect(CACHE_TTL.DETAIL).toBe(60);
    expect(CACHE_TTL.REFERENCE_DATA).toBe(600);
    expect(CACHE_TTL.FEATURED).toBe(120);
    expect(CACHE_TTL.SEARCH).toBe(15);
  });

  it("should handle concurrent getOrSet calls", async () => {
    let callCount = 0;
    const slowFetcher = async () => {
      callCount++;
      await new Promise(r => setTimeout(r, 50));
      return "slow-result";
    };

    // Fire two concurrent requests for the same key
    const [r1, r2] = await Promise.all([
      cache.getOrSet("concurrent", slowFetcher, 60),
      cache.getOrSet("concurrent", slowFetcher, 60),
    ]);

    expect(r1).toBe("slow-result");
    expect(r2).toBe("slow-result");
    // Both should get the result, though fetcher may be called twice (no dedup)
    expect(callCount).toBeGreaterThanOrEqual(1);
    expect(callCount).toBeLessThanOrEqual(2);
  });

  it("should return undefined for expired entries via get()", () => {
    vi.useFakeTimers();
    cache.set("exp", "value", 1);
    expect(cache.get("exp")).toBe("value");

    vi.advanceTimersByTime(2000);
    expect(cache.get("exp")).toBeUndefined();

    vi.useRealTimers();
  });
});
