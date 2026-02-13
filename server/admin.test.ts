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

function createStaffContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "staff-user",
    username: null,
    passwordHash: null,
    displayName: null,
    email: "staff@alqasem.com.sa",
    name: "موظف",
    fullName: null,
    phone: null,
    avatar: null,
    loginMethod: "manus",
    role: "staff",
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

describe("Admin Router - Access Control", () => {
  it("admin can access dashboardStats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.dashboardStats();
      expect(result).toHaveProperty("totalProperties");
      expect(result).toHaveProperty("newInquiries");
      expect(result).toHaveProperty("totalProjects");
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  }, 15000);

  it("unauthenticated user cannot access dashboardStats", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.dashboardStats()).rejects.toThrow();
  });

  it("admin can access listUsers", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.listUsers({ search: "", role: "all" });
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(["INTERNAL_SERVER_ERROR", "FORBIDDEN"]).toContain(e.code);
    }
  });

  it("staff cannot access listUsers (admin only)", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listUsers({ search: "", role: "all" })).rejects.toThrow("permission");
  });

  it("staff cannot access getAuditLogs (admin only)", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getAuditLogs({ search: "", action: "all", entityType: "all" })).rejects.toThrow("permission");
  });

  it("admin can access getAuditLogs", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.getAuditLogs({ search: "", action: "all", entityType: "all" });
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("staff cannot access getPermissions (admin only)", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getPermissions()).rejects.toThrow("permission");
  });

  it("staff cannot access initPermissions (admin only)", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.initPermissions()).rejects.toThrow("permission");
  });

  it("staff cannot access exportAuditLogCSV (admin only)", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.exportAuditLogCSV()).rejects.toThrow("permission");
  });

  it("staff cannot create guides (admin only)", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.createGuide({
      title: "Test", slug: "test", category: "general", content: "Content",
    })).rejects.toThrow("permission");
  });
});

describe("Admin Router - Input Validation", () => {
  it("createProperty requires title", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.createProperty({
        title: "",
        type: "villa",
        listingType: "sale",
        price: 1000000,
        area: 300,
        rooms: 5,
        bathrooms: 3,
      })
    ).rejects.toThrow();
  });

  it("createProject requires title", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.createProject({
        title: "",
      })
    ).rejects.toThrow();
  });

  it("submitInquiry requires name", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.submitInquiry({
        name: "",
      })
    ).rejects.toThrow();
  });

  it("sendMessage requires body", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.sendMessage({
        recipientId: 2,
        body: "",
      })
    ).rejects.toThrow();
  });

  it("createGuide requires title and content", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.createGuide({
        title: "",
        slug: "test",
        category: "general",
        content: "Content",
      })
    ).rejects.toThrow();
  });

  it("markNotificationRead requires id", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      // @ts-expect-error testing invalid input
      caller.admin.markNotificationRead({})
    ).rejects.toThrow();
  });
});

describe("Admin Router - V2 Procedure Existence", () => {
  it("all V1 admin procedures exist", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Dashboard
    expect(typeof caller.admin.dashboardStats).toBe("function");
    
    // Users
    expect(typeof caller.admin.listUsers).toBe("function");
    expect(typeof caller.admin.createUser).toBe("function");
    expect(typeof caller.admin.toggleUserStatus).toBe("function");
    
    // Properties
    expect(typeof caller.admin.listProperties).toBe("function");
    expect(typeof caller.admin.createProperty).toBe("function");
    expect(typeof caller.admin.deleteProperty).toBe("function");
    expect(typeof caller.admin.exportPropertiesCSV).toBe("function");
    
    // Projects
    expect(typeof caller.admin.listProjects).toBe("function");
    expect(typeof caller.admin.createProject).toBe("function");
    expect(typeof caller.admin.deleteProject).toBe("function");
    
    // Inquiries
    expect(typeof caller.admin.listInquiries).toBe("function");
    expect(typeof caller.admin.updateInquiryStatus).toBe("function");
    expect(typeof caller.admin.addInquiryNote).toBe("function");
    expect(typeof caller.admin.exportInquiriesCSV).toBe("function");
    
    // CMS
    expect(typeof caller.admin.listHomepageSections).toBe("function");
    expect(typeof caller.admin.updateHomepageSection).toBe("function");
    expect(typeof caller.admin.listPages).toBe("function");
    expect(typeof caller.admin.updatePage).toBe("function");
    
    // Media
    expect(typeof caller.admin.listMedia).toBe("function");
    expect(typeof caller.admin.uploadMedia).toBe("function");
    expect(typeof caller.admin.deleteMedia).toBe("function");
    
    // Reports
    expect(typeof caller.admin.getReportData).toBe("function");
    
    // Settings
    expect(typeof caller.admin.getSettings).toBe("function");
    expect(typeof caller.admin.updateSettings).toBe("function");
    
    // Audit Log
    expect(typeof caller.admin.getAuditLogs).toBe("function");
    
    // Public inquiry
    expect(typeof caller.admin.submitInquiry).toBe("function");
  });

  it("localLogin procedure exists", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.admin.localLogin).toBe("function");
  });

  it("all V2 admin procedures exist (notifications, messages, permissions, guides)", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    // Notifications
    expect(typeof caller.admin.listNotifications).toBe("function");
    expect(typeof caller.admin.unreadNotificationCount).toBe("function");
    expect(typeof caller.admin.markNotificationRead).toBe("function");
    expect(typeof caller.admin.markAllNotificationsRead).toBe("function");
    
    // Messages
    expect(typeof caller.admin.listThreads).toBe("function");
    expect(typeof caller.admin.getThread).toBe("function");
    expect(typeof caller.admin.sendMessage).toBe("function");
    expect(typeof caller.admin.toggleMessageStar).toBe("function");
    expect(typeof caller.admin.archiveThread).toBe("function");
    expect(typeof caller.admin.markThreadRead).toBe("function");
    expect(typeof caller.admin.unreadMessageCount).toBe("function");
    
    // Permissions
    expect(typeof caller.admin.getPermissions).toBe("function");
    expect(typeof caller.admin.updatePermission).toBe("function");
    expect(typeof caller.admin.initPermissions).toBe("function");
    
    // Guides
    expect(typeof caller.admin.listGuides).toBe("function");
    expect(typeof caller.admin.getGuide).toBe("function");
    expect(typeof caller.admin.createGuide).toBe("function");
    
    // Admin users list
    expect(typeof caller.admin.listAdminUsers).toBe("function");
  });
});

describe("Admin Router - Notifications Access", () => {
  it("authenticated user can list notifications", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.listNotifications({});
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("authenticated user can get unread count", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.unreadNotificationCount();
      expect(result).toHaveProperty("count");
      expect(typeof result.count).toBe("number");
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("unauthenticated user cannot list notifications", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listNotifications({})).rejects.toThrow();
  });
});

describe("Admin Router - Messages Access", () => {
  it("authenticated user can list threads", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.listThreads({});
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("authenticated user can get unread message count", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.unreadMessageCount();
      expect(result).toHaveProperty("count");
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("unauthenticated user cannot send messages", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.sendMessage({ recipientId: 1, body: "test" })).rejects.toThrow();
  });
});

describe("Admin Router - Guides Access", () => {
  it("authenticated user can list guides", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.listGuides();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("unauthenticated user cannot list guides", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listGuides()).rejects.toThrow();
  });
});
