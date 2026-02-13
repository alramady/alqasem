import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean, bigint, index } from "drizzle-orm/mysql-core";

// ─── Users (from template) ───
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["viewer", "user", "admin"]).default("user").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Audit Log ───
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 128 }).notNull(),
  target: varchar("target", { length: 256 }),
  metadata: json("metadata"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_audit_user").on(table.userId),
  index("idx_audit_action").on(table.action),
  index("idx_audit_created").on(table.createdAt),
]);

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLogEntry = typeof auditLog.$inferInsert;

// ─── Neighborhoods ───
export const neighborhoods = mysqlTable("neighborhoods", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  nameAr: varchar("nameAr", { length: 128 }),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  city: varchar("city", { length: 64 }).notNull().default("Riyadh"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  boundingBox: json("boundingBox"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Neighborhood = typeof neighborhoods.$inferSelect;
export type InsertNeighborhood = typeof neighborhoods.$inferInsert;

// ─── OTA Sources ───
export const otaSources = mysqlTable("ota_sources", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  baseUrl: varchar("baseUrl", { length: 256 }),
  isActive: boolean("isActive").default(true).notNull(),
  scraperConfig: json("scraperConfig"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OtaSource = typeof otaSources.$inferSelect;

// ─── Listings ───
export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 128 }).notNull(),
  otaSourceId: int("otaSourceId").notNull(),
  neighborhoodId: int("neighborhoodId"),
  title: text("title"),
  url: varchar("url", { length: 512 }),
  propertyType: mysqlEnum("propertyType", ["studio", "1br", "2br", "3br", "4br_plus"]).default("1br"),
  hostType: mysqlEnum("hostType", ["individual", "property_manager"]).default("individual"),
  hostName: varchar("hostName", { length: 256 }),
  hostId: varchar("hostId", { length: 128 }),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  maxGuests: int("maxGuests"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: int("reviewCount").default(0),
  photoCount: int("photoCount").default(0),
  amenities: json("amenities"),
  isSuperhost: boolean("isSuperhost").default(false),
  responseRate: int("responseRate"),
  instantBook: boolean("instantBook").default(false),
  firstSeen: timestamp("firstSeen").defaultNow().notNull(),
  lastSeen: timestamp("lastSeen").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_listings_ota").on(table.otaSourceId),
  index("idx_listings_neighborhood").on(table.neighborhoodId),
  index("idx_listings_external").on(table.externalId, table.otaSourceId),
  index("idx_listings_host").on(table.hostId),
  index("idx_listings_property_type").on(table.propertyType),
]);

export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;

// ─── Price Snapshots ───
export const priceSnapshots = mysqlTable("price_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  snapshotDate: timestamp("snapshotDate").notNull(),
  nightlyRate: decimal("nightlyRate", { precision: 10, scale: 2 }),
  weeklyRate: decimal("weeklyRate", { precision: 10, scale: 2 }),
  monthlyRate: decimal("monthlyRate", { precision: 10, scale: 2 }),
  cleaningFee: decimal("cleaningFee", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 8 }).default("SAR"),
  availableDays: int("availableDays"),
  blockedDays: int("blockedDays"),
  bookedDays: int("bookedDays"),
  scrapeJobId: int("scrapeJobId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_price_listing").on(table.listingId),
  index("idx_price_date").on(table.snapshotDate),
  index("idx_price_job").on(table.scrapeJobId),
]);

export type PriceSnapshot = typeof priceSnapshots.$inferSelect;
export type InsertPriceSnapshot = typeof priceSnapshots.$inferInsert;

