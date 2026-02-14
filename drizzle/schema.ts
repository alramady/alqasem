import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow + admin RBAC.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 100 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  displayName: varchar("displayName", { length: 255 }),
  name: text("name"),
  fullName: varchar("fullName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  avatar: varchar("avatar", { length: 1000 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "manager", "staff"]).default("user").notNull(),
  status: mysqlEnum("userStatus", ["active", "inactive"]).default("active").notNull(),
  failedLoginAttempts: int("failedLoginAttempts").default(0),
  lockedUntil: timestamp("lockedUntil"),
  totpSecret: varchar("totpSecret", { length: 255 }),
  totpEnabled: boolean("totpEnabled").default(false).notNull(),
  totpBackupCodes: json("totpBackupCodes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Permissions table for granular access control.
 */
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  role: mysqlEnum("permRole", ["admin", "manager", "staff"]).notNull(),
  module: varchar("module", { length: 100 }).notNull(),
  canView: boolean("canView").default(false).notNull(),
  canCreate: boolean("canCreate").default(false).notNull(),
  canEdit: boolean("canEdit").default(false).notNull(),
  canDelete: boolean("canDelete").default(false).notNull(),
  canExport: boolean("canExport").default(false).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

/**
 * Properties table for real estate listings.
 */
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  titleEn: varchar("titleEn", { length: 500 }),
  description: text("description"),
  descriptionEn: text("descriptionEn"),
  type: mysqlEnum("propertyType", ["villa", "apartment", "land", "commercial", "office", "building"]).default("villa").notNull(),
  listingType: mysqlEnum("listingType", ["sale", "rent"]).default("sale").notNull(),
  status: mysqlEnum("propertyStatus", ["active", "sold", "rented", "draft"]).default("active").notNull(),
  price: decimal("price", { precision: 15, scale: 2 }),
  area: decimal("area", { precision: 10, scale: 2 }),
  rooms: int("rooms"),
  bathrooms: int("bathrooms"),
  hasParking: boolean("hasParking").default(false),
  city: varchar("city", { length: 100 }).default("الرياض"),
  cityEn: varchar("cityEn", { length: 100 }),
  district: varchar("district", { length: 200 }),
  districtEn: varchar("districtEn", { length: 200 }),
  address: text("address"),
  addressEn: text("addressEn"),
  features: json("features"),
  images: json("images"),
  videoUrl: varchar("videoUrl", { length: 1000 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  floor: int("floor"),
  direction: mysqlEnum("direction", ["north", "south", "east", "west", "north_east", "north_west", "south_east", "south_west"]),
  furnishing: mysqlEnum("furnishing", ["furnished", "semi_furnished", "unfurnished"]),
  buildingAge: int("buildingAge"),
  viewCount: int("viewCount").default(0),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
});
export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Projects table for development projects.
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  titleEn: varchar("titleEn", { length: 500 }),
  subtitle: varchar("subtitle", { length: 500 }),
  subtitleEn: varchar("subtitleEn", { length: 500 }),
  description: text("description"),
  descriptionEn: text("descriptionEn"),
  location: varchar("location", { length: 500 }),
  locationEn: varchar("locationEn", { length: 500 }),
  status: mysqlEnum("projectStatus", ["active", "completed", "upcoming"]).default("active").notNull(),
  totalUnits: int("totalUnits"),
  soldUnits: int("soldUnits"),
  features: json("features"),
  images: json("images"),
  videoUrl: varchar("videoUrl", { length: 1000 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  displayOrder: int("displayOrder").default(0),
  isFeatured: boolean("isFeatured").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Inquiries from website visitors.
 */
export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  inquiryType: mysqlEnum("inquiryType", ["buy", "rent", "sell", "general", "management"]).default("general").notNull(),
  message: text("message"),
  propertyId: int("propertyId"),
  status: mysqlEnum("inquiryStatus", ["new", "in_progress", "completed", "closed"]).default("new").notNull(),
  assignedTo: int("assignedTo"),
  internalNotes: text("internalNotes"),
  source: varchar("source", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

/**
 * Media library for uploaded files.
 */
export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 500 }).notNull(),
  filePath: varchar("filePath", { length: 1000 }).notNull(),
  fileType: mysqlEnum("fileType", ["image", "video", "document", "other"]).default("image").notNull(),
  fileSize: bigint("fileSize", { mode: "number" }),
  mimeType: varchar("mimeType", { length: 100 }),
  altText: varchar("altText", { length: 500 }),
  folder: varchar("folder", { length: 255 }).default("general"),
  thumbnailUrl: varchar("thumbnailUrl", { length: 1000 }),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;

/**
 * CMS pages with page builder support.
 */
export const pages = mysqlTable("pages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  titleEn: varchar("titleEn", { length: 500 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content"),
  contentEn: text("contentEn"),
  sections: json("sections"), // JSON array of page builder sections
  pageType: mysqlEnum("pageType", ["static", "dynamic", "landing"]).default("static").notNull(),
  status: mysqlEnum("pageStatus", ["published", "draft", "archived"]).default("published").notNull(),
  seoTitle: varchar("seoTitle", { length: 500 }),
  seoDescription: text("seoDescription"),
  seoKeywords: varchar("seoKeywords", { length: 500 }),
  ogImage: varchar("ogImage", { length: 1000 }),
  template: varchar("template", { length: 100 }).default("default"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Page = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;

/**
 * Homepage sections for CMS control.
 */
export const homepageSections = mysqlTable("homepage_sections", {
  id: int("id").autoincrement().primaryKey(),
  sectionKey: varchar("sectionKey", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 500 }),
  subtitle: varchar("subtitle", { length: 500 }),
  content: json("content"),
  isVisible: boolean("isVisible").default(true),
  displayOrder: int("displayOrder").default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});

export type HomepageSection = typeof homepageSections.$inferSelect;
export type InsertHomepageSection = typeof homepageSections.$inferInsert;

/**
 * Settings key-value store.
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("settingKey", { length: 100 }).notNull().unique(),
  value: text("settingValue"),
  groupName: varchar("groupName", { length: 100 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("updatedBy"),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

/**
 * Notifications for admin users.
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  message: text("message"),
  type: mysqlEnum("notificationType", ["inquiry", "system", "user_action", "property", "project", "message"]).default("system").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  link: varchar("link", { length: 1000 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Internal messaging between admin users.
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  threadId: varchar("threadId", { length: 64 }).notNull(),
  senderId: int("senderId").notNull(),
  senderName: varchar("senderName", { length: 255 }),
  recipientId: int("recipientId").notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  subject: varchar("subject", { length: 500 }),
  body: text("body").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  isStarred: boolean("isStarred").default(false).notNull(),
  isArchived: boolean("isArchived").default(false).notNull(),
  parentId: int("parentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Audit log for tracking all admin actions.
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  userName: varchar("userName", { length: 255 }),
  action: mysqlEnum("auditAction", ["create", "update", "delete", "login", "logout", "status_change", "export", "upload", "view", "settings_change"]).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId"),
  oldValues: json("oldValues"),
  newValues: json("newValues"),
  details: json("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Admin guides and help articles.
 */
export const guides = mysqlTable("guides", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("guideSlug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  targetPage: varchar("targetPage", { length: 255 }),
  displayOrder: int("displayOrder").default(0),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Guide = typeof guides.$inferSelect;
export type InsertGuide = typeof guides.$inferInsert;

/**
 * Password reset tokens for forgot-password flow.
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * User sessions for session management (track active logins).
 */
export const userSessions = mysqlTable("user_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 255 }).notNull(),
  deviceInfo: varchar("deviceInfo", { length: 500 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  isRevoked: boolean("isRevoked").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

/**
 * Activity logs table for tracking user actions in detail.
 */
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }),
  action: varchar("activityAction", { length: 100 }).notNull(),
  category: mysqlEnum("activityCategory", ["auth", "property", "project", "inquiry", "cms", "media", "settings", "user", "system"]).default("system").notNull(),
  entityType: varchar("activityEntityType", { length: 100 }),
  entityId: int("activityEntityId"),
  description: text("activityDescription"),
  metadata: json("activityMetadata"),
  ipAddress: varchar("activityIpAddress", { length: 45 }),
  userAgent: text("activityUserAgent"),
  createdAt: timestamp("activityCreatedAt").defaultNow().notNull(),
});
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * Newsletter subscribers.
 */
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  subscribedAt: timestamp("subscribedAt").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribedAt"),
});
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

/**
 * Property view tracking for analytics.
 */
export const propertyViews = mysqlTable("property_views", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  visitorIp: varchar("visitorIp", { length: 45 }),
  userAgent: text("userAgent"),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});
export type PropertyView = typeof propertyViews.$inferSelect;

/**
 * Cities for property/project location management.
 */
export const cities = mysqlTable("cities", {
  id: int("id").autoincrement().primaryKey(),
  nameAr: varchar("nameAr", { length: 200 }).notNull(),
  nameEn: varchar("nameEn", { length: 200 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type City = typeof cities.$inferSelect;
export type InsertCity = typeof cities.$inferInsert;

/**
 * Districts (neighborhoods) within cities.
 */
export const districts = mysqlTable("districts", {
  id: int("id").autoincrement().primaryKey(),
  cityId: int("cityId").notNull(),
  nameAr: varchar("nameAr", { length: 200 }).notNull(),
  nameEn: varchar("nameEn", { length: 200 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type District = typeof districts.$inferSelect;
export type InsertDistrict = typeof districts.$inferInsert;

/**
 * Amenities master list.
 */
export const amenities = mysqlTable("amenities", {
  id: int("id").autoincrement().primaryKey(),
  nameAr: varchar("nameAr", { length: 200 }).notNull(),
  nameEn: varchar("nameEn", { length: 200 }),
  icon: varchar("icon", { length: 100 }),
  category: mysqlEnum("amenityCategory", ["basic", "comfort", "security", "outdoor", "entertainment", "other"]).default("basic").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Amenity = typeof amenities.$inferSelect;
export type InsertAmenity = typeof amenities.$inferInsert;

/**
 * Property-Amenity junction table.
 */
export const propertyAmenities = mysqlTable("property_amenities", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  amenityId: int("amenityId").notNull(),
});
export type PropertyAmenity = typeof propertyAmenities.$inferSelect;
export type InsertPropertyAmenity = typeof propertyAmenities.$inferInsert;
