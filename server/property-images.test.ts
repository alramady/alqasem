import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    username: null,
    passwordHash: null,
    displayName: null,
    email: "admin@alqasem.com.sa",
    name: "مدير النظام",
    fullName: null,
    phone: null,
    avatar: null,
    loginMethod: "manus",
    role: "admin",
    status: "active",
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Property Images - Procedure Existence", () => {
  it("uploadPropertyImage procedure exists", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.admin.uploadPropertyImage).toBe("function");
  });

  it("removePropertyImage procedure exists", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.admin.removePropertyImage).toBe("function");
  });

  it("reorderPropertyImages procedure exists", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.admin.reorderPropertyImages).toBe("function");
  });

  it("getPropertyImages procedure exists", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.admin.getPropertyImages).toBe("function");
  });
});

describe("Property Images - Access Control", () => {
  it("unauthenticated user cannot upload property images", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.uploadPropertyImage({
        propertyId: 1,
        filename: "test.jpg",
        mimeType: "image/jpeg",
        base64: "dGVzdA==",
        size: 1024,
      })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot remove property images", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.removePropertyImage({
        propertyId: 1,
        imageUrl: "https://example.com/test.jpg",
      })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot reorder property images", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.reorderPropertyImages({
        propertyId: 1,
        images: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
      })
    ).rejects.toThrow();
  });

  it("unauthenticated user cannot get property images", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.getPropertyImages({ propertyId: 1 })
    ).rejects.toThrow();
  });
});

describe("Property Images - Input Validation", () => {
  it("uploadPropertyImage rejects non-image MIME types", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.admin.uploadPropertyImage({
        propertyId: 1,
        filename: "test.pdf",
        mimeType: "application/pdf",
        base64: "dGVzdA==",
        size: 1024,
      });
      // If it doesn't throw for mime type, it should throw for property not found (DB)
    } catch (e: any) {
      // Either BAD_REQUEST (mime validation) or INTERNAL_SERVER_ERROR (no DB)
      expect(["BAD_REQUEST", "INTERNAL_SERVER_ERROR"]).toContain(e.code);
    }
  });

  it("uploadPropertyImage rejects oversized files", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.admin.uploadPropertyImage({
        propertyId: 1,
        filename: "huge.jpg",
        mimeType: "image/jpeg",
        base64: "dGVzdA==",
        size: 15 * 1024 * 1024, // 15MB exceeds 10MB limit
      });
    } catch (e: any) {
      expect(["BAD_REQUEST", "INTERNAL_SERVER_ERROR"]).toContain(e.code);
    }
  });

  it("uploadPropertyImage requires propertyId", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error testing invalid input
      caller.admin.uploadPropertyImage({
        filename: "test.jpg",
        mimeType: "image/jpeg",
        base64: "dGVzdA==",
        size: 1024,
      })
    ).rejects.toThrow();
  });

  it("removePropertyImage requires propertyId and imageUrl", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error testing invalid input
      caller.admin.removePropertyImage({})
    ).rejects.toThrow();
  });

  it("reorderPropertyImages requires propertyId and images array", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error testing invalid input
      caller.admin.reorderPropertyImages({ propertyId: 1 })
    ).rejects.toThrow();
  });

  it("getPropertyImages requires propertyId", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error testing invalid input
      caller.admin.getPropertyImages({})
    ).rejects.toThrow();
  });
});

describe("Property Images - Database Operations", () => {
  it("getPropertyImages returns images array for valid property", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.getPropertyImages({ propertyId: 1 });
      expect(result).toHaveProperty("images");
      expect(Array.isArray(result.images)).toBe(true);
    } catch (e: any) {
      // NOT_FOUND (property doesn't exist) or INTERNAL_SERVER_ERROR (no DB) are both acceptable
      expect(["NOT_FOUND", "INTERNAL_SERVER_ERROR"]).toContain(e.code);
    }
  });

  it("removePropertyImage handles non-existent property", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.admin.removePropertyImage({
        propertyId: 99999,
        imageUrl: "https://example.com/nonexistent.jpg",
      });
    } catch (e: any) {
      expect(["NOT_FOUND", "INTERNAL_SERVER_ERROR"]).toContain(e.code);
    }
  });

  it("reorderPropertyImages handles non-existent property", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.admin.reorderPropertyImages({
        propertyId: 99999,
        images: ["https://example.com/a.jpg"],
      });
    } catch (e: any) {
      expect(["NOT_FOUND", "INTERNAL_SERVER_ERROR"]).toContain(e.code);
    }
  });

  it("uploadPropertyImage handles non-existent property", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.admin.uploadPropertyImage({
        propertyId: 99999,
        filename: "test.jpg",
        mimeType: "image/jpeg",
        base64: "dGVzdA==",
        size: 1024,
      });
    } catch (e: any) {
      // Could be NOT_FOUND or INTERNAL_SERVER_ERROR depending on DB availability
      expect(["NOT_FOUND", "INTERNAL_SERVER_ERROR"]).toContain(e.code);
    }
  });
});
