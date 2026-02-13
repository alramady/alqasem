import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import bcrypt from "bcryptjs";
import { sdk } from "../_core/sdk";
import { COOKIE_NAME, SESSION_EXPIRY_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { getDb } from "../db";
import {
  users, properties, projects, inquiries, media, pages,
  homepageSections, settings, auditLogs, notifications, messages, permissions, guides,
  passwordResetTokens, userSessions, activityLogs, cities, districts,
} from "../../drizzle/schema";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../email";
import { generateSecret as otpGenerateSecret, generateSync as otpGenerateSync, verifySync as otpVerifySync, generateURI as otpGenerateURI } from "otplib";
import QRCode from "qrcode";
import { eq, like, and, or, desc, asc, sql, isNull, count, ne, lt, gt, gte, lte, inArray } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
import { sanitizeText, sanitizeHtml, sanitizeObject } from "../sanitize";

// Helper to log audit events with before/after tracking
async function logAudit(userId: number | null, userName: string | null, action: string, entityType: string, entityId: number | null, details: any, oldValues?: any, newValues?: any) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values({
      userId, userName, action: action as any, entityType, entityId, details, oldValues, newValues,
    });
  } catch (e) {
    console.error("[AuditLog] Failed to log:", e);
  }
}

// Helper to create notification
async function createNotification(userId: number, title: string, message: string, type: string, link?: string) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(notifications).values({
      userId, title, message, type: type as any, link,
    });
  } catch (e) {
    console.error("[Notification] Failed to create:", e);
  }
}

// Notify all admins
async function notifyAdmins(title: string, message: string, type: string, link?: string, excludeUserId?: number) {
  const db = await getDb();
  if (!db) return;
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  for (const admin of admins) {
    if (admin.id !== excludeUserId) {
      await createNotification(admin.id, title, message, type, link);
    }
  }
}

/** Log a user activity for the activity dashboard. */
async function logActivity(
  userId: number,
  userName: string | null,
  action: string,
  category: "auth" | "property" | "project" | "inquiry" | "cms" | "media" | "settings" | "user" | "system",
  description: string,
  entityType?: string,
  entityId?: number,
  metadata?: any,
  ipAddress?: string,
  userAgent?: string,
) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(activityLogs).values({
      userId, userName, action, category, description,
      entityType: entityType || null, entityId: entityId || null,
      metadata: metadata || null, ipAddress: ipAddress || null, userAgent: userAgent || null,
    });
  } catch (e) {
    console.error("[ActivityLog] Failed to log:", e);
  }
}

/** Parse user-agent string into a readable device description. */
function parseDeviceInfo(ua: string): string {
  if (!ua) return "متصفح غير معروف";
  let browser = "متصفح";
  let os = "";
  // Detect browser
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
  // Detect OS
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux") && !ua.includes("Android")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  return os ? `${browser} / ${os}` : browser;
}

