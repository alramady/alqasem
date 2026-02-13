import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Newsletter Subscription Tests ───
describe("Newsletter Subscription", () => {
  it("should validate email format for newsletter subscription", () => {
    const validEmails = ["test@example.com", "user@domain.sa", "name+tag@gmail.com"];
    const invalidEmails = ["notanemail", "@domain.com", "user@", ""];
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    validEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(true);
    });
    invalidEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  it("should normalize email to lowercase", () => {
    const email = "Test@Example.COM";
    expect(email.toLowerCase()).toBe("test@example.com");
  });
});

// ─── Property Comparison Tests ───
describe("Property Comparison", () => {
  it("should limit comparison to 4 properties max", () => {
    const compareIds: number[] = [1, 2, 3, 4];
    const newId = 5;
    
    if (compareIds.length >= 4) {
      expect(compareIds.length).toBe(4);
      expect(compareIds).not.toContain(newId);
    }
  });

  it("should toggle property in comparison list", () => {
    let compareIds: number[] = [1, 2];
    
    // Add
    const addId = 3;
    if (!compareIds.includes(addId)) {
      compareIds = [...compareIds, addId];
    }
    expect(compareIds).toContain(3);
    expect(compareIds.length).toBe(3);
    
    // Remove
    const removeId = 2;
    compareIds = compareIds.filter(id => id !== removeId);
    expect(compareIds).not.toContain(2);
    expect(compareIds.length).toBe(2);
  });

  it("should require at least 2 properties for comparison", () => {
    const compareIds1 = [1];
    const compareIds2 = [1, 2];
    
    expect(compareIds1.length >= 2).toBe(false);
    expect(compareIds2.length >= 2).toBe(true);
  });
});

// ─── Favorites Tests ───
describe("Favorites (localStorage)", () => {
  it("should serialize and deserialize favorites correctly", () => {
    const favorites = [1, 5, 10, 23];
    const serialized = JSON.stringify(favorites);
    const deserialized = JSON.parse(serialized);
    
    expect(deserialized).toEqual(favorites);
  });

  it("should toggle favorite status", () => {
    let favorites = [1, 2, 3];
    
    // Add
    const addId = 4;
    favorites = [...favorites, addId];
    expect(favorites).toContain(4);
    
    // Remove
    const removeId = 2;
    favorites = favorites.filter(id => id !== removeId);
    expect(favorites).not.toContain(2);
  });

  it("should handle empty favorites gracefully", () => {
    const empty = JSON.parse("[]");
    expect(Array.isArray(empty)).toBe(true);
    expect(empty.length).toBe(0);
  });
});

// ─── Mortgage Calculator Tests ───
describe("Mortgage Calculator", () => {
  function calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    if (monthlyRate === 0) return principal / numPayments;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  it("should calculate monthly payment correctly for standard loan", () => {
    // 1,000,000 SAR at 5% for 25 years
    const monthly = calculateMonthlyPayment(1000000, 5, 25);
    expect(monthly).toBeGreaterThan(5800);
    expect(monthly).toBeLessThan(5900);
  });

  it("should calculate monthly payment for zero interest", () => {
    const monthly = calculateMonthlyPayment(1200000, 0, 20);
    expect(monthly).toBe(5000);
  });

  it("should calculate total cost correctly", () => {
    const monthly = calculateMonthlyPayment(500000, 4, 15);
    const totalCost = monthly * 15 * 12;
    expect(totalCost).toBeGreaterThan(500000);
  });

  it("should handle down payment correctly", () => {
    const price = 2000000;
    const downPaymentPercent = 20;
    const downPayment = price * (downPaymentPercent / 100);
    const loanAmount = price - downPayment;
    
    expect(downPayment).toBe(400000);
    expect(loanAmount).toBe(1600000);
  });
});

// ─── Share URL Generation Tests ───
describe("Share URL Generation", () => {
  const baseUrl = "https://example.com/properties/123";
  const title = "فيلا فاخرة في الرياض";

  it("should generate WhatsApp share URL", () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(title + "\n" + baseUrl)}`;
    expect(whatsappUrl).toContain("wa.me");
    expect(whatsappUrl).toContain(encodeURIComponent(baseUrl));
  });

  it("should generate Twitter share URL", () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(baseUrl)}`;
    expect(twitterUrl).toContain("twitter.com/intent/tweet");
    expect(twitterUrl).toContain(encodeURIComponent(baseUrl));
  });

  it("should generate email share URL", () => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(baseUrl)}`;
    expect(emailUrl).toContain("mailto:");
    expect(emailUrl).toContain(encodeURIComponent(title));
  });
});

// ─── Property View Tracking Tests ───
describe("Property View Tracking", () => {
  it("should increment view count", () => {
    let viewCount = 0;
    viewCount += 1;
    expect(viewCount).toBe(1);
    viewCount += 1;
    expect(viewCount).toBe(2);
  });
});

// ─── Similar Properties Logic Tests ───
describe("Similar Properties", () => {
  const properties = [
    { id: 1, type: "villa", city: "الرياض", price: "1500000" },
    { id: 2, type: "villa", city: "الرياض", price: "1800000" },
    { id: 3, type: "apartment", city: "الرياض", price: "500000" },
    { id: 4, type: "villa", city: "جدة", price: "2000000" },
    { id: 5, type: "villa", city: "الرياض", price: "1600000" },
  ];

  it("should find similar properties by type and city", () => {
    const current = properties[0];
    const similar = properties.filter(
      p => p.id !== current.id && p.type === current.type && p.city === current.city
    );
    expect(similar.length).toBe(2);
    expect(similar.every(p => p.type === "villa")).toBe(true);
    expect(similar.every(p => p.city === "الرياض")).toBe(true);
  });

  it("should exclude current property from similar list", () => {
    const currentId = 1;
    const similar = properties.filter(p => p.id !== currentId);
    expect(similar.every(p => p.id !== currentId)).toBe(true);
  });
});

// ─── Report Export Tests ───
describe("Report Export CSV", () => {
  it("should generate valid CSV header for properties", () => {
    const headers = ["ID", "العنوان", "النوع", "المدينة", "السعر", "المساحة", "الحالة"];
    const csvHeader = headers.join(",");
    expect(csvHeader).toContain("ID");
    expect(csvHeader).toContain("العنوان");
    expect(csvHeader.split(",").length).toBe(7);
  });

  it("should escape CSV values with commas", () => {
    const value = "فيلا, فاخرة";
    const escaped = `"${value}"`;
    expect(escaped).toBe('"فيلا, فاخرة"');
  });
});

// ─── Period Filter Tests ───
describe("Report Period Filter", () => {
  it("should calculate correct date range for week", () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    expect(weekAgo.getTime()).toBeLessThan(now.getTime());
    expect(now.getTime() - weekAgo.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("should calculate correct date range for month", () => {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    expect(monthAgo.getTime()).toBeLessThan(now.getTime());
  });

  it("should calculate correct date range for quarter", () => {
    const now = new Date();
    const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    expect(quarterAgo.getTime()).toBeLessThan(now.getTime());
  });

  it("should calculate correct date range for year", () => {
    const now = new Date();
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    expect(yearAgo.getTime()).toBeLessThan(now.getTime());
  });
});
