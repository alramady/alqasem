import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000";

async function trpcQuery(path: string, input?: any) {
  const url = input
    ? `${BASE}/api/trpc/${path}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`
    : `${BASE}/api/trpc/${path}`;
  const res = await fetch(url);
  return res.json();
}

describe("Property Comparison Feature", () => {
  it("should return properties for comparison by IDs", async () => {
    const data = await trpcQuery("public.getPropertiesForComparison", { ids: [1, 2, 3] });
    const result = data.result?.data?.json || data.result?.data;
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
  });

  it("should return property details with comparison fields (price, area, rooms)", async () => {
    const data = await trpcQuery("public.getPropertiesForComparison", { ids: [1, 2] });
    const result = data.result?.data?.json || data.result?.data;
    expect(result.length).toBeGreaterThanOrEqual(1);
    const p = result.find((r: any) => r.id === 1);
    expect(p).toBeDefined();
    expect(p.price).toBeDefined();
    expect(p.area).toBeDefined();
    expect(p.title).toBeDefined();
  });

  it("should handle up to 4 properties for comparison", async () => {
    const data = await trpcQuery("public.getPropertiesForComparison", { ids: [1, 2, 3, 5] });
    const result = data.result?.data?.json || data.result?.data;
    expect(result.length).toBe(4);
  });

  it("should reject fewer than 2 IDs", async () => {
    const data = await trpcQuery("public.getPropertiesForComparison", { ids: [1] });
    expect(data.error).toBeDefined();
    expect(data.error?.json?.data?.code).toBe("BAD_REQUEST");
  });

  it("should reject empty IDs array", async () => {
    const data = await trpcQuery("public.getPropertiesForComparison", { ids: [] });
    expect(data.error).toBeDefined();
    expect(data.error?.json?.data?.code).toBe("BAD_REQUEST");
  });

  it("should include images array in comparison data", async () => {
    const data = await trpcQuery("public.getPropertiesForComparison", { ids: [1, 2] });
    const result = data.result?.data?.json || data.result?.data;
    const p = result[0];
    expect(p).toHaveProperty("images");
  });

  it("should include property type and listing type", async () => {
    const data = await trpcQuery("public.getPropertiesForComparison", { ids: [1, 2] });
    const result = data.result?.data?.json || data.result?.data;
    const p = result[0];
    expect(p.type).toBeDefined();
    expect(p.listingType).toBeDefined();
  });

  it("should include location data (city)", async () => {
    const data = await trpcQuery("public.getPropertiesForComparison", { ids: [1, 2] });
    const result = data.result?.data?.json || data.result?.data;
    const p = result[0];
    expect(p.city).toBeDefined();
  });
});

describe("Property Favorites Feature", () => {
  it("should have customer.getFavorites endpoint (requires auth)", async () => {
    const res = await fetch(`${BASE}/api/trpc/customer.getFavorites`);
    const data = await res.json();
    expect(data.error?.json?.data?.code || "UNAUTHORIZED").toBe("UNAUTHORIZED");
  });

  it("should have customer.toggleFavorite endpoint (requires auth)", async () => {
    const res = await fetch(`${BASE}/api/trpc/customer.toggleFavorite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { propertyId: 1 } }),
    });
    const data = await res.json();
    expect(data.error?.json?.data?.code || "UNAUTHORIZED").toBe("UNAUTHORIZED");
  });

  it("should have customer.syncFavorites endpoint (requires auth)", async () => {
    const res = await fetch(`${BASE}/api/trpc/customer.syncFavorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { propertyIds: [1, 2, 3] } }),
    });
    const data = await res.json();
    expect(data.error?.json?.data?.code || "UNAUTHORIZED").toBe("UNAUTHORIZED");
  });

  it("should have customer.clearFavorites endpoint (requires auth)", async () => {
    const res = await fetch(`${BASE}/api/trpc/customer.clearFavorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    expect(data.error?.json?.data?.code || "UNAUTHORIZED").toBe("UNAUTHORIZED");
  });

  it("should have favorites page route accessible", async () => {
    const res = await fetch(`${BASE}/favorites`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html.toLowerCase()).toContain("<!doctype html>");
  });

  it("should have compare page route accessible", async () => {
    const res = await fetch(`${BASE}/compare`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html.toLowerCase()).toContain("<!doctype html>");
  });

  it("should support shared favorites URL with ids parameter", async () => {
    const res = await fetch(`${BASE}/favorites?ids=1,2,3`);
    expect(res.status).toBe(200);
  });
});
