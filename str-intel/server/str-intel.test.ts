import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// Mock DB module — all exported functions
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getUserById: vi.fn(),
  getUserByUsername: vi.fn().mockResolvedValue({
    id: 99, username: "testadmin", passwordHash: "$2a$12$fakehash", name: "Test Admin",
    displayName: "Admin", email: "admin@cobnb.sa", mobile: null, role: "admin",
    isActive: true, lastLoginIp: null, lastSignedIn: new Date(), createdAt: new Date(), updatedAt: new Date(),
    openId: null, loginMethod: null,
  }),
  updateUserLogin: vi.fn().mockResolvedValue(undefined),
  createUser: vi.fn().mockResolvedValue({
    id: 10, username: "newuser", name: "New User", displayName: "New", email: "new@cobnb.sa",
    mobile: null, role: "viewer", isActive: true,
  }),
  resetUserPassword: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  insertAuditLog: vi.fn().mockResolvedValue(undefined),
  getAuditLogs: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, action: "scrape_trigger", target: "airbnb", ipAddress: "127.0.0.1", createdAt: new Date() },
    { id: 2, userId: 1, action: "role_change", target: "user:2", metadata: { newRole: "admin" }, ipAddress: "127.0.0.1", createdAt: new Date() },
    { id: 3, userId: 1, action: "user_create", target: "user:newuser", metadata: { role: "viewer" }, ipAddress: "127.0.0.1", createdAt: new Date() },
  ]),
  getAllUsers: vi.fn().mockResolvedValue([
    { id: 1, username: "admin", name: "Admin User", displayName: "Admin", email: "admin@cobnb.sa", role: "admin", isActive: true, lastSignedIn: new Date(), createdAt: new Date() },
    { id: 2, username: "analyst", name: "Regular User", displayName: "Analyst", email: "user@cobnb.sa", role: "user", isActive: true, lastSignedIn: new Date(), createdAt: new Date() },
    { id: 3, username: "viewer1", name: "Viewer User", displayName: "Viewer", email: "viewer@cobnb.sa", role: "viewer", isActive: true, lastSignedIn: new Date(), createdAt: new Date() },
  ]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  deactivateUser: vi.fn().mockResolvedValue(undefined),
  activateUser: vi.fn().mockResolvedValue(undefined),
  getDashboardSummary: vi.fn().mockResolvedValue({
    totalListings: 214, avgRating: "4.22", avgAdr: 765, avgOccupancy: "66.2", avgRevpar: 504,
    newListingsThisWeek: 23, competitorCount: 12,
    otaDistribution: [{ otaSourceId: 1, count: 80 }, { otaSourceId: 2, count: 70 }],
    propertyTypeDistribution: [{ propertyType: "1br", count: 60 }, { propertyType: "2br", count: 50 }],
    hostTypeDistribution: [{ hostType: "individual", count: 120 }, { hostType: "property_manager", count: 94 }],
    lastScrapeJob: { completedAt: new Date() },
    neighborhoodMetrics: [{ neighborhoodId: 1, adr: "800", occupancyRate: "70", revpar: "560", totalListings: 30, newListings: 3 }],
  }),
  getSupplyGrowth: vi.fn().mockResolvedValue([
    { neighborhoodId: 1, metricDate: new Date(), totalListings: 30, newListings: 3 },
  ]),
  getNeighborhoods: vi.fn().mockResolvedValue([
    { id: 1, name: "Al Olaya", nameAr: "العليا", slug: "al-olaya", city: "Riyadh", isActive: true },
    { id: 2, name: "Hittin", nameAr: "حطين", slug: "hittin", city: "Riyadh", isActive: true },
  ]),
  getNeighborhoodDetail: vi.fn().mockResolvedValue({
    neighborhood: { id: 1, name: "Al Olaya", slug: "al-olaya" },
    latestMetrics: { adr: "800", occupancyRate: "70", revpar: "560", totalListings: 30 },
    propertyTypeMetrics: [{ propertyType: "1br", adr: "600", occupancyRate: "75", revpar: "450" }],
    listingStats: { count: 30, avgRating: 4.3 },
    topHosts: [{ hostId: "h1", hostName: "Test Host", hostType: "property_manager", count: 5, avgRating: 4.5 }],
  }),
  getNeighborhoodMetrics: vi.fn().mockResolvedValue([
    { metricDate: new Date(), adr: "800", occupancyRate: "70", revpar: "560", totalListings: 30 },
  ]),
  getListings: vi.fn().mockResolvedValue({
    items: [{ id: 1, title: "Test Listing", neighborhoodId: 1, propertyType: "1br", otaSourceId: 1, hostType: "individual", rating: "4.5", reviewCount: 10, photoCount: 8, isSuperhost: false }],
    total: 1,
  }),
  getAdrTrends: vi.fn().mockResolvedValue([
    { metricDate: new Date(), neighborhoodId: 1, adr: "800", occupancyRate: "70", revpar: "560", dataConfidence: "real" },
  ]),
  getPriceDistribution: vi.fn().mockResolvedValue([
    { propertyType: "1br", nightlyRate: "600", neighborhoodId: 1 },
  ]),
  getSeasonalPatterns: vi.fn().mockResolvedValue([
    { id: 1, name: "Riyadh Season", seasonType: "peak", startDate: "10-01", endDate: "03-31", avgPriceMultiplier: "1.80" },
  ]),
  getCompetitors: vi.fn().mockResolvedValue([
    { id: 1, hostId: "h1", hostName: "Test PM", portfolioSize: 15, avgRating: "4.3", avgNightlyRate: "800", totalReviews: 120, isSuperhost: true },
  ]),
  getCompetitorDetail: vi.fn().mockResolvedValue({
    competitor: { id: 1, hostId: "h1", hostName: "Test PM", portfolioSize: 15 },
    listings: [{ id: 1, title: "Test Listing" }],
  }),
  getOtaSources: vi.fn().mockResolvedValue([
    { id: 1, name: "Airbnb", slug: "airbnb", baseUrl: "https://airbnb.com", isActive: true },
    { id: 2, name: "Booking.com", slug: "booking", baseUrl: "https://booking.com", isActive: true },
  ]),
  getScrapeJobs: vi.fn().mockResolvedValue([
    { id: 1, otaSourceId: 1, status: "completed", startedAt: new Date(), completedAt: new Date(), listingsFound: 50, errors: 0, jobType: "full_scan", duration: 45000 },
  ]),
  getScrapeSchedules: vi.fn().mockResolvedValue([]),
  getExportData: vi.fn().mockResolvedValue([
    { metricDate: new Date(), neighborhoodId: 1, propertyType: "all", adr: "800", occupancyRate: "70", revpar: "560", totalListings: 30, newListings: 3 },
  ]),
  getNeighborhoodBySlug: vi.fn(),
}));

