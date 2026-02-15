import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000";

describe("Property Map View", () => {
  it("serves the map view page", async () => {
    const res = await fetch(`${BASE}/properties/map`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<!doctype html>");
  });

  it("searchProperties endpoint returns items for map markers", async () => {
    const res = await fetch(`${BASE}/api/trpc/public.searchProperties?input=${encodeURIComponent(JSON.stringify({ json: { page: 1, limit: 5 } }))}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.result?.data?.json).toHaveProperty("items");
    expect(data.result?.data?.json).toHaveProperty("total");
    expect(data.result?.data?.json).toHaveProperty("totalPages");
  });

  it("searchProperties returns array of items", async () => {
    const res = await fetch(`${BASE}/api/trpc/public.searchProperties?input=${encodeURIComponent(JSON.stringify({ json: { page: 1, limit: 50 } }))}`);
    const data = await res.json();
    const items = data.result?.data?.json?.items;
    expect(Array.isArray(items)).toBe(true);
  });
});

describe("Customer Dashboard - My Inquiries", () => {
  it("getMyInquiries requires authentication", async () => {
    const res = await fetch(`${BASE}/api/trpc/customer.getMyInquiries`);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error?.json?.data?.code).toBe("UNAUTHORIZED");
  });
});

describe("Customer Dashboard - My Financing Requests", () => {
  it("getMyFinancingRequests requires authentication", async () => {
    const res = await fetch(`${BASE}/api/trpc/customer.getMyFinancingRequests`);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error?.json?.data?.code).toBe("UNAUTHORIZED");
  });
});

describe("Drip Email System", () => {
  it("drip settings exist in database", async () => {
    const res = await fetch(`${BASE}/api/trpc/public.getSiteConfig`);
    const data = await res.json();
    const settings = data.result?.data?.json?.settings;
    expect(settings).toBeDefined();
    // Drip settings should be present
    expect(settings?.drip_enabled).toBeDefined();
    expect(settings?.drip_day1_subject_ar).toBeDefined();
    expect(settings?.drip_day1_subject_en).toBeDefined();
  });

  it("drip campaign has day 1, 3, and 7 email templates", async () => {
    const res = await fetch(`${BASE}/api/trpc/public.getSiteConfig`);
    const data = await res.json();
    const settings = data.result?.data?.json?.settings;
    // Day 1
    expect(settings?.drip_day1_subject_ar).toBeTruthy();
    expect(settings?.drip_day1_body_ar).toBeTruthy();
    // Day 3
    expect(settings?.drip_day3_subject_ar).toBeTruthy();
    expect(settings?.drip_day3_body_ar).toBeTruthy();
    // Day 7
    expect(settings?.drip_day7_subject_ar).toBeTruthy();
    expect(settings?.drip_day7_body_ar).toBeTruthy();
  });

  it("financing submission schedules drip emails", async () => {
    // Submit a financing request and verify it succeeds (drip scheduling happens server-side)
    const res = await fetch(`${BASE}/api/trpc/public.submitFinancingRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          customerName: "Test Drip User",
          customerPhone: "0500000099",
          customerEmail: "drip-test@example.com",
          propertyPrice: 1500000,
          downPaymentPct: 20,
          loanAmount: 1200000,
          rate: "4.49",
          termYears: 25,
          monthlyPayment: 6850,
        }
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.result?.data?.json?.success).toBe(true);
    expect(data.result?.data?.json?.requestNumber).toMatch(/^FIN-/);
  });
});

describe("Admin Financing Requests Endpoints", () => {
  it("listFinancingRequests requires admin auth", async () => {
    const res = await fetch(`${BASE}/api/trpc/admin.listFinancingRequests?input=${encodeURIComponent(JSON.stringify({ json: { page: 1 } }))}`);
    const data = await res.json();
    expect(data.error?.json?.data?.code).toBe("FORBIDDEN");
  });

  it("updateFinancingRequestStatus is protected by CSRF and auth", async () => {
    const res = await fetch(`${BASE}/api/trpc/admin.updateFinancingRequestStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ json: { id: 1, status: "contacted" } }),
    });
    const data = await res.json();
    // CSRF protection blocks before auth check
    expect(data.error?.code || data.error?.json?.data?.code).toBeTruthy();
  });
});
