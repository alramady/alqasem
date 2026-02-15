import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sendEmail } from "../email";
import { customers, otpCodes, customerFavorites, customerSessions, inquiries, financingRequests } from "../../drizzle/schema";
import { eq, and, desc, asc, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "../_core/env";
import { getSessionCookieOptions } from "../_core/cookies";

// Customer cookie name (separate from admin)
const CUSTOMER_COOKIE = "customer_session";
const CUSTOMER_SESSION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

// JWT helpers for customer sessions
async function createCustomerToken(customerId: number, phone: string): Promise<string> {
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  return new SignJWT({ customerId, phone, type: "customer" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor((Date.now() + CUSTOMER_SESSION_MS) / 1000))
    .sign(secret);
}

async function verifyCustomerToken(token: string | undefined | null): Promise<{ customerId: number; phone: string } | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (payload.type !== "customer" || !payload.customerId || !payload.phone) return null;
    return { customerId: payload.customerId as number, phone: payload.phone as string };
  } catch {
    return null;
  }
}

// Extract customer cookie from request
function getCustomerCookie(req: any): string | null {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").reduce((acc: Record<string, string>, c: string) => {
    const [key, ...val] = c.trim().split("=");
    acc[key] = val.join("=");
    return acc;
  }, {} as Record<string, string>);
  return cookies[CUSTOMER_COOKIE] || null;
}

// Middleware-like: resolve customer from cookie
async function resolveCustomer(req: any) {
  const token = getCustomerCookie(req);
  const payload = await verifyCustomerToken(token);
  if (!payload) return null;
  const db = await getDb();
  if (!db) return null;
  const [customer] = await db.select().from(customers).where(eq(customers.id, payload.customerId)).limit(1);
  if (!customer || customer.status !== "active") return null;
  return customer;
}