// Mock scraper orchestrator
vi.mock("./scrapers/orchestrator", () => ({
  getOrchestrator: vi.fn().mockReturnValue({
    runScrapeJob: vi.fn().mockResolvedValue({
      totalListings: 50, totalErrors: 0, duration: 30000, jobs: [],
    }),
  }),
}));

// Mock excel export
vi.mock("./excel-export", () => ({
  generateExcelReport: vi.fn().mockResolvedValue(Buffer.from("mock-excel-data")),
}));

// Mock scheduler
vi.mock("./scheduler", () => ({
  getScheduler: vi.fn().mockReturnValue({
    getStatus: vi.fn().mockReturnValue({
      isRunning: false, frequency: null, lastRunAt: null, nextRunAt: null, totalRuns: 0, lastRunResult: null,
    }),
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

// Mock notifications module
vi.mock("./notifications", () => ({
  getNotifications: vi.fn().mockReturnValue([
    { id: "notif_1", type: "info", title: "User Login", message: "Admin logged in from IP 127.0.0.1", category: "login", timestamp: new Date(), read: false },
    { id: "notif_2", type: "success", title: "Scrape Job Completed", message: "Found 50 listings in 30s. No errors.", category: "scrape", timestamp: new Date(), read: true },
  ]),
  getUnreadCount: vi.fn().mockReturnValue(1),
  markAsRead: vi.fn().mockReturnValue(true),
  markAllAsRead: vi.fn().mockReturnValue(2),
  notifyNewLogin: vi.fn(),
  notifySuspiciousActivity: vi.fn(),
  notifyScrapeComplete: vi.fn(),
  notifyScrapeFailure: vi.fn(),
  notifySchedulerChange: vi.fn(),
  notifyExport: vi.fn(),
  notifyUserAction: vi.fn(),
  addNotification: vi.fn(),
}));

// Mock report generator
vi.mock("./report-generator", () => ({
  generatePitchReport: vi.fn().mockResolvedValue({
    html: "<html><body>CoBNB Report</body></html>",
    title: "Property Acquisition Analysis: Al Olaya",
    neighborhood: "Al Olaya",
    generatedAt: new Date().toISOString(),
  }),
}));

// ─── Context Helpers ───

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(role: "viewer" | "user" | "admin" = "user", id = 1): TrpcContext {
  return {
    user: {
      id,
      username: `test-${role}`,
      name: `Test ${role}`,
      displayName: `${role.charAt(0).toUpperCase() + role.slice(1)}`,
      email: `${role}@cobnb.sa`,
      mobile: null,
      role,
      isActive: true,
      lastLoginIp: null,
      lastSignedIn: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      openId: null,
      loginMethod: null,
    },
    req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ═══════════════════════════════════════════════════════════════
// SECURITY: All data routes require authentication
// ═══════════════════════════════════════════════════════════════

describe("Security: Protected Routes", () => {
  it("rejects unauthenticated access to dashboard.summary", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.dashboard.summary()).rejects.toThrow();
  });

  it("rejects unauthenticated access to neighborhoods.list", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.neighborhoods.list()).rejects.toThrow();
  });

  it("rejects unauthenticated access to listings.list", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.listings.list({})).rejects.toThrow();
  });

  it("rejects unauthenticated access to metrics.adrTrends", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.metrics.adrTrends({})).rejects.toThrow();
  });

  it("rejects unauthenticated access to competitors.list", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.competitors.list({})).rejects.toThrow();
  });

  it("rejects unauthenticated access to export.data", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.export.data({})).rejects.toThrow();
  });

  it("rejects unauthenticated access to scrapeJobs.list", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.scrapeJobs.list({})).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// SECURITY: Admin-only routes
