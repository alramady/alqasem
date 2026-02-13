import { eq, desc, sql, and, gte, lte, like, inArray, asc, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, neighborhoods, otaSources, listings, priceSnapshots, metrics, competitors, scrapeJobs, seasonalPatterns, scrapeSchedules, reports } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Neighborhoods ───
export async function getNeighborhoods() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(neighborhoods).where(eq(neighborhoods.isActive, true)).orderBy(asc(neighborhoods.name));
}

export async function getNeighborhoodBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(neighborhoods).where(eq(neighborhoods.slug, slug)).limit(1);
  return result[0] || null;
}

// ─── OTA Sources ───
export async function getOtaSources() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(otaSources).orderBy(asc(otaSources.name));
}

// ─── Dashboard Summary ───
export async function getDashboardSummary() {
  const db = await getDb();
  if (!db) return null;

  const [totalListings] = await db.select({ count: sql<number>`COUNT(*)` }).from(listings).where(eq(listings.isActive, true));
  const [avgRating] = await db.select({ avg: sql<number>`AVG(CAST(rating AS DECIMAL(3,2)))` }).from(listings).where(eq(listings.isActive, true));
  
  // Latest metrics across all neighborhoods
  const latestMetrics = await db.select().from(metrics)
    .where(eq(metrics.propertyType, 'all'))
    .orderBy(desc(metrics.metricDate))
    .limit(8);

  const avgAdr = latestMetrics.length > 0 ? latestMetrics.reduce((s, m) => s + Number(m.adr || 0), 0) / latestMetrics.length : 0;
  const avgOcc = latestMetrics.length > 0 ? latestMetrics.reduce((s, m) => s + Number(m.occupancyRate || 0), 0) / latestMetrics.length : 0;
  const avgRevpar = latestMetrics.length > 0 ? latestMetrics.reduce((s, m) => s + Number(m.revpar || 0), 0) / latestMetrics.length : 0;
  const totalNew = latestMetrics.reduce((s, m) => s + (m.newListings || 0), 0);

  // Competitor count
  const [compCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(competitors);

  // OTA distribution
  const otaDist = await db.select({
    otaSourceId: listings.otaSourceId,
    count: sql<number>`COUNT(*)`,
  }).from(listings).where(eq(listings.isActive, true)).groupBy(listings.otaSourceId);

  // Property type distribution
  const ptDist = await db.select({
    propertyType: listings.propertyType,
    count: sql<number>`COUNT(*)`,
  }).from(listings).where(eq(listings.isActive, true)).groupBy(listings.propertyType);

  // Host type distribution
  const hostDist = await db.select({
    hostType: listings.hostType,
    count: sql<number>`COUNT(*)`,
  }).from(listings).where(eq(listings.isActive, true)).groupBy(listings.hostType);

  // Last scrape job
  const [lastJob] = await db.select().from(scrapeJobs).orderBy(desc(scrapeJobs.completedAt)).limit(1);

  return {
    totalListings: totalListings?.count || 0,
    avgRating: Number(avgRating?.avg || 0).toFixed(2),
    avgAdr: Math.round(avgAdr),
    avgOccupancy: Number(avgOcc).toFixed(1),
    avgRevpar: Math.round(avgRevpar),
    newListingsThisWeek: totalNew,
    competitorCount: compCount?.count || 0,
    otaDistribution: otaDist,
    propertyTypeDistribution: ptDist,
    hostTypeDistribution: hostDist,
    lastScrapeJob: lastJob || null,
    neighborhoodMetrics: latestMetrics,
  };
}

// ─── Neighborhood Metrics ───
export async function getNeighborhoodMetrics(neighborhoodId: number, propertyType?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(metrics.neighborhoodId, neighborhoodId)];
  if (propertyType) {
    conditions.push(eq(metrics.propertyType, propertyType as any));
  } else {
    conditions.push(eq(metrics.propertyType, 'all'));
  }
  
  return db.select().from(metrics)
    .where(and(...conditions))
    .orderBy(asc(metrics.metricDate));
}

