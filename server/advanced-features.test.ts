import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext() {
  const setCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      ip: "127.0.0.1",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        host: "localhost:3000",
      },
    } as any,
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: () => {},
    } as any,
  };
  return { ctx, setCookies };
}

function createAdminContext(userId = 1) {
  const setCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const user: AuthenticatedUser = {
    id: userId,
    openId: "local-admin-test",
    email: "admin@test.com",
    name: "Test Admin",
    loginMethod: "local",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      ip: "127.0.0.1",
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        host: "localhost:3000",
        cookie: `${COOKIE_NAME}=test-token-hash`,
      },
    } as any,
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: () => {},
    } as any,
  };
  return { ctx, setCookies };
}

function createStaffContext(userId = 2) {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "local-staff-test",
    email: "staff@test.com",
    name: "Test Staff",
    loginMethod: "local",
    role: "staff",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      ip: "127.0.0.1",
      headers: {
        "user-agent": "Mozilla/5.0",
        host: "localhost:3000",
        cookie: `${COOKIE_NAME}=test-token-staff`,
      },
    } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  };
  return { ctx };
}

// ============ TWO-FACTOR AUTHENTICATION TESTS ============
describe("Two-Factor Authentication (2FA)", () => {
  it("get2FAStatus returns status for authenticated user", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.get2FAStatus();
    expect(result).toHaveProperty("enabled");
    expect(typeof result.enabled).toBe("boolean");
    expect(result).toHaveProperty("backupCodesRemaining");
    expect(typeof result.backupCodesRemaining).toBe("number");
  });

  it("get2FAStatus requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.get2FAStatus()).rejects.toThrow();
  });

  it("setup2FA generates QR code and secret for authenticated user", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.setup2FA();
    expect(result).toHaveProperty("qrCodeDataUrl");
    expect(result).toHaveProperty("secret");
    expect(result.qrCodeDataUrl).toContain("data:image/png");
    expect(result.secret.length).toBeGreaterThan(10);
  });

  it("setup2FA requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.setup2FA()).rejects.toThrow();
  });

  it("verify2FASetup rejects invalid code", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First setup to get a pending secret
    await caller.admin.setup2FA();

    // Try to verify with wrong code
    await expect(
      caller.admin.verify2FASetup({ code: "000000" })
    ).rejects.toThrow();
  });

  it("verify2FASetup requires valid 6-digit code format", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.verify2FASetup({ code: "abc" })
    ).rejects.toThrow();
  });

  it("disable2FA requires password", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.disable2FA({ password: "" })
    ).rejects.toThrow();
  });

  it("disable2FA requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.disable2FA({ password: "test" })
    ).rejects.toThrow();
  });

  it("regenerateBackupCodes requires password", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.regenerateBackupCodes({ password: "" })
    ).rejects.toThrow();
  });

  it("regenerateBackupCodes requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.regenerateBackupCodes({ password: "test" })
    ).rejects.toThrow();
  });

  it("verify2FA rejects without valid twoFaToken", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.verify2FA({ twoFaToken: "invalid-token", totpCode: "123456" })
    ).rejects.toThrow();
  });
});

// ============ ACTIVITY DASHBOARD TESTS ============
describe("Activity Dashboard", () => {
  it("getAllActivity returns paginated results for admin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getAllActivity({ limit: 10, offset: 0 });
    expect(result).toHaveProperty("activities");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.activities)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("getAllActivity supports category filtering", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getAllActivity({
      limit: 10,
      offset: 0,
      category: "auth",
    });
    expect(result).toHaveProperty("activities");
    expect(Array.isArray(result.activities)).toBe(true);
  });

  it("getAllActivity supports user filtering", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getAllActivity({
      limit: 10,
      offset: 0,
      userId: 1,
    });
    expect(result).toHaveProperty("activities");
    expect(Array.isArray(result.activities)).toBe(true);
  });

  it("getAllActivity requires admin role", async () => {
    const { ctx } = createStaffContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.getAllActivity({ limit: 10, offset: 0 })
    ).rejects.toThrow();
  });

  it("getUserActivitySummary returns summary for admin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getUserActivitySummary({ userId: 1 });
    expect(result).toHaveProperty("totalActions");
    expect(result).toHaveProperty("recentSessions");
    expect(result).toHaveProperty("lastActive");
    expect(result).toHaveProperty("categoryCounts");
    expect(typeof result.totalActions).toBe("number");
  });

  it("getUserActivitySummary requires admin role", async () => {
    const { ctx } = createStaffContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.getUserActivitySummary({ userId: 1 })
    ).rejects.toThrow();
  });

  it("getUserActivity returns activities for specific user", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getUserActivity({ userId: 1, limit: 10 });
    expect(result).toHaveProperty("activities");
    expect(Array.isArray(result.activities)).toBe(true);
  });

  it("getUserLoginHistory returns login sessions for specific user", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getUserLoginHistory({ userId: 1, limit: 10 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getUserLoginHistory requires admin role", async () => {
    const { ctx } = createStaffContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.getUserLoginHistory({ userId: 1, limit: 10 })
    ).rejects.toThrow();
  });

  it("getUser returns user details for admin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // This might throw if user doesn't exist, but it should not throw permission error
    try {
      const result = await caller.admin.getUser({ id: 1 });
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("username");
    } catch (err: any) {
      // User might not exist in test DB, but should not be permission error
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });
});
