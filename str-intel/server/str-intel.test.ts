import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// Mock DB module
vi.mock("./db", () => ({
  getDashboardSummary: vi.fn().mockResolvedValue({
    totalListings: 214,
    avgRating: "4.22",
    avgAdr: 765,
    avgOccupancy: "66.2",
    avgRevpar: 504,
    newListingsThisWeek: 23,
    competitorCount: 12,
    otaDistribution: [
      { otaSourceId: 1, count: 80 },
      { otaSourceId: 2, count: 70 },
    ],
    propertyTypeDistribution: [
      { propertyType: "1br", count: 60 },
      { propertyType: "2br", count: 50 },
    ],
    hostTypeDistribution: [
      { hostType: "individual", count: 120 },
      { hostType: "property_manager", count: 94 },
    ],
    lastScrapeJob: { completedAt: new Date() },
    neighborhoodMetrics: [
      { neighborhoodId: 1, adr: "800", occupancyRate: "70", revpar: "560", totalListings: 30, newListings: 3 },
    ],
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
  getExportData: vi.fn().mockResolvedValue([
    { metricDate: new Date(), neighborhoodId: 1, propertyType: "all", adr: "800", occupancyRate: "70", revpar: "560", totalListings: 30, newListings: 3 },
  ]),
  getAllUsers: vi.fn().mockResolvedValue([
    { id: 1, openId: "user1", name: "Admin User", email: "admin@cobnb.sa", role: "admin", isActive: true, lastSignedIn: new Date(), createdAt: new Date() },
    { id: 2, openId: "user2", name: "Regular User", email: "user@cobnb.sa", role: "user", isActive: true, lastSignedIn: new Date(), createdAt: new Date() },
    { id: 3, openId: "user3", name: "Viewer User", email: "viewer@cobnb.sa", role: "viewer", isActive: true, lastSignedIn: new Date(), createdAt: new Date() },
  ]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  deactivateUser: vi.fn().mockResolvedValue(undefined),
  activateUser: vi.fn().mockResolvedValue(undefined),
  getAuditLogs: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, action: "scrape_trigger", target: "airbnb", ipAddress: "127.0.0.1", createdAt: new Date() },
    { id: 2, userId: 1, action: "role_change", target: "user:2", metadata: { newRole: "admin" }, ipAddress: "127.0.0.1", createdAt: new Date() },
  ]),
  insertAuditLog: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

// Mock scraper orchestrator
vi.mock("./scrapers/orchestrator", () => ({
  getOrchestrator: vi.fn().mockReturnValue({
    runScrapeJob: vi.fn().mockResolvedValue({
      totalListings: 50,
      totalErrors: 0,
      duration: 30000,
      jobs: [],
    }),
  }),
}));

// Mock excel export
vi.mock("./excel-export", () => ({
  generateExcelReport: vi.fn().mockResolvedValue(Buffer.from("mock-excel-data")),
}));

// Mock scheduler
vi.mock("./scheduler", () => {
  const mockScheduler = {
    getStatus: vi.fn().mockReturnValue({
      isRunning: false,
      frequency: null,
      lastRunAt: null,
      nextRunAt: null,
      totalRuns: 0,
      lastRunResult: null,
    }),
    start: vi.fn(),
    stop: vi.fn(),
  };
  return {
    getScheduler: vi.fn().mockReturnValue(mockScheduler),
  };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(role: "viewer" | "user" | "admin" = "user", id = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: `test-${role}`,
    email: `${role}@cobnb.sa`,
    name: `Test ${role}`,
    loginMethod: "manus",
    role,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── SECURITY: All data routes require authentication ───
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

// ─── SECURITY: Admin-only routes ───
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

// ─── SECURITY: Export role restriction (viewer cannot export) ───
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
    expect(result.filename).toMatch(/CoBNB_Market_Intelligence_Riyadh_.*\.xlsx/);
    expect(result.mimeType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  });
});

// ─── Dashboard API (authenticated) ───
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

// ─── Neighborhoods API ───
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

// ─── Listings API ───
describe("Listings API", () => {
  it("returns paginated listings", async () => {
    const caller = appRouter.createCaller(createUserContext("viewer"));
    const result = await caller.listings.list({ page: 1, limit: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].title).toBe("Test Listing");
  });
});

// ─── Competitors API ───
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

// ─── Admin: User Management ───
describe("Admin: User Management", () => {
  it("lists all users for admin", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.admin.users.list();
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("Admin User");
    expect(result[1].role).toBe("user");
    expect(result[2].role).toBe("viewer");
  });

  it("rejects non-admin access to user list", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.admin.users.list()).rejects.toThrow();
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

// ─── Admin: Audit Log ───
describe("Admin: Audit Log", () => {
  it("returns audit logs for admin", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.admin.auditLog({ limit: 50 });
    expect(result).toHaveLength(2);
    expect(result[0].action).toBe("scrape_trigger");
    expect(result[1].action).toBe("role_change");
  });

  it("rejects non-admin access to audit log", async () => {
    const caller = appRouter.createCaller(createUserContext("user"));
    await expect(caller.admin.auditLog({ limit: 50 })).rejects.toThrow();
  });
});

// ─── Auth ───
describe("Auth", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated context", async () => {
    const caller = appRouter.createCaller(createUserContext("admin"));
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test admin");
    expect(result?.role).toBe("admin");
  });

  it("clears session cookie on logout", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});