// ═══════════════════════════════════════════════════════════════

describe("Security: Admin-only Routes", () => {
  it("rejects non-admin access to scrapeJobs.trigger", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.scrapeJobs.trigger({ otaSlugs: ["airbnb"] })).rejects.toThrow();
  });

  it("rejects viewer access to scrapeJobs.trigger", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    await expect(caller.scrapeJobs.trigger({ otaSlugs: ["airbnb"] })).rejects.toThrow();
  });

  it("allows admin access to scrapeJobs.trigger", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.scrapeJobs.trigger({ otaSlugs: ["airbnb"], jobType: "full_scan" });
    expect(result.started).toBe(true);
  });

  it("rejects non-admin access to scheduler.start", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.scheduler.start({ frequency: "weekly" })).rejects.toThrow();
  });

  it("rejects non-admin access to scheduler.stop", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.scheduler.stop()).rejects.toThrow();
  });

  it("allows admin access to scheduler.start", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.scheduler.start({ frequency: "weekly" });
    expect(result.started).toBe(true);
    expect(result.frequency).toBe("weekly");
  });

  it("allows admin access to scheduler.stop", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.scheduler.stop();
    expect(result.stopped).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// SECURITY: Export role restriction (viewer cannot export)
// ═══════════════════════════════════════════════════════════════

describe("Security: Export Role Restriction", () => {
  it("rejects viewer access to export.data", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    await expect(caller.export.data({})).rejects.toThrow(/Viewers cannot export/);
  });

  it("rejects viewer access to export.excel", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    await expect(caller.export.excel({})).rejects.toThrow(/Viewers cannot export/);
  });

  it("allows user access to export.data", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    const result = await caller.export.data({});
    expect(result).toHaveLength(1);
  });

  it("allows admin access to export.excel", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.export.excel({ includeMetrics: true });
    expect(result).toBeDefined();
    expect(result.mimeType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  });
});

// ═══════════════════════════════════════════════════════════════
// Dashboard API (authenticated)
// ═══════════════════════════════════════════════════════════════

describe("Dashboard API", () => {
  it("returns dashboard summary with all KPIs for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.dashboard.summary();
    expect(result).toBeDefined();
    expect(result?.totalListings).toBe(214);
    expect(result?.avgAdr).toBe(765);
    expect(result?.avgOccupancy).toBe("66.2");
    expect(result?.avgRevpar).toBe(504);
    expect(result?.competitorCount).toBe(12);
    expect(result?.newListingsThisWeek).toBe(23);
  });

  it("returns supply growth data", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.dashboard.supplyGrowth();
    expect(result).toHaveLength(1);
    expect(result[0].totalListings).toBe(30);
  });
});

