import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Enhanced Search Filters - Price Range", () => {
  it("accepts minPrice filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({ minPrice: 500000 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
    // All returned items should have price >= minPrice
    for (const item of result.items) {
      if (item.price) {
        expect(parseFloat(item.price)).toBeGreaterThanOrEqual(500000);
      }
    }
  });

  it("accepts maxPrice filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({ maxPrice: 1000000 });
    expect(result).toHaveProperty("items");
    expect(Array.isArray(result.items)).toBe(true);
    // All returned items should have price <= maxPrice
    for (const item of result.items) {
      if (item.price) {
        expect(parseFloat(item.price)).toBeLessThanOrEqual(1000000);
      }
    }
  });

  it("accepts combined minPrice and maxPrice", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({
      minPrice: 200000,
      maxPrice: 2000000,
    });
    expect(result).toHaveProperty("items");
    for (const item of result.items) {
      if (item.price) {
        const price = parseFloat(item.price);
        expect(price).toBeGreaterThanOrEqual(200000);
        expect(price).toBeLessThanOrEqual(2000000);
      }
    }
  });

  it("returns fewer results with narrow price range", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const allResults = await caller.public.searchProperties({});
    const narrowResults = await caller.public.searchProperties({
      minPrice: 900000,
      maxPrice: 1100000,
    });
    expect(narrowResults.total).toBeLessThanOrEqual(allResults.total);
  });

  it("rejects negative minPrice", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.searchProperties({ minPrice: -100 })
    ).rejects.toThrow();
  });

  it("rejects negative maxPrice", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.searchProperties({ maxPrice: -500 })
    ).rejects.toThrow();
  });
});

describe("Enhanced Search Filters - Bedrooms (minRooms)", () => {
  it("accepts minRooms filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({ minRooms: 3 });
    expect(result).toHaveProperty("items");
    expect(Array.isArray(result.items)).toBe(true);
    // All returned items should have rooms >= 3
    for (const item of result.items) {
      if (item.rooms !== null && item.rooms !== undefined) {
        expect(item.rooms).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("returns fewer results with higher minRooms", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const rooms1 = await caller.public.searchProperties({ minRooms: 1 });
    const rooms5 = await caller.public.searchProperties({ minRooms: 5 });
    expect(rooms5.total).toBeLessThanOrEqual(rooms1.total);
  });

  it("accepts minRooms with type filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({
      type: "villa",
      minRooms: 4,
    });
    expect(result).toHaveProperty("items");
    for (const item of result.items) {
      expect(item.type).toBe("villa");
      if (item.rooms !== null && item.rooms !== undefined) {
        expect(item.rooms).toBeGreaterThanOrEqual(4);
      }
    }
  });
});

describe("Enhanced Search Filters - Bathrooms (minBathrooms)", () => {
  it("accepts minBathrooms filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({ minBathrooms: 2 });
    expect(result).toHaveProperty("items");
    expect(Array.isArray(result.items)).toBe(true);
    // All returned items should have bathrooms >= 2
    for (const item of result.items) {
      if (item.bathrooms !== null && item.bathrooms !== undefined) {
        expect(item.bathrooms).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("returns fewer results with higher minBathrooms", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const bath1 = await caller.public.searchProperties({ minBathrooms: 1 });
    const bath4 = await caller.public.searchProperties({ minBathrooms: 4 });
    expect(bath4.total).toBeLessThanOrEqual(bath1.total);
  });

  it("accepts minBathrooms with listing type filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({
      listingType: "sale",
      minBathrooms: 3,
    });
    expect(result).toHaveProperty("items");
    for (const item of result.items) {
      expect(item.listingType).toBe("sale");
      if (item.bathrooms !== null && item.bathrooms !== undefined) {
        expect(item.bathrooms).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe("Enhanced Search Filters - Combined Filters", () => {
  it("accepts all three filters combined", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({
      minPrice: 100000,
      maxPrice: 5000000,
      minRooms: 2,
      minBathrooms: 1,
    });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("accepts all filters with type and listing type", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({
      type: "apartment",
      listingType: "rent",
      minPrice: 10000,
      maxPrice: 100000,
      minRooms: 1,
      minBathrooms: 1,
      sort: "price_asc",
      page: 1,
      limit: 10,
    });
    expect(result).toHaveProperty("items");
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    for (const item of result.items) {
      expect(item.type).toBe("apartment");
      expect(item.listingType).toBe("rent");
    }
  });

  it("returns zero results for impossible filter combination", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({
      minPrice: 999999999,
      maxPrice: 999999999,
      minRooms: 100,
      minBathrooms: 100,
    });
    expect(result.items.length).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe("Enhanced Search Filters - Count Endpoint", () => {
  it("searchPropertiesCount accepts price range filters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchPropertiesCount({
      minPrice: 100000,
      maxPrice: 5000000,
    });
    expect(result).toHaveProperty("count");
    expect(typeof result.count).toBe("number");
    expect(result.count).toBeGreaterThanOrEqual(0);
  });

  it("searchPropertiesCount accepts rooms and bathrooms filters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchPropertiesCount({
      minRooms: 3,
      minBathrooms: 2,
    });
    expect(result).toHaveProperty("count");
    expect(typeof result.count).toBe("number");
    expect(result.count).toBeGreaterThanOrEqual(0);
  });

  it("count matches search total for same filters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const filters = { minPrice: 500000, minRooms: 2 };
    const searchResult = await caller.public.searchProperties(filters);
    const countResult = await caller.public.searchPropertiesCount(filters);
    expect(countResult.count).toBe(searchResult.total);
  });
});