// ─── Neighborhood Detail ───
export async function getNeighborhoodDetail(neighborhoodId: number) {
  const db = await getDb();
  if (!db) return null;

  const [nb] = await db.select().from(neighborhoods).where(eq(neighborhoods.id, neighborhoodId));
  if (!nb) return null;

  // Latest metrics
  const latestMetrics = await db.select().from(metrics)
    .where(and(eq(metrics.neighborhoodId, neighborhoodId), eq(metrics.propertyType, 'all')))
    .orderBy(desc(metrics.metricDate))
    .limit(1);

  // Metrics by property type (latest)
  const ptMetrics = await db.select().from(metrics)
    .where(and(
      eq(metrics.neighborhoodId, neighborhoodId),
      sql`${metrics.propertyType} != 'all'`,
    ))
    .orderBy(desc(metrics.metricDate))
    .limit(5);

  // Listings in this neighborhood
  const nbListings = await db.select({
    count: sql<number>`COUNT(*)`,
    avgRating: sql<number>`AVG(CAST(rating AS DECIMAL(3,2)))`,
    avgReviews: sql<number>`AVG(reviewCount)`,
    superhostPct: sql<number>`AVG(isSuperhost) * 100`,
  }).from(listings)
    .where(and(eq(listings.neighborhoodId, neighborhoodId), eq(listings.isActive, true)));

  // Top hosts in this neighborhood
  const topHosts = await db.select({
    hostId: listings.hostId,
    hostName: listings.hostName,
    hostType: listings.hostType,
    count: sql<number>`COUNT(*)`,
    avgRating: sql<number>`AVG(CAST(rating AS DECIMAL(3,2)))`,
  }).from(listings)
    .where(and(eq(listings.neighborhoodId, neighborhoodId), eq(listings.isActive, true)))
    .groupBy(listings.hostId, listings.hostName, listings.hostType)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  return {
    neighborhood: nb,
    latestMetrics: latestMetrics[0] || null,
    propertyTypeMetrics: ptMetrics,
    listingStats: nbListings[0] || null,
    topHosts,
  };
}