// ═══════════════════════════════════════════════════════════════
// Neighborhoods API
// ═══════════════════════════════════════════════════════════════

describe("Neighborhoods API", () => {
  it("lists all active neighborhoods", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.neighborhoods.list();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Al Olaya");
  });

  it("returns neighborhood detail with metrics", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.neighborhoods.detail({ id: 1 });
    expect(result?.neighborhood.name).toBe("Al Olaya");
    expect(result?.latestMetrics?.adr).toBe("800");
    expect(result?.topHosts).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// Listings API
// ═══════════════════════════════════════════════════════════════

describe("Listings API", () => {
  it("returns paginated listings", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.listings.list({ page: 1, limit: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].title).toBe("Test Listing");
  });
});

// ═══════════════════════════════════════════════════════════════
// Competitors API
// ═══════════════════════════════════════════════════════════════

describe("Competitors API", () => {
  it("lists competitors sorted by portfolio size", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.competitors.list({});
    expect(result).toHaveLength(1);
    expect(result[0].hostName).toBe("Test PM");
    expect(result[0].portfolioSize).toBe(15);
  });

  it("returns competitor detail with listings", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.competitors.detail({ hostId: "h1" });
    expect(result?.competitor.hostName).toBe("Test PM");
    expect(result?.listings).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// Admin: User Management (CRUD)
// ═══════════════════════════════════════════════════════════════

describe("Admin: User Management", () => {
  it("lists all users for admin", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.admin.users.list();
    expect(result).toHaveLength(3);
    expect(result[0].username).toBe("admin");
    expect(result[1].role).toBe("user");
    expect(result[2].role).toBe("viewer");
  });

  it("rejects non-admin access to user list", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.admin.users.list()).rejects.toThrow();
  });

  it("rejects viewer access to user list", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    await expect(caller.admin.users.list()).rejects.toThrow();
  });

  it("creates a new user", async () => {
    // Mock getUserByUsername to return null (no existing user) for the create check
    const db = await import("./db");
    (db.getUserByUsername as any).mockResolvedValueOnce(null);

    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.admin.users.create({
      username: "newanalyst",
      password: "SecurePass123!",
      name: "New Analyst",
      displayName: "Analyst",
      email: "analyst@cobnb.sa",
      role: "user",
    });
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
  });

  it("rejects creating a user with duplicate username", async () => {
    // getUserByUsername returns a user (already exists)
    const caller = appRouter.createCaller(createUserContext("admin"));
    await expect(
      caller.admin.users.create({
        username: "testadmin",
        password: "SecurePass123!",
        name: "Duplicate",
      })
    ).rejects.toThrow(/Username already exists/);
  });

  it("rejects non-admin from creating users", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(
      caller.admin.users.create({
        username: "newuser",
        password: "SecurePass123!",
        name: "New User",
      })
    ).rejects.toThrow();
  });

  it("updates user role", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.admin.users.updateRole({ userId: 2, role: "admin" });
    expect(result.success).toBe(true);
  });

  it("prevents admin from changing own role", async () => {
    const caller = appRouter.createCaller(createUserContext("admin", 1));
    await expect(caller.admin.users.updateRole({ userId: 1, role: "user" })).rejects.toThrow(/cannot change your own role/);
  });

  it("resets a user password", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.admin.users.resetPassword({ userId: 2, newPassword: "NewSecure123!" });
    expect(result.success).toBe(true);
  });

  it("rejects non-admin from resetting passwords", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(
      caller.admin.users.resetPassword({ userId: 2, newPassword: "NewSecure123!" })
    ).rejects.toThrow();
  });

  it("rejects short passwords on reset", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    await expect(
      caller.admin.users.resetPassword({ userId: 2, newPassword: "short" })
    ).rejects.toThrow();
  });

  it("deactivates a user", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.admin.users.deactivate({ userId: 2 });
    expect(result.success).toBe(true);
  });

  it("prevents admin from deactivating self", async () => {
    const caller = appRouter.createCaller(createUserContext("admin", 1));
    await expect(caller.admin.users.deactivate({ userId: 1 })).rejects.toThrow(/cannot deactivate yourself/);
  });

  it("activates a user", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.admin.users.activate({ userId: 3 });
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Admin: Audit Log
// ═══════════════════════════════════════════════════════════════

describe("Admin: Audit Log", () => {
  it("returns audit logs for admin", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.admin.auditLog({ limit: 50 });
    expect(result).toHaveLength(3);
    expect(result[0].action).toBe("scrape_trigger");
    expect(result[1].action).toBe("role_change");
    expect(result[2].action).toBe("user_create");
  });

  it("rejects non-admin access to audit log", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.admin.auditLog({ limit: 50 })).rejects.toThrow();
  });

  it("rejects viewer access to audit log", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    await expect(caller.admin.auditLog({ limit: 50 })).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// Auth: me / logout
// ═══════════════════════════════════════════════════════════════

describe("Auth", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user with all fields for authenticated context", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test admin");
    expect(result?.role).toBe("admin");
    expect(result?.username).toBe("test-admin");
    expect(result?.displayName).toBe("Admin");
  });

  it("returns viewer user correctly", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.auth.me();
    expect(result?.role).toBe("viewer");
  });

  it("clears session cookie on logout", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
// Metrics & Seasonal
// ═══════════════════════════════════════════════════════════════

describe("Metrics API", () => {
  it("returns ADR trends with data confidence", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.metrics.adrTrends({});
    expect(result).toHaveLength(1);
    expect(result[0].adr).toBe("800");
    expect(result[0].dataConfidence).toBe("real");
  });

  it("returns seasonal patterns", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.metrics.seasonal();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Riyadh Season");
    expect(result[0].seasonType).toBe("peak");
  });

  it("returns price distribution", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.metrics.priceDistribution({});
    expect(result).toHaveLength(1);
    expect(result[0].propertyType).toBe("1br");
  });
});

