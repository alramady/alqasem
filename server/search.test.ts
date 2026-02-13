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

describe("Search Properties - Procedure Existence", () => {
  it("searchProperties procedure exists", () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.public.searchProperties).toBe("function");
  });

  it("searchProjects procedure exists", () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.public.searchProjects).toBe("function");
  });

  it("getPropertyCities procedure exists", () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.public.getPropertyCities).toBe("function");
  });
});

describe("Search Properties - Input Validation", () => {
  it("accepts empty input (returns all active properties)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties();
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("limit");
    expect(result).toHaveProperty("totalPages");
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(12);
  });

  it("accepts type filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({ type: "villa" });
    expect(result).toHaveProperty("items");
    expect(Array.isArray(result.items)).toBe(true);
    // All returned items should be villas
    for (const item of result.items) {
      expect(item.type).toBe("villa");
    }
  });

  it("accepts listingType filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({ listingType: "rent" });
    expect(result).toHaveProperty("items");
    for (const item of result.items) {
      expect(item.listingType).toBe("rent");
    }
  });

  it("accepts sort parameter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({ sort: "price_desc" });
    expect(result).toHaveProperty("items");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("accepts pagination parameters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({ page: 1, limit: 5 });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(5);
    expect(result.items.length).toBeLessThanOrEqual(5);
  });

  it("rejects invalid type", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.searchProperties({ type: "invalid_type" as any })
    ).rejects.toThrow();
  });

  it("rejects invalid sort", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.searchProperties({ sort: "invalid_sort" as any })
    ).rejects.toThrow();
  });

  it("rejects negative minPrice", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.searchProperties({ minPrice: -100 })
    ).rejects.toThrow();
  });

  it("rejects page less than 1", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.searchProperties({ page: 0 })
    ).rejects.toThrow();
  });

  it("rejects limit greater than 50", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.searchProperties({ limit: 100 })
    ).rejects.toThrow();
  });

  it("accepts text query search", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({ query: "فيلا" });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("accepts combined filters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({
      type: "apartment",
      listingType: "sale",
      minPrice: 100000,
      maxPrice: 5000000,
      sort: "price_asc",
      page: 1,
      limit: 10,
    });
    expect(result).toHaveProperty("items");
    for (const item of result.items) {
      expect(item.type).toBe("apartment");
      expect(item.listingType).toBe("sale");
    }
  });

  it("returns correct totalPages calculation", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProperties({ limit: 1 });
    if (result.total > 0) {
      expect(result.totalPages).toBe(result.total);
    } else {
      expect(result.totalPages).toBe(0);
    }
  });
});

describe("Search Projects - Input Validation", () => {
  it("accepts empty input (returns all projects)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProjects();
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("limit");
    expect(result).toHaveProperty("totalPages");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("accepts status filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProjects({ status: "active" });
    expect(result).toHaveProperty("items");
    for (const item of result.items) {
      expect(item.status).toBe("active");
    }
  });

  it("accepts text query search", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProjects({ query: "مشروع" });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
  });

  it("accepts sort parameter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProjects({ sort: "units_desc" });
    expect(result).toHaveProperty("items");
  });

  it("accepts pagination", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.searchProjects({ page: 1, limit: 5 });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(5);
    expect(result.items.length).toBeLessThanOrEqual(5);
  });

  it("rejects invalid status", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.searchProjects({ status: "invalid" as any })
    ).rejects.toThrow();
  });

  it("rejects invalid sort", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.searchProjects({ sort: "invalid" as any })
    ).rejects.toThrow();
  });
});

describe("Get Property Cities", () => {
  it("returns an array of cities", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.getPropertyCities();
    expect(Array.isArray(result)).toBe(true);
    for (const city of result) {
      expect(typeof city).toBe("string");
    }
  });
});
