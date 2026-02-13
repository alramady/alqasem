import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sanitizeText } from "../sanitize";
import { inquiries, properties, projects, notifications, users, auditLogs, settings, homepageSections, pages } from "../../drizzle/schema";
import { eq, desc, asc, and, isNull, like, or, gte, lte, sql, count } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Helper to notify all admins
async function notifyAdmins(title: string, message: string, type: string, link?: string) {
  const db = await getDb();
  if (!db) return;
  try {
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        title,
        message,
        type: type as any,
        link,
      });
    }
  } catch (e) {
    console.error("[Notification] Failed to notify admins:", e);
  }
}

// Helper to log audit events
async function logPublicAudit(action: string, entityType: string, entityId: number | null, details: any) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values({
      userId: null,
      userName: "زائر",
      action: action as any,
      entityType,
      entityId,
      details,
    });
  } catch (e) {
    console.error("[AuditLog] Failed to log:", e);
  }
}

export const publicRouter = router({
  // ============ SITE CONFIG (settings + CMS) ============
  getSiteConfig: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { settings: {}, sections: [] };

    const [allSettings, allSections] = await Promise.all([
      db.select().from(settings),
      db.select().from(homepageSections).orderBy(homepageSections.displayOrder),
    ]);

    const settingsMap: Record<string, string> = {};
    allSettings.forEach(s => { settingsMap[s.key] = s.value || ""; });

    return {
      settings: settingsMap,
      sections: allSections,
    };
  }),

  // ============ CMS PAGES (PUBLIC) ============
  listPublishedPages: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const result = await db.select({
      id: pages.id,
      title: pages.title,
      titleEn: pages.titleEn,
      slug: pages.slug,
      pageType: pages.pageType,
      seoTitle: pages.seoTitle,
      seoDescription: pages.seoDescription,
      template: pages.template,
    }).from(pages).where(eq(pages.status, "published")).orderBy(asc(pages.title));
    return result;
  }),

  getPageBySlug: publicProcedure.input(z.object({
    slug: z.string().min(1),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "خطأ في الاتصال بقاعدة البيانات" });

    const [page] = await db.select().from(pages)
      .where(and(eq(pages.slug, input.slug), eq(pages.status, "published")))
      .limit(1);
    if (!page) throw new TRPCError({ code: "NOT_FOUND", message: "الصفحة غير موجودة" });

    return page;
  }),

  // ============ SEARCH & FILTER ============
  searchProperties: publicProcedure.input(z.object({
    query: z.string().optional(),
    type: z.enum(["villa", "apartment", "land", "commercial", "office", "building"]).optional(),
    listingType: z.enum(["sale", "rent"]).optional(),
    status: z.enum(["active", "sold", "rented", "draft"]).optional(),
    city: z.string().optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    minArea: z.number().min(0).optional(),
    maxArea: z.number().min(0).optional(),
    minRooms: z.number().int().min(0).optional(),
    maxRooms: z.number().int().min(0).optional(),
    sort: z.enum(["newest", "oldest", "price_asc", "price_desc", "area_asc", "area_desc"]).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(50).optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "خطأ في الاتصال بقاعدة البيانات" });

    const page = input?.page || 1;
    const limit = input?.limit || 12;
    const offset = (page - 1) * limit;

    const conditions: any[] = [isNull(properties.deletedAt)];

    // Default to active only unless explicitly requesting other statuses
    if (input?.status) {
      conditions.push(eq(properties.status, input.status));
    } else {
      conditions.push(eq(properties.status, "active"));
    }

    if (input?.type) conditions.push(eq(properties.type, input.type));
    if (input?.listingType) conditions.push(eq(properties.listingType, input.listingType));
    if (input?.city) conditions.push(eq(properties.city, input.city));
    if (input?.minPrice) conditions.push(gte(properties.price, String(input.minPrice)));
    if (input?.maxPrice) conditions.push(lte(properties.price, String(input.maxPrice)));
    if (input?.minArea) conditions.push(gte(properties.area, String(input.minArea)));
    if (input?.maxArea) conditions.push(lte(properties.area, String(input.maxArea)));
    if (input?.minRooms) conditions.push(gte(properties.rooms, input.minRooms));
    if (input?.maxRooms) conditions.push(lte(properties.rooms, input.maxRooms));

    if (input?.query && input.query.trim()) {
      const q = `%${input.query.trim()}%`;
      conditions.push(
        or(
          like(properties.title, q),
          like(properties.titleEn, q),
          like(properties.description, q),
          like(properties.descriptionEn, q),
          like(properties.city, q),
          like(properties.cityEn, q),
          like(properties.district, q),
          like(properties.districtEn, q),
          like(properties.address, q),
          like(properties.addressEn, q)
        )
      );
    }

    const whereClause = and(...conditions);

    // Sorting
    let orderBy;
    switch (input?.sort) {
      case "oldest": orderBy = asc(properties.createdAt); break;
      case "price_asc": orderBy = asc(properties.price); break;
      case "price_desc": orderBy = desc(properties.price); break;
      case "area_asc": orderBy = asc(properties.area); break;
      case "area_desc": orderBy = desc(properties.area); break;
      default: orderBy = desc(properties.createdAt);
    }

    const [items, totalResult] = await Promise.all([
      db.select().from(properties).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ total: count() }).from(properties).where(whereClause),
    ]);

    const total = totalResult[0]?.total || 0;

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }),

  searchProjects: publicProcedure.input(z.object({
    query: z.string().optional(),
    status: z.enum(["active", "completed", "upcoming"]).optional(),
    sort: z.enum(["newest", "oldest", "units_asc", "units_desc"]).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(50).optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "خطأ في الاتصال بقاعدة البيانات" });

    const page = input?.page || 1;
    const limit = input?.limit || 12;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (input?.status) conditions.push(eq(projects.status, input.status));

    if (input?.query && input.query.trim()) {
      const q = `%${input.query.trim()}%`;
      conditions.push(
        or(
          like(projects.title, q),
          like(projects.titleEn, q),
          like(projects.subtitle, q),
          like(projects.subtitleEn, q),
          like(projects.description, q),
          like(projects.descriptionEn, q),
          like(projects.location, q),
          like(projects.locationEn, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;
    switch (input?.sort) {
      case "oldest": orderBy = asc(projects.createdAt); break;
      case "units_asc": orderBy = asc(projects.totalUnits); break;
      case "units_desc": orderBy = desc(projects.totalUnits); break;
      default: orderBy = desc(projects.createdAt);
    }

    const [items, totalResult] = await Promise.all([
      db.select().from(projects).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ total: count() }).from(projects).where(whereClause),
    ]);

    const total = totalResult[0]?.total || 0;

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }),

  // Get distinct cities for filter dropdown
  getPropertyCities: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "خطأ في الاتصال بقاعدة البيانات" });

    const result = await db.selectDistinct({ city: properties.city })
      .from(properties)
      .where(and(isNull(properties.deletedAt), eq(properties.status, "active")));

    return result.map(r => r.city).filter(Boolean) as string[];
  }),

  // ============ PUBLIC PROJECT QUERIES ============
  getProject: publicProcedure.input(z.object({
    id: z.number().int().positive(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "خطأ في الاتصال بقاعدة البيانات" });

    const [project] = await db.select().from(projects).where(eq(projects.id, input.id)).limit(1);
    if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "المشروع غير موجود" });

    return project;
  }),

  listActiveProjects: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "خطأ في الاتصال بقاعدة البيانات" });

    const result = await db.select().from(projects).orderBy(desc(projects.displayOrder), desc(projects.createdAt));
    return result;
  }),

  getProperty: publicProcedure.input(z.object({
    id: z.number().int().positive(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "خطأ في الاتصال بقاعدة البيانات" });

    const [property] = await db.select().from(properties)
      .where(and(eq(properties.id, input.id), isNull(properties.deletedAt)))
      .limit(1);
    if (!property) throw new TRPCError({ code: "NOT_FOUND", message: "العقار غير موجود" });

    return property;
  }),

  listActiveProperties: publicProcedure.input(z.object({
    type: z.string().optional(),
    listingType: z.string().optional(),
    city: z.string().optional(),
    limit: z.number().int().positive().max(50).optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "خطأ في الاتصال بقاعدة البيانات" });

    const conditions = [isNull(properties.deletedAt), eq(properties.status, "active")];

    const result = await db.select().from(properties)
      .where(and(...conditions))
      .orderBy(desc(properties.createdAt))
      .limit(input?.limit || 20);
    return result;
  }),

  // ============ CONTACT FORM SUBMISSION ============
  submitInquiry: publicProcedure.input(z.object({
    name: z.string().min(2, "الاسم مطلوب (حرفين على الأقل)"),
    phone: z.string().min(9, "رقم الجوال مطلوب"),
    email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
    subject: z.string().optional(),
    message: z.string().min(5, "الرسالة مطلوبة (5 أحرف على الأقل)"),
    source: z.string().optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "خطأ في الاتصال بقاعدة البيانات" });

    // Map subject to inquiry type
    let inquiryType: "buy" | "rent" | "sell" | "general" | "management" = "general";
    if (input.subject === "شراء عقار") inquiryType = "buy";
    else if (input.subject === "إيجار عقار") inquiryType = "rent";
    else if (input.subject === "إدارة أملاك") inquiryType = "management";

    const result = await db.insert(inquiries).values({
      name: sanitizeText(input.name),
      phone: sanitizeText(input.phone),
      email: input.email ? sanitizeText(input.email) : null,
      inquiryType,
      message: input.subject ? `[${sanitizeText(input.subject)}] ${sanitizeText(input.message)}` : sanitizeText(input.message),
      source: sanitizeText(input.source || "contact_form"),
      status: "new",
    });

    const insertId = Number(result[0].insertId);

    // Notify all admins
    await notifyAdmins(
      "📩 رسالة جديدة من الموقع",
      `${input.name} أرسل رسالة جديدة: ${input.message.substring(0, 100)}${input.message.length > 100 ? "..." : ""}`,
      "inquiry",
      "/admin/inquiries"
    );

    // Log audit
    await logPublicAudit("create", "inquiry", insertId, {
      name: input.name,
      phone: input.phone,
      source: input.source || "contact_form",
    });

    return { success: true, id: insertId, message: "تم إرسال رسالتك بنجاح! سنتواصل معك قريباً." };
  }),

  // ============ ADD PROPERTY SUBMISSION ============
  submitProperty: publicProcedure.input(z.object({
    type: z.string().min(1, "نوع العقار مطلوب"),
    purpose: z.string().min(1, "الغرض مطلوب"),
    city: z.string().min(1, "المدينة مطلوبة"),
    district: z.string().optional(),
    area: z.string().optional(),
    rooms: z.string().optional(),
    bathrooms: z.string().optional(),
    price: z.string().optional(),
    description: z.string().optional(),
    name: z.string().min(2, "الاسم مطلوب"),
    phone: z.string().min(9, "رقم الجوال مطلوب"),
    email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "خطأ في الاتصال بقاعدة البيانات" });

    // Map type string to enum value
    const typeMap: Record<string, "villa" | "apartment" | "land" | "commercial" | "office" | "building"> = {
      villa: "villa",
      apartment: "apartment",
      land: "land",
      commercial: "commercial",
    };

    const listingMap: Record<string, "sale" | "rent"> = {
      sale: "sale",
      rent: "rent",
    };

    // Create property as draft
    const result = await db.insert(properties).values({
      title: `عقار جديد - ${input.type === "villa" ? "فيلا" : input.type === "apartment" ? "شقة" : input.type === "land" ? "أرض" : "تجاري"} في ${input.city}`,
      description: input.description || null,
      type: typeMap[input.type] || "villa",
      listingType: listingMap[input.purpose] || "sale",
      status: "draft",
      price: input.price || null,
      area: input.area || null,
      rooms: input.rooms ? parseInt(input.rooms) : null,
      bathrooms: input.bathrooms ? parseInt(input.bathrooms) : null,
      city: input.city,
      district: input.district || null,
    });

    const propertyId = Number(result[0].insertId);

    // Also create an inquiry linked to this property
    await db.insert(inquiries).values({
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      inquiryType: input.purpose === "rent" ? "rent" : "sell",
      message: `طلب إضافة عقار جديد - ${input.type === "villa" ? "فيلا" : input.type === "apartment" ? "شقة" : input.type === "land" ? "أرض" : "تجاري"} في ${input.city}${input.district ? `، حي ${input.district}` : ""}${input.area ? ` - المساحة: ${input.area} م²` : ""}${input.price ? ` - السعر: ${input.price} ر.س` : ""}`,
      propertyId,
      source: "add_property_form",
      status: "new",
    });

    // Notify all admins
    await notifyAdmins(
      "🏠 طلب إضافة عقار جديد",
      `${input.name} يريد إضافة ${input.type === "villa" ? "فيلا" : input.type === "apartment" ? "شقة" : input.type === "land" ? "أرض" : "عقار تجاري"} في ${input.city}${input.price ? ` بسعر ${input.price} ر.س` : ""}`,
      "property",
      "/admin/properties"
    );

    // Log audit
    await logPublicAudit("create", "property", propertyId, {
      type: input.type,
      purpose: input.purpose,
      city: input.city,
      submittedBy: input.name,
      phone: input.phone,
    });

    return { success: true, id: propertyId, message: "تم استلام طلبك بنجاح! سيقوم فريقنا بمراجعة العقار والتواصل معك." };
  }),

  // ============ PROPERTY REQUEST SUBMISSION ============
  submitPropertyRequest: publicProcedure.input(z.object({
    type: z.string().optional(),
    purpose: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    rooms: z.string().optional(),
    minArea: z.string().optional(),
    details: z.string().optional(),
    name: z.string().min(2, "الاسم مطلوب"),
    phone: z.string().min(9, "رقم الجوال مطلوب"),
    email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "خطأ في الاتصال بقاعدة البيانات" });

    const typeLabel = input.type === "villa" ? "فيلا" : input.type === "apartment" ? "شقة" : input.type === "land" ? "أرض" : input.type === "commercial" ? "تجاري" : "أي نوع";
    const purposeLabel = input.purpose === "buy" ? "شراء" : input.purpose === "rent" ? "إيجار" : "غير محدد";

    let message = `طلب عقار - ${typeLabel} ${purposeLabel}`;
    if (input.city) message += ` في ${input.city}`;
    if (input.district) message += `، حي ${input.district}`;
    if (input.minPrice || input.maxPrice) message += ` | الميزانية: ${input.minPrice || "0"} - ${input.maxPrice || "غير محدد"} ر.س`;
    if (input.rooms) message += ` | ${input.rooms} غرف`;
    if (input.minArea) message += ` | الحد الأدنى للمساحة: ${input.minArea} م²`;
    if (input.details) message += `\n${input.details}`;

    const result = await db.insert(inquiries).values({
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      inquiryType: input.purpose === "rent" ? "rent" : "buy",
      message,
      source: "property_request_form",
      status: "new",
    });

    const insertId = Number(result[0].insertId);

    // Notify all admins
    await notifyAdmins(
      "🔍 طلب بحث عن عقار",
      `${input.name} يبحث عن ${typeLabel} ${purposeLabel}${input.city ? ` في ${input.city}` : ""}`,
      "inquiry",
      "/admin/inquiries"
    );

    // Log audit
    await logPublicAudit("create", "inquiry", insertId, {
      type: "property_request",
      propertyType: input.type,
      purpose: input.purpose,
      city: input.city,
      submittedBy: input.name,
    });

    return { success: true, id: insertId, message: "تم استلام طلبك بنجاح! سنبحث لك عن أفضل الخيارات المتاحة." };
  }),
});
