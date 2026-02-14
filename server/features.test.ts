import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME, SESSION_EXPIRY_MS } from "../shared/const";
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
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
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

function createProtectedContext(userId = 2) {
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

// ============ FORGOT PASSWORD TESTS ============
describe("Forgot Password Flow", () => {
  it("requestPasswordReset requires a valid email format", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.requestPasswordReset({ email: "not-an-email" })
    ).rejects.toThrow();
  });

  it("requestPasswordReset returns success even for non-existent email (prevents enumeration)", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.requestPasswordReset({
      email: "nonexistent-random-test-user@example.com",
    });

    expect(result.success).toBe(true);
    expect(result.message).toBeTruthy();
  });

  it("verifyResetToken returns invalid for a bogus token", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.verifyResetToken({
      token: "bogus-token-that-does-not-exist",
    });

    expect(result.valid).toBe(false);
  });

  it("resetPassword rejects with invalid/expired token", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.resetPassword({
        token: "invalid-token-xyz",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      })
    ).rejects.toThrow();
  });

  it("resetPassword rejects when passwords don't match", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.resetPassword({
        token: "some-token",
        newPassword: "password1",
        confirmPassword: "password2",
      })
    ).rejects.toThrow();
  });

  it("resetPassword rejects short passwords", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.resetPassword({
        token: "some-token",
        newPassword: "12345",
        confirmPassword: "12345",
      })
    ).rejects.toThrow();
  });
});

// ============ SESSION MANAGEMENT TESTS ============
describe("Session Management", () => {
  it("listSessions returns sessions array for authenticated user", async () => {
    const { ctx } = createProtectedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.listSessions();

    expect(result).toHaveProperty("sessions");
    expect(Array.isArray(result.sessions)).toBe(true);
  });

  it("revokeSession rejects non-existent session", async () => {
    const { ctx } = createProtectedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.revokeSession({ sessionId: 999999 })
    ).rejects.toThrow();
  });

  it("revokeAllOtherSessions succeeds for authenticated user", async () => {
    const { ctx } = createProtectedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.revokeAllOtherSessions();
    expect(result.success).toBe(true);
  });
});

// ============ USER MANAGEMENT TESTS ============
describe("Enhanced User Management", () => {
  it("createUserWithCredentials requires admin role", async () => {
    const { ctx } = createProtectedContext(); // staff role
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.createUserWithCredentials({
        fullName: "Test User",
        username: "testuser123",
        password: "password123",
        email: "test-new@example.com",
        role: "staff",
      })
    ).rejects.toThrow(); // Should throw FORBIDDEN
  });

  it("createUserWithCredentials validates minimum password length", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.createUserWithCredentials({
        fullName: "Test User",
        username: "testuser123",
        password: "12345", // too short
        email: "test-new@example.com",
        role: "staff",
      })
    ).rejects.toThrow();
  });

  it("createUserWithCredentials validates email format", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.createUserWithCredentials({
        fullName: "Test User",
        username: "testuser123",
        password: "password123",
        email: "not-an-email",
        role: "staff",
      })
    ).rejects.toThrow();
  });

  it("adminResetUserPassword requires admin role", async () => {
    const { ctx } = createProtectedContext(); // staff role
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.adminResetUserPassword({
        userId: 1,
        newPassword: "newpassword123",
      })
    ).rejects.toThrow();
  });

  it("adminResetUserPassword validates minimum password length", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.adminResetUserPassword({
        userId: 1,
        newPassword: "123", // too short
      })
    ).rejects.toThrow();
  });

  it("deleteUser requires admin role", async () => {
    const { ctx } = createProtectedContext(); // staff role
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.deleteUser({ userId: 999 })
    ).rejects.toThrow();
  });

  it("deleteUser prevents self-deletion", async () => {
    const { ctx } = createAdminContext(1);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.deleteUser({ userId: 1 })
    ).rejects.toThrow(/لا يمكنك حذف حسابك الخاص/);
  });

  it("deleteUser rejects non-existent user", async () => {
    const { ctx } = createAdminContext(1);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.deleteUser({ userId: 999999 })
    ).rejects.toThrow();
  });
});
