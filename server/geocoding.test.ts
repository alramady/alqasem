import { describe, it, expect } from "vitest";

// City coordinate ranges used for validation
const CITY_RANGES: Record<string, { lat: number; lng: number; latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
  "الرياض": { lat: 24.7136, lng: 46.6753, latMin: 24.4, latMax: 25.1, lngMin: 46.4, lngMax: 47.1 },
  "جدة": { lat: 21.5433, lng: 39.1728, latMin: 21.3, latMax: 21.8, lngMin: 39.0, lngMax: 39.4 },
  "الدمام": { lat: 26.3927, lng: 50.0888, latMin: 26.2, latMax: 26.6, lngMin: 49.9, lngMax: 50.3 },
  "الخبر": { lat: 26.2172, lng: 50.1971, latMin: 26.1, latMax: 26.5, lngMin: 50.0, lngMax: 50.4 },
  "مكة المكرمة": { lat: 21.4225, lng: 39.8262, latMin: 21.3, latMax: 21.5, lngMin: 39.7, lngMax: 40.0 },
  "المدينة المنورة": { lat: 24.4672, lng: 39.6024, latMin: 24.3, latMax: 24.7, lngMin: 39.4, lngMax: 39.8 },
};

function isInCity(lat: number, lng: number, city: string): boolean {
  const range = CITY_RANGES[city];
  if (!range) return true;
  return lat >= range.latMin && lat <= range.latMax && lng >= range.lngMin && lng <= range.lngMax;
}

describe("Geocoding Validation", () => {
  describe("isInCity validation", () => {
    it("should validate Riyadh coordinates correctly", () => {
      expect(isInCity(24.7136, 46.6753, "الرياض")).toBe(true);
      expect(isInCity(24.8343, 46.6792, "الرياض")).toBe(true); // النرجس
      expect(isInCity(24.9072, 46.6258, "الرياض")).toBe(true); // النرجس geocoded
    });

    it("should reject Jeddah coordinates for Riyadh properties", () => {
      // This was the original bug - حي النرجس was geocoded to Jeddah
      expect(isInCity(21.5950, 39.1616, "الرياض")).toBe(false);
    });

    it("should validate Jeddah coordinates correctly", () => {
      expect(isInCity(21.5433, 39.1728, "جدة")).toBe(true);
      expect(isInCity(21.5292, 39.1611, "جدة")).toBe(true); // الحمراء
      expect(isInCity(21.6023, 39.1078, "جدة")).toBe(true); // الكورنيش
    });

    it("should reject Riyadh coordinates for Jeddah properties", () => {
      expect(isInCity(24.7136, 46.6753, "جدة")).toBe(false);
    });

    it("should validate Dammam coordinates correctly", () => {
      expect(isInCity(26.3937, 50.0714, "الدمام")).toBe(true);
    });

    it("should validate Khobar coordinates correctly", () => {
      expect(isInCity(26.2857, 50.2119, "الخبر")).toBe(true);
    });

    it("should validate Makkah coordinates correctly", () => {
      expect(isInCity(21.4195, 39.8583, "مكة المكرمة")).toBe(true);
    });

    it("should validate Madinah coordinates correctly", () => {
      expect(isInCity(24.4672, 39.6024, "المدينة المنورة")).toBe(true);
    });

    it("should accept any coordinates for unknown cities", () => {
      expect(isInCity(0, 0, "مدينة غير معروفة")).toBe(true);
    });

    it("should reject sea coordinates (0,0) for Saudi cities", () => {
      expect(isInCity(0, 0, "الرياض")).toBe(false);
      expect(isInCity(0, 0, "جدة")).toBe(false);
    });
  });

  describe("Address format for geocoding", () => {
    it("should build correct address with district and city", () => {
      const parts: string[] = [];
      const district = "النرجس";
      const city = "الرياض";
      if (district) parts.push(district);
      parts.push(city);
      parts.push("المملكة العربية السعودية");
      const addr = parts.join(", ");
      expect(addr).toBe("النرجس, الرياض, المملكة العربية السعودية");
    });

    it("should build correct address with only city", () => {
      const parts: string[] = [];
      const district = null;
      const city = "جدة";
      if (district) parts.push(district);
      parts.push(city);
      parts.push("المملكة العربية السعودية");
      const addr = parts.join(", ");
      expect(addr).toBe("جدة, المملكة العربية السعودية");
    });

    it("should build correct address with full address field", () => {
      const parts: string[] = [];
      const address = "شارع الملك فهد، حي النرجس";
      const district = "النرجس";
      const city = "الرياض";
      if (address) parts.push(address);
      else if (district) parts.push(district);
      parts.push(city);
      parts.push("المملكة العربية السعودية");
      const addr = parts.join(", ");
      expect(addr).toBe("شارع الملك فهد، حي النرجس, الرياض, المملكة العربية السعودية");
    });
  });

  describe("Map center computation", () => {
    it("should use property coordinates when available", () => {
      const property = { latitude: "24.8343", longitude: "46.6792", city: "الرياض" };
      const lat = property.latitude ? parseFloat(property.latitude) : 24.7136;
      const lng = property.longitude ? parseFloat(property.longitude) : 46.6753;
      expect(lat).toBeCloseTo(24.8343, 4);
      expect(lng).toBeCloseTo(46.6792, 4);
    });

    it("should fall back to city center when no coordinates", () => {
      const defaultCoords: Record<string, { lat: number; lng: number }> = {
        "الرياض": { lat: 24.7136, lng: 46.6753 },
        "جدة": { lat: 21.4858, lng: 39.1925 },
      };
      const property = { latitude: null, longitude: null, city: "جدة" };
      const cityCoords = defaultCoords[property.city || "الرياض"] || { lat: 24.7136, lng: 46.6753 };
      const lat = property.latitude ? parseFloat(property.latitude) : cityCoords.lat;
      const lng = property.longitude ? parseFloat(property.longitude) : cityCoords.lng;
      expect(lat).toBeCloseTo(21.4858, 4);
      expect(lng).toBeCloseTo(39.1925, 4);
    });

    it("should fall back to Riyadh for unknown city", () => {
      const defaultCoords: Record<string, { lat: number; lng: number }> = {
        "الرياض": { lat: 24.7136, lng: 46.6753 },
      };
      const property = { latitude: null, longitude: null, city: "مدينة غير معروفة" };
      const cityCoords = defaultCoords[property.city || "الرياض"] || { lat: 24.7136, lng: 46.6753 };
      expect(cityCoords.lat).toBeCloseTo(24.7136, 4);
      expect(cityCoords.lng).toBeCloseTo(46.6753, 4);
    });
  });

  describe("Price formatting", () => {
    it("should format price correctly", () => {
      const formatPrice = (p: string | null) => {
        if (!p) return null;
        const num = parseFloat(p);
        if (isNaN(num)) return null;
        return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
      };
      expect(formatPrice("1500000")).toBe("1,500,000");
      expect(formatPrice("750000.50")).toBe("750,001");
      expect(formatPrice(null)).toBeNull();
      expect(formatPrice("abc")).toBeNull();
    });
  });
});
