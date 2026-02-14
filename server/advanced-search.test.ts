import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { amenities } from "../drizzle/schema";
import { sql } from "drizzle-orm";

// Create a public caller (no user context)
const publicCtx: TrpcContext = { user: null, setCookie: () => {}, getCookie: () => undefined, origin: "http://localhost:3000" };
const publicCaller = appRouter.createCaller(publicCtx);

describe("Advanced Search & Filter Backend", () => {
  // ============ SCHEMA VALIDATION ============
  describe("Schema - New Columns Exist", () => {
    it("should have bathrooms, floor, direction, furnishing, building_age columns", async () => {
      const db = await getDb();
      expect(db).toBeTruthy();
      const result = await db!.execute(
        sql`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'properties' AND COLUMN_NAME IN ('bathrooms', 'floor', 'direction', 'furnishing', 'buildingAge')`
      );
      const rows = (result as any)[0] || result;
      const columnNames = rows.map((r: any) => r.COLUMN_NAME);
      expect(columnNames).toContain("bathrooms");
      expect(columnNames).toContain("floor");
      expect(columnNames).toContain("direction");
      expect(columnNames).toContain("furnishing");
      expect(columnNames).toContain("buildingAge");
    });
  });

  // ============ AMENITIES TABLE ============
  describe("Amenities Table", () => {
    it("should have seeded amenities with AR/EN names and categories", async () => {
      const db = await getDb();
      expect(db).toBeTruthy();
      const result = await db!.select().from(amenities);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].nameAr).toBeTruthy();
      expect(result[0].nameEn).toBeTruthy();
      expect(result[0].category).toBeTruthy();
    });

    it("should have property_amenities junction table", async () => {
      const db = await getDb();
      const result = await db!.execute(
        sql`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'property_amenities'`
      );
      const rows = (result as any)[0] || result;
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  // ============ PUBLIC API - getAmenities ============
  describe("Public API - getAmenities", () => {
    it("should return list of amenities via tRPC", async () => {
      const result = await publicCaller.public.getAmenities();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("nameAr");
      expect(result[0]).toHaveProperty("nameEn");
      expect(result[0]).toHaveProperty("category");
    });
  });

  // ============ SEARCH WITH NEW FILTERS ============
  describe("searchProperties with advanced filters", () => {
    it("should accept minBathrooms filter", async () => {
      const result = await publicCaller.public.searchProperties({
        minBathrooms: 2,
        limit: 5,
      });
      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should accept direction filter", async () => {
      const result = await publicCaller.public.searchProperties({
        direction: "north",
        limit: 5,
      });
      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should accept furnishing filter", async () => {
      const result = await publicCaller.public.searchProperties({
        furnishing: "furnished",
        limit: 5,
      });
      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should accept maxBuildingAge filter", async () => {
      const result = await publicCaller.public.searchProperties({
        maxBuildingAge: 10,
        limit: 5,
      });
      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should accept floor filter", async () => {
      const result = await publicCaller.public.searchProperties({
        floor: 3,
        limit: 5,
      });
      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should accept amenityIds filter", async () => {
      const result = await publicCaller.public.searchProperties({
        amenityIds: [1, 2],
        limit: 5,
      });
      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should accept multiple advanced filters combined", async () => {
      const result = await publicCaller.public.searchProperties({
        type: "apartment",
        minBathrooms: 1,
        direction: "north",
        furnishing: "furnished",
        limit: 5,
      });
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("should return total count with advanced filters", async () => {
      const result = await publicCaller.public.searchProperties({
        minBathrooms: 1,
        limit: 5,
      });
      expect(typeof result.total).toBe("number");
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it("should return 0 results for impossible filter combination", async () => {
      const result = await publicCaller.public.searchProperties({
        minBathrooms: 999,
        limit: 5,
      });
      expect(result.items.length).toBe(0);
      expect(result.total).toBe(0);
    });
  });
});
