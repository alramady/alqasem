/**
 * Scraper Orchestrator — Coordinates scraping across all OTA platforms,
 * manages job tracking, and persists results to the database.
 */
import { getDb } from "../db";
import { listings, priceSnapshots, scrapeJobs, competitors, metrics, neighborhoods, otaSources } from "../../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { AirbnbScraper } from "./airbnb";
import { GathernScraper } from "./gathern";
import { BookingScraper } from "./booking";
import { AgodaScraper } from "./agoda";
import { BaseScraper, ScrapedListing, ProxyConfig } from "./base";

export interface ScrapeJobConfig {
  otaSlugs?: string[];
  neighborhoodSlugs?: string[];
  jobType?: "full_scan" | "price_update" | "calendar_check" | "review_scan";
  proxies?: ProxyConfig[];
  maxConcurrent?: number;
  delayMs?: number;
}

interface NeighborhoodInfo {
  id: number;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
}

interface OtaInfo {
  id: number;
  slug: string;
  name: string;
}

export class ScraperOrchestrator {
  private scrapers: Map<string, BaseScraper> = new Map();

  constructor(config?: { proxies?: ProxyConfig[]; maxConcurrent?: number; delayMs?: number }) {
    const opts = {
      maxConcurrent: config?.maxConcurrent || 2,
      delayMs: config?.delayMs || 2000,
      proxies: config?.proxies,
    };

    this.scrapers.set("airbnb", new AirbnbScraper(opts));
    this.scrapers.set("gathern", new GathernScraper({ ...opts, maxConcurrent: 3, delayMs: 1500 }));
    this.scrapers.set("booking", new BookingScraper(opts));
    this.scrapers.set("agoda", new AgodaScraper(opts));
  }

  async runScrapeJob(config: ScrapeJobConfig = {}): Promise<{
    jobIds: number[];
    totalListings: number;
    totalErrors: number;
    duration: number;
  }> {
    const startTime = Date.now();
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get neighborhoods and OTA sources
    const allNeighborhoods = await db.select().from(neighborhoods).where(eq(neighborhoods.isActive, true));
    const allOtas = await db.select().from(otaSources).where(eq(otaSources.isActive, true));

    const targetNeighborhoods: NeighborhoodInfo[] = config.neighborhoodSlugs?.length
      ? allNeighborhoods.filter(n => config.neighborhoodSlugs!.includes(n.slug)).map(n => ({
          id: n.id, name: n.name, slug: n.slug,
          latitude: Number(n.latitude) || 24.7136,
          longitude: Number(n.longitude) || 46.6753,
        }))
      : allNeighborhoods.map(n => ({
          id: n.id, name: n.name, slug: n.slug,
          latitude: Number(n.latitude) || 24.7136,
          longitude: Number(n.longitude) || 46.6753,
        }));

    const targetOtas: OtaInfo[] = config.otaSlugs?.length
      ? allOtas.filter(o => config.otaSlugs!.includes(o.slug)).map(o => ({ id: o.id, slug: o.slug, name: o.name }))
      : allOtas.map(o => ({ id: o.id, slug: o.slug, name: o.name }));

    const jobIds: number[] = [];
    let totalListings = 0;
    let totalErrors = 0;

    for (const ota of targetOtas) {
      const scraper = this.scrapers.get(ota.slug);
      if (!scraper) continue;

      for (const nb of targetNeighborhoods) {
        // Create scrape job record
        const [job] = await db.insert(scrapeJobs).values({
          otaSourceId: ota.id,
          neighborhoodId: nb.id,
          status: "running",
          jobType: config.jobType || "full_scan",
          startedAt: new Date(),
        }).$returningId();

        const jobId = job.id;
        jobIds.push(jobId);

        try {
          console.log(`[Orchestrator] Scraping ${ota.name} → ${nb.name}...`);
          const result = await scraper.scrapeNeighborhood(nb.name, nb.latitude, nb.longitude);

          // Persist listings and price snapshots
          let listingsUpdated = 0;
          let priceSnapshotsCreated = 0;

          for (const scrapedListing of result.listings) {
            try {
              const listingId = await this.upsertListing(scrapedListing, ota.id, nb.id);
              if (listingId && scrapedListing.nightlyRate) {
                await this.insertPriceSnapshot(listingId, scrapedListing, jobId);
                priceSnapshotsCreated++;
              }
              listingsUpdated++;
            } catch (e) {
              console.error(`[Orchestrator] Failed to persist listing ${scrapedListing.externalId}:`, e);
            }
          }

          // Update job record
          await db.update(scrapeJobs).set({
            status: "completed",
            listingsFound: result.totalFound,
            listingsUpdated,
            priceSnapshots: priceSnapshotsCreated,
            errors: result.errors.length,
            errorLog: result.errors.length > 0 ? result.errors.join("\n") : null,
            completedAt: new Date(),
            duration: result.duration,
          }).where(eq(scrapeJobs.id, jobId));

          totalListings += result.totalFound;
          totalErrors += result.errors.length;

          console.log(`[Orchestrator] ✓ ${ota.name} → ${nb.name}: ${result.totalFound} listings, ${result.errors.length} errors`);
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          await db.update(scrapeJobs).set({
            status: "failed",
            errors: 1,
            errorLog: errMsg,
            completedAt: new Date(),
            duration: Date.now() - startTime,
          }).where(eq(scrapeJobs.id, jobId));

          totalErrors++;
          console.error(`[Orchestrator] ✗ ${ota.name} → ${nb.name}: ${errMsg}`);
        }
      }
    }

    // After all scraping, update competitor and metrics tables
    try {
      await this.updateCompetitors();
      await this.updateMetrics();
    } catch (e) {
      console.error("[Orchestrator] Post-scrape analysis failed:", e);
    }

    return {
      jobIds,
      totalListings,
      totalErrors,
      duration: Date.now() - startTime,
    };
  }

