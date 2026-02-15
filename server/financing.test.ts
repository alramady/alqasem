import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000/api/trpc";

describe("Financing Request API", () => {
  // Test: getMortgageConfig includes financing CTA fields
  it("getMortgageConfig returns financing CTA config", async () => {
    const res = await fetch(`${BASE}/public.getMortgageConfig`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    const data = body.result?.data?.json;
    expect(data).toBeTruthy();
    expect(data.enabled).toBe(true);
    expect(data.defaultRate).toBe(4.49);
    expect(typeof data.financingCtaEnabled).toBe("boolean");
    expect(typeof data.financingCtaTitleAr).toBe("string");
    expect(typeof data.financingCtaTitleEn).toBe("string");
  });

  // Test: submitFinancingRequest with valid Saudi phone
  it("submitFinancingRequest succeeds with valid data", async () => {
    const res = await fetch(`${BASE}/public.submitFinancingRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          customerName: "أحمد الرشيدي",
          customerPhone: "0551234567",
          propertyPrice: 2000000,
          downPaymentPct: 20,
          loanAmount: 1600000,
          rate: "4.49",
          termYears: 25,
          monthlyPayment: 8900,
        },
      }),
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    const data = body.result?.data?.json;
    expect(data.success).toBe(true);
    expect(data.requestNumber).toMatch(/^FIN-/);
  });

  // Test: submitFinancingRequest with property context
  it("submitFinancingRequest includes property info", async () => {
    const res = await fetch(`${BASE}/public.submitFinancingRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          propertyId: 1,
          propertyTitle: "فيلا فاخرة في حي النرجس",
          customerName: "محمد العتيبي",
          customerPhone: "0599876543",
          customerEmail: "test@example.com",
          propertyPrice: 3500000,
          downPaymentPct: 30,
          loanAmount: 2450000,
          rate: "4.49",
          termYears: 20,
          monthlyPayment: 15200,
          notes: "أرغب في تمويل متوافق مع الشريعة",
        },
      }),
    });
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.result?.data?.json?.success).toBe(true);
  });

  // Test: rejects invalid phone number
  it("rejects non-Saudi phone number", async () => {
    const res = await fetch(`${BASE}/public.submitFinancingRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          customerName: "Test User",
          customerPhone: "1234567890",
          propertyPrice: 1000000,
          downPaymentPct: 20,
          loanAmount: 800000,
          rate: "4.49",
          termYears: 25,
          monthlyPayment: 5000,
        },
      }),
    });
    const body = await res.json();
    // Should fail validation
    expect(body.error || body.result?.data?.json?.success !== true).toBeTruthy();
  });

  // Test: rejects empty name
  it("rejects empty customer name", async () => {
    const res = await fetch(`${BASE}/public.submitFinancingRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          customerName: "",
          customerPhone: "0512345678",
          propertyPrice: 1000000,
          downPaymentPct: 20,
          loanAmount: 800000,
          rate: "4.49",
          termYears: 25,
          monthlyPayment: 5000,
        },
      }),
    });
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  // Test: request number format
  it("returns unique request numbers", { timeout: 30000 }, async () => {
    const numbers = new Set<string>();
    for (let i = 0; i < 3; i++) {
      const res = await fetch(`${BASE}/public.submitFinancingRequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            customerName: `User ${i}`,
            customerPhone: "0512345678",
            propertyPrice: 1000000,
            downPaymentPct: 20,
            loanAmount: 800000,
            rate: "4.49",
            termYears: 25,
            monthlyPayment: 5000,
          },
        }),
      });
      const body = await res.json();
      const num = body.result?.data?.json?.requestNumber;
      expect(num).toBeTruthy();
      numbers.add(num);
    }
    expect(numbers.size).toBe(3); // All unique
  });
});