// Generate 6-digit OTP
function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const customerRouter = router({
  // ============ SEND OTP ============
  sendOTP: publicProcedure.input(z.object({
    phone: z.string().min(9, "رقم الجوال مطلوب").max(15),
    purpose: z.enum(["register", "login", "reset_password"]).default("register"),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const phone = input.phone.replace(/\s+/g, "").replace(/^00/, "+");

    // Rate limit: max 3 OTPs per phone per 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const [recentCount] = await db.select({ cnt: sql<number>`COUNT(*)` })
      .from(otpCodes)
      .where(and(
        eq(otpCodes.phone, phone),
        sql`${otpCodes.createdAt} > ${tenMinAgo.toISOString()}`
      ));
    if ((recentCount?.cnt || 0) >= 3) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "تم إرسال عدة رموز. انتظر قليلاً" });
    }

    // Check if phone already registered (for register purpose)
    if (input.purpose === "register") {
      const [existing] = await db.select({ id: customers.id }).from(customers).where(eq(customers.phone, phone)).limit(1);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "رقم الجوال مسجل مسبقاً. سجل دخولك" });
      }
    }

    // For login/reset, check phone exists
    if (input.purpose === "login" || input.purpose === "reset_password") {
      const [existing] = await db.select({ id: customers.id }).from(customers).where(eq(customers.phone, phone)).limit(1);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "رقم الجوال غير مسجل" });
      }
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.insert(otpCodes).values({
      phone,
      code,
      purpose: input.purpose,
      expiresAt,
    });

    // Send OTP via email (since we have SMTP configured, not SMS)
    // In production, this would be SMS via Twilio/etc.
    // For now, we log it and also try to send via email if customer has email
    console.log(`[OTP] Code ${code} sent to ${phone} for ${input.purpose}`);

    // Try to find customer email for email-based OTP delivery
    const [customer] = await db.select({ email: customers.email }).from(customers).where(eq(customers.phone, phone)).limit(1);
    if (customer?.email) {
      await sendEmail({
        to: customer.email,
        subject: "رمز التحقق | Verification Code",
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f8f5f0; border-radius: 12px;">
            <h2 style="color: #0f1b33; text-align: center;">القاسم العقارية</h2>
            <div style="background: white; padding: 30px; border-radius: 8px; text-align: center;">
              <p style="color: #666; font-size: 16px;">رمز التحقق الخاص بك:</p>
              <div style="font-size: 36px; font-weight: bold; color: #0f1b33; letter-spacing: 8px; padding: 20px; background: #f0f0f0; border-radius: 8px; margin: 15px 0;">${code}</div>
              <p style="color: #999; font-size: 13px;">صالح لمدة 5 دقائق</p>
            </div>
          </div>
        `,
        text: `رمز التحقق: ${code} (صالح لمدة 5 دقائق)`,
      });
    }

    return { success: true, message: "تم إرسال رمز التحقق" };
  }),

  // ============ VERIFY OTP & REGISTER ============
  verifyOTPAndRegister: publicProcedure.input(z.object({
    phone: z.string().min(9).max(15),
    code: z.string().length(6),
    name: z.string().min(2, "الاسم مطلوب"),
    email: z.string().email("البريد غير صحيح").optional().or(z.literal("")),
    password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const phone = input.phone.replace(/\s+/g, "").replace(/^00/, "+");

    // Verify OTP
    const [otp] = await db.select().from(otpCodes)
      .where(and(
        eq(otpCodes.phone, phone),
        eq(otpCodes.code, input.code),
        eq(otpCodes.purpose, "register"),
        eq(otpCodes.isUsed, false as any),
      ))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!otp || new Date(otp.expiresAt) < new Date()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "رمز التحقق غير صحيح أو منتهي الصلاحية" });
    }

    // Check phone not already registered
    const [existing] = await db.select({ id: customers.id }).from(customers).where(eq(customers.phone, phone)).limit(1);
    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "رقم الجوال مسجل مسبقاً" });
    }

    // Mark OTP as used
    await db.update(otpCodes).set({ isUsed: true as any }).where(eq(otpCodes.id, otp.id));

    // Create customer
    const passwordHash = await bcrypt.hash(input.password, 12);
    const [result] = await db.insert(customers).values({
      phone,
      email: input.email || null,
      name: input.name,
      passwordHash,
      isVerified: true as any,
    }).$returningId();

    const customerId = result.id;

    // Create session
    const token = await createCustomerToken(customerId, phone);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const ua = ctx.req.headers["user-agent"] || "";
    const ip = ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString() || "unknown";

    await db.insert(customerSessions).values({
      customerId,
      tokenHash,
      deviceInfo: ua.substring(0, 200),
      ipAddress: ip,
      expiresAt: new Date(Date.now() + CUSTOMER_SESSION_MS),
    });

    // Set cookie
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(CUSTOMER_COOKIE, token, {
      ...cookieOptions,
      maxAge: CUSTOMER_SESSION_MS,
    });

    return {
      success: true,
      customer: { id: customerId, name: input.name, phone, email: input.email || null },
    };
  }),

  // ============ LOGIN WITH PASSWORD ============
  login: publicProcedure.input(z.object({
    phone: z.string().min(9).max(15),
    password: z.string().min(1),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const phone = input.phone.replace(/\s+/g, "").replace(/^00/, "+");

    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
    if (!customer || !customer.passwordHash) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "رقم الجوال أو كلمة المرور غير صحيحة" });
    }

    if (customer.status !== "active") {
      throw new TRPCError({ code: "FORBIDDEN", message: "الحساب معطّل" });
    }

    const valid = await bcrypt.compare(input.password, customer.passwordHash);
    if (!valid) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "رقم الجوال أو كلمة المرور غير صحيحة" });
    }

    // Update last login
    await db.update(customers).set({ lastLoginAt: new Date() }).where(eq(customers.id, customer.id));

    // Create session
    const token = await createCustomerToken(customer.id, phone);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const ua = ctx.req.headers["user-agent"] || "";
    const ip = ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString() || "unknown";

    await db.insert(customerSessions).values({
      customerId: customer.id,
      tokenHash,
      deviceInfo: ua.substring(0, 200),
      ipAddress: ip,
      expiresAt: new Date(Date.now() + CUSTOMER_SESSION_MS),
    });

    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(CUSTOMER_COOKIE, token, {
      ...cookieOptions,
      maxAge: CUSTOMER_SESSION_MS,
    });

    return {
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        avatar: customer.avatar,
      },
    };
  }),

  // ============ LOGIN WITH OTP (passwordless) ============
  verifyOTPLogin: publicProcedure.input(z.object({
    phone: z.string().min(9).max(15),
    code: z.string().length(6),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const phone = input.phone.replace(/\s+/g, "").replace(/^00/, "+");

    // Verify OTP
    const [otp] = await db.select().from(otpCodes)
      .where(and(
        eq(otpCodes.phone, phone),
        eq(otpCodes.code, input.code),
        eq(otpCodes.purpose, "login"),
        eq(otpCodes.isUsed, false as any),
      ))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!otp || new Date(otp.expiresAt) < new Date()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "رمز التحقق غير صحيح أو منتهي" });
    }

    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
    if (!customer) {
      throw new TRPCError({ code: "NOT_FOUND", message: "الحساب غير موجود" });
    }

    // Mark OTP used
    await db.update(otpCodes).set({ isUsed: true as any }).where(eq(otpCodes.id, otp.id));
    await db.update(customers).set({ lastLoginAt: new Date() }).where(eq(customers.id, customer.id));

    const token = await createCustomerToken(customer.id, phone);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await db.insert(customerSessions).values({
      customerId: customer.id,
      tokenHash,
      deviceInfo: (ctx.req.headers["user-agent"] || "").substring(0, 200),
      ipAddress: ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString() || "unknown",
      expiresAt: new Date(Date.now() + CUSTOMER_SESSION_MS),
    });

    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(CUSTOMER_COOKIE, token, { ...cookieOptions, maxAge: CUSTOMER_SESSION_MS });

    return {
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        avatar: customer.avatar,
      },
    };
  }),

  // ============ GET CURRENT CUSTOMER (me) ============
  me: publicProcedure.query(async ({ ctx }) => {
    const customer = await resolveCustomer(ctx.req);
    return customer ? {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      avatar: customer.avatar,
      preferredLanguage: customer.preferredLanguage,
      isVerified: customer.isVerified,
      createdAt: customer.createdAt,
    } : null;
  }),

  // ============ LOGOUT ============
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(CUSTOMER_COOKIE, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),

  // ============ UPDATE PROFILE ============
  updateProfile: publicProcedure.input(z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional().or(z.literal("")),
    preferredLanguage: z.enum(["ar", "en"]).optional(),
  })).mutation(async ({ input, ctx }) => {
    const customer = await resolveCustomer(ctx.req);
    if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "يرجى تسجيل الدخول" });

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const updateData: Record<string, any> = {};
    if (input.name !== undefined) updateData.customerName = input.name;
    if (input.email !== undefined) updateData.email = input.email || null;
    if (input.preferredLanguage !== undefined) updateData.preferredLanguage = input.preferredLanguage;

    if (Object.keys(updateData).length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "لا توجد بيانات للتحديث" });
    }

    await db.update(customers).set(updateData).where(eq(customers.id, customer.id));
    return { success: true };
  }),

  // ============ CHANGE PASSWORD ============
  changePassword: publicProcedure.input(z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
  })).mutation(async ({ input, ctx }) => {
    const customer = await resolveCustomer(ctx.req);
    if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "يرجى تسجيل الدخول" });
    if (!customer.passwordHash) throw new TRPCError({ code: "BAD_REQUEST" });

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const valid = await bcrypt.compare(input.currentPassword, customer.passwordHash);
    if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة المرور الحالية غير صحيحة" });

    const hash = await bcrypt.hash(input.newPassword, 12);
    await db.update(customers).set({ passwordHash: hash }).where(eq(customers.id, customer.id));
    return { success: true };
  }),

  // ============ FAVORITES ============
  getFavorites: publicProcedure.query(async ({ ctx }) => {
    const customer = await resolveCustomer(ctx.req);
    if (!customer) return [];

    const db = await getDb();
    if (!db) return [];

    const favs = await db.select({ propertyId: customerFavorites.propertyId, addedAt: customerFavorites.addedAt })
      .from(customerFavorites)
      .where(eq(customerFavorites.customerId, customer.id))
      .orderBy(desc(customerFavorites.addedAt));

    return favs.map(f => f.propertyId);
  }),

  syncFavorites: publicProcedure.input(z.object({
    propertyIds: z.array(z.number().int().positive()),
  })).mutation(async ({ input, ctx }) => {
    const customer = await resolveCustomer(ctx.req);
    if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "يرجى تسجيل الدخول" });

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Get existing favorites
    const existing = await db.select({ propertyId: customerFavorites.propertyId })
      .from(customerFavorites)
      .where(eq(customerFavorites.customerId, customer.id));
    const existingIds = new Set(existing.map(e => e.propertyId));

    // Add new ones from localStorage that aren't in DB
    const toAdd = input.propertyIds.filter(id => !existingIds.has(id));
    for (const propertyId of toAdd) {
      await db.insert(customerFavorites).values({
        customerId: customer.id,
        propertyId,
      });
    }

    // Return merged list (DB + new from localStorage)
    const allFavs = await db.select({ propertyId: customerFavorites.propertyId })
      .from(customerFavorites)
      .where(eq(customerFavorites.customerId, customer.id))
      .orderBy(desc(customerFavorites.addedAt));

    return allFavs.map(f => f.propertyId);
  }),

  toggleFavorite: publicProcedure.input(z.object({
    propertyId: z.number().int().positive(),
  })).mutation(async ({ input, ctx }) => {
    const customer = await resolveCustomer(ctx.req);
    if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "يرجى تسجيل الدخول" });

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [existing] = await db.select().from(customerFavorites)
      .where(and(
        eq(customerFavorites.customerId, customer.id),
        eq(customerFavorites.propertyId, input.propertyId),
      ))
      .limit(1);

    if (existing) {
      await db.delete(customerFavorites).where(eq(customerFavorites.id, existing.id));
      return { added: false };
    } else {
      await db.insert(customerFavorites).values({
        customerId: customer.id,
        propertyId: input.propertyId,
      });
      return { added: true };
    }
  }),

  clearFavorites: publicProcedure.mutation(async ({ ctx }) => {
    const customer = await resolveCustomer(ctx.req);
    if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "يرجى تسجيل الدخول" });

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    await db.delete(customerFavorites).where(eq(customerFavorites.customerId, customer.id));
    return { success: true };
  }),

  // ============ MY INQUIRIES ============
  getMyInquiries: publicProcedure.query(async ({ ctx }) => {
    const customer = await resolveCustomer(ctx.req);
    if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "يرجى تسجيل الدخول" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const results = await db.select().from(inquiries)
      .where(eq(inquiries.phone, customer.phone))
      .orderBy(desc(inquiries.createdAt))
      .limit(50);
    return results;
  }),

  // ============ MY FINANCING REQUESTS ============
  getMyFinancingRequests: publicProcedure.query(async ({ ctx }) => {
    const customer = await resolveCustomer(ctx.req);
    if (!customer) throw new TRPCError({ code: "UNAUTHORIZED", message: "يرجى تسجيل الدخول" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const results = await db.select().from(financingRequests)
      .where(eq(financingRequests.customerPhone, customer.phone))
      .orderBy(desc(financingRequests.createdAt))
      .limit(50);
    return results;
  }),
});
