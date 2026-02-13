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
    propertyTypeMetrics: [
      { propertyType: "1br", adr: "600", occupancyRate: "75", revpar: "450" },
    ],
    listingStats: { count: 30, avgRating: 4.3 },
    topHosts: [
      { hostId: "h1", hostName: "Test Host", hostType: "property_manager", count: 5, avgRating: 4.5 },
    ],
  }),
  getNeighborhoodMetrics: vi.fn().mockResolvedValue([
    { metricDate: new Date(), adr: "800", occupancyRate: "70", revpar: "560", totalListings: 30 },
  ]),
  getListings: vi.fn().mockResolvedValue({
    items: [
      { id: 1, title: "Test Listing", neighborhoodId: 1, propertyType: "1br", otaSourceId: 1, hostType: "individual", rating: "4.5", reviewCount: 10, photoCount: 8, isSuperhost: false },
    ],
    total: 1,
  }),
  getAdrTrends: vi.fn().mockResolvedValue([
    { metricDate: new Date(), neighborhoodId: 1, adr: "800", occupancyRate: "70", revpar: "560" },
  ]),
  getPriceDistribution: vi.fn().mockResolvedValue([
    { propertyType: "1br", nightlyRate: "600", neighborhoodId: 1 },
  ]),
  getSeasonalPatterns: vi.fn().mockResolvedValue([
    { id: 1, name: "Riyadh Season", seasonType: "peak", startDate: "10-01", endDate: "03-31", avgPriceMultiplier: "1.80", description: "Peak season" },
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
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@cobnb.sa",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Dashboard API", () => {
  it("returns dashboard summary with all KPIs", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dashboard.summary();
    expect(result).toBeDefined();
    expect(result?.totalListings).toBe(214);
    expect(result?.avgAdr).toBe(765);
    expect(result?.avgOccupancy).toBe("66.2");
    expect(result?.avgRevpar).toBe(504);
    expect(result?.competitorCount).toBe(12);
    expect(result?.newListingsThisWeek).toBe(23);
    expect(result?.otaDistribution).toHaveLength(2);
    expect(result?.propertyTypeDistribution).toHaveLength(2);
    expect(result?.hostTypeDistribution).toHaveLength(2);
    expect(result?.neighborhoodMetrics).toHaveLength(1);
  });

  it("returns supply growth data", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dashboard.supplyGrowth();
    expect(result).toHaveLength(1);
    expect(result[0].totalListings).toBe(30);
    expect(result[0].newListings).toBe(3);
  });
});

describe("Neighborhoods API", () => {
  it("lists all active neighborhoods", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.neighborhoods.list();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Al Olaya");
    expect(result[1].name).toBe("Hittin");
  });

  it("returns neighborhood detail with metrics and top hosts", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.neighborhoods.detail({ id: 1 });
    expect(result).toBeDefined();
    expect(result?.neighborhood.name).toBe("Al Olaya");
    expect(result?.latestMetrics?.adr).toBe("800");
    expect(result?.topHosts).toHaveLength(1);
    expect(result?.topHosts[0].hostName).toBe("Test Host");
  });

  it("returns neighborhood metrics with optional property type filter", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.neighborhoods.metrics({ neighborhoodId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].adr).toBe("800");
  });
});

describe("Listings API", () => {
  it("returns paginated listings with filters", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.listings.list({ page: 1, limit: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].title).toBe("Test Listing");
  });

  it("accepts neighborhood and property type filters", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.listings.list({
      neighborhoodId: 1,
      propertyType: "1br",
      page: 1,
    });
    expect(result).toBeDefined();
    expect(result.items).toBeDefined();
  });
});

describe("Metrics API", () => {
  it("returns ADR trends", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.metrics.adrTrends({});
    expect(result).toHaveLength(1);
    expect(result[0].adr).toBe("800");
  });

  it("returns price distribution", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.metrics.priceDistribution({});
    expect(result).toHaveLength(1);
  });

  it("returns seasonal patterns", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.metrics.seasonal();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Riyadh Season");
    expect(result[0].seasonType).toBe("peak");
  });
});