/** Get current session token hash from request cookie. */
function getCurrentTokenHash(req: any): string | null {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").reduce((acc: Record<string, string>, c: string) => {
    const [key, ...val] = c.trim().split("=");
    acc[key] = val.join("=");
    return acc;
  }, {} as Record<string, string>);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const adminRouter = router({
  // ============ LOCAL AUTH ============
  localLogin: publicProcedure.input(z.object({
    username: z.string().min(1, "اسم المستخدم مطلوب"),
    password: z.string().min(1, "كلمة المرور مطلوبة"),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [user] = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }

    if (user.status === "inactive") {
      throw new TRPCError({ code: "FORBIDDEN", message: "الحساب معطّل. تواصل مع مدير النظام" });
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      throw new TRPCError({ code: "FORBIDDEN", message: "الحساب مقفل مؤقتاً. حاول لاحقاً" });
    }

    if (!user.passwordHash) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "هذا الحساب لا يدعم تسجيل الدخول بكلمة مرور" });
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      // Increment failed attempts
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await db.update(users).set({
        failedLoginAttempts: attempts,
        ...(lockUntil ? { lockedUntil: lockUntil } : {}),
      }).where(eq(users.id, user.id));
      throw new TRPCError({ code: "UNAUTHORIZED", message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }

    // Reset failed attempts on success
    await db.update(users).set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastSignedIn: new Date(),
    }).where(eq(users.id, user.id));

    // Create JWT session token
    const token = await sdk.createSessionToken(user.openId, {
      expiresInMs: SESSION_EXPIRY_MS,
      name: user.displayName || user.name || user.fullName || user.username || "",
    });

    // Set session cookie
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: SESSION_EXPIRY_MS,
    });

    // Track session in database
    try {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const ua = ctx.req.headers["user-agent"] || "";
      const ip = ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString() || "unknown";
      const deviceInfo = parseDeviceInfo(ua);
      await db.insert(userSessions).values({
        userId: user.id,
        tokenHash,
        deviceInfo,
        ipAddress: ip,
        userAgent: ua,
        expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
      });
    } catch (e) {
      console.error("[Session] Failed to track session:", e);
    }

    await logAudit(user.id, user.displayName || user.name || user.username, "login", "user", user.id, { method: "local", username: input.username }, null, null);

    // Check if 2FA is enabled
    if (user.totpEnabled && user.totpSecret) {
      // Return a pending 2FA response — don't set cookie yet
      // Store a temporary 2FA token that expires in 5 minutes
      const twoFaToken = crypto.randomBytes(32).toString("hex");
      const twoFaTokenHash = crypto.createHash("sha256").update(twoFaToken).digest("hex");
      // Store in password_reset_tokens table (reuse) with short expiry
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: twoFaTokenHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      });
      return {
        success: true,
        requires2FA: true,
        twoFaToken,
        user: {
          id: user.id,
          name: user.displayName || user.name || user.fullName,
          email: user.email,
          role: user.role,
        },
      };
    }

    await logActivity(user.id, user.displayName || user.name || user.username, "login", "auth", "تسجيل دخول ناجح", "user", user.id, { method: "local" }, ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString(), ctx.req.headers["user-agent"]);

    return {
      success: true,
      requires2FA: false,
      user: {
        id: user.id,
        name: user.displayName || user.name || user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }),

  // ============ 2FA VERIFICATION ON LOGIN ============
  verify2FA: publicProcedure.input(z.object({
    twoFaToken: z.string().min(1),
    totpCode: z.string().min(6).max(6),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const tokenHash = crypto.createHash("sha256").update(input.twoFaToken).digest("hex");
    const [resetRow] = await db.select().from(passwordResetTokens).where(
      and(eq(passwordResetTokens.token, tokenHash), isNull(passwordResetTokens.usedAt))
    ).limit(1);
    if (!resetRow || new Date(resetRow.expiresAt) < new Date()) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "انتهت صلاحية جلسة التحقق. أعد تسجيل الدخول" });
    }
    const [user] = await db.select().from(users).where(eq(users.id, resetRow.userId)).limit(1);
    if (!user || !user.totpSecret) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "خطأ في التحقق" });
    }
    // Check TOTP code
    const result = otpVerifySync({ token: input.totpCode, secret: user.totpSecret });
    if (!result.valid) {
      // Check backup codes
      const backupCodes = (user.totpBackupCodes as string[] | null) || [];
      const codeIndex = backupCodes.indexOf(input.totpCode);
      if (codeIndex === -1) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "رمز التحقق غير صحيح" });
      }
      // Remove used backup code
      backupCodes.splice(codeIndex, 1);
      await db.update(users).set({ totpBackupCodes: backupCodes }).where(eq(users.id, user.id));
    }
    // Mark token as used
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, resetRow.id));
    // Now create the actual session
    const token = await sdk.createSessionToken(user.openId, {
      expiresInMs: SESSION_EXPIRY_MS,
      name: user.displayName || user.name || user.fullName || user.username || "",
    });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_EXPIRY_MS });
    try {
      const sessionTokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const ua = ctx.req.headers["user-agent"] || "";
      const ip = ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString() || "unknown";
      await db.insert(userSessions).values({
        userId: user.id, tokenHash: sessionTokenHash, deviceInfo: parseDeviceInfo(ua),
        ipAddress: ip, userAgent: ua, expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS),
      });
    } catch (e) { console.error("[Session] Failed to track:", e); }
    await logAudit(user.id, user.displayName || user.name || user.username, "login", "user", user.id, { method: "local", with2FA: true });
    await logActivity(user.id, user.displayName || user.name || user.username, "login_2fa", "auth", "تسجيل دخول ناجح مع التحقق الثنائي", "user", user.id, { method: "local", with2FA: true }, ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString(), ctx.req.headers["user-agent"]);
    return {
      success: true,
      user: { id: user.id, name: user.displayName || user.name || user.fullName, email: user.email, role: user.role },
    };
  }),

  // ============ CHANGE PASSWORD ============
  changePassword: protectedProcedure.input(z.object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })).mutation(async ({ input, ctx }) => {
    if (input.newPassword !== input.confirmPassword) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "كلمة المرور الجديدة وتأكيدها غير متطابقتين" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user || !user.passwordHash) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "هذا الحساب لا يدعم تغيير كلمة المرور" });
    }

    const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة المرور الحالية غير صحيحة" });
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 12);
    await db.update(users).set({ passwordHash: hashedPassword }).where(eq(users.id, ctx.user.id));

    await logAudit(ctx.user.id, ctx.user.name || ctx.user.openId, "update", "user", ctx.user.id, { action: "password_changed" }, null, null);
    await createNotification(ctx.user.id, "تم تغيير كلمة المرور", "تم تغيير كلمة المرور الخاصة بك بنجاح", "success");

    return { success: true, message: "تم تغيير كلمة المرور بنجاح" };
  }),

  // ============ UPDATE PROFILE ============
  updateProfile: protectedProcedure.input(z.object({
    displayName: z.string().min(1, "الاسم المعروض مطلوب").optional(),
    email: z.string().email("البريد الإلكتروني غير صالح").optional(),
    phone: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const updateData: Record<string, any> = {};
    if (input.displayName !== undefined) updateData.displayName = input.displayName;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;

    if (Object.keys(updateData).length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "لا توجد بيانات للتحديث" });
    }

    await db.update(users).set(updateData).where(eq(users.id, ctx.user.id));

    await logAudit(ctx.user.id, ctx.user.name || ctx.user.openId, "update", "user", ctx.user.id, { action: "profile_updated", fields: Object.keys(updateData) }, null, updateData);

    return { success: true, message: "تم تحديث الملف الشخصي بنجاح" };
  }),

  // ============ GET MY PROFILE ============
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [user] = await db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });
    return user;
  }),

  // ============ DASHBOARD ============
  dashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [propCount] = await db.select({ count: count() }).from(properties).where(isNull(properties.deletedAt));
    const [activePropCount] = await db.select({ count: count() }).from(properties).where(and(eq(properties.status, "active"), isNull(properties.deletedAt)));
    const [newInqCount] = await db.select({ count: count() }).from(inquiries).where(eq(inquiries.status, "new"));
    const [projCount] = await db.select({ count: count() }).from(projects);
    const [userCount] = await db.select({ count: count() }).from(users);
    const [mediaCount] = await db.select({ count: count() }).from(media);
    const [pageCount] = await db.select({ count: count() }).from(pages);
    const [unreadNotifCount] = await db.select({ count: count() }).from(notifications).where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().slice(0, 19).replace('T', ' ');
    const [monthlyInqCount] = await db.select({ count: count() }).from(inquiries).where(gte(inquiries.createdAt, monthStart));

    const recentInquiries = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt)).limit(10);
    const recentActivity = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(15);

    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    // Optimized: single query instead of 6 separate queries (N+1 fix)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 19).replace('T', ' ');
    const monthlyData = await db.select({
      yearMonth: sql<string>`DATE_FORMAT(${inquiries.createdAt}, '%Y-%m')`,
      monthNum: sql<number>`MONTH(${inquiries.createdAt})`,
      cnt: count(),
    }).from(inquiries)
      .where(sql`${inquiries.createdAt} >= ${sixMonthsAgoStr}`)
      .groupBy(sql`DATE_FORMAT(${inquiries.createdAt}, '%Y-%m')`, sql`MONTH(${inquiries.createdAt})`)
      .orderBy(sql`DATE_FORMAT(${inquiries.createdAt}, '%Y-%m')`);
    
    const monthlyMap = new Map(monthlyData.map(r => [r.yearMonth, r.cnt]));
    const inquiriesByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      inquiriesByMonth.push({ month: months[d.getMonth()], count: monthlyMap.get(key) || 0 });
    }

    const typeResults = await db.select({ type: properties.type, count: count() }).from(properties).where(isNull(properties.deletedAt)).groupBy(properties.type);
    const typeLabels: Record<string, string> = { villa: "فيلا", apartment: "شقة", land: "أرض", commercial: "تجاري", office: "مكتب", building: "عمارة" };
    const propertiesByType = typeResults.map((r) => ({ type: typeLabels[r.type] || r.type, count: r.count }));

    const statusResults = await db.select({ status: inquiries.status, count: count() }).from(inquiries).groupBy(inquiries.status);
    const statusLabels: Record<string, string> = { new: "جديد", in_progress: "قيد المعالجة", completed: "مكتمل", closed: "مغلق" };
    const inquiriesByStatus = statusResults.map((r) => ({ status: statusLabels[r.status] || r.status, count: r.count }));

    return {
      totalProperties: propCount.count, activeProperties: activePropCount.count,
      newInquiries: newInqCount.count, totalProjects: projCount.count,
      totalUsers: userCount.count, totalMedia: mediaCount.count,
      totalPages: pageCount.count, unreadNotifications: unreadNotifCount.count,
      monthlyInquiries: monthlyInqCount.count,
      recentInquiries, recentActivity, inquiriesByMonth, propertiesByType, inquiriesByStatus,
      userName: ctx.user.name || ctx.user.fullName || "مدير",
      userRole: ctx.user.role,
    };
  }),

  // ============ USERS ============
  listUsers: adminProcedure.input(z.object({ search: z.string().optional(), role: z.string().optional() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [];
    if (input.search) conditions.push(or(like(users.name, `%${input.search}%`), like(users.email, `%${input.search}%`)));
    if (input.role && input.role !== "all") conditions.push(eq(users.role, input.role as any));
    return db.select().from(users).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(users.createdAt));
  }),

  getUser: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [user] = await db.select().from(users).where(eq(users.id, input.id));
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    return user;
  }),

  createUser: adminProcedure.input(z.object({
    fullName: z.string().min(1), email: z.string().email(), phone: z.string().optional(), role: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const openId = `manual-${nanoid(12)}`;
    await db.insert(users).values({
      openId, name: input.fullName, fullName: input.fullName, email: input.email,
      phone: input.phone || null, role: input.role as any, status: "active",
    });
    await logAudit(ctx.user.id, ctx.user.name || null, "create", "user", null, { email: input.email, role: input.role });
    await notifyAdmins("مستخدم جديد", `تم إنشاء حساب جديد: ${input.fullName}`, "user_action", "/admin/users");
    return { success: true };
  }),

  updateUser: adminProcedure.input(z.object({
    id: z.number(), fullName: z.string().optional(), email: z.string().optional(),
    phone: z.string().optional(), role: z.string().optional(), status: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [oldUser] = await db.select().from(users).where(eq(users.id, input.id));
    const updateData: any = {};
    if (input.fullName !== undefined) { updateData.fullName = input.fullName; updateData.name = input.fullName; }
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.status !== undefined) updateData.status = input.status;
    await db.update(users).set(updateData).where(eq(users.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "update", "user", input.id, {}, oldUser, updateData);
    return { success: true };
  }),

  toggleUserStatus: adminProcedure.input(z.object({ userId: z.number(), status: z.string() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(users).set({ status: input.status as any }).where(eq(users.id, input.userId));
    await logAudit(ctx.user.id, ctx.user.name || null, "status_change", "user", input.userId, { newStatus: input.status });
    return { success: true };
  }),

  // ============ PERMISSIONS ============
  getPermissions: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(permissions).orderBy(permissions.role, permissions.module);
  }),

  updatePermission: adminProcedure.input(z.object({
    role: z.string(), module: z.string(),
    canView: z.boolean(), canCreate: z.boolean(), canEdit: z.boolean(), canDelete: z.boolean(), canExport: z.boolean(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const existing = await db.select().from(permissions).where(and(eq(permissions.role, input.role as any), eq(permissions.module, input.module)));
    if (existing.length > 0) {
      await db.update(permissions).set({
        canView: input.canView, canCreate: input.canCreate, canEdit: input.canEdit,
        canDelete: input.canDelete, canExport: input.canExport,
      }).where(eq(permissions.id, existing[0].id));
    } else {
      await db.insert(permissions).values({
        role: input.role as any, module: input.module,
        canView: input.canView, canCreate: input.canCreate, canEdit: input.canEdit,
        canDelete: input.canDelete, canExport: input.canExport,
      });
    }
    await logAudit(ctx.user.id, ctx.user.name || null, "settings_change", "permission", null, { role: input.role, module: input.module });
    return { success: true };
  }),

  initPermissions: adminProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const modules = ["dashboard", "users", "properties", "projects", "inquiries", "cms", "media", "reports", "settings", "audit_log", "notifications", "messages"];
    const roles = ["admin", "manager", "staff"] as const;
    const defaults: Record<string, Record<string, boolean>> = {
      admin: { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true },
      manager: { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true },
      staff: { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false },
    };
    for (const role of roles) {
      for (const mod of modules) {
        const existing = await db.select().from(permissions).where(and(eq(permissions.role, role), eq(permissions.module, mod)));
        if (existing.length === 0) {
          await db.insert(permissions).values({
            role, module: mod, ...defaults[role] as any,
          });
        }
      }
    }
    return { success: true };
  }),

  // ============ PROPERTIES ============
  listProperties: protectedProcedure.input(z.object({
    search: z.string().optional(), type: z.string().optional(), status: z.string().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [isNull(properties.deletedAt)];
    if (input.search) conditions.push(or(like(properties.title, `%${input.search}%`), like(properties.district, `%${input.search}%`)));
    if (input.type && input.type !== "all") conditions.push(eq(properties.type, input.type as any));
    if (input.status && input.status !== "all") conditions.push(eq(properties.status, input.status as any));
    return db.select().from(properties).where(and(...conditions)).orderBy(desc(properties.createdAt));
  }),

  getProperty: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [prop] = await db.select().from(properties).where(eq(properties.id, input.id));
    if (!prop) throw new TRPCError({ code: "NOT_FOUND" });
    return prop;
  }),

  createProperty: protectedProcedure.input(z.object({
    title: z.string().min(1), titleEn: z.string().optional(), description: z.string().optional(), descriptionEn: z.string().optional(),
    type: z.string(), listingType: z.string(),
    status: z.string().optional(), price: z.number(), area: z.number(), rooms: z.number(), bathrooms: z.number(),
    city: z.string().optional(), cityEn: z.string().optional(), district: z.string().optional(), districtEn: z.string().optional(),
    address: z.string().optional(), addressEn: z.string().optional(),
    videoUrl: z.string().optional(), images: z.array(z.string()).optional(), features: z.array(z.string()).optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    // Sanitize all text inputs to prevent XSS
    const s = sanitizeObject(input, ["description", "descriptionEn"]);
    const [result] = await db.insert(properties).values({
      title: s.title, titleEn: s.titleEn || null,
      description: s.description || null, descriptionEn: s.descriptionEn || null,
      type: s.type as any, listingType: s.listingType as any,
      status: (s.status || "active") as any,
      price: input.price.toString(), area: input.area.toString(),
      rooms: input.rooms, bathrooms: input.bathrooms,
      city: s.city || "الرياض", cityEn: s.cityEn || null,
      district: s.district || null, districtEn: s.districtEn || null,
      address: s.address || null, addressEn: s.addressEn || null,
      videoUrl: s.videoUrl || null,
      images: input.images || null, features: input.features || null,
      createdBy: ctx.user.id,
    });
    await logAudit(ctx.user.id, ctx.user.name || null, "create", "property", null, { title: input.title });
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "create_property", "property", `إضافة عقار: ${input.title}`, "property", undefined, { title: input.title, type: input.type });
    await notifyAdmins("عقار جديد", `تم إضافة عقار: ${input.title}`, "property", "/admin/properties");
    return { success: true };
  }),

  updateProperty: protectedProcedure.input(z.object({
    id: z.number(), title: z.string().optional(), titleEn: z.string().optional(),
    description: z.string().optional(), descriptionEn: z.string().optional(),
    type: z.string().optional(), listingType: z.string().optional(), status: z.string().optional(),
    price: z.number().optional(), area: z.number().optional(), rooms: z.number().optional(), bathrooms: z.number().optional(),
    city: z.string().optional(), cityEn: z.string().optional(), district: z.string().optional(), districtEn: z.string().optional(),
    address: z.string().optional(), addressEn: z.string().optional(),
    videoUrl: z.string().optional(), images: z.array(z.string()).optional(), features: z.array(z.string()).optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [oldProp] = await db.select().from(properties).where(eq(properties.id, input.id));
    // Sanitize text inputs
    const s = sanitizeObject(input, ["description", "descriptionEn"]);
    const updateData: any = {};
    if (s.title !== undefined) updateData.title = s.title;
    if (s.titleEn !== undefined) updateData.titleEn = s.titleEn;
    if (s.description !== undefined) updateData.description = s.description;
    if (s.descriptionEn !== undefined) updateData.descriptionEn = s.descriptionEn;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.listingType !== undefined) updateData.listingType = input.listingType;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.price !== undefined) updateData.price = input.price.toString();
    if (input.area !== undefined) updateData.area = input.area.toString();
    if (input.rooms !== undefined) updateData.rooms = input.rooms;
    if (input.bathrooms !== undefined) updateData.bathrooms = input.bathrooms;
    if (s.city !== undefined) updateData.city = s.city;
    if (s.cityEn !== undefined) updateData.cityEn = s.cityEn;
    if (s.district !== undefined) updateData.district = s.district;
    if (s.districtEn !== undefined) updateData.districtEn = s.districtEn;
    if (s.address !== undefined) updateData.address = s.address;
    if (s.addressEn !== undefined) updateData.addressEn = s.addressEn;
    if (s.videoUrl !== undefined) updateData.videoUrl = s.videoUrl;
    if (input.images !== undefined) updateData.images = input.images;
    if (input.features !== undefined) updateData.features = input.features;
     await db.update(properties).set(updateData).where(eq(properties.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "update", "property", input.id, {}, oldProp, updateData);
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "update_property", "property", `تعديل عقار #${input.id}`, "property", input.id, { changes: Object.keys(updateData) });
    return { success: true };
  }),
  deleteProperty: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(properties).set({ deletedAt: new Date() }).where(eq(properties.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "delete", "property", input.id, {});
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "delete_property", "property", `حذف عقار #${input.id}`, "property", input.id);
    return { success: true };
  }),
  // ============ PROPERTY IMAGES =============
  uploadPropertyImage: protectedProcedure.input(z.object({
    propertyId: z.number(),
    filename: z.string(),
    mimeType: z.string(),
    base64: z.string(),
    size: z.number(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Validate file type
    if (!input.mimeType.startsWith("image/")) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "يجب أن يكون الملف صورة" });
    }

    // Validate file size (max 10MB)
    if (input.size > 10 * 1024 * 1024) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "حجم الصورة يجب أن لا يتجاوز 10 ميجابايت" });
    }

    // Check property exists
    const [prop] = await db.select().from(properties).where(eq(properties.id, input.propertyId));
    if (!prop) throw new TRPCError({ code: "NOT_FOUND", message: "العقار غير موجود" });

    // Upload to S3
    const buffer = Buffer.from(input.base64, "base64");
    const ext = input.filename.split(".").pop() || "jpg";
    const key = `properties/${input.propertyId}/${nanoid(12)}.${ext}`;
    const { url } = await storagePut(key, buffer, input.mimeType);

    // Also save to media library
    await db.insert(media).values({
      filename: input.filename, filePath: url, fileType: "image" as any,
      fileSize: input.size, mimeType: input.mimeType, folder: `property-${input.propertyId}`,
      uploadedBy: ctx.user.id,
    });

    // Add URL to property images array
    const currentImages: string[] = Array.isArray(prop.images) ? (prop.images as string[]) : [];
    const updatedImages = [...currentImages, url];
    await db.update(properties).set({ images: updatedImages }).where(eq(properties.id, input.propertyId));

    await logAudit(ctx.user.id, ctx.user.name || null, "upload", "property", input.propertyId, { filename: input.filename, imageCount: updatedImages.length });

    return { success: true, url, imageCount: updatedImages.length };
  }),

  removePropertyImage: protectedProcedure.input(z.object({
    propertyId: z.number(),
    imageUrl: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [prop] = await db.select().from(properties).where(eq(properties.id, input.propertyId));
    if (!prop) throw new TRPCError({ code: "NOT_FOUND", message: "العقار غير موجود" });

    const currentImages: string[] = Array.isArray(prop.images) ? (prop.images as string[]) : [];
    const updatedImages = currentImages.filter(img => img !== input.imageUrl);
    await db.update(properties).set({ images: updatedImages }).where(eq(properties.id, input.propertyId));

    await logAudit(ctx.user.id, ctx.user.name || null, "delete", "property", input.propertyId, { action: "image_removed", imageCount: updatedImages.length });

    return { success: true, imageCount: updatedImages.length };
  }),

  reorderPropertyImages: protectedProcedure.input(z.object({
    propertyId: z.number(),
    images: z.array(z.string()),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [prop] = await db.select().from(properties).where(eq(properties.id, input.propertyId));
    if (!prop) throw new TRPCError({ code: "NOT_FOUND", message: "العقار غير موجود" });

    await db.update(properties).set({ images: input.images }).where(eq(properties.id, input.propertyId));

    await logAudit(ctx.user.id, ctx.user.name || null, "update", "property", input.propertyId, { action: "images_reordered", imageCount: input.images.length });

    return { success: true };
  }),

  getPropertyImages: protectedProcedure.input(z.object({
    propertyId: z.number(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [prop] = await db.select({ images: properties.images }).from(properties).where(eq(properties.id, input.propertyId));
    if (!prop) throw new TRPCError({ code: "NOT_FOUND", message: "العقار غير موجود" });

    return { images: Array.isArray(prop.images) ? (prop.images as string[]) : [] };
  }),

  exportPropertiesCSV: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const props = await db.select().from(properties).where(isNull(properties.deletedAt));
    const headers = "العنوان,النوع,العرض,السعر,المساحة,الغرف,الحمامات,المدينة,الحي,الحالة\n";
    const rows = props.map(p => `"${p.title}","${p.type}","${p.listingType}","${p.price}","${p.area}","${p.rooms}","${p.bathrooms}","${p.city}","${p.district}","${p.status}"`).join("\n");
    await logAudit(ctx.user.id, ctx.user.name || null, "export", "property", null, { count: props.length });
    return { csv: "\uFEFF" + headers + rows };
  }),

  // ============ PROJECTS ============
  listProjects: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(projects).orderBy(projects.displayOrder);
  }),

  getProject: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [proj] = await db.select().from(projects).where(eq(projects.id, input.id));
    if (!proj) throw new TRPCError({ code: "NOT_FOUND" });
    return proj;
  }),

  createProject: protectedProcedure.input(z.object({
    title: z.string().min(1), titleEn: z.string().optional(),
    subtitle: z.string().optional(), subtitleEn: z.string().optional(),
    description: z.string().optional(), descriptionEn: z.string().optional(),
    location: z.string().optional(), locationEn: z.string().optional(),
    status: z.string().optional(),
    totalUnits: z.number().optional(), soldUnits: z.number().optional(),
    videoUrl: z.string().optional(), isFeatured: z.boolean().optional(),
    latitude: z.number().optional(), longitude: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const s = sanitizeObject(input, ["description", "descriptionEn"]);
    await db.insert(projects).values({
      title: s.title, titleEn: s.titleEn || null,
      subtitle: s.subtitle || null, subtitleEn: s.subtitleEn || null,
      description: s.description || null, descriptionEn: s.descriptionEn || null,
      location: s.location || null, locationEn: s.locationEn || null,
      status: (input.status || "active") as any,
      totalUnits: input.totalUnits || 0, soldUnits: input.soldUnits || 0,
      videoUrl: input.videoUrl || null, isFeatured: input.isFeatured || false,
      latitude: input.latitude ? String(input.latitude) : null,
      longitude: input.longitude ? String(input.longitude) : null,
    });
    await logAudit(ctx.user.id, ctx.user.name || null, "create", "project", null, { title: input.title });
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "create_project", "project", `إضافة مشروع: ${input.title}`, "project", undefined, { title: input.title });
    return { success: true };
  }),
  updateProject: protectedProcedure.input(z.object({
    id: z.number(), title: z.string().optional(), titleEn: z.string().optional(),
    subtitle: z.string().optional(), subtitleEn: z.string().optional(),
    description: z.string().optional(), descriptionEn: z.string().optional(),
    location: z.string().optional(), locationEn: z.string().optional(),
    status: z.string().optional(),
    totalUnits: z.number().optional(), soldUnits: z.number().optional(),
    videoUrl: z.string().optional(), isFeatured: z.boolean().optional(), displayOrder: z.number().optional(),
    latitude: z.number().optional(), longitude: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [oldProj] = await db.select().from(projects).where(eq(projects.id, input.id));
    const s = sanitizeObject(input, ["description", "descriptionEn"]);
    const updateData: any = {};
    if (s.title !== undefined) updateData.title = s.title;
    if (s.titleEn !== undefined) updateData.titleEn = s.titleEn;
    if (s.subtitle !== undefined) updateData.subtitle = s.subtitle;
    if (s.subtitleEn !== undefined) updateData.subtitleEn = s.subtitleEn;
    if (s.description !== undefined) updateData.description = s.description;
    if (s.descriptionEn !== undefined) updateData.descriptionEn = s.descriptionEn;
    if (s.location !== undefined) updateData.location = s.location;
    if (s.locationEn !== undefined) updateData.locationEn = s.locationEn;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.totalUnits !== undefined) updateData.totalUnits = input.totalUnits;
    if (input.soldUnits !== undefined) updateData.soldUnits = input.soldUnits;
    if (input.videoUrl !== undefined) updateData.videoUrl = input.videoUrl;
    if (input.isFeatured !== undefined) updateData.isFeatured = input.isFeatured;
    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
    if (input.latitude !== undefined) updateData.latitude = String(input.latitude);
    if (input.longitude !== undefined) updateData.longitude = String(input.longitude);
     await db.update(projects).set(updateData).where(eq(projects.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "update", "project", input.id, {}, oldProj, updateData);
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "update_project", "project", `تعديل مشروع #${input.id}`, "project", input.id, { changes: Object.keys(updateData) });
    return { success: true };
  }),
  deleteProject: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
     await db.delete(projects).where(eq(projects.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "delete", "project", input.id, {});
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "delete_project", "project", `حذف مشروع #${input.id}`, "project", input.id);
    return { success: true };
  }),
  // ============ PROJECT IMAGES ============
  uploadProjectImage: protectedProcedure.input(z.object({
    projectId: z.number(),
    filename: z.string(),
    mimeType: z.string(),
    base64: z.string(),
    size: z.number(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    if (!input.mimeType.startsWith("image/")) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "يجب أن يكون الملف صورة" });
    }
    if (input.size > 10 * 1024 * 1024) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "حجم الصورة يجب أن لا يتجاوز 10 ميجابايت" });
    }

    const [proj] = await db.select().from(projects).where(eq(projects.id, input.projectId));
    if (!proj) throw new TRPCError({ code: "NOT_FOUND", message: "المشروع غير موجود" });

    const buffer = Buffer.from(input.base64, "base64");
    const ext = input.filename.split(".").pop() || "jpg";
    const key = `projects/${input.projectId}/${nanoid(12)}.${ext}`;
    const { url } = await storagePut(key, buffer, input.mimeType);

    await db.insert(media).values({
      filename: input.filename, filePath: url, fileType: "image" as any,
      fileSize: input.size, mimeType: input.mimeType, folder: `project-${input.projectId}`,
      uploadedBy: ctx.user.id,
    });

    const currentImages: string[] = Array.isArray(proj.images) ? (proj.images as string[]) : [];
    const updatedImages = [...currentImages, url];
    await db.update(projects).set({ images: updatedImages }).where(eq(projects.id, input.projectId));

    await logAudit(ctx.user.id, ctx.user.name || null, "upload", "project", input.projectId, { filename: input.filename, imageCount: updatedImages.length });

    return { success: true, url, imageCount: updatedImages.length };
  }),

  removeProjectImage: protectedProcedure.input(z.object({
    projectId: z.number(),
    imageUrl: z.string(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [proj] = await db.select().from(projects).where(eq(projects.id, input.projectId));
    if (!proj) throw new TRPCError({ code: "NOT_FOUND", message: "المشروع غير موجود" });

    const currentImages: string[] = Array.isArray(proj.images) ? (proj.images as string[]) : [];
    const updatedImages = currentImages.filter(img => img !== input.imageUrl);
    await db.update(projects).set({ images: updatedImages }).where(eq(projects.id, input.projectId));

    await logAudit(ctx.user.id, ctx.user.name || null, "delete", "project", input.projectId, { action: "image_removed", imageCount: updatedImages.length });

    return { success: true, imageCount: updatedImages.length };
  }),

  reorderProjectImages: protectedProcedure.input(z.object({
    projectId: z.number(),
    images: z.array(z.string()),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [proj] = await db.select().from(projects).where(eq(projects.id, input.projectId));
    if (!proj) throw new TRPCError({ code: "NOT_FOUND", message: "المشروع غير موجود" });

    await db.update(projects).set({ images: input.images }).where(eq(projects.id, input.projectId));

    await logAudit(ctx.user.id, ctx.user.name || null, "update", "project", input.projectId, { action: "images_reordered", imageCount: input.images.length });

    return { success: true };
  }),

  getProjectImages: protectedProcedure.input(z.object({
    projectId: z.number(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [proj] = await db.select({ images: projects.images }).from(projects).where(eq(projects.id, input.projectId));
    if (!proj) throw new TRPCError({ code: "NOT_FOUND", message: "المشروع غير موجود" });

    return { images: Array.isArray(proj.images) ? (proj.images as string[]) : [] };
  }),

  // ============ INQUIRIES ============
  listInquiries: protectedProcedure.input(z.object({
    search: z.string().optional(), status: z.string().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [];
    if (input.search) conditions.push(or(like(inquiries.name, `%${input.search}%`), like(inquiries.phone, `%${input.search}%`)));
    if (input.status && input.status !== "all") conditions.push(eq(inquiries.status, input.status as any));
    return db.select().from(inquiries).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(inquiries.createdAt));
  }),

  updateInquiryStatus: protectedProcedure.input(z.object({ id: z.number(), status: z.string() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(inquiries).set({ status: input.status as any }).where(eq(inquiries.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "status_change", "inquiry", input.id, { newStatus: input.status });
    return { success: true };
  }),

  addInquiryNote: protectedProcedure.input(z.object({ id: z.number(), note: z.string() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [existing] = await db.select({ internalNotes: inquiries.internalNotes }).from(inquiries).where(eq(inquiries.id, input.id));
    const sanitizedNote = sanitizeText(input.note);
    const updatedNotes = (existing?.internalNotes || "") + `\n[${new Date().toLocaleString("ar-SA")}] ${ctx.user.name || "مستخدم"}: ${sanitizedNote}`;
    await db.update(inquiries).set({ internalNotes: updatedNotes }).where(eq(inquiries.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "update", "inquiry", input.id, { action: "note_added" });
    return { success: true };
  }),

  exportInquiriesCSV: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const inqs = await db.select().from(inquiries);
    const headers = "الاسم,البريد,الجوال,النوع,الرسالة,الحالة,التاريخ\n";
    const rows = inqs.map(i => `"${i.name}","${i.email}","${i.phone}","${i.inquiryType}","${(i.message || "").replace(/"/g, '""')}","${i.status}","${i.createdAt}"`).join("\n");
    await logAudit(ctx.user.id, ctx.user.name || null, "export", "inquiry", null, { count: inqs.length });
    return { csv: "\uFEFF" + headers + rows };
  }),

  // ============ CMS - PAGES ============
  listPages: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(pages).orderBy(desc(pages.updatedAt));
  }),

  getPage: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [page] = await db.select().from(pages).where(eq(pages.id, input.id));
    if (!page) throw new TRPCError({ code: "NOT_FOUND" });
    return page;
  }),

  createPage: protectedProcedure.input(z.object({
    title: z.string().min(1), slug: z.string().min(1), content: z.string().optional(),
    sections: z.any().optional(), pageType: z.string().optional(), status: z.string().optional(),
    seoTitle: z.string().optional(), seoDescription: z.string().optional(), seoKeywords: z.string().optional(),
    template: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(pages).values({
      title: sanitizeText(input.title), slug: input.slug,
      content: input.content ? sanitizeHtml(input.content) : null,
      sections: input.sections || null, pageType: (input.pageType || "static") as any,
      status: (input.status || "draft") as any,
      seoTitle: input.seoTitle ? sanitizeText(input.seoTitle) : null,
      seoDescription: input.seoDescription ? sanitizeText(input.seoDescription) : null,
      seoKeywords: input.seoKeywords ? sanitizeText(input.seoKeywords) : null,
      template: input.template || "default",
      createdBy: ctx.user.id,
    });
     await logAudit(ctx.user.id, ctx.user.name || null, "create", "page", null, { title: input.title, slug: input.slug });
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "create_page", "cms", `إضافة صفحة: ${input.title}`, "page", undefined, { title: input.title, slug: input.slug });
    return { success: true };
  }),
  updatePage: protectedProcedure.input(z.object({
    id: z.number(), title: z.string().optional(), slug: z.string().optional(), content: z.string().optional(),
    sections: z.any().optional(), pageType: z.string().optional(), status: z.string().optional(),
    seoTitle: z.string().optional(), seoDescription: z.string().optional(), seoKeywords: z.string().optional(),
    template: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [oldPage] = await db.select().from(pages).where(eq(pages.id, input.id));
    const updateData: any = {};
    if (input.title !== undefined) updateData.title = sanitizeText(input.title);
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.content !== undefined) updateData.content = input.content ? sanitizeHtml(input.content) : null;
    if (input.sections !== undefined) updateData.sections = input.sections;
    if (input.pageType !== undefined) updateData.pageType = input.pageType;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.seoTitle !== undefined) updateData.seoTitle = input.seoTitle ? sanitizeText(input.seoTitle) : null;
    if (input.seoDescription !== undefined) updateData.seoDescription = input.seoDescription ? sanitizeText(input.seoDescription) : null;
    if (input.seoKeywords !== undefined) updateData.seoKeywords = input.seoKeywords ? sanitizeText(input.seoKeywords) : null;
    if (input.template !== undefined) updateData.template = input.template;
    await db.update(pages).set(updateData).where(eq(pages.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "update", "page", input.id, {}, oldPage, updateData);
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "update_page", "cms", `تعديل صفحة #${input.id}`, "page", input.id, { changes: Object.keys(updateData) });
    return { success: true };
  }),
  deletePage: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(pages).where(eq(pages.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "delete", "page", input.id, {});
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "delete_page", "cms", `حذف صفحة #${input.id}`, "page", input.id);
    return { success: true };
  }),
  // ============ CMS - HOMEPAGE SECTIONS =============
  listHomepageSections: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(homepageSections).orderBy(homepageSections.displayOrder);
  }),

  updateHomepageSection: protectedProcedure.input(z.object({
    id: z.number(), title: z.string().optional(), subtitle: z.string().optional(),
    content: z.any().optional(), isVisible: z.boolean().optional(), displayOrder: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const updateData: any = { updatedBy: ctx.user.id };
    if (input.title !== undefined) updateData.title = sanitizeText(input.title);
    if (input.subtitle !== undefined) updateData.subtitle = sanitizeText(input.subtitle);
    if (input.content !== undefined) updateData.content = input.content;
    if (input.isVisible !== undefined) updateData.isVisible = input.isVisible;
    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
    await db.update(homepageSections).set(updateData).where(eq(homepageSections.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "update", "section", input.id, updateData);
    return { success: true };
  }),

  // ============ MEDIA ============
  listMedia: protectedProcedure.input(z.object({ search: z.string().optional(), folder: z.string().optional() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [];
    if (input.search) conditions.push(like(media.filename, `%${input.search}%`));
    if (input.folder && input.folder !== "all") conditions.push(eq(media.folder, input.folder));
    return db.select().from(media).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(media.createdAt));
  }),

  uploadMedia: protectedProcedure.input(z.object({
    filename: z.string(), mimeType: z.string(), base64: z.string(), size: z.number(), folder: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const buffer = Buffer.from(input.base64, "base64");
    const ext = input.filename.split(".").pop() || "bin";
    const key = `media/${nanoid(12)}.${ext}`;
    const { url } = await storagePut(key, buffer, input.mimeType);
    const fileType = input.mimeType.startsWith("image") ? "image" : input.mimeType.startsWith("video") ? "video" : "document";
    await db.insert(media).values({
      filename: input.filename, filePath: url, fileType: fileType as any,
      fileSize: input.size, mimeType: input.mimeType, folder: input.folder || "general",
      uploadedBy: ctx.user.id,
    });
    await logAudit(ctx.user.id, ctx.user.name || null, "upload", "media", null, { filename: input.filename });
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "upload_media", "media", `رفع ملف: ${input.filename}`, "media", undefined, { filename: input.filename, fileType });
    return { success: true, url };
  }),
  deleteMedia: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
     await db.delete(media).where(eq(media.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "delete", "media", input.id, {});
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "delete_media", "media", `حذف ملف #${input.id}`, "media", input.id);
    return { success: true };
  }),
  // ============ REPORTS ============
  getReportData: protectedProcedure.input(z.object({ period: z.string().optional() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { totalProperties: 0, totalInquiries: 0, conversionRate: "0%", avgPrice: "0", inquiriesTrend: [], propertiesTrend: [], inquiriesByType: [], propertiesByStatus: [] };

    // Calculate date range based on period
    const now = new Date();
    let periodStart: Date | null = null;
    let trendMonths = 6;
    switch (input?.period) {
      case "week":
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        trendMonths = 1;
        break;
      case "month":
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        trendMonths = 6;
        break;
      case "quarter":
        periodStart = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        trendMonths = 6;
        break;
      case "year":
        periodStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        trendMonths = 12;
        break;
    }

    const propConditions: any[] = [isNull(properties.deletedAt)];
    const inqConditions: any[] = [];
    if (periodStart) {
      propConditions.push(gte(properties.createdAt, periodStart));
      inqConditions.push(gte(inquiries.createdAt, periodStart));
    }

    const [propCount] = await db.select({ count: count() }).from(properties).where(and(...propConditions));
    const [inqCount] = await db.select({ count: count() }).from(inquiries).where(inqConditions.length ? and(...inqConditions) : undefined);
    const completedConds = [...inqConditions, eq(inquiries.status, "completed")];
    const [completedCount] = await db.select({ count: count() }).from(inquiries).where(completedConds.length ? and(...completedConds) : undefined);
    const conversionRate = inqCount.count > 0 ? `${Math.round((completedCount.count / inqCount.count) * 100)}%` : "0%";
    const avgResult = await db.select({ avg: sql<string>`AVG(${properties.price})` }).from(properties).where(and(...propConditions));
    const avgPrice = avgResult[0]?.avg ? Math.round(parseFloat(avgResult[0].avg)).toLocaleString() : "0";

    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const inquiriesTrend = [];
    const propertiesTrend = [];
    for (let i = trendMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const dStr = d.toISOString().slice(0, 19).replace('T', ' ');
      const dEndStr = dEnd.toISOString().slice(0, 19).replace('T', ' ');
      const [ic] = await db.select({ count: count() }).from(inquiries).where(and(sql`${inquiries.createdAt} >= ${dStr}`, sql`${inquiries.createdAt} <= ${dEndStr}`));
      const [pc] = await db.select({ count: count() }).from(properties).where(and(sql`${properties.createdAt} >= ${dStr}`, sql`${properties.createdAt} <= ${dEndStr}`, isNull(properties.deletedAt)));
      inquiriesTrend.push({ label: months[d.getMonth()], count: ic.count });
      propertiesTrend.push({ label: months[d.getMonth()], count: pc.count });
    }

    const inqByType = await db.select({ type: inquiries.inquiryType, count: count() }).from(inquiries).groupBy(inquiries.inquiryType);
    const propByStatus = await db.select({ status: properties.status, count: count() }).from(properties).where(isNull(properties.deletedAt)).groupBy(properties.status);

    return { totalProperties: propCount.count, totalInquiries: inqCount.count, conversionRate, avgPrice, inquiriesTrend, propertiesTrend, inquiriesByType: inqByType, propertiesByStatus: propByStatus };
  }),

  exportReportCSV: protectedProcedure.input(z.object({ type: z.string() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await logAudit(ctx.user.id, ctx.user.name || null, "export", "report", null, { type: input.type });
    if (input.type === "audit") {
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(1000);
      const headers = "المستخدم,الإجراء,النوع,التاريخ\n";
      const rows = logs.map(l => `"${l.userName}","${l.action}","${l.entityType}","${l.createdAt}"`).join("\n");
      return { csv: "\uFEFF" + headers + rows };
    }
    if (input.type === "properties") {
      const props = await db.select().from(properties).where(isNull(properties.deletedAt)).orderBy(desc(properties.createdAt)).limit(5000);
      const headers = "الرقم,العنوان,النوع,نوع العرض,الحالة,السعر,المساحة,الغرف,المدينة,الحي,تاريخ الإضافة\n";
      const rows = props.map(p => `${p.id},"${p.title}","${p.type}","${p.listingType}","${p.status}","${p.price || ''}","${p.area || ''}","${p.rooms || ''}","${p.city || ''}","${p.district || ''}","${p.createdAt}"`).join("\n");
      return { csv: "\uFEFF" + headers + rows };
    }
    if (input.type === "inquiries") {
      const inqs = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt)).limit(5000);
      const headers = "الرقم,الاسم,الجوال,البريد,النوع,الحالة,المصدر,تاريخ الإرسال\n";
      const rows = inqs.map(i => `${i.id},"${i.name}","${i.phone || ''}","${i.email || ''}","${i.inquiryType}","${i.status}","${i.source || ''}","${i.createdAt}"`).join("\n");
      return { csv: "\uFEFF" + headers + rows };
    }
    return { csv: "" };
  }),

  // ============ SETTINGS ============
  getSettings: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {};
    const allSettings = await db.select().from(settings);
    const result: Record<string, string> = {};
    allSettings.forEach(s => { result[s.key] = s.value || ""; });
    return result;
  }),

  updateSettings: protectedProcedure.input(z.object({
    group: z.string(), values: z.record(z.string(), z.string()),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    for (const [key, value] of Object.entries(input.values)) {
      const existing = await db.select().from(settings).where(eq(settings.key, key));
      if (existing.length > 0) {
        await db.update(settings).set({ value: value, groupName: input.group, updatedBy: ctx.user.id }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key: key as string, value: value as string, groupName: input.group, updatedBy: ctx.user.id });
      }
    }
    await logAudit(ctx.user.id, ctx.user.name || null, "settings_change", "setting", null, { group: input.group });
    return { success: true };
  }),

  // ============ NOTIFICATIONS ============
  listNotifications: protectedProcedure.input(z.object({ unreadOnly: z.boolean().optional() })).query(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [eq(notifications.userId, ctx.user.id)];
    if (input.unreadOnly) conditions.push(eq(notifications.isRead, false));
    return db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt)).limit(50);
  }),

  unreadNotificationCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { count: 0 };
    const [result] = await db.select({ count: count() }).from(notifications).where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));
    return { count: result.count };
  }),

  markNotificationRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));
    return { success: true };
  }),

  markAllNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, ctx.user.id));
    return { success: true };
  }),
  sendCustomNotification: protectedProcedure.input(z.object({
    title: z.string().min(1), message: z.string().min(1), type: z.string().optional(),
    targetAll: z.boolean().optional(), targetUserId: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "فقط المدير يمكنه إرسال التنبيهات" });
    const notifType = input.type || "info";
    if (input.targetUserId) {
      await createNotification(input.targetUserId, input.title, input.message, notifType);
    } else {
      const allUsers = await db.select({ id: users.id }).from(users).where(eq(users.status, "active"));
      for (const u of allUsers) {
        await createNotification(u.id, input.title, input.message, notifType);
      }
    }
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "send_notification", "system", `إرسال تنبيه: ${input.title}`, "notification", undefined, { targetAll: !input.targetUserId, type: notifType });
    return { success: true };
  }),
  // ============ MESSAGES =============
  listThreads: protectedProcedure.input(z.object({ filter: z.string().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [or(eq(messages.senderId, ctx.user.id), eq(messages.recipientId, ctx.user.id))];
    if (input.filter === "starred") conditions.push(eq(messages.isStarred, true));
    if (input.filter === "archived") conditions.push(eq(messages.isArchived, true));
    if (!input.filter || input.filter === "inbox") conditions.push(eq(messages.isArchived, false));
    const allMessages = await db.select().from(messages).where(and(...conditions)).orderBy(desc(messages.createdAt));
    // Group by threadId and return latest message per thread
    const threadMap = new Map<string, typeof allMessages[0]>();
    for (const msg of allMessages) {
      if (!threadMap.has(msg.threadId)) threadMap.set(msg.threadId, msg);
    }
    return Array.from(threadMap.values());
  }),

  getThread: protectedProcedure.input(z.object({ threadId: z.string() })).query(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(messages).where(
      and(eq(messages.threadId, input.threadId), or(eq(messages.senderId, ctx.user.id), eq(messages.recipientId, ctx.user.id)))
    ).orderBy(asc(messages.createdAt));
  }),

  sendMessage: protectedProcedure.input(z.object({
    recipientId: z.number(), subject: z.string().optional(), body: z.string().min(1), threadId: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [recipient] = await db.select().from(users).where(eq(users.id, input.recipientId));
    if (!recipient) throw new TRPCError({ code: "NOT_FOUND", message: "المستلم غير موجود" });
    const threadId = input.threadId || nanoid(16);
    await db.insert(messages).values({
      threadId, senderId: ctx.user.id, senderName: ctx.user.name || ctx.user.fullName || "مستخدم",
      recipientId: input.recipientId, recipientName: recipient.name || recipient.fullName || "مستخدم",
      subject: input.subject ? sanitizeText(input.subject) : null, body: sanitizeText(input.body),
    });
    await createNotification(input.recipientId, "رسالة جديدة", `رسالة من ${ctx.user.name || "مستخدم"}: ${input.subject || "بدون عنوان"}`, "message", "/admin/messages");
    return { success: true, threadId };
  }),

  toggleMessageStar: protectedProcedure.input(z.object({ id: z.number(), isStarred: z.boolean() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(messages).set({ isStarred: input.isStarred }).where(eq(messages.id, input.id));
    return { success: true };
  }),

  archiveThread: protectedProcedure.input(z.object({ threadId: z.string() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(messages).set({ isArchived: true }).where(eq(messages.threadId, input.threadId));
    return { success: true };
  }),

  markThreadRead: protectedProcedure.input(z.object({ threadId: z.string() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(messages).set({ isRead: true }).where(and(eq(messages.threadId, input.threadId), eq(messages.recipientId, ctx.user.id)));
    return { success: true };
  }),

  unreadMessageCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { count: 0 };
    const [result] = await db.select({ count: count() }).from(messages).where(and(eq(messages.recipientId, ctx.user.id), eq(messages.isRead, false)));
    return { count: result.count };
  }),

  // ============ AUDIT LOG ============
  getAuditLogs: adminProcedure.input(z.object({
    search: z.string().optional(), action: z.string().optional(), entityType: z.string().optional(),
    dateFrom: z.string().optional(), dateTo: z.string().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [];
    if (input.search) conditions.push(like(auditLogs.userName, `%${input.search}%`));
    if (input.action && input.action !== "all") conditions.push(eq(auditLogs.action, input.action as any));
    if (input.entityType && input.entityType !== "all") conditions.push(eq(auditLogs.entityType, input.entityType));
    if (input.dateFrom) conditions.push(sql`${auditLogs.createdAt} >= ${new Date(input.dateFrom).toISOString().slice(0, 19).replace('T', ' ')}`);
    if (input.dateTo) conditions.push(sql`${auditLogs.createdAt} <= ${new Date(input.dateTo).toISOString().slice(0, 19).replace('T', ' ')}`);
    return db.select().from(auditLogs).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(auditLogs.createdAt)).limit(500);
  }),

  exportAuditLogCSV: adminProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(2000);
    const headers = "المعرف,المستخدم,الإجراء,النوع,المعرف المرتبط,التاريخ\n";
    const rows = logs.map(l => `"${l.id}","${l.userName}","${l.action}","${l.entityType}","${l.entityId || ""}","${l.createdAt}"`).join("\n");
    await logAudit(ctx.user.id, ctx.user.name || null, "export", "audit_log", null, { count: logs.length });
    return { csv: "\uFEFF" + headers + rows };
  }),

  // ============ GUIDES ============
  listGuides: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(guides).where(eq(guides.isPublished, true)).orderBy(guides.displayOrder);
  }),

  getGuide: protectedProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [guide] = await db.select().from(guides).where(eq(guides.slug, input.slug));
    if (!guide) throw new TRPCError({ code: "NOT_FOUND" });
    return guide;
  }),

  // Admin-only guide management
  createGuide: adminProcedure.input(z.object({
    title: z.string().min(1), slug: z.string().min(1), content: z.string().min(1),
    category: z.string().optional(), targetPage: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(guides).values({
      title: input.title, slug: input.slug, content: input.content,
      category: input.category || null, targetPage: input.targetPage || null,
    });
    await logAudit(ctx.user.id, ctx.user.name || null, "create", "guide", null, { title: input.title });
    return { success: true };
  }),

  // ============ ADMIN USERS LIST (for messaging) ============
  listAdminUsers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select({ id: users.id, name: users.name, fullName: users.fullName, email: users.email, role: users.role }).from(users).where(ne(users.role, "user"));
  }),

  // ============ PUBLIC INQUIRY SUBMISSION ============
  submitInquiry: protectedProcedure.input(z.object({
    name: z.string().min(1), email: z.string().optional(), phone: z.string().optional(),
    inquiryType: z.string().optional(), message: z.string().optional(), propertyId: z.number().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(inquiries).values({
      name: input.name, email: input.email || null, phone: input.phone || null,
      inquiryType: (input.inquiryType || "general") as any, message: input.message || null,
      propertyId: input.propertyId || null, source: "website",
    });
    await notifyAdmins("طلب جديد", `طلب جديد من ${input.name}`, "inquiry", "/admin/inquiries");
    return { success: true };
  }),

  // ============ FORGOT PASSWORD ============
  requestPasswordReset: publicProcedure.input(z.object({
    email: z.string().email("البريد الإلكتروني غير صالح"),
    origin: z.string().url().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    // Always return success to prevent email enumeration
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (!user || user.status === "inactive") {
      // Don't reveal if email exists
      return { success: true, message: "إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة إعادة تعيين كلمة المرور" };
    }
    // Invalidate any existing tokens for this user
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(
      and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt))
    );
    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });
    // Send email
    const origin = input.origin || `https://${ctx.req.headers.host}`;
    await sendPasswordResetEmail(
      user.email!,
      token,
      origin,
      user.displayName || user.name || user.fullName || user.username || undefined
    );
    await logAudit(null, null, "create", "password_reset", user.id, { email: input.email });
    return { success: true, message: "إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة إعادة تعيين كلمة المرور" };
  }),

  verifyResetToken: publicProcedure.input(z.object({
    token: z.string().min(1),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [resetToken] = await db.select().from(passwordResetTokens).where(
      and(
        eq(passwordResetTokens.token, input.token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    ).limit(1);
    if (!resetToken) {
      return { valid: false };
    }
    return { valid: true };
  }),

  resetPassword: publicProcedure.input(z.object({
    token: z.string().min(1),
    newPassword: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    confirmPassword: z.string().min(1),
  })).mutation(async ({ input }) => {
    if (input.newPassword !== input.confirmPassword) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "كلمة المرور وتأكيدها غير متطابقتين" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [resetToken] = await db.select().from(passwordResetTokens).where(
      and(
        eq(passwordResetTokens.token, input.token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    ).limit(1);
    if (!resetToken) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية" });
    }
    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(input.newPassword, 12);
    await db.update(users).set({ passwordHash: hashedPassword, failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, resetToken.userId));
    // Mark token as used
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, resetToken.id));
    // Revoke all existing sessions for this user (force re-login)
    await db.update(userSessions).set({ isRevoked: true }).where(eq(userSessions.userId, resetToken.userId));
    await logAudit(resetToken.userId, null, "update", "password_reset", resetToken.userId, { action: "password_reset_completed" });
    return { success: true, message: "تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول" };
  }),

  // ============ SESSION MANAGEMENT ============
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { sessions: [], currentTokenHash: null };
    const sessions = await db.select().from(userSessions).where(
      and(
        eq(userSessions.userId, ctx.user.id),
        eq(userSessions.isRevoked, false),
        gt(userSessions.expiresAt, new Date())
      )
    ).orderBy(desc(userSessions.lastActiveAt));
    const currentTokenHash = getCurrentTokenHash(ctx.req);
    return {
      sessions: sessions.map(s => ({
        id: s.id,
        deviceInfo: s.deviceInfo,
        ipAddress: s.ipAddress,
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.tokenHash === currentTokenHash,
      })),
      currentTokenHash,
    };
  }),

  revokeSession: protectedProcedure.input(z.object({
    sessionId: z.number(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    // Only allow revoking own sessions
    const [session] = await db.select().from(userSessions).where(
      and(eq(userSessions.id, input.sessionId), eq(userSessions.userId, ctx.user.id))
    ).limit(1);
    if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "الجلسة غير موجودة" });
    const currentTokenHash = getCurrentTokenHash(ctx.req);
    if (session.tokenHash === currentTokenHash) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكنك إلغاء الجلسة الحالية" });
    }
    await db.update(userSessions).set({ isRevoked: true }).where(eq(userSessions.id, input.sessionId));
    await logAudit(ctx.user.id, ctx.user.name || null, "delete", "session", input.sessionId, { action: "session_revoked" });
    return { success: true };
  }),

  revokeAllOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const currentTokenHash = getCurrentTokenHash(ctx.req);
    if (currentTokenHash) {
      // Revoke all sessions except current
      await db.update(userSessions).set({ isRevoked: true }).where(
        and(
          eq(userSessions.userId, ctx.user.id),
          eq(userSessions.isRevoked, false),
          sql`${userSessions.tokenHash} != ${currentTokenHash}`
        )
      );
    } else {
      await db.update(userSessions).set({ isRevoked: true }).where(
        and(eq(userSessions.userId, ctx.user.id), eq(userSessions.isRevoked, false))
      );
    }
    await logAudit(ctx.user.id, ctx.user.name || null, "delete", "session", null, { action: "all_other_sessions_revoked" });
    return { success: true };
  }),

  // ============ ENHANCED USER MANAGEMENT ============
  createUserWithCredentials: adminProcedure.input(z.object({
    fullName: z.string().min(1, "الاسم مطلوب"),
    username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
    password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    email: z.string().email("البريد الإلكتروني غير صالح"),
    phone: z.string().optional(),
    role: z.enum(["admin", "manager", "staff"]),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    // Check username uniqueness
    const [existingUser] = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
    if (existingUser) {
      throw new TRPCError({ code: "CONFLICT", message: "اسم المستخدم مستخدم بالفعل" });
    }
    // Check email uniqueness
    const [existingEmail] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (existingEmail) {
      throw new TRPCError({ code: "CONFLICT", message: "البريد الإلكتروني مستخدم بالفعل" });
    }
    const openId = `local-${nanoid(16)}`;
    const passwordHash = await bcrypt.hash(input.password, 12);
    await db.insert(users).values({
      openId,
      username: input.username,
      passwordHash,
      name: input.fullName,
      fullName: input.fullName,
      displayName: input.fullName,
      email: input.email,
      phone: input.phone || null,
      role: input.role,
      status: "active",
    });
    await logAudit(ctx.user.id, ctx.user.name || null, "create", "user", null, { username: input.username, email: input.email, role: input.role });
    await notifyAdmins("مستخدم جديد", `تم إنشاء حساب جديد: ${input.fullName} (${input.role})`, "user_action", "/admin/users", ctx.user.id);
    return { success: true };
  }),

  adminResetUserPassword: adminProcedure.input(z.object({
    userId: z.number(),
    newPassword: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [targetUser] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
    if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });
    const hashedPassword = await bcrypt.hash(input.newPassword, 12);
    await db.update(users).set({ passwordHash: hashedPassword, failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, input.userId));
    // Revoke all sessions for this user
    await db.update(userSessions).set({ isRevoked: true }).where(eq(userSessions.userId, input.userId));
    await logAudit(ctx.user.id, ctx.user.name || null, "update", "user", input.userId, { action: "admin_password_reset" });
    return { success: true };
  }),

  deleteUser: adminProcedure.input(z.object({
    userId: z.number(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    if (input.userId === ctx.user.id) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكنك حذف حسابك الخاص" });
    }
    const [targetUser] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
    if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });
    // Revoke all sessions first
    await db.update(userSessions).set({ isRevoked: true }).where(eq(userSessions.userId, input.userId));
    // Delete the user
    await db.delete(users).where(eq(users.id, input.userId));
    await logAudit(ctx.user.id, ctx.user.name || null, "delete", "user", input.userId, { deletedUser: targetUser.fullName || targetUser.username });
    return { success: true };
  }),

  // ============ TWO-FACTOR AUTHENTICATION (2FA) SETUP ============
  get2FAStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [user] = await db.select({ totpEnabled: users.totpEnabled, totpBackupCodes: users.totpBackupCodes }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    const backupCodes = (user.totpBackupCodes as string[] | null) || [];
    return { enabled: user.totpEnabled, backupCodesRemaining: backupCodes.length };
  }),

  setup2FA: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    if (user.totpEnabled) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "التحقق الثنائي مفعّل بالفعل" });
    }
    const secret = otpGenerateSecret();
    const otpauthUrl = otpGenerateURI({
      secret,
      issuer: "AlQasem-RealEstate",
      label: user.username || user.email || user.openId,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    // Store secret temporarily (not enabled yet until verified)
    await db.update(users).set({ totpSecret: secret }).where(eq(users.id, ctx.user.id));
    return { secret, qrCodeDataUrl, otpauthUrl };
  }),

  verify2FASetup: protectedProcedure.input(z.object({
    code: z.string().min(6).max(6),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user || !user.totpSecret) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "يرجى إعداد التحقق الثنائي أولاً" });
    }
    const result = otpVerifySync({ token: input.code, secret: user.totpSecret });
    if (!result.valid) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "رمز التحقق غير صحيح. تأكد من مزامنة الوقت" });
    }
    // Generate backup codes
    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
    }
    await db.update(users).set({ totpEnabled: true, totpBackupCodes: backupCodes }).where(eq(users.id, ctx.user.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "update", "user", ctx.user.id, { action: "2fa_enabled" });
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "enable_2fa", "auth", "تم تفعيل التحقق الثنائي", "user", ctx.user.id, null, ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString(), ctx.req.headers["user-agent"]);
    return { success: true, backupCodes };
  }),

  disable2FA: protectedProcedure.input(z.object({
    password: z.string().min(1, "كلمة المرور مطلوبة"),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    if (!user.totpEnabled) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "التحقق الثنائي غير مفعّل" });
    }
    if (!user.passwordHash) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن التحقق من الهوية" });
    }
    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة المرور غير صحيحة" });
    }
    await db.update(users).set({ totpEnabled: false, totpSecret: null, totpBackupCodes: null }).where(eq(users.id, ctx.user.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "update", "user", ctx.user.id, { action: "2fa_disabled" });
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "disable_2fa", "auth", "تم تعطيل التحقق الثنائي", "user", ctx.user.id, null, ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString(), ctx.req.headers["user-agent"]);
    return { success: true, message: "تم تعطيل التحقق الثنائي بنجاح" };
  }),

  regenerateBackupCodes: protectedProcedure.input(z.object({
    password: z.string().min(1),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user || !user.totpEnabled) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "التحقق الثنائي غير مفعّل" });
    }
    if (!user.passwordHash) throw new TRPCError({ code: "BAD_REQUEST" });
    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة المرور غير صحيحة" });
    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
    }
    await db.update(users).set({ totpBackupCodes: backupCodes }).where(eq(users.id, ctx.user.id));
    await logActivity(ctx.user.id, ctx.user.name || ctx.user.username, "regenerate_backup_codes", "auth", "تم إعادة إنشاء رموز الاسترداد", "user", ctx.user.id);
    return { success: true, backupCodes };
  }),

  // ============ ACTIVITY DASHBOARD ============
  getUserActivity: adminProcedure.input(z.object({
    userId: z.number(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
    category: z.string().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { activities: [], total: 0 };
    const conditions: any[] = [eq(activityLogs.userId, input.userId)];
    if (input.category && input.category !== "all") {
      conditions.push(eq(activityLogs.category, input.category as any));
    }
    const whereClause = and(...conditions);
    const [totalResult] = await db.select({ count: count() }).from(activityLogs).where(whereClause);
    const activities = await db.select().from(activityLogs).where(whereClause).orderBy(desc(activityLogs.createdAt)).limit(input.limit).offset(input.offset);
    return { activities, total: totalResult?.count || 0 };
  }),

  getMyActivity: protectedProcedure.input(z.object({
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
    category: z.string().optional(),
  })).query(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) return { activities: [], total: 0 };
    const conditions: any[] = [eq(activityLogs.userId, ctx.user.id)];
    if (input.category && input.category !== "all") {
      conditions.push(eq(activityLogs.category, input.category as any));
    }
    const whereClause = and(...conditions);
    const [totalResult] = await db.select({ count: count() }).from(activityLogs).where(whereClause);
    const activities = await db.select().from(activityLogs).where(whereClause).orderBy(desc(activityLogs.createdAt)).limit(input.limit).offset(input.offset);
    return { activities, total: totalResult?.count || 0 };
  }),

  getUserLoginHistory: adminProcedure.input(z.object({
    userId: z.number(),
    limit: z.number().min(1).max(50).default(20),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(userSessions).where(eq(userSessions.userId, input.userId)).orderBy(desc(userSessions.createdAt)).limit(input.limit);
  }),

  getUserActivitySummary: adminProcedure.input(z.object({
    userId: z.number(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { totalActions: 0, lastActive: null, categoryCounts: [], recentSessions: 0 };
    const [totalResult] = await db.select({ count: count() }).from(activityLogs).where(eq(activityLogs.userId, input.userId));
    const [lastActivity] = await db.select({ createdAt: activityLogs.createdAt }).from(activityLogs).where(eq(activityLogs.userId, input.userId)).orderBy(desc(activityLogs.createdAt)).limit(1);
    const categoryCounts = await db.select({
      category: activityLogs.category,
      count: count(),
    }).from(activityLogs).where(eq(activityLogs.userId, input.userId)).groupBy(activityLogs.category);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
    const [recentSessionsResult] = await db.select({ count: count() }).from(userSessions).where(
      and(eq(userSessions.userId, input.userId), sql`${userSessions.createdAt} >= ${thirtyDaysAgoStr}`)
    );
    return {
      totalActions: totalResult?.count || 0,
      lastActive: lastActivity?.createdAt || null,
      categoryCounts,
      recentSessions: recentSessionsResult?.count || 0,
    };
  }),

  getAllActivity: adminProcedure.input(z.object({
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
    category: z.string().optional(),
    userId: z.number().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { activities: [], total: 0 };
    const conditions: any[] = [];
    if (input.userId) conditions.push(eq(activityLogs.userId, input.userId));
    if (input.category && input.category !== "all") {
      conditions.push(eq(activityLogs.category, input.category as any));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [totalResult] = await db.select({ count: count() }).from(activityLogs).where(whereClause);
    const activities = await db.select().from(activityLogs).where(whereClause).orderBy(desc(activityLogs.createdAt)).limit(input.limit).offset(input.offset);
    return { activities, total: totalResult?.count || 0 };
  }),

  // ============ CITIES ============
  listCities: protectedProcedure.input(z.object({ includeInactive: z.boolean().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [];
    if (!input?.includeInactive) conditions.push(eq(cities.isActive, true));
    return db.select().from(cities).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(cities.sortOrder), asc(cities.nameAr));
  }),

  createCity: adminProcedure.input(z.object({
    nameAr: z.string().min(1),
    nameEn: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [result] = await db.insert(cities).values({ nameAr: input.nameAr, nameEn: input.nameEn || null, sortOrder: input.sortOrder ?? 0 });
    await logAudit(ctx.user.id, ctx.user.name || null, "create", "city", result.insertId, { nameAr: input.nameAr });
    await logActivity(ctx.user.id, ctx.user.name || null, "create_city", "settings", `إنشاء مدينة: ${input.nameAr}`, "city", result.insertId);
    return { id: result.insertId };
  }),

  updateCity: adminProcedure.input(z.object({
    id: z.number(),
    nameAr: z.string().min(1),
    nameEn: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(cities).set({ nameAr: input.nameAr, nameEn: input.nameEn || null, sortOrder: input.sortOrder ?? 0 }).where(eq(cities.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "update", "city", input.id, { nameAr: input.nameAr });
    await logActivity(ctx.user.id, ctx.user.name || null, "update_city", "settings", `تحديث مدينة: ${input.nameAr}`, "city", input.id);
    return { success: true };
  }),

  toggleCityActive: adminProcedure.input(z.object({ id: z.number(), isActive: z.boolean() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(cities).set({ isActive: input.isActive }).where(eq(cities.id, input.id));
    // Also deactivate all districts if city is deactivated
    if (!input.isActive) {
      await db.update(districts).set({ isActive: false }).where(eq(districts.cityId, input.id));
    }
    await logAudit(ctx.user.id, ctx.user.name || null, "status_change", "city", input.id, { isActive: input.isActive });
    await logActivity(ctx.user.id, ctx.user.name || null, input.isActive ? "activate_city" : "deactivate_city", "settings", `${input.isActive ? "تفعيل" : "تعطيل"} مدينة`, "city", input.id);
    return { success: true };
  }),

  deleteCity: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    // Delete all districts in this city first
    await db.delete(districts).where(eq(districts.cityId, input.id));
    await db.delete(cities).where(eq(cities.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "delete", "city", input.id, {});
    await logActivity(ctx.user.id, ctx.user.name || null, "delete_city", "settings", "حذف مدينة", "city", input.id);
    return { success: true };
  }),

  // ============ DISTRICTS ============
  listDistricts: protectedProcedure.input(z.object({ cityId: z.number().optional(), includeInactive: z.boolean().optional() }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions: any[] = [];
    if (input?.cityId) conditions.push(eq(districts.cityId, input.cityId));
    if (!input?.includeInactive) conditions.push(eq(districts.isActive, true));
    return db.select().from(districts).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(districts.sortOrder), asc(districts.nameAr));
  }),

  createDistrict: adminProcedure.input(z.object({
    cityId: z.number(),
    nameAr: z.string().min(1),
    nameEn: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [result] = await db.insert(districts).values({ cityId: input.cityId, nameAr: input.nameAr, nameEn: input.nameEn || null, sortOrder: input.sortOrder ?? 0 });
    await logAudit(ctx.user.id, ctx.user.name || null, "create", "district", result.insertId, { nameAr: input.nameAr, cityId: input.cityId });
    await logActivity(ctx.user.id, ctx.user.name || null, "create_district", "settings", `إنشاء حي: ${input.nameAr}`, "district", result.insertId);
    return { id: result.insertId };
  }),

  updateDistrict: adminProcedure.input(z.object({
    id: z.number(),
    cityId: z.number(),
    nameAr: z.string().min(1),
    nameEn: z.string().optional(),
    sortOrder: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(districts).set({ cityId: input.cityId, nameAr: input.nameAr, nameEn: input.nameEn || null, sortOrder: input.sortOrder ?? 0 }).where(eq(districts.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "update", "district", input.id, { nameAr: input.nameAr });
    await logActivity(ctx.user.id, ctx.user.name || null, "update_district", "settings", `تحديث حي: ${input.nameAr}`, "district", input.id);
    return { success: true };
  }),

  toggleDistrictActive: adminProcedure.input(z.object({ id: z.number(), isActive: z.boolean() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(districts).set({ isActive: input.isActive }).where(eq(districts.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "status_change", "district", input.id, { isActive: input.isActive });
    await logActivity(ctx.user.id, ctx.user.name || null, input.isActive ? "activate_district" : "deactivate_district", "settings", `${input.isActive ? "تفعيل" : "تعطيل"} حي`, "district", input.id);
    return { success: true };
  }),

  deleteDistrict: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(districts).where(eq(districts.id, input.id));
    await logAudit(ctx.user.id, ctx.user.name || null, "delete", "district", input.id, {});
    await logActivity(ctx.user.id, ctx.user.name || null, "delete_district", "settings", "حذف حي", "district", input.id);
    return { success: true };
  }),
});
