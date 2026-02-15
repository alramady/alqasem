# Al-Qasim Real Estate — Developer Documentation

> **القاسم العقارية** — Comprehensive bilingual (AR/EN) real estate platform for property management, marketing, and consulting in Saudi Arabia.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Backend API Reference](#5-backend-api-reference)
6. [Frontend Pages & Routes](#6-frontend-pages--routes)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [CMS & Homepage Sections](#8-cms--homepage-sections)
9. [Bilingual (AR/EN) System](#9-bilingual-aren-system)
10. [File Storage & Media](#10-file-storage--media)
11. [Email & Notifications](#11-email--notifications)
12. [Testing](#12-testing)
13. [Development Commands](#13-development-commands)
14. [Environment Variables](#14-environment-variables)
15. [Deployment](#15-deployment)
16. [Common Tasks](#16-common-tasks)

---

## 1. Architecture Overview

The platform follows a **monorepo** structure with a React 19 frontend and Express 4 backend, connected via tRPC 11 for end-to-end type safety. The database is MySQL/TiDB managed through Drizzle ORM.

```
┌──────────────────────────────────────────────────────┐
│                    Browser (Client)                   │
│  React 19 + Tailwind 4 + shadcn/ui + Framer Motion  │
│  tRPC React Query hooks ← Superjson serialization    │
└───────────────────────┬──────────────────────────────┘
                        │ /api/trpc/*
┌───────────────────────▼──────────────────────────────┐
│                  Express 4 Server                     │
│  tRPC 11 Router → Procedures (public/protected/admin)│
│  Manus OAuth + JWT Sessions + CSRF Protection        │
└───────────────────────┬──────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────┐
│              MySQL / TiDB (Drizzle ORM)              │
│  30+ tables: properties, projects, users, agencies…  │
└──────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 19.2 |
| Styling | Tailwind CSS | 4.1 |
| UI Components | shadcn/ui + Radix | Latest |
| Animations | Framer Motion | 12.x |
| Routing | Wouter | 3.3 |
| API Layer | tRPC (client + server) | 11.6 |
| Serialization | Superjson | 1.13 |
| Backend | Express | 4.21 |
| ORM | Drizzle ORM | 0.44 |
| Database | MySQL / TiDB | — |
| Validation | Zod | 4.1 |
| Email | Nodemailer | 8.0 |
| Build Tool | Vite | 7.1 |
| Testing | Vitest | 2.1 |
| Language | TypeScript | 5.9 |

---

## 3. Project Structure

```
alqasim-realestate/
├── client/                     # Frontend application
│   ├── public/                 # Static assets (favicon, robots.txt)
│   ├── src/
│   │   ├── _core/hooks/        # useAuth hook
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/             # shadcn/ui primitives (50+ components)
│   │   │   ├── admin/          # Admin-specific components
│   │   │   ├── Navbar.tsx      # Main navigation bar
│   │   │   ├── Footer.tsx      # Site footer
│   │   │   ├── HeroSection.tsx # Homepage hero
│   │   │   ├── ServicesSection.tsx
│   │   │   ├── ProjectsSection.tsx
│   │   │   ├── PropertiesSection.tsx
│   │   │   ├── PartnersSection.tsx
│   │   │   ├── ContactSection.tsx
│   │   │   ├── AboutSection.tsx
│   │   │   ├── VirtualTourEmbed.tsx  # 360° tour embed
│   │   │   ├── MortgageCalculator.tsx
│   │   │   ├── PropertyMapView.tsx
│   │   │   └── ...
│   │   ├── contexts/           # React contexts
│   │   │   ├── LanguageContext.tsx    # AR/EN switching
│   │   │   ├── SiteConfigContext.tsx  # Homepage sections from DB
│   │   │   ├── CustomerAuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/              # Custom hooks
│   │   ├── i18n/               # Translation files
│   │   │   ├── ar.ts           # Arabic translations
│   │   │   └── en.ts           # English translations
│   │   ├── lib/
│   │   │   ├── trpc.ts         # tRPC client binding
│   │   │   ├── branding.ts     # Brand constants
│   │   │   └── utils.ts        # Utility functions
│   │   ├── pages/              # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Properties.tsx
│   │   │   ├── PropertyDetail.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── ProjectDetail.tsx
│   │   │   ├── About.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── Services.tsx
│   │   │   ├── Favorites.tsx
│   │   │   ├── Compare.tsx
│   │   │   ├── CustomerLogin.tsx
│   │   │   ├── CustomerRegister.tsx
│   │   │   ├── CustomerAccount.tsx
│   │   │   ├── admin/          # Admin panel pages (20+)
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Properties.tsx
│   │   │   │   ├── Projects.tsx
│   │   │   │   ├── Inquiries.tsx
│   │   │   │   ├── Users.tsx
│   │   │   │   ├── Permissions.tsx
│   │   │   │   ├── CMS.tsx
│   │   │   │   ├── Settings.tsx
│   │   │   │   ├── Agencies.tsx
│   │   │   │   ├── Agents.tsx
│   │   │   │   ├── CitiesDistricts.tsx
│   │   │   │   ├── FinancingRequests.tsx
│   │   │   │   ├── AuditLog.tsx
│   │   │   │   ├── Reports.tsx
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── App.tsx             # Route definitions
│   │   ├── main.tsx            # Entry point + providers
│   │   └── index.css           # Global styles + theme
│   └── index.html
├── server/                     # Backend application
│   ├── _core/                  # Framework plumbing (DO NOT EDIT)
│   │   ├── context.ts          # tRPC context builder
│   │   ├── env.ts              # Environment variable access
│   │   ├── llm.ts              # LLM integration helper
│   │   ├── imageGeneration.ts  # AI image generation
│   │   ├── notification.ts     # Owner notifications
│   │   ├── map.ts              # Google Maps proxy
│   │   └── ...
│   ├── routers/                # tRPC procedure files
│   │   ├── admin.ts            # Admin procedures (~1200 lines)
│   │   ├── public.ts           # Public procedures (~950 lines)
│   │   └── customer.ts         # Customer procedures (~520 lines)
│   ├── routers.ts              # Router aggregator
│   ├── db.ts                   # Database query helpers
│   ├── email.ts                # Email sending (Nodemailer)
│   ├── drip.ts                 # Drip campaign scheduler
│   ├── sanitize.ts             # Input sanitization
│   ├── storage.ts              # S3 file storage helpers
│   └── *.test.ts               # Vitest test files (25+ files)
├── drizzle/                    # Database schema
│   ├── schema.ts               # All table definitions
│   └── relations.ts            # Table relationships
├── shared/                     # Shared types & constants
│   ├── types.ts
│   └── const.ts
├── storage/                    # S3 helper wrappers
├── todo.md                     # Feature tracking
├── DEVELOPER_DOCS.md           # This file
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── drizzle.config.ts
└── tsconfig.json
```

---

## 4. Database Schema

The platform uses **30+ MySQL tables** managed by Drizzle ORM. Below are the key tables grouped by domain.

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Admin/staff accounts | id, name, email, password, role (admin/user), status, phone, avatar |
| `permissions` | Role-based access control | id, userId, module, canView, canCreate, canEdit, canDelete |
| `customers` | Public customer accounts | id, name, email, phone, passwordHash, status, verifiedAt |
| `customer_sessions` | Customer JWT sessions | id, customerId, token, expiresAt, ipAddress, userAgent |

### Property Domain

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `properties` | Property listings | id, title, titleEn, type, purpose, price, area, bedrooms, bathrooms, city, district, lat, lng, images (JSON), virtualTourUrl, virtualTourType, status, agentId, agencyId |
| `projects` | Development projects | id, title, titleEn, status, totalUnits, soldUnits, location, images (JSON), features (JSON), isFeatured |
| `cities` | Saudi cities | id, nameAr, nameEn, isActive |
| `districts` | City districts | id, cityId, nameAr, nameEn, isActive |
| `amenities` | Property amenities | id, nameAr, nameEn, icon, category |
| `property_amenities` | Property-amenity junction | propertyId, amenityId |
| `property_views` | View tracking | id, propertyId, viewedAt, ipAddress |

### Business Domain

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `agencies` | Real estate agencies | id, nameAr, nameEn, slug, logo, license, phone, email, description, city, isActive |
| `agents` | Individual agents | id, agencyId, nameAr, nameEn, slug, photo, phone, email, license, specialization |
| `inquiries` | Contact inquiries | id, propertyId, name, email, phone, message, status, notes, source |
| `financing_requests` | Mortgage requests | id, customerId, propertyId, amount, income, employmentType, status |
| `customer_favorites` | Saved properties | id, customerId, propertyId |

### CMS & Configuration

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `pages` | CMS pages | id, title, titleEn, slug, contentAr, contentEn, status, seoTitle, seoDescription |
| `homepage_sections` | Homepage section config | id, sectionKey, title, subtitle, content (JSON), isVisible, sortOrder |
| `settings` | Site-wide settings | id, settingKey, value, category |
| `media` | Media library | id, filename, url, type, size, alt, folder |
| `guides` | User guides | id, title, content, category, sortOrder |

### System Tables

| Table | Purpose |
|-------|---------|
| `notifications` | System notifications |
| `messages` | Internal messaging |
| `audit_logs` | Admin action audit trail |
| `activity_logs` | User activity tracking |
| `newsletter_subscribers` | Email subscriptions |
| `password_reset_tokens` | Password reset flow |
| `user_sessions` | Admin session management |
| `otp_codes` | Customer OTP verification |

### Schema Modification Workflow

```bash
# 1. Edit drizzle/schema.ts
# 2. Generate and apply migration
pnpm db:push
# This runs: drizzle-kit generate && drizzle-kit migrate
```

---

## 5. Backend API Reference

All API procedures are accessible via tRPC at `/api/trpc/*`. They are organized into three routers.

### 5.1 Public Router (`server/routers/public.ts`)

These procedures require **no authentication**.

| Procedure | Type | Description |
|-----------|------|-------------|
| `public.getSiteConfig` | Query | Returns all homepage sections, settings, and visibility flags |
| `public.searchProperties` | Query | Full-text property search with filters (type, purpose, city, price range, bedrooms, area) |
| `public.getProperty` | Query | Single property detail by ID |
| `public.listActiveProjects` | Query | All active/featured projects |
| `public.getProject` | Query | Single project detail by ID |
| `public.getPropertyCities` | Query | Distinct cities with property counts |
| `public.getCitiesWithDistricts` | Query | All cities with nested districts |
| `public.getAmenities` | Query | All amenities grouped by category |
| `public.submitInquiry` | Mutation | Submit a property inquiry (name, email, phone, message) |
| `public.submitContactForm` | Mutation | Submit general contact form |
| `public.requestFinancing` | Mutation | Submit financing/mortgage request |
| `public.subscribeNewsletter` | Mutation | Subscribe to newsletter |
| `public.trackPropertyView` | Mutation | Record a property page view |
| `public.searchAgencies` | Query | Search agencies with filters |
| `public.getAgencyBySlug` | Query | Agency profile by slug |
| `public.getAgentBySlug` | Query | Agent profile by slug |
| `public.getHomepageStats` | Query | Aggregate stats (total properties, projects, clients) |
| `public.listPublishedPages` | Query | All published CMS pages |
| `public.getPageBySlug` | Query | Single CMS page by slug |
| `public.calculateMortgage` | Query | Mortgage calculator (price, downPayment, years, rate) |

### 5.2 Admin Router (`server/routers/admin.ts`)

These procedures require **admin authentication** (JWT session cookie).

| Procedure | Type | Description |
|-----------|------|-------------|
| `admin.login` | Mutation | Admin email/password login with 2FA support |
| `admin.register` | Mutation | Create admin account (first user auto-admin) |
| `admin.getMyProfile` | Query | Current admin profile |
| `admin.dashboardStats` | Query | Dashboard KPIs (properties, inquiries, views, revenue) |
| **Properties** | | |
| `admin.listProperties` | Query | Paginated property list with search |
| `admin.getProperty` | Query | Single property for editing |
| `admin.createProperty` | Mutation | Create property with all fields including virtualTourUrl |
| `admin.updateProperty` | Mutation | Update property |
| `admin.deleteProperty` | Mutation | Soft-delete property |
| `admin.bulkUpdateProperties` | Mutation | Batch status update |
| `admin.duplicateProperty` | Mutation | Clone a property |
| `admin.exportPropertiesCSV` | Mutation | Export to CSV |
| **Projects** | | |
| `admin.listProjects` | Query | All projects |
| `admin.getProject` | Query | Single project for editing |
| `admin.createProject` | Mutation | Create project |
| `admin.updateProject` | Mutation | Update project |
| `admin.deleteProject` | Mutation | Delete project |
| **Users & Permissions** | | |
| `admin.listUsers` | Query | All admin users |
| `admin.createUser` | Mutation | Create admin user |
| `admin.updateUser` | Mutation | Update admin user |
| `admin.toggleUserStatus` | Mutation | Activate/deactivate user |
| `admin.getPermissions` | Query | All permission records |
| `admin.updatePermissions` | Mutation | Set module permissions per user |
| **CMS** | | |
| `admin.listPages` | Query | All CMS pages |
| `admin.createPage` | Mutation | Create CMS page (AR/EN content) |
| `admin.updatePage` | Mutation | Update CMS page |
| `admin.deletePage` | Mutation | Delete CMS page |
| **Settings & Config** | | |
| `admin.getSettings` | Query | All site settings |
| `admin.updateSettings` | Mutation | Update settings |
| `admin.getHomepageSections` | Query | All homepage section configs |
| `admin.updateHomepageSection` | Mutation | Update section visibility, title, content |
| **Other** | | |
| `admin.listInquiries` | Query | All inquiries with filters |
| `admin.updateInquiryStatus` | Mutation | Change inquiry status |
| `admin.listAgencies` | Query | All agencies |
| `admin.createAgency` | Mutation | Create agency |
| `admin.listAgents` | Query | All agents |
| `admin.createAgent` | Mutation | Create agent |
| `admin.listFinancingRequests` | Query | All financing requests |
| `admin.getAuditLog` | Query | Audit trail entries |
| `admin.listNotifications` | Query | System notifications |
| `admin.listMessages` | Query | Internal messages |

### 5.3 Customer Router (`server/routers/customer.ts`)

These procedures handle **customer (public user) authentication and features**.

| Procedure | Type | Description |
|-----------|------|-------------|
| `customer.register` | Mutation | Register with email/phone + OTP |
| `customer.verifyOtp` | Mutation | Verify OTP code |
| `customer.login` | Mutation | Customer login |
| `customer.me` | Query | Current customer profile |
| `customer.logout` | Mutation | End session |
| `customer.updateProfile` | Mutation | Update customer profile |
| `customer.changePassword` | Mutation | Change password |
| `customer.getFavorites` | Query | Saved properties |
| `customer.addFavorite` | Mutation | Save a property |
| `customer.removeFavorite` | Mutation | Remove saved property |
| `customer.clearFavorites` | Mutation | Clear all favorites |
| `customer.getMyInquiries` | Query | Customer's inquiries |
| `customer.getMyFinancingRequests` | Query | Customer's financing requests |

---

## 6. Frontend Pages & Routes

### Public Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Home.tsx` | Landing page with hero, services, properties, projects, partners, contact |
| `/about` | `About.tsx` | Company information |
| `/services` | `Services.tsx` | Service details |
| `/properties` | `Properties.tsx` | Property listings with search/filter |
| `/properties/:id` | `PropertyDetail.tsx` | Property detail with gallery, map, mortgage calc, virtual tour |
| `/properties/map` | `PropertyMapView.tsx` | Map-based property search |
| `/projects` | `Projects.tsx` | Project listings |
| `/projects/:id` | `ProjectDetail.tsx` | Project detail with gallery |
| `/contact` | `Contact.tsx` | Contact form |
| `/add-property` | `AddProperty.tsx` | List your property form |
| `/request-property` | `RequestProperty.tsx` | Property request form |
| `/favorites` | `Favorites.tsx` | Saved properties |
| `/compare` | `Compare.tsx` | Property comparison |
| `/agencies` | `Agencies.tsx` | Agency directory |
| `/agency/:slug` | `AgencyProfile.tsx` | Agency profile |
| `/agent/:slug` | `AgentProfile.tsx` | Agent profile |
| `/privacy-policy` | `PrivacyPolicy.tsx` | Privacy policy |
| `/iqar-license` | `IqarLicense.tsx` | IQAR license info |
| `/page/:slug` | `CMSPage.tsx` | Dynamic CMS pages |

### Customer Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | `CustomerLogin.tsx` | Customer login |
| `/register` | `CustomerRegister.tsx` | Customer registration with OTP |
| `/account` | `CustomerAccount.tsx` | Customer dashboard |

### Admin Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/login` | `Login.tsx` | Admin login |
| `/admin` or `/admin/dashboard` | `Dashboard.tsx` | Admin dashboard with KPIs |
| `/admin/properties` | `Properties.tsx` | Property CRUD |
| `/admin/projects` | `Projects.tsx` | Project CRUD |
| `/admin/inquiries` | `Inquiries.tsx` | Inquiry management |
| `/admin/users` | `Users.tsx` | User management |
| `/admin/permissions` | `Permissions.tsx` | Permission matrix |
| `/admin/cms` | `CMS.tsx` | CMS page editor |
| `/admin/settings` | `Settings.tsx` | Site settings |
| `/admin/media` | `Media.tsx` | Media library |
| `/admin/agencies` | `Agencies.tsx` | Agency management |
| `/admin/agents` | `Agents.tsx` | Agent management |
| `/admin/cities-districts` | `CitiesDistricts.tsx` | City/district management |
| `/admin/financing-requests` | `FinancingRequests.tsx` | Financing request review |
| `/admin/audit-log` | `AuditLog.tsx` | Audit trail viewer |
| `/admin/reports` | `Reports.tsx` | Analytics reports |
| `/admin/notifications` | `Notifications.tsx` | Notification center |
| `/admin/messages` | `Messages.tsx` | Internal messaging |
| `/admin/guides` | `Guides.tsx` | User guides |
| `/admin/profile` | `Profile.tsx` | Admin profile |
| `/admin/sessions` | `Sessions.tsx` | Active session management |
| `/admin/activity` | `ActivityDashboard.tsx` | Activity dashboard |

---

## 7. Authentication & Authorization

The platform has **two separate auth systems**:

### Admin Authentication
- **Method**: Email/password with optional 2FA (TOTP)
- **Session**: JWT stored in HTTP-only cookie (`admin_token`)
- **CSRF**: Double-submit cookie pattern via `useCsrfToken` hook
- **Roles**: `admin` (full access) and `user` (permission-based)
- **Procedures**: `protectedProcedure` requires valid admin session; `adminProcedure` requires `role === 'admin'`

### Customer Authentication
- **Method**: Email/phone + OTP verification, then password login
- **Session**: JWT stored in HTTP-only cookie (`customer_token`)
- **Context**: `CustomerAuthContext` provides `useCustomerAuth()` hook
- **Features**: Favorites, inquiry history, financing requests, profile management

### Permission System
The `permissions` table controls per-module access for admin users:

```typescript
// Modules: properties, projects, inquiries, pages, media, settings, users, agencies, agents, financing
// Each module has: canView, canCreate, canEdit, canDelete
```

---

## 8. CMS & Homepage Sections

### Homepage Sections (Backend-Editable)

All homepage sections are stored in the `homepage_sections` table and can be edited from the admin panel at `/admin/settings`.

| Section Key | Content Structure |
|-------------|-------------------|
| `hero` | `{ titleAr, titleEn, subtitleAr, subtitleEn, backgroundImage }` |
| `services` | `{ badgeAr, badgeEn, titleAr, titleEn, subtitleAr, subtitleEn, services: [{ titleAr, titleEn, descriptionAr, descriptionEn, featuresAr, featuresEn }] }` |
| `partners` | `{ partners: [{ nameAr, nameEn, logo }] }` |
| `about` | `{ titleAr, titleEn, descriptionAr, descriptionEn, stats: [...] }` |
| `contact` | `{ phone, email, address, mapLat, mapLng }` |
| `video` | `{ videoUrl, titleAr, titleEn }` |

Each section has `isVisible` (boolean) and `sortOrder` (int) fields for controlling display.

### CMS Pages

Full bilingual page editor with:
- Arabic and English content (WYSIWYG)
- SEO metadata (title, description, keywords)
- Slug-based routing (`/page/:slug`)
- Draft/Published status

---

## 9. Bilingual (AR/EN) System

### Translation Files
- `client/src/i18n/ar.ts` — Arabic translations (default)
- `client/src/i18n/en.ts` — English translations

### Usage in Components

```tsx
import { useLanguage } from "@/contexts/LanguageContext";

function MyComponent() {
  const { t, isAr, lang, setLang } = useLanguage();
  
  return (
    <div>
      <h1>{t("services.title")}</h1>
      <p>{isAr ? "محتوى عربي" : "English content"}</p>
    </div>
  );
}
```

### RTL Support
- The `<html>` element gets `dir="rtl"` and `lang="ar"` when Arabic is active
- Tailwind's `rtl:` variant is available for directional styling
- Use `icon-directional` CSS class for icons that should flip in RTL
- Use `style={{ insetInlineStart: '1rem' }}` instead of `left`/`right` for logical positioning

### Database Bilingual Fields
Most content tables have paired columns:
- `title` / `titleEn`
- `description` / `descriptionEn`
- `nameAr` / `nameEn`
- `contentAr` / `contentEn`

---

## 10. File Storage & Media

### S3 Storage

```typescript
import { storagePut } from "./server/storage";

// Upload a file
const { url } = await storagePut(
  `properties/${propertyId}/${filename}`,
  fileBuffer,
  "image/jpeg"
);
```

### Image Upload Flow
1. Client sends file via FormData to a tRPC mutation
2. Server receives buffer, uploads to S3 via `storagePut()`
3. S3 URL is stored in the database (e.g., `properties.images` JSON array)
4. Frontend renders images directly from CDN URLs

### Media Library
Admin panel at `/admin/media` provides:
- Upload interface with drag-and-drop
- Folder organization
- Image preview and metadata editing
- Bulk operations

---

## 11. Email & Notifications

### Email System (`server/email.ts`)

```typescript
// Configured via environment variables:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL, SMTP_FROM_NAME
```

Email is used for:
- Customer OTP verification
- Inquiry notifications to admin
- Drip campaign emails (`server/drip.ts`)
- Password reset tokens

### Owner Notifications

```typescript
import { notifyOwner } from "./server/_core/notification";

await notifyOwner({
  title: "New Inquiry",
  content: "A new property inquiry was submitted..."
});
```

---

## 12. Testing

### Test Structure

The project has **25+ test files** covering all major features:

| Test File | Coverage |
|-----------|----------|
| `admin.test.ts` | Admin login, registration, CRUD |
| `public.test.ts` | Public API endpoints |
| `customer.test.ts` | Customer auth, favorites |
| `search.test.ts` | Property search & filtering |
| `virtual-tour.test.ts` | Virtual tour embed feature |
| `mortgage.test.ts` | Mortgage calculator |
| `bilingual.test.ts` | AR/EN content handling |
| `agencies.test.ts` | Agency/agent management |
| `cities-districts.test.ts` | City/district CRUD |
| `cms-pages.test.ts` | CMS page management |
| `csrf.test.ts` | CSRF protection |
| `seo-compliance.test.ts` | SEO metadata |
| `financing.test.ts` | Financing requests |
| `compare-favorites.test.ts` | Compare & favorites |
| `smtp.test.ts` | Email delivery |

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
npx vitest run server/virtual-tour.test.ts

# Run tests in watch mode
npx vitest --watch
```

### Test Pattern

Tests use HTTP requests against the running dev server:

```typescript
import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000";

describe("Feature", () => {
  it("should work", async () => {
    const res = await fetch(`${BASE}/api/trpc/public.searchProperties?input=${encodeURIComponent(JSON.stringify({ json: {} }))}`);
    const data = await res.json();
    expect(data.result.data.json).toBeDefined();
  });
});
```

---

## 13. Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server (hot reload) |
| `pnpm build` | Build for production (Vite + esbuild) |
| `pnpm start` | Start production server |
| `pnpm check` | TypeScript type checking |
| `pnpm test` | Run all Vitest tests |
| `pnpm db:push` | Generate and apply database migrations |
| `pnpm format` | Format code with Prettier |

---

## 14. Environment Variables

### System Variables (Auto-injected)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL/TiDB connection string |
| `JWT_SECRET` | Session cookie signing secret |
| `VITE_APP_ID` | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL |
| `OWNER_OPEN_ID` | Owner's Manus OpenID |
| `OWNER_NAME` | Owner's display name |
| `BUILT_IN_FORGE_API_URL` | Internal API URL (LLM, storage, etc.) |
| `BUILT_IN_FORGE_API_KEY` | Internal API bearer token |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend API token |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend API URL |

### Email Configuration

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (587 for TLS) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password / app password |
| `SMTP_FROM_EMAIL` | Sender email address |
| `SMTP_FROM_NAME` | Sender display name |

### Branding

| Variable | Description |
|----------|-------------|
| `VITE_APP_TITLE` | Site title displayed in browser tab |
| `VITE_APP_LOGO` | Site logo URL |

---

## 15. Deployment

The platform is deployed via Manus hosting:

1. Save a checkpoint: `webdev_save_checkpoint`
2. Click **Publish** in the Manus Management UI
3. Custom domain can be configured in Settings > Domains

### Build Output
- Frontend: Vite builds to `dist/client/`
- Backend: esbuild bundles to `dist/index.js`
- Static assets are served with aggressive caching

---

## 16. Common Tasks

### Adding a New Property Field

1. Add column to `drizzle/schema.ts` in the `properties` table
2. Run `pnpm db:push`
3. Update `server/routers/admin.ts` — add field to create/update Zod schemas
4. Update `server/routers/public.ts` — include in select queries
5. Update `client/src/pages/admin/Properties.tsx` — add form input
6. Update `client/src/pages/PropertyDetail.tsx` — display the field
7. Write a test in `server/*.test.ts`

### Adding a New Homepage Section

1. Insert row in `homepage_sections` table:
   ```sql
   INSERT INTO homepage_sections (sectionKey, title, subtitle, content, isVisible, sortOrder)
   VALUES ('new_section', 'Title', 'Subtitle', '{}', true, 10);
   ```
2. Create component `client/src/components/NewSection.tsx`
3. Use `useSection("new_section")` and `useSectionVisible("new_section")` hooks
4. Add component to `client/src/pages/Home.tsx`

### Adding a New Admin Page

1. Create `client/src/pages/admin/NewPage.tsx`
2. Add route in `client/src/App.tsx`
3. Add navigation item in `client/src/components/AdminLayout.tsx`
4. Create backend procedures in `server/routers/admin.ts`
5. Add permission module if needed

### Modifying Partner Logos

Update the `homepage_sections` table where `sectionKey = 'partners'`:

```sql
UPDATE homepage_sections 
SET content = JSON_SET(content, '$.partners', JSON_ARRAY(
  JSON_OBJECT('nameAr', 'الاسم بالعربي', 'nameEn', 'English Name', 'logo', 'https://cdn-url/logo.png')
))
WHERE sectionKey = 'partners';
```

Or use the admin panel at `/admin/settings` to edit section content.

### Modifying Services Section Text

The services section reads from `homepage_sections` where `sectionKey = 'services'`. The content JSON supports:

```json
{
  "badgeAr": "خدماتنا",
  "badgeEn": "Our Services",
  "titleAr": "خدمات عقارية متكاملة",
  "titleEn": "Comprehensive Real Estate Services",
  "subtitleAr": "نقدم مجموعة شاملة من الخدمات العقارية المتميزة",
  "subtitleEn": "We offer a complete range of distinguished real estate services",
  "services": [
    {
      "titleAr": "إدارة الأملاك",
      "titleEn": "Property Management",
      "descriptionAr": "...",
      "descriptionEn": "...",
      "featuresAr": ["تحصيل الإيجارات", "..."],
      "featuresEn": ["Rent Collection", "..."]
    }
  ]
}
```

---

*Last updated: February 2026*
