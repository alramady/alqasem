import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getOrchestrator } from "./scrapers/orchestrator";
import { generateExcelReport } from "./excel-export";
import { getScheduler } from "./scheduler";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Dashboard ───
  dashboard: router({
    summary: publicProcedure.query(async () => {
      return db.getDashboardSummary();
    }),
    supplyGrowth: publicProcedure.query(async () => {
      return db.getSupplyGrowth();
    }),
  }),

  // ─── Neighborhoods ───
  neighborhoods: router({
    list: publicProcedure.query(async () => {
      return db.getNeighborhoods();
    }),
    detail: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getNeighborhoodDetail(input.id);
      }),
    metrics: publicProcedure
      .input(z.object({
        neighborhoodId: z.number(),
        propertyType: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.getNeighborhoodMetrics(input.neighborhoodId, input.propertyType);
      }),
  }),

  // ─── Listings ───
  listings: router({
    list: publicProcedure
      .input(z.object({
        neighborhoodId: z.number().optional(),
        propertyType: z.string().optional(),
        otaSourceId: z.number().optional(),
        hostType: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minRating: z.number().optional(),
        search: z.string().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
        sortBy: z.string().optional(),
        sortDir: z.enum(['asc', 'desc']).optional(),
      }))
      .query(async ({ input }) => {
        return db.getListings(input);
      }),
  }),

  // ─── Metrics & Trends ───
  metrics: router({
    adrTrends: publicProcedure
      .input(z.object({
        neighborhoodId: z.number().optional(),
        propertyType: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.getAdrTrends(input.neighborhoodId, input.propertyType);
      }),
    priceDistribution: publicProcedure
      .input(z.object({ neighborhoodId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPriceDistribution(input.neighborhoodId);
      }),
    seasonal: publicProcedure.query(async () => {
      return db.getSeasonalPatterns();
    }),
  }),

  // ─── Competitors ───
  competitors: router({
    list: publicProcedure
      .input(z.object({ sortBy: z.string().optional() }))
      .query(async ({ input }) => {
        return db.getCompetitors(input.sortBy);
      }),
    detail: publicProcedure
      .input(z.object({ hostId: z.string() }))
      .query(async ({ input }) => {
        return db.getCompetitorDetail(input.hostId);
      }),
  }),

  // ─── OTA Sources ───
  otaSources: router({
    list: publicProcedure.query(async () => {
      return db.getOtaSources();
    }),
  }),

  // ─── Scrape Jobs ───
  scrapeJobs: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getScrapeJobs(input.limit);
      }),
    trigger: protectedProcedure
      .input(z.object({
        otaSlugs: z.array(z.string()).optional(),
        neighborhoodSlugs: z.array(z.string()).optional(),
        jobType: z.enum(["full_scan", "price_update", "calendar_check", "review_scan"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const orchestrator = getOrchestrator();
        // Run async — don't await to avoid timeout
        const promise = orchestrator.runScrapeJob({
          otaSlugs: input.otaSlugs,
          neighborhoodSlugs: input.neighborhoodSlugs,
          jobType: input.jobType,
        });
        // Fire and forget, but log completion
        promise.then(result => {
          console.log(`[ScrapeJob] Completed: ${result.totalListings} listings, ${result.totalErrors} errors, ${result.duration}ms`);
        }).catch(err => {
          console.error("[ScrapeJob] Failed:", err);
        });
        return { started: true, message: "Scrape job started. Check the jobs list for progress." };
      }),
  }),

  // ─── Export ───
  export: router({
    data: publicProcedure
      .input(z.object({
        neighborhoodIds: z.array(z.number()).optional(),
        propertyTypes: z.array(z.string()).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.getExportData({
          neighborhoodIds: input.neighborhoodIds,
          propertyTypes: input.propertyTypes,
          dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
          dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
        });
      }),
    excel: publicProcedure
      .input(z.object({
        neighborhoodIds: z.array(z.number()).optional(),
        propertyTypes: z.array(z.string()).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        includeListings: z.boolean().optional(),
        includeMetrics: z.boolean().optional(),
        includeCompetitors: z.boolean().optional(),
        includeSeasonalPatterns: z.boolean().optional(),
        includePriceSnapshots: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const buffer = await generateExcelReport(input);
        // Return base64 encoded Excel file
        return {
          filename: `STR_Intelligence_Riyadh_${new Date().toISOString().split("T")[0]}.xlsx`,
          data: buffer.toString("base64"),
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
      }),
  }),

  // ─── Scheduler ───
  scheduler: router({
    status: protectedProcedure.query(async () => {
      const scheduler = getScheduler();
      return scheduler.getStatus();
    }),
    start: protectedProcedure
      .input(z.object({
        frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const scheduler = getScheduler();
        scheduler.start(input.frequency || "weekly");
        return { started: true, frequency: input.frequency || "weekly" };
      }),
    stop: protectedProcedure.mutation(async () => {
      const scheduler = getScheduler();
      scheduler.stop();
      return { stopped: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
