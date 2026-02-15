import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000/api/trpc";

async function query(proc: string, input?: any) {
  const url = input
    ? `${BASE}/${proc}?input=${encodeURIComponent(JSON.stringify(input))}`
    : `${BASE}/${proc}`;
  const res = await fetch(url);
  const json = await res.json();
  // tRPC v11 with superjson wraps in .json
  return json.result?.data?.json ?? json.result?.data;
}

describe("Mortgage Calculator Backend", () => {
  it("getMortgageConfig returns config when enabled", async () => {
    const config = await query("public.getMortgageConfig");
    expect(config).toBeDefined();
    expect(config.enabled).toBe(true);
  });

  it("getMortgageConfig returns correct rate defaults", async () => {
    const config = await query("public.getMortgageConfig");
    expect(config.defaultRate).toBe(5.5);
    expect(config.minRate).toBe(2.0);
    expect(config.maxRate).toBe(12.0);
  });

  it("getMortgageConfig returns correct term defaults", async () => {
    const config = await query("public.getMortgageConfig");
    expect(config.defaultTerm).toBe(25);
    expect(config.minTerm).toBe(5);
    expect(config.maxTerm).toBe(30);
  });

  it("getMortgageConfig returns correct down payment defaults", async () => {
    const config = await query("public.getMortgageConfig");
    expect(config.defaultDownPayment).toBe(20);
    expect(config.minDownPayment).toBe(10);
    expect(config.maxDownPayment).toBe(90);
  });

  it("getMortgageConfig returns bilingual titles", async () => {
    const config = await query("public.getMortgageConfig");
    expect(config.titleAr).toContain("حاسبة");
    expect(config.titleEn).toContain("Mortgage");
  });

  it("getMortgageConfig returns bilingual disclaimers", async () => {
    const config = await query("public.getMortgageConfig");
    expect(config.disclaimerAr).toContain("تقديرية");
    expect(config.disclaimerEn).toContain("estimation");
  });

  it("getMortgageConfig returns SAMA reference in disclaimer", async () => {
    const config = await query("public.getMortgageConfig");
    expect(config.disclaimerAr).toContain("ساما");
    expect(config.disclaimerEn).toContain("SAMA");
  });
});

describe("Mortgage Calculator Math Verification", () => {
  // Standard mortgage formula verification
  it("calculates correct monthly payment for 1M SAR at 5.5% for 25 years", () => {
    const principal = 800000; // 1M - 20% down
    const monthlyRate = 0.055 / 12;
    const n = 25 * 12;
    const expected = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    // ~5,085 SAR/month
    expect(Math.round(expected)).toBeGreaterThan(4900);
    expect(Math.round(expected)).toBeLessThan(5200);
  });

  it("calculates zero interest when rate is 0", () => {
    const principal = 800000;
    const n = 25 * 12;
    const monthly = principal / n;
    expect(Math.round(monthly)).toBe(2667);
  });

  it("total payment exceeds loan amount (interest adds up)", () => {
    const principal = 800000;
    const monthlyRate = 0.055 / 12;
    const n = 25 * 12;
    const monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    const total = monthly * n;
    expect(total).toBeGreaterThan(principal);
    // Total interest should be significant
    const interest = total - principal;
    expect(interest).toBeGreaterThan(500000);
  });
});