// ─── Listings ───
export async function getListings(filters: {
  neighborhoodId?: number;
  propertyType?: string;
  otaSourceId?: number;
  hostType?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const conditions = [eq(listings.isActive, true)];
  if (filters.neighborhoodId) conditions.push(eq(listings.neighborhoodId, filters.neighborhoodId));
  if (filters.propertyType) conditions.push(eq(listings.propertyType, filters.propertyType as any));
  if (filters.otaSourceId) conditions.push(eq(listings.otaSourceId, filters.otaSourceId));
  if (filters.hostType) conditions.push(eq(listings.hostType, filters.hostType as any));
  if (filters.minRating) conditions.push(gte(listings.rating, String(filters.minRating)));
  if (filters.search) conditions.push(like(listings.title, `%${filters.search}%`));

  const where = and(...conditions);

  const [totalResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(listings).where(where);
  
  let orderClause;
  switch (filters.sortBy) {
    case 'rating': orderClause = filters.sortDir === 'asc' ? asc(listings.rating) : desc(listings.rating); break;
    case 'reviews': orderClause = filters.sortDir === 'asc' ? asc(listings.reviewCount) : desc(listings.reviewCount); break;
    case 'title': orderClause = filters.sortDir === 'asc' ? asc(listings.title) : desc(listings.title); break;
    default: orderClause = desc(listings.lastSeen);
  }

  const items = await db.select().from(listings).where(where).orderBy(orderClause).limit(limit).offset(offset);

  return { items, total: totalResult?.count || 0 };
}

// ─── Competitors ───
export async function getCompetitors(sortBy?: string) {
  const db = await getDb();
  if (!db) return [];

  let orderClause;
  switch (sortBy) {
    case 'rating': orderClause = desc(competitors.avgRating); break;
    case 'price': orderClause = desc(competitors.avgNightlyRate); break;
    case 'reviews': orderClause = desc(competitors.totalReviews); break;
    default: orderClause = desc(competitors.portfolioSize);
  }

  return db.select().from(competitors).orderBy(orderClause);
}

export async function getCompetitorDetail(hostId: string) {
  const db = await getDb();
  if (!db) return null;

  const [comp] = await db.select().from(competitors).where(eq(competitors.hostId, hostId));
  if (!comp) return null;

  const compListings = await db.select().from(listings)
    .where(and(eq(listings.hostId, hostId), eq(listings.isActive, true)));

  return { competitor: comp, listings: compListings };
}

// ─── ADR Trends (time series) ───
export async function getAdrTrends(neighborhoodId?: number, propertyType?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (neighborhoodId) conditions.push(eq(metrics.neighborhoodId, neighborhoodId));
  conditions.push(eq(metrics.propertyType, (propertyType || 'all') as any));

  return db.select({
    metricDate: metrics.metricDate,
    neighborhoodId: metrics.neighborhoodId,
    adr: metrics.adr,
    adr30: metrics.adr30,
    adr60: metrics.adr60,
    adr90: metrics.adr90,
    occupancyRate: metrics.occupancyRate,
    revpar: metrics.revpar,
    totalListings: metrics.totalListings,
  }).from(metrics)
    .where(and(...conditions))
    .orderBy(asc(metrics.metricDate));
}

// ─── Seasonal Patterns ───
export async function getSeasonalPatterns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(seasonalPatterns).orderBy(asc(seasonalPatterns.startDate));
}

// ─── Scrape Jobs ───
export async function getScrapeJobs(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scrapeJobs).orderBy(desc(scrapeJobs.createdAt)).limit(limit);
}

// ─── Scrape Schedules ───
export async function getScrapeSchedules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scrapeSchedules).orderBy(asc(scrapeSchedules.name));
}

// ─── Export Data ───
export async function getExportData(params: {
  neighborhoodIds?: number[];
  propertyTypes?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  metrics?: string[];
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (params.neighborhoodIds?.length) {
    conditions.push(inArray(metrics.neighborhoodId, params.neighborhoodIds));
  }
  if (params.propertyTypes?.length) {
    conditions.push(inArray(metrics.propertyType, params.propertyTypes as any));
  }
  if (params.dateFrom) {
    conditions.push(gte(metrics.metricDate, params.dateFrom));
  }
  if (params.dateTo) {
    conditions.push(lte(metrics.metricDate, params.dateTo));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db.select().from(metrics).where(where).orderBy(asc(metrics.metricDate));
}

// ─── Price Distribution ───
export async function getPriceDistribution(neighborhoodId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(listings.isActive, true)];
  if (neighborhoodId) conditions.push(eq(listings.neighborhoodId, neighborhoodId));

  // Get latest price for each listing
  const result = await db.select({
    propertyType: listings.propertyType,
    nightlyRate: priceSnapshots.nightlyRate,
    neighborhoodId: listings.neighborhoodId,
  }).from(listings)
    .innerJoin(priceSnapshots, eq(priceSnapshots.listingId, listings.id))
    .where(and(...conditions, gte(priceSnapshots.snapshotDate, sql`DATE_SUB(NOW(), INTERVAL 7 DAY)`)));

  return result;
}

// ─── Supply Growth ───
export async function getSupplyGrowth() {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    neighborhoodId: metrics.neighborhoodId,
    metricDate: metrics.metricDate,
    totalListings: metrics.totalListings,
    newListings: metrics.newListings,
  }).from(metrics)
    .where(eq(metrics.propertyType, 'all'))
    .orderBy(asc(metrics.metricDate));
}