  private async upsertListing(scraped: ScrapedListing, otaSourceId: number, neighborhoodId: number): Promise<number | null> {
    const db = await getDb();
    if (!db) return null;

    // Check if listing exists
    const existing = await db.select({ id: listings.id }).from(listings)
      .where(and(
        eq(listings.externalId, scraped.externalId),
        eq(listings.otaSourceId, otaSourceId)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing listing
      await db.update(listings).set({
        title: scraped.title,
        url: scraped.url,
        propertyType: scraped.propertyType,
        hostType: scraped.hostType,
        hostName: scraped.hostName,
        hostId: scraped.hostId,
        bedrooms: scraped.bedrooms,
        bathrooms: scraped.bathrooms,
        maxGuests: scraped.maxGuests,
        latitude: String(scraped.latitude),
        longitude: String(scraped.longitude),
        rating: String(scraped.rating),
        reviewCount: scraped.reviewCount,
        photoCount: scraped.photoCount,
        amenities: scraped.amenities,
        isSuperhost: scraped.isSuperhost,
        responseRate: scraped.responseRate,
        instantBook: scraped.instantBook,
        lastSeen: new Date(),
        isActive: true,
      }).where(eq(listings.id, existing[0].id));

      return existing[0].id;
    } else {
      // Insert new listing
      const [result] = await db.insert(listings).values({
        externalId: scraped.externalId,
        otaSourceId,
        neighborhoodId,
        title: scraped.title,
        url: scraped.url,
        propertyType: scraped.propertyType,
        hostType: scraped.hostType,
        hostName: scraped.hostName,
        hostId: scraped.hostId,
        bedrooms: scraped.bedrooms,
        bathrooms: scraped.bathrooms,
        maxGuests: scraped.maxGuests,
        latitude: String(scraped.latitude),
        longitude: String(scraped.longitude),
        rating: String(scraped.rating),
        reviewCount: scraped.reviewCount,
        photoCount: scraped.photoCount,
        amenities: scraped.amenities,
        isSuperhost: scraped.isSuperhost,
        responseRate: scraped.responseRate,
        instantBook: scraped.instantBook,
        firstSeen: new Date(),
        lastSeen: new Date(),
        isActive: true,
      }).$returningId();

      return result.id;
    }
  }

  private async insertPriceSnapshot(listingId: number, scraped: ScrapedListing, jobId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db.insert(priceSnapshots).values({
      listingId,
      snapshotDate: new Date(),
      nightlyRate: scraped.nightlyRate ? String(scraped.nightlyRate) : null,
      weeklyRate: scraped.weeklyRate ? String(scraped.weeklyRate) : null,
      monthlyRate: scraped.monthlyRate ? String(scraped.monthlyRate) : null,
      cleaningFee: scraped.cleaningFee ? String(scraped.cleaningFee) : null,
      currency: scraped.currency,
      availableDays: scraped.availableDays,
      blockedDays: scraped.blockedDays,
      bookedDays: scraped.bookedDays,
      scrapeJobId: jobId,
    });
  }

  private async updateCompetitors(): Promise<void> {
    const db = await getDb();
    if (!db) return;

    // Find hosts with 3+ listings (property managers)
    const hostGroups = await db.select({
      hostId: listings.hostId,
      hostName: listings.hostName,
      otaSourceId: listings.otaSourceId,
      count: sql<number>`COUNT(*)`,
      avgRating: sql<number>`AVG(CAST(rating AS DECIMAL(3,2)))`,
      totalReviews: sql<number>`SUM(reviewCount)`,
      isSuperhost: sql<boolean>`MAX(isSuperhost)`,
    }).from(listings)
      .where(and(eq(listings.isActive, true), sql`${listings.hostId} IS NOT NULL AND ${listings.hostId} != ''`))
      .groupBy(listings.hostId, listings.hostName, listings.otaSourceId)
      .having(sql`COUNT(*) >= 3`);

    for (const host of hostGroups) {
      if (!host.hostId) continue;

      // Get neighborhood distribution
      const nbDist = await db.select({
        neighborhoodId: listings.neighborhoodId,
        count: sql<number>`COUNT(*)`,
      }).from(listings)
        .where(and(eq(listings.hostId, host.hostId), eq(listings.isActive, true)))
        .groupBy(listings.neighborhoodId);

      // Get property type distribution
      const ptDist = await db.select({
        propertyType: listings.propertyType,
        count: sql<number>`COUNT(*)`,
      }).from(listings)
        .where(and(eq(listings.hostId, host.hostId), eq(listings.isActive, true)))
        .groupBy(listings.propertyType);

      // Get average nightly rate
      const [avgPrice] = await db.select({
        avg: sql<number>`AVG(CAST(nightlyRate AS DECIMAL(10,2)))`,
      }).from(priceSnapshots)
        .innerJoin(listings, eq(priceSnapshots.listingId, listings.id))
        .where(and(
          eq(listings.hostId, host.hostId),
          sql`${priceSnapshots.snapshotDate} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
        ));

      // Upsert competitor
      const existing = await db.select({ id: competitors.id }).from(competitors)
        .where(eq(competitors.hostId, host.hostId)).limit(1);

      const compData = {
        hostId: host.hostId,
        hostName: host.hostName,
        otaSourceId: host.otaSourceId,
        portfolioSize: host.count,
        avgRating: String(host.avgRating || 0),
        avgNightlyRate: String(avgPrice?.avg || 0),
        totalReviews: host.totalReviews || 0,
        neighborhoods: nbDist.map(n => ({ id: n.neighborhoodId, count: n.count })),
        propertyTypes: ptDist.map(p => ({ type: p.propertyType, count: p.count })),
        isSuperhost: Boolean(host.isSuperhost),
        lastUpdated: new Date(),
      };

      if (existing.length > 0) {
        await db.update(competitors).set(compData).where(eq(competitors.id, existing[0].id));
      } else {
        await db.insert(competitors).values({
          ...compData,
          firstDetected: new Date(),
        });
      }
    }
  }

  private async updateMetrics(): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const allNeighborhoods = await db.select().from(neighborhoods).where(eq(neighborhoods.isActive, true));
    const propertyTypes = ["all", "studio", "1br", "2br", "3br", "4br_plus"] as const;

    for (const nb of allNeighborhoods) {
      for (const pt of propertyTypes) {
        try {
          const conditions = [
            eq(listings.neighborhoodId, nb.id),
            eq(listings.isActive, true),
          ];
          if (pt !== "all") {
            conditions.push(eq(listings.propertyType, pt as any));
          }

          // Count listings
          const [countResult] = await db.select({ count: sql<number>`COUNT(*)` })
            .from(listings).where(and(...conditions));

          // Count new listings (first seen in last 7 days)
          const [newResult] = await db.select({ count: sql<number>`COUNT(*)` })
            .from(listings).where(and(
              ...conditions,
              sql`${listings.firstSeen} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
            ));

          // Average rating
          const [ratingResult] = await db.select({
            avg: sql<number>`AVG(CAST(rating AS DECIMAL(3,2)))`,
          }).from(listings).where(and(...conditions));

          // Price metrics from recent snapshots
          const priceConditions = [
            eq(listings.neighborhoodId, nb.id),
            eq(listings.isActive, true),
            sql`${priceSnapshots.snapshotDate} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
          ];
          if (pt !== "all") {
            priceConditions.push(eq(listings.propertyType, pt as any));
          }

          // Proper percentile calculation using MySQL subqueries
          const [priceResult] = await db.select({
            avgPrice: sql<number>`AVG(CAST(nightlyRate AS DECIMAL(10,2)))`,
            priceCount: sql<number>`COUNT(*)`,
          }).from(priceSnapshots)
            .innerJoin(listings, eq(priceSnapshots.listingId, listings.id))
            .where(and(...priceConditions));

          // Get all prices sorted for proper median and percentile calculation
          const allPrices = await db.select({
            nightlyRate: sql<number>`CAST(nightlyRate AS DECIMAL(10,2))`,
          }).from(priceSnapshots)
            .innerJoin(listings, eq(priceSnapshots.listingId, listings.id))
            .where(and(...priceConditions, sql`nightlyRate IS NOT NULL AND nightlyRate > 0`))
            .orderBy(sql`CAST(nightlyRate AS DECIMAL(10,2)) ASC`);

          const prices = allPrices.map(p => Number(p.nightlyRate)).filter(p => p > 0);
          const medianPrice = prices.length > 0 ? calculatePercentile(prices, 50) : 0;
          const p25 = prices.length > 0 ? calculatePercentile(prices, 25) : 0;
          const p75 = prices.length > 0 ? calculatePercentile(prices, 75) : 0;

          // Trailing ADR (30/60/90 days)
          const getTrailingAdr = async (days: number) => {
            const [result] = await db.select({
              avg: sql<number>`AVG(CAST(nightlyRate AS DECIMAL(10,2)))`,
            }).from(priceSnapshots)
              .innerJoin(listings, eq(priceSnapshots.listingId, listings.id))
              .where(and(
                eq(listings.neighborhoodId, nb.id),
                eq(listings.isActive, true),
                sql`${priceSnapshots.snapshotDate} >= DATE_SUB(NOW(), INTERVAL ${sql.raw(String(days))} DAY)`,
                ...(pt !== "all" ? [eq(listings.propertyType, pt as any)] : []),
              ));
            return result?.avg || 0;
          };

          const adr30 = await getTrailingAdr(30);
          const adr60 = await getTrailingAdr(60);
          const adr90 = await getTrailingAdr(90);

          // Occupancy estimation from calendar data
          const [occResult] = await db.select({
            avgBooked: sql<number>`AVG(bookedDays)`,
            avgAvailable: sql<number>`AVG(availableDays)`,
            avgBlocked: sql<number>`AVG(blockedDays)`,
          }).from(priceSnapshots)
            .innerJoin(listings, eq(priceSnapshots.listingId, listings.id))
            .where(and(
              eq(listings.neighborhoodId, nb.id),
              eq(listings.isActive, true),
              sql`${priceSnapshots.bookedDays} IS NOT NULL`,
              sql`${priceSnapshots.snapshotDate} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
              ...(pt !== "all" ? [eq(listings.propertyType, pt as any)] : []),
            ));

          const totalDays = (occResult?.avgBooked || 0) + (occResult?.avgAvailable || 0);
          const hasRealOccupancy = totalDays > 0;
          const occupancyRate = hasRealOccupancy ? ((occResult?.avgBooked || 0) / totalDays) * 100 : 65; // Default estimate

          const adr = priceResult?.avgPrice || 0;
          const revpar = adr * (occupancyRate / 100);

          // Determine data confidence level
          const hasPriceData = prices.length > 0;
          const hasOccupancyData = hasRealOccupancy;
          let dataConfidence: "real" | "estimated" | "default" = "default";
          if (hasPriceData && hasOccupancyData) {
            dataConfidence = "real";
          } else if (hasPriceData || hasOccupancyData) {
            dataConfidence = "estimated";
          }

          // Insert metric
          await db.insert(metrics).values({
            neighborhoodId: nb.id,
            propertyType: pt,
            metricDate: new Date(),
            period: "daily",
            adr: String(Math.round(adr)),
            adr30: String(Math.round(adr30)),
            adr60: String(Math.round(adr60)),
            adr90: String(Math.round(adr90)),
            occupancyRate: String(occupancyRate.toFixed(1)),
            revpar: String(Math.round(revpar)),
            totalListings: countResult?.count || 0,
            newListings: newResult?.count || 0,
            avgRating: String(Number(ratingResult?.avg || 0).toFixed(2)),
            medianPrice: String(Math.round(medianPrice)),
            priceP25: String(Math.round(p25)),
            priceP75: String(Math.round(p75)),
            dataConfidence,
          });
        } catch (e) {
          console.error(`[Orchestrator] Metrics update failed for ${nb.name}/${pt}:`, e);
        }
      }
    }
  }
}

/**
 * Calculate a percentile from a sorted array of numbers.
 * Uses linear interpolation between closest ranks.
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (upper >= sortedValues.length) return sortedValues[sortedValues.length - 1];
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

// Singleton instance
let _orchestrator: ScraperOrchestrator | null = null;

export function getOrchestrator(config?: { proxies?: ProxyConfig[] }): ScraperOrchestrator {
  if (!_orchestrator) {
    _orchestrator = new ScraperOrchestrator(config);
  }
  return _orchestrator;
}
