import { COOKIE_NAME, BCRYPT_SALT_ROUNDS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getOrchestrator } from "./scrapers/orchestrator";
import { generateExcelReport } from "./excel-export";
import { getScheduler } from "./scheduler";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

// ─── Role-based middleware ───
const viewerProcedure = protectedProcedure;

const exportProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role === "viewer") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Viewers cannot export data. Contact an admin to upgrade your role." });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get user with password hash
        const userWithPw = await db.getUserByUsername(ctx.user.username || "");
        if (!userWithPw || !userWithPw.passwordHash) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change password for this account." });
        }
        const valid = await bcrypt.compare(input.currentPassword, userWithPw.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Current password is incorrect." });
        }
        const newHash = await bcrypt.hash(input.newPassword, BCRYPT_SALT_ROUNDS);
        await db.resetUserPassword(ctx.user.id, newHash);
        await db.insertAuditLog({
          userId: ctx.user.id,
          action: "password_change",
          target: `user:${ctx.user.id}`,
          ipAddress: ctx.req.ip,
        });
        return { success: true };
      }),
  }),

  // ─── Dashboard (protected — any authenticated user) ───
  dashboard: router({
    summary: viewerProcedure.query(async () => {
      return db.getDashboardSummary();
    }),
    supplyGrowth: viewerProcedure.query(async () => {
      return db.getSupplyGrowth();
    }),
  }),

  // ─── Neighborhoods (protected) ───
  neighborhoods: router({
    list: viewerProcedure.query(async () => {
      return db.getNeighborhoods();
    }),
    detail: viewerProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getNeighborhoodDetail(input.id);
      }),
    metrics: viewerProcedure
      .input(z.object({
        neighborhoodId: z.number(),
        propertyType: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.getNeighborhoodMetrics(input.neighborhoodId, input.propertyType);
      }),
  }),

  // ─── Listings (protected) ───
  listings: router({
    list: viewerProcedure
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

  // ─── Metrics & Trends (protected) ───
  metrics: router({
    adrTrends: viewerProcedure
      .input(z.object({
        neighborhoodId: z.number().optional(),
        propertyType: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.getAdrTrends(input.neighborhoodId, input.propertyType);
      }),
    priceDistribution: viewerProcedure
      .input(z.object({ neighborhoodId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getPriceDistribution(input.neighborhoodId);
      }),
    seasonal: viewerProcedure.query(async () => {
      return db.getSeasonalPatterns();
    }),
  }),

  // ─── Competitors (protected) ───
  competitors: router({
    list: viewerProcedure
      .input(z.object({ sortBy: z.string().optional() }))
      .query(async ({ input }) => {
        return db.getCompetitors(input.sortBy);
      }),
    detail: viewerProcedure
      .input(z.object({ hostId: z.string() }))
      .query(async ({ input }) => {
        return db.getCompetitorDetail(input.hostId);
      }),
  }),

  // ─── OTA Sources (protected) ───
  otaSources: router({
    list: viewerProcedure.query(async () => {
      return db.getOtaSources();
    }),
  }),

  // ─── Scrape Jobs ───
  scrapeJobs: router({
    list: viewerProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getScrapeJobs(input.limit);
      }),
    trigger: adminProcedure
      .input(z.object({
        otaSlugs: z.array(z.string()).optional(),
        neighborhoodSlugs: z.array(z.string()).optional(),
        jobType: z.enum(["full_scan", "price_update", "calendar_check", "review_scan"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.insertAuditLog({
          userId: ctx.user.id,
          action: "scrape_trigger",
          target: `OTAs: ${input.otaSlugs?.join(",") || "all"}, Neighborhoods: ${input.neighborhoodSlugs?.join(",") || "all"}`,
          metadata: { jobType: input.jobType || "full_scan" },
          ipAddress: ctx.req.ip,
        });
        const orchestrator = getOrchestrator();
        const promise = orchestrator.runScrapeJob({
          otaSlugs: input.otaSlugs,
          neighborhoodSlugs: input.neighborhoodSlugs,
          jobType: input.jobType,
        });
        promise.then(result => {
          console.log(`[ScrapeJob] Completed: ${result.totalListings} listings, ${result.totalErrors} errors, ${result.duration}ms`);
        }).catch(err => {
          console.error("[ScrapeJob] Failed:", err);
        });
        return { started: true, message: "Scrape job started. Check the jobs list for progress." };
      }),
  }),

  // ─── Export (user + admin only, not viewer) ───
  export: router({
    data: exportProcedure
      .input(z.object({
        neighborhoodIds: z.array(z.number()).optional(),
        propertyTypes: z.array(z.string()).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }))
      .query(async ({ input, ctx }) => {
        await db.insertAuditLog({
          userId: ctx.user.id,
          action: "export_csv",
          target: "metrics",
          metadata: input,
          ipAddress: ctx.req.ip,
        });
        return db.getExportData({
          neighborhoodIds: input.neighborhoodIds,
          propertyTypes: input.propertyTypes,
          dateFrom: input.dateFrom ? new Date(input.dateFrom) : undefined,
          dateTo: input.dateTo ? new Date(input.dateTo) : undefined,
        });
      }),
    excel: exportProcedure
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
      .mutation(async ({ input, ctx }) => {
        await db.insertAuditLog({
          userId: ctx.user.id,
          action: "export_excel",
          target: "full_report",
          metadata: input,
          ipAddress: ctx.req.ip,
        });
        const buffer = await generateExcelReport(input);
        return {
          filename: `CoBNB_Market_Intelligence_Riyadh_${new Date().toISOString().split("T")[0]}.xlsx`,
          data: buffer.toString("base64"),
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
      }),
  }),

  // ─── Scheduler (admin only) ───
  scheduler: router({
    status: adminProcedure.query(async () => {
      const scheduler = getScheduler();
      return scheduler.getStatus();
    }),
    start: adminProcedure
      .input(z.object({
        frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.insertAuditLog({
          userId: ctx.user.id,
          action: "scheduler_start",
          target: input.frequency || "weekly",
          ipAddress: ctx.req.ip,
        });
        const scheduler = getScheduler();
        scheduler.start(input.frequency || "weekly");
        return { started: true, frequency: input.frequency || "weekly" };
      }),
    stop: adminProcedure.mutation(async ({ ctx }) => {
      await db.insertAuditLog({
        userId: ctx.user.id,
        action: "scheduler_stop",
        ipAddress: ctx.req.ip,
      });
      const scheduler = getScheduler();
      scheduler.stop();
      return { stopped: true };
    }),
  }),

  // ─── Admin: User Management ───
  admin: router({
    users: router({
      list: adminProcedure.query(async () => {
        return db.getAllUsers();
      }),
      create: adminProcedure
        .input(z.object({
          username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, dots, hyphens, and underscores"),
          password: z.string().min(8),
          name: z.string().min(1),
          displayName: z.string().optional(),
          email: z.string().email().optional().or(z.literal("")),
          mobile: z.string().optional(),
          role: z.enum(["viewer", "user", "admin"]).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          // Check if username already exists
          const existing = await db.getUserByUsername(input.username);
          if (existing) {
            throw new TRPCError({ code: "CONFLICT", message: "Username already exists." });
          }
          const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
          const user = await db.createUser({
            username: input.username,
            passwordHash,
            name: input.name,
            displayName: input.displayName,
            email: input.email || undefined,
            mobile: input.mobile,
            role: input.role,
          });
          await db.insertAuditLog({
            userId: ctx.user.id,
            action: "user_create",
            target: `user:${input.username}`,
            metadata: { role: input.role || "viewer" },
            ipAddress: ctx.req.ip,
          });
          return { success: true, user };
        }),
      updateRole: adminProcedure
        .input(z.object({
          userId: z.number(),
          role: z.enum(["viewer", "user", "admin"]),
        }))
        .mutation(async ({ input, ctx }) => {
          if (input.userId === ctx.user.id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot change your own role." });
          }
          await db.updateUserRole(input.userId, input.role);
          await db.insertAuditLog({
            userId: ctx.user.id,
            action: "role_change",
            target: `user:${input.userId}`,
            metadata: { newRole: input.role },
            ipAddress: ctx.req.ip,
          });
          return { success: true };
        }),
      resetPassword: adminProcedure
        .input(z.object({
          userId: z.number(),
          newPassword: z.string().min(8),
        }))
        .mutation(async ({ input, ctx }) => {
          const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_SALT_ROUNDS);
          await db.resetUserPassword(input.userId, passwordHash);
          await db.insertAuditLog({
            userId: ctx.user.id,
            action: "password_reset",
            target: `user:${input.userId}`,
            ipAddress: ctx.req.ip,
          });
          return { success: true };
        }),
      deactivate: adminProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (input.userId === ctx.user.id) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot deactivate yourself." });
          }
          await db.deactivateUser(input.userId);
          await db.insertAuditLog({
            userId: ctx.user.id,
            action: "user_deactivate",
            target: `user:${input.userId}`,
            ipAddress: ctx.req.ip,
          });
          return { success: true };
        }),
      activate: adminProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(async ({ input, ctx }) => {
          await db.activateUser(input.userId);
          await db.insertAuditLog({
            userId: ctx.user.id,
            action: "user_activate",
            target: `user:${input.userId}`,
            ipAddress: ctx.req.ip,
          });
          return { success: true };
        }),
    }),
    auditLog: adminProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getAuditLogs(input.limit || 50);
      }),
  }),
});

export type AppRouter = typeof appRouter;