describe("Competitors API", () => {
  it("lists competitors sorted by portfolio size", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.competitors.list({});
    expect(result).toHaveLength(1);
    expect(result[0].hostName).toBe("Test PM");
    expect(result[0].portfolioSize).toBe(15);
    expect(result[0].isSuperhost).toBe(true);
  });

  it("returns competitor detail with listings", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.competitors.detail({ hostId: "h1" });
    expect(result).toBeDefined();
    expect(result?.competitor.hostName).toBe("Test PM");
    expect(result?.listings).toHaveLength(1);
  });
});

describe("OTA Sources API", () => {
  it("lists all OTA sources", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.otaSources.list();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Airbnb");
    expect(result[1].name).toBe("Booking.com");
  });
});

describe("Scrape Jobs API", () => {
  it("lists recent scrape jobs with job type and duration", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.scrapeJobs.list({});
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("completed");
    expect(result[0].listingsFound).toBe(50);
    expect(result[0].jobType).toBe("full_scan");
    expect(result[0].duration).toBe(45000);
  });

  it("triggers a scrape job for authenticated users", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.scrapeJobs.trigger({
      otaSlugs: ["airbnb"],
      neighborhoodSlugs: ["al-olaya"],
      jobType: "full_scan",
    });
    expect(result.started).toBe(true);
    expect(result.message).toContain("Scrape job started");
  });

  it("rejects scrape trigger for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.scrapeJobs.trigger({ otaSlugs: ["airbnb"] })
    ).rejects.toThrow();
  });
});

describe("Export API", () => {
  it("returns export data with filters", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.export.data({});
    expect(result).toHaveLength(1);
    expect(result[0].adr).toBe("800");
    expect(result[0].neighborhoodId).toBe(1);
  });

  it("accepts date range and neighborhood filters", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.export.data({
      neighborhoodIds: [1, 2],
      dateFrom: "2025-01-01",
      dateTo: "2025-12-31",
    });
    expect(result).toBeDefined();
  });

  it("generates Excel report with base64 encoded data", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.export.excel({
      includeListings: true,
      includeMetrics: true,
      includeCompetitors: true,
      includeSeasonalPatterns: true,
      includePriceSnapshots: true,
    });
    expect(result).toBeDefined();
    expect(result.filename).toMatch(/STR_Intelligence_Riyadh_.*\.xlsx/);
    expect(result.mimeType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(result.data).toBeTruthy();
    // Verify it's valid base64
    const decoded = Buffer.from(result.data, "base64");
    expect(decoded.length).toBeGreaterThan(0);
  });

  it("generates Excel report with selective sheets", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.export.excel({
      includeListings: false,
      includeMetrics: true,
      includeCompetitors: false,
    });
    expect(result).toBeDefined();
    expect(result.filename).toContain(".xlsx");
  });
});

describe("Scheduler API", () => {
  it("returns scheduler status for authenticated users", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.scheduler.status();
    expect(result).toBeDefined();
    expect(result.isRunning).toBe(false);
    expect(result.totalRuns).toBe(0);
  });

  it("starts scheduler with specified frequency", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.scheduler.start({ frequency: "weekly" });
    expect(result.started).toBe(true);
    expect(result.frequency).toBe("weekly");
  });

  it("starts scheduler with default weekly frequency", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.scheduler.start({});
    expect(result.started).toBe(true);
    expect(result.frequency).toBe("weekly");
  });

  it("stops scheduler for authenticated users", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.scheduler.stop();
    expect(result.stopped).toBe(true);
  });

  it("rejects scheduler access for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.scheduler.status()).rejects.toThrow();
  });

  it("rejects scheduler start for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.scheduler.start({ frequency: "daily" })).rejects.toThrow();
  });
});

describe("Auth", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated context", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test User");
    expect(result?.role).toBe("admin");
  });

  it("clears session cookie on logout", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});