// ═══════════════════════════════════════════════════════════════
// OTA Sources & Scrape Jobs
// ═══════════════════════════════════════════════════════════════

describe("OTA Sources & Scrape Jobs", () => {
  it("lists OTA sources", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.otaSources.list();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Airbnb");
  });

  it("lists scrape jobs", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.scrapeJobs.list({ limit: 10 });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("completed");
    expect(result[0].listingsFound).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════
// Notifications API
// ═══════════════════════════════════════════════════════════════

describe("Notifications API", () => {
  it("returns notifications for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.notifications.list({ limit: 20 });
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("User Login");
    expect(result[1].category).toBe("scrape");
  });

  it("returns unread count", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.notifications.unreadCount();
    expect(result.count).toBe(1);
  });

  it("marks a notification as read", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.notifications.markRead({ notificationId: "notif_1" });
    expect(result.success).toBe(true);
  });

  it("marks all notifications as read", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.notifications.markAllRead();
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
  });

  it("rejects unauthenticated access to notifications", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.notifications.list({ limit: 10 })).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// Change Password
// ═══════════════════════════════════════════════════════════════

describe("Auth: Change Password", () => {
  it("rejects unauthenticated change password", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.changePassword({ currentPassword: "old", newPassword: "newpassword123" })
    ).rejects.toThrow();
  });

  it("rejects short new password", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(
      caller.auth.changePassword({ currentPassword: "old", newPassword: "short" })
    ).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// Report Generation
// ═══════════════════════════════════════════════════════════════

describe("Reports API", () => {
  it("generates a pitch report for user role", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    const result = await caller.reports.generatePitch({
      neighborhoodId: 1,
      includeCompetitors: true,
      includeSeasonalPatterns: true,
      includePropertyBreakdown: true,
    });
    expect(result.html).toContain("CoBNB Report");
    expect(result.title).toContain("Al Olaya");
    expect(result.neighborhood).toBe("Al Olaya");
  });

  it("generates a pitch report for admin role", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.reports.generatePitch({
      neighborhoodId: 1,
    });
    expect(result.html).toBeDefined();
    expect(result.generatedAt).toBeDefined();
  });

  it("rejects viewer from generating reports", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    await expect(
      caller.reports.generatePitch({ neighborhoodId: 1 })
    ).rejects.toThrow(/Viewers cannot export/);
  });

  it("rejects unauthenticated report generation", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.reports.generatePitch({ neighborhoodId: 1 })
    ).rejects.toThrow();
  });

  it("logs report generation in audit log", async () => {
    const dbMod = await import("./db");
    (dbMod.insertAuditLog as any).mockClear();
    const caller = appRouter.createCaller(createUserContext("admin"));
    await caller.reports.generatePitch({ neighborhoodId: 1 });
    expect(dbMod.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "report_generate",
        target: "neighborhood:1",
      })
    );
  });
});
