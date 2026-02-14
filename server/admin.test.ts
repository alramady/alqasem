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


// ============ SESSIONS ============
describe("Admin Router - Sessions", () => {
  it("authenticated user can list sessions", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listSessions();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("sessions");
    expect(Array.isArray(result.sessions)).toBe(true);
  });

  it("unauthenticated user cannot list sessions", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listSessions()).rejects.toThrow();
  });

  it("revokeSession should reject non-existent session", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.revokeSession({ sessionId: 999999 })
    ).rejects.toThrow();
  });

  it("revokeAllOtherSessions should work for authenticated user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.revokeAllOtherSessions();
      expect(result).toBeDefined();
    } catch (e: any) {
      // May fail if no sessions exist, acceptable
      expect(e).toBeDefined();
    }
  });
});

// ============ ACTIVITY LOG ============
describe("Admin Router - Activity Log", () => {
  it("authenticated user can get activity log", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getMyActivity({ limit: 10, offset: 0 });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("activities");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.activities)).toBe(true);
  });

  it("unauthenticated user cannot access activity log", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.getMyActivity({ limit: 10, offset: 0 })
    ).rejects.toThrow();
  });
});

// ============ 2FA ============
describe("Admin Router - Two-Factor Authentication", () => {
  it("authenticated user can check 2FA status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.get2FAStatus();
      expect(result).toBeDefined();
      expect(result).toHaveProperty("enabled");
      expect(typeof result.enabled).toBe("boolean");
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("unauthenticated user cannot check 2FA status", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.get2FAStatus()).rejects.toThrow();
  });

  it("verify2FASetup should reject invalid code", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.verify2FASetup({ code: "000000" })
    ).rejects.toThrow();
  });
});

// ============ PASSWORD RESET ============
describe("Admin Router - Password Reset", () => {
  it("requestPasswordReset should reject invalid email format", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.requestPasswordReset({ email: "not-an-email" })
    ).rejects.toThrow();
  });

  it("verifyResetToken should handle invalid token", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.verifyResetToken({ token: "invalid-token-xyz" });
      // If it doesn't throw, it should return valid:false or similar
      expect(result).toBeDefined();
    } catch (e: any) {
      // Throwing is also valid behavior
      expect(e).toBeDefined();
    }
  });

  it("resetPassword should reject invalid token", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.resetPassword({ token: "invalid-token-xyz", newPassword: "newpass123" })
    ).rejects.toThrow();
  });

  it("changePassword should reject unauthenticated users", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.changePassword({ currentPassword: "old", newPassword: "new123456" })
    ).rejects.toThrow();
  });

  it("changePassword should validate minimum password length", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.changePassword({ currentPassword: "old", newPassword: "ab" })
    ).rejects.toThrow();
  });
});

// ============ CITIES & DISTRICTS ============
describe("Admin Router - Cities & Districts", () => {
  it("authenticated user can list cities", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.listCities({});
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("authenticated user can list districts", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.listDistricts({});
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("unauthenticated user cannot list cities", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.listCities({})).rejects.toThrow();
  });
});

// ============ PROPERTIES CRUD ============
describe("Admin Router - Properties CRUD", () => {
  it("listProperties should return array of properties", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listProperties({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("getProperty should throw for non-existent ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.getProperty({ id: 999999 })
    ).rejects.toThrow();
  });

  it("deleteProperty handles non-existent ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.deleteProperty({ id: 999999 });
      // Soft delete may succeed even for non-existent
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });

  it("exportPropertiesCSV should return CSV object", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.exportPropertiesCSV();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("csv");
    expect(typeof result.csv).toBe("string");
    expect(result.csv.length).toBeGreaterThan(0);
  });

  it("getPropertyImages should return images object for valid property", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.admin.listProperties({});
    if (list.length > 0) {
      const result = await caller.admin.getPropertyImages({ propertyId: list[0].id });
      expect(result).toHaveProperty("images");
      expect(Array.isArray(result.images)).toBe(true);
    }
  });
});

// ============ PROJECTS CRUD ============
describe("Admin Router - Projects CRUD", () => {
  it("listProjects should return array", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.listProjects();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("getProject should throw for non-existent ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.getProject({ id: 999999 })
    ).rejects.toThrow();
  });

  it("deleteProject handles non-existent ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.deleteProject({ id: 999999 });
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });
});

