import { describe, expect, it, vi, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create a mock context (no customer cookie)
function createPublicContext(): { ctx: TrpcContext; cookies: Record<string, any>; clearedCookies: string[] } {
  const cookies: Record<string, any> = {};
  const clearedCookies: string[] = [];
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as any,
    res: {
      cookie: (name: string, value: string, options: any) => {
        cookies[name] = { value, options };
      },
      clearCookie: (name: string, options: any) => {
        clearedCookies.push(name);
        delete cookies[name];
      },
    } as any,
  };
  return { ctx, cookies, clearedCookies };
}

// Helper to create context with a cookie header
function createContextWithCookie(cookieString: string): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {
        cookie: cookieString,
      },
      ip: "127.0.0.1",
    } as any,
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any,
  };
}

const caller = (ctx: TrpcContext) => appRouter.createCaller(ctx);

describe("Customer Authentication", () => {
  // ============ SEND OTP ============
  describe("sendOTP", () => {
    it("should reject empty phone number", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.sendOTP({ phone: "", purpose: "register" })
      ).rejects.toThrow();
    });

    it("should accept valid phone for registration", async () => {
      const { ctx } = createPublicContext();
      // This will either succeed (sending OTP) or fail with "phone already registered"
      // Both are valid outcomes - we're testing the endpoint accepts the input
      try {
        const result = await caller(ctx).customer.sendOTP({ phone: "0500000001", purpose: "register" });
        expect(result.success).toBe(true);
      } catch (err: any) {
        // CONFLICT means phone already registered, TOO_MANY_REQUESTS means rate limited - both valid
        expect(["CONFLICT", "TOO_MANY_REQUESTS"]).toContain(err.code);
      }
    });

    it("should reject login OTP for unregistered phone", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.sendOTP({ phone: "0599999999", purpose: "login" })
      ).rejects.toThrow();
    });
  });

  // ============ REGISTER ============
  describe("verifyOTPAndRegister", () => {
    it("should reject registration with invalid OTP code", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.verifyOTPAndRegister({
          phone: "0500000002",
          code: "000000",
          name: "Test User",
          password: "password123",
        })
      ).rejects.toThrow();
    });

    it("should reject registration with short password", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.verifyOTPAndRegister({
          phone: "0500000003",
          code: "123456",
          name: "Test User",
          password: "12345", // too short
        })
      ).rejects.toThrow();
    });

    it("should reject registration without name", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.verifyOTPAndRegister({
          phone: "0500000004",
          code: "123456",
          name: "", // empty name
          password: "password123",
        })
      ).rejects.toThrow();
    });
  });

  // ============ LOGIN ============
  describe("login", () => {
    it("should reject login with wrong phone", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.login({ phone: "0599888777", password: "wrongpassword" })
      ).rejects.toThrow();
    });

    it("should reject login with empty password", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.login({ phone: "0500000001", password: "" })
      ).rejects.toThrow();
    });
  });

  // ============ ME (Get Current Customer) ============
  describe("me", () => {
    it("should return null for unauthenticated request", async () => {
      const { ctx } = createPublicContext();
      const result = await caller(ctx).customer.me();
      expect(result).toBeNull();
    });

    it("should return null for invalid cookie", async () => {
      const ctx = createContextWithCookie("customer_session=invalid_token_here");
      const result = await caller(ctx).customer.me();
      expect(result).toBeNull();
    });
  });

  // ============ LOGOUT ============
  describe("logout", () => {
    it("should clear the customer session cookie", async () => {
      const { ctx, clearedCookies } = createPublicContext();
      const result = await caller(ctx).customer.logout();
      expect(result.success).toBe(true);
      expect(clearedCookies).toContain("customer_session");
    });
  });

  // ============ UPDATE PROFILE ============
  describe("updateProfile", () => {
    it("should reject unauthenticated profile update", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.updateProfile({ name: "New Name" })
      ).rejects.toThrow();
    });
  });

  // ============ CHANGE PASSWORD ============
  describe("changePassword", () => {
    it("should reject unauthenticated password change", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.changePassword({ currentPassword: "old", newPassword: "newpass123" })
      ).rejects.toThrow();
    });

    it("should reject short new password", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.changePassword({ currentPassword: "old", newPassword: "12345" })
      ).rejects.toThrow();
    });
  });
});

describe("Customer Favorites", () => {
  // ============ GET FAVORITES ============
  describe("getFavorites", () => {
    it("should return empty array for unauthenticated user", async () => {
      const { ctx } = createPublicContext();
      const result = await caller(ctx).customer.getFavorites();
      expect(result).toEqual([]);
    });
  });

  // ============ TOGGLE FAVORITE ============
  describe("toggleFavorite", () => {
    it("should reject unauthenticated toggle", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.toggleFavorite({ propertyId: 1 })
      ).rejects.toThrow();
    });

    it("should reject invalid property ID", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.toggleFavorite({ propertyId: -1 })
      ).rejects.toThrow();
    });

    it("should reject zero property ID", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.toggleFavorite({ propertyId: 0 })
      ).rejects.toThrow();
    });
  });

  // ============ SYNC FAVORITES ============
  describe("syncFavorites", () => {
    it("should reject unauthenticated sync", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.syncFavorites({ propertyIds: [1, 2, 3] })
      ).rejects.toThrow();
    });
  });

  // ============ CLEAR FAVORITES ============
  describe("clearFavorites", () => {
    it("should reject unauthenticated clear", async () => {
      const { ctx } = createPublicContext();
      await expect(
        caller(ctx).customer.clearFavorites()
      ).rejects.toThrow();
    });
  });
});

describe("Search Properties Count", () => {
  it("should return a count number for empty filters", async () => {
    const { ctx } = createPublicContext();
    const result = await caller(ctx).public.searchPropertiesCount({});
    expect(typeof result.count).toBe("number");
    expect(result.count).toBeGreaterThanOrEqual(0);
  });

  it("should return count for type filter", async () => {
    const { ctx } = createPublicContext();
    const result = await caller(ctx).public.searchPropertiesCount({ type: "villa" });
    expect(typeof result.count).toBe("number");
  });

  it("should return count for listing filter", async () => {
    const { ctx } = createPublicContext();
    const result = await caller(ctx).public.searchPropertiesCount({ listing: "sale" });
    expect(typeof result.count).toBe("number");
  });

  it("should return count for price range filter", async () => {
    const { ctx } = createPublicContext();
    const result = await caller(ctx).public.searchPropertiesCount({ minPrice: 100000, maxPrice: 5000000 });
    expect(typeof result.count).toBe("number");
  });

  it("should return count for amenities filter", async () => {
    const { ctx } = createPublicContext();
    const result = await caller(ctx).public.searchPropertiesCount({ amenityIds: [1, 2] });
    expect(typeof result.count).toBe("number");
  });
});
