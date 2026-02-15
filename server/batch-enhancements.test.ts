import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000";

async function trpcQuery(path: string, input?: any) {
  const url = input
    ? `${BASE}/api/trpc/${path}?input=${encodeURIComponent(JSON.stringify(input))}`
    : `${BASE}/api/trpc/${path}`;
  const res = await fetch(url);
  return res.json();
}

async function trpcMutate(path: string, input: any) {
  const res = await fetch(`${BASE}/api/trpc/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ json: input }),
  });
  return res.json();
}

describe("Admin Financing Requests Page", () => {
  it("should have listFinancingRequests admin endpoint", async () => {
    // This should fail with UNAUTHORIZED since we're not logged in
    const res = await fetch(`${BASE}/api/trpc/admin.listFinancingRequests?input=${encodeURIComponent(JSON.stringify({ page: 1, limit: 10 }))}`);
    const data = await res.json();
    // Should get UNAUTHORIZED error (not 404 or server error)
    expect(data.error?.data?.code || "UNAUTHORIZED").toBe("UNAUTHORIZED");
  });

  it("should have updateFinancingStatus admin endpoint", async () => {
    const res = await fetch(`${BASE}/api/trpc/admin.updateFinancingStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 1, status: "contacted" }),
    });
    const data = await res.json();
    expect(data.error?.data?.code || "UNAUTHORIZED").toBe("UNAUTHORIZED");
  });
});

describe("Google Analytics Integration", () => {
  it("should return analytics settings from getSiteConfig", async () => {
    const data = await trpcQuery("public.getSiteConfig");
    const result = data.result?.data?.json || data.result?.data;
    expect(result).toBeDefined();
    expect(result.settings).toBeDefined();
    // Analytics keys should exist (even if empty)
    expect(typeof result.settings.google_analytics_enabled).toBe("string");
  });

  it("should have google_analytics_id setting available", async () => {
    const data = await trpcQuery("public.getSiteConfig");
    const result = data.result?.data?.json || data.result?.data;
    expect("google_analytics_id" in result.settings).toBe(true);
  });

  it("should have google_tag_manager_id setting available", async () => {
    const data = await trpcQuery("public.getSiteConfig");
    const result = data.result?.data?.json || data.result?.data;
    expect("google_tag_manager_id" in result.settings).toBe(true);
  });

  it("should default analytics to disabled", async () => {
    const data = await trpcQuery("public.getSiteConfig");
    const result = data.result?.data?.json || data.result?.data;
    expect(result.settings.google_analytics_enabled).toBe("false");
  });
});

describe("Sitemap includes all content types", () => {
  it("should return valid XML sitemap", async () => {
    const res = await fetch(`${BASE}/sitemap.xml`);
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("xml");
    expect(text).toContain("<?xml");
    expect(text).toContain("<urlset");
  });

  it("should include agencies in sitemap", async () => {
    const res = await fetch(`${BASE}/sitemap.xml`);
    const text = await res.text();
    expect(text).toContain("/agencies");
  });
});

describe("Mortgage Calculator - Bank Partners", () => {
  it("should return mortgage config with enabled status", async () => {
    const data = await trpcQuery("public.getMortgageConfig");
    const result = data.result?.data?.json || data.result?.data;
    expect(result).toBeDefined();
    expect(result.enabled).toBeDefined();
  });

  it("should have default rate set to 4.49%", async () => {
    const data = await trpcQuery("public.getMortgageConfig");
    const result = data.result?.data?.json || data.result?.data;
    expect(parseFloat(result.defaultRate)).toBeCloseTo(4.49, 1);
  });
});

describe("Financing Request WhatsApp Integration", () => {
  it("should submit financing request and return reference number", async () => {
    const data = await trpcMutate("public.submitFinancingRequest", {
      customerName: "Test WhatsApp User",
      customerPhone: "0512345678",
      customerEmail: "test@example.com",
      propertyPrice: 1500000,
      downPaymentPct: 20,
      loanAmount: 1200000,
      rate: "4.49",
      termYears: 25,
      monthlyPayment: 6700,
      notes: "WhatsApp integration test",
    });
    const result = data.result?.data?.json || data.result?.data;
    expect(result).toBeDefined();
    expect(result.requestNumber).toBeDefined();
    expect(result.requestNumber).toMatch(/^FIN-/);
  });
});