// ─── Metrics (pre-calculated) ───
export const metrics = mysqlTable("metrics", {
  id: int("id").autoincrement().primaryKey(),
  neighborhoodId: int("neighborhoodId").notNull(),
  propertyType: mysqlEnum("propertyType", ["studio", "1br", "2br", "3br", "4br_plus", "all"]).default("all"),
  metricDate: timestamp("metricDate").notNull(),
  period: mysqlEnum("period", ["daily", "weekly", "monthly"]).default("daily"),
  adr: decimal("adr", { precision: 10, scale: 2 }),
  adr30: decimal("adr30", { precision: 10, scale: 2 }),
  adr60: decimal("adr60", { precision: 10, scale: 2 }),
  adr90: decimal("adr90", { precision: 10, scale: 2 }),
  occupancyRate: decimal("occupancyRate", { precision: 5, scale: 2 }),
  revpar: decimal("revpar", { precision: 10, scale: 2 }),
  totalListings: int("totalListings").default(0),
  newListings: int("newListings").default(0),
  avgRating: decimal("avgRating", { precision: 3, scale: 2 }),
  medianPrice: decimal("medianPrice", { precision: 10, scale: 2 }),
  priceP25: decimal("priceP25", { precision: 10, scale: 2 }),
  priceP75: decimal("priceP75", { precision: 10, scale: 2 }),
  dataConfidence: mysqlEnum("dataConfidence", ["real", "estimated", "default"]).default("estimated"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_metrics_neighborhood").on(table.neighborhoodId),
  index("idx_metrics_date").on(table.metricDate),
  index("idx_metrics_type").on(table.propertyType),
]);

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = typeof metrics.$inferInsert;

// ─── Competitors (property managers with 5+ listings) ───
export const competitors = mysqlTable("competitors", {
  id: int("id").autoincrement().primaryKey(),
  hostId: varchar("hostId", { length: 128 }).notNull(),
  hostName: varchar("hostName", { length: 256 }),
  otaSourceId: int("otaSourceId"),
  portfolioSize: int("portfolioSize").default(0),
  avgRating: decimal("avgRating", { precision: 3, scale: 2 }),
  avgNightlyRate: decimal("avgNightlyRate", { precision: 10, scale: 2 }),
  totalReviews: int("totalReviews").default(0),
  neighborhoods: json("neighborhoods"),
  propertyTypes: json("propertyTypes"),
  isSuperhost: boolean("isSuperhost").default(false),
  firstDetected: timestamp("firstDetected").defaultNow().notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_competitors_host").on(table.hostId),
  index("idx_competitors_portfolio").on(table.portfolioSize),
]);

export type Competitor = typeof competitors.$inferSelect;
export type InsertCompetitor = typeof competitors.$inferInsert;

// ─── Scrape Jobs ───
export const scrapeJobs = mysqlTable("scrape_jobs", {
  id: int("id").autoincrement().primaryKey(),
  otaSourceId: int("otaSourceId"),
  neighborhoodId: int("neighborhoodId"),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "cancelled"]).default("pending"),
  jobType: mysqlEnum("jobType", ["full_scan", "price_update", "calendar_check", "review_scan"]).default("full_scan"),
  listingsFound: int("listingsFound").default(0),
  listingsUpdated: int("listingsUpdated").default(0),
  priceSnapshots: int("priceSnapshots").default(0),
  errors: int("errors").default(0),
  errorLog: text("errorLog"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  duration: int("duration"),
  triggeredBy: int("triggeredBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_jobs_status").on(table.status),
  index("idx_jobs_ota").on(table.otaSourceId),
]);

export type ScrapeJob = typeof scrapeJobs.$inferSelect;
export type InsertScrapeJob = typeof scrapeJobs.$inferInsert;

// ─── Seasonal Patterns ───
export const seasonalPatterns = mysqlTable("seasonal_patterns", {
  id: int("id").autoincrement().primaryKey(),
  neighborhoodId: int("neighborhoodId"),
  seasonType: mysqlEnum("seasonType", ["peak", "high", "low", "event"]).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  startDate: varchar("startDate", { length: 10 }),
  endDate: varchar("endDate", { length: 10 }),
  avgPriceMultiplier: decimal("avgPriceMultiplier", { precision: 4, scale: 2 }),
  description: text("description"),
  year: int("year"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SeasonalPattern = typeof seasonalPatterns.$inferSelect;
export type InsertSeasonalPattern = typeof seasonalPatterns.$inferInsert;

// ─── Scrape Schedules ───
export const scrapeSchedules = mysqlTable("scrape_schedules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  otaSourceId: int("otaSourceId"),
  neighborhoodId: int("neighborhoodId"),
  frequency: mysqlEnum("frequency", ["daily", "weekly", "biweekly", "monthly"]).default("weekly"),
  jobType: mysqlEnum("jobType", ["full_scan", "price_update", "calendar_check", "review_scan"]).default("full_scan"),
  isActive: boolean("isActive").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScrapeSchedule = typeof scrapeSchedules.$inferSelect;
export type InsertScrapeSchedule = typeof scrapeSchedules.$inferInsert;

// ─── Reports ───
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  reportType: mysqlEnum("reportType", ["weekly", "biweekly", "monthly", "custom"]).default("weekly"),
  periodStart: timestamp("periodStart"),
  periodEnd: timestamp("periodEnd"),
  summary: text("summary"),
  data: json("data"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