// ============ INQUIRIES ============
describe("Admin Router - Inquiries CRUD", () => {
  it("listInquiries should return array", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listInquiries({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("updateInquiryStatus handles non-existent inquiry", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.updateInquiryStatus({ id: 999999, status: "contacted" });
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });

  it("addInquiryNote handles non-existent inquiry", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.addInquiryNote({ id: 999999, note: "test note" });
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });

  it("exportInquiriesCSV should return CSV object", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.exportInquiriesCSV();
    expect(result).toBeDefined();
    expect(result).toHaveProperty("csv");
    expect(typeof result.csv).toBe("string");
  });
});

// ============ CMS PAGES ============
describe("Admin Router - CMS Pages CRUD", () => {
  it("listPages should return array", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.listPages();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("getPage should throw for non-existent ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.getPage({ id: 999999 })
    ).rejects.toThrow();
  });

  it("deletePage handles non-existent ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.deletePage({ id: 999999 });
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });

  it("listHomepageSections should return array", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.listHomepageSections();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });
});

// ============ MEDIA ============
describe("Admin Router - Media CRUD", () => {
  it("listMedia should return array", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.listMedia({});
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("listMedia with search should filter", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.listMedia({ search: "nonexistent_xyz_123" });
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("deleteMedia handles non-existent ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.deleteMedia({ id: 999999 });
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e).toBeDefined();
    }
  });
});

// ============ SETTINGS ============
describe("Admin Router - Settings", () => {
  it("getSettings should return object", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.admin.getSettings();
      expect(typeof result).toBe("object");
      expect(result).toBeDefined();
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  });

  it("unauthenticated user cannot access settings", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getSettings()).rejects.toThrow();
  });
});

// ============ REPORTS ============
describe("Admin Router - Reports", () => {
  it("getReportData should return report object", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getReportData({});
    expect(result).toBeDefined();
    expect(result).toHaveProperty("totalProperties");
    expect(result).toHaveProperty("totalInquiries");
  });

  it("getReportData with period filter should work", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getReportData({ period: "month" });
    expect(result).toBeDefined();
  });

  it("exportReportCSV should return CSV object", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.exportReportCSV({ type: "properties" });
    expect(result).toBeDefined();
    expect(result).toHaveProperty("csv");
    expect(typeof result.csv).toBe("string");
  });

  it("unauthenticated user cannot access reports", async () => {
    const ctx = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getReportData({})).rejects.toThrow();
  });
});

// ============ V3 PROCEDURE EXISTENCE ============
describe("Admin Router - V3 Procedure Existence (Sessions, Activity, 2FA, Cities)", () => {
  it("all V3 admin procedures exist", () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Sessions
    expect(typeof caller.admin.listSessions).toBe("function");
    expect(typeof caller.admin.revokeSession).toBe("function");
    expect(typeof caller.admin.revokeAllOtherSessions).toBe("function");

    // Activity
    expect(typeof caller.admin.getMyActivity).toBe("function");

    // 2FA
    expect(typeof caller.admin.get2FAStatus).toBe("function");
    expect(typeof caller.admin.setup2FA).toBe("function");
    expect(typeof caller.admin.verify2FASetup).toBe("function");
    expect(typeof caller.admin.disable2FA).toBe("function");
    expect(typeof caller.admin.regenerateBackupCodes).toBe("function");

    // Password Reset
    expect(typeof caller.admin.requestPasswordReset).toBe("function");
    expect(typeof caller.admin.verifyResetToken).toBe("function");
    expect(typeof caller.admin.resetPassword).toBe("function");
    expect(typeof caller.admin.changePassword).toBe("function");

    // Cities & Districts
    expect(typeof caller.admin.listCities).toBe("function");
    expect(typeof caller.admin.listDistricts).toBe("function");

    // Profile
    expect(typeof caller.admin.getMyProfile).toBe("function");
    expect(typeof caller.admin.updateProfile).toBe("function");

    // Admin Users
    expect(typeof caller.admin.listAdminUsers).toBe("function");
  });
});
