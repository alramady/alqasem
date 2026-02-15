# Al-Qasim Real Estate - Project TODO

## Phase 1: Project Setup & Source Code Migration
- [x] Copy exported source code into initialized project
- [x] Install additional dependencies (TipTap, bcryptjs, etc.)
- [x] Configure design system (fonts, colors, theme)

## Phase 2: Database Schema & Seeding
- [x] Push database schema with all tables (properties, projects, pages, settings, etc.)
- [x] Seed site settings (company info, contact, social links)
- [x] Seed homepage sections (hero, about, services, partners, contact, video)
- [x] Seed 17 properties with bilingual data
- [x] Seed 6 projects with bilingual data
- [x] Seed 8 CMS pages with bilingual content

## Feature 1: Bilingual System (i18n)
- [x] Language context with AR/EN switching
- [x] Arabic translations (200+ keys)
- [x] English translations (200+ keys)
- [x] RTL/LTR direction switching
- [x] Language toggle in Navbar
- [x] Persist language preference in localStorage

## Feature 2: Property Listings
- [x] Property listing page with search/filter
- [x] Advanced filters (type, city, price range, area, rooms)
- [x] Property detail page with image gallery
- [x] Bilingual property display

## Feature 3: Project Showcase
- [x] Project listing page with filters
- [x] Project detail page with gallery and progress bar
- [x] Google Maps integration for project locations
- [x] Bilingual project display

## Feature 4: CMS-Managed Homepage
- [x] Hero section (background image, stats, CTA)
- [x] About section (description, highlights, values)
- [x] Services section (3 gradient cards)
- [x] Properties section (latest from DB)
- [x] Projects section (featured from DB)
- [x] Partners section (logo carousel)
- [x] Video showcase section
- [x] Contact section with form

## Feature 5: Admin Panel
- [x] Dashboard with KPI cards and charts
- [x] Properties CRUD with table view
- [x] Projects CRUD with table view
- [x] CMS page management
- [x] Homepage section editor (JSON)
- [x] Media library with S3 upload
- [x] Inquiries management
- [x] Audit logging
- [x] Settings management
- [x] Partner management

## Feature 6: Local Authentication
- [x] Username/password login with bcrypt
- [x] Role-based access control (admin/user/manager/staff)
- [x] Protected admin routes
- [x] Change password functionality
- [x] Root admin account seeding

## Feature 7: Contact Forms
- [x] General inquiry form (saves to inquiries table)
- [x] Property submission form (saves to properties as draft)
- [x] Property request form (saves to inquiries table)
- [x] Admin notifications on new submissions

## Feature 8: Multi-Image Upload
- [x] Property image upload to S3
- [x] Project image upload to S3
- [x] Drag-and-drop upload interface
- [x] Image reordering capability
- [x] Cover image selection

## Feature 9: WYSIWYG Editor
- [x] TipTap rich text editor with 24-button toolbar
- [x] RTL/Arabic text support
- [x] Image insertion via URL and S3 upload
- [x] HTML source toggle
- [x] Live preview for CMS pages

## Feature 10: Neo-Arabian Minimalism Design
- [x] Navy/gold/sand color palette (OKLCH)
- [x] Arabic fonts (Noto Kufi, Noto Sans Arabic, Cairo)
- [x] English fallback font (Inter)
- [x] Responsive design (mobile-first)
- [x] Section alternation (white/sand and navy backgrounds)
- [x] Card-based layouts with hover animations

## Export & GitHub Update
- [x] Export entire project as zip file
- [x] Update GitHub repository with latest code

## Bug Fixes & Security Hardening (Audit)
- [x] Fix #1: PropertyDetail.tsx — replace hardcoded data with tRPC DB query
- [x] Fix #2: Wire bilingual English fields into admin CRUD (properties + projects)
- [x] Fix #3: Remove hardcoded admin password from seed file
- [x] Fix #4: Add rate limiting (global, auth, forms)
- [x] Fix #5: Add input sanitization / XSS prevention with DOMPurify
- [x] Fix #6: Add CORS configuration
- [x] Fix #7: Reduce JWT session expiry from 1 year to 24 hours
- [x] Fix #8: Add database indexes and push migration
- [x] Fix #9: Optimize dashboard N+1 queries
- [x] Verify all existing tests still pass after fixes

## CSRF Token Protection
- [x] Create server-side CSRF token generation and validation middleware
- [x] Add CSRF token endpoint (GET /api/csrf-token)
- [x] Apply CSRF validation to all tRPC mutation endpoints
- [x] Wire CSRF token into tRPC client headers for all mutations
- [x] Write vitest tests for CSRF protection
- [x] Verify all existing tests still pass

## V2 Audit Remaining Fixes
- [x] Fix #1A: Sanitize submitProperty mutation inputs
- [x] Fix #1B: Sanitize submitPropertyRequest mutation inputs
- [x] Fix #1C: Sanitize createPage and updatePage (HTML content + text fields)
- [x] Fix #1D: Sanitize updateHomepageSection title/subtitle
- [x] Fix #1E: Sanitize addInquiryNote
- [x] Fix #1F: Sanitize sendMessage subject/body
- [x] Fix #2: Rate-limit public.submitProperty and public.submitPropertyRequest
- [x] Fix #3: Fix CORS to use allowlist instead of reflecting any origin
- [x] Fix #4: Wire PropertyDetail inquiry form with tRPC mutation
- [x] Fix #5: Verify and add composite database indexes in schema
- [x] Run all tests and verify fixes

## CSRF Token Bootstrap Fix
- [x] Fix public form submissions failing with 'error 1' due to CSRF token mismatch on first visit
- [x] Pre-fetch CSRF token on SPA initialization before any form renders
- [x] Verify all public forms work on first visit without prior navigation

## Visual Edit
- [x] Change hero text from "ابحث عن منزلك مع القاسم" to "ابحث عن عقارك مع القاسم"

## UI Adjustments
- [x] Remove address/location text from the top bar

## Remove Manus OAuth - Local Auth Only
- [x] Audit current auth system (OAuth vs local auth flow)
- [x] Remove Manus OAuth routes from server (_core/oauth.ts, callback handler)
- [x] Update server context.ts to resolve user from local JWT only
- [x] Update tRPC procedures to use local auth context
- [x] Remove OAuth-related client code (getLoginUrl, OAuth redirect)
- [x] Make admin login page the sole entry point for authentication
- [x] Update useAuth hook to work with local auth only
- [x] Seed root admin: Khalid Abdullah / Hobart / 15001500 / hobarti@protonmail.com
- [x] Update all tests to reflect local-only auth
- [x] Verify all admin and public pages work correctly

## New Features - Batch Implementation
- [x] Feature 1: Forgot Password flow via email with reset token
  - [x] Add password_reset_tokens table to schema
  - [x] Add sessions table to schema for session management
  - [x] Push database migrations
  - [x] Create server-side forgot password endpoint (generate token, send email)
  - [x] Create server-side reset password endpoint (validate token, update password)
  - [x] Create Forgot Password page (request reset)
  - [x] Create Reset Password page (enter new password)
  - [x] Add routes in App.tsx
  - [x] Add rate limiting for password reset endpoints
  - [x] Add CSRF bootstrap-safe mutations for password reset
- [x] Feature 2: Session management in admin panel
  - [x] Track sessions in DB on login (device, IP, timestamp)
  - [x] Add server endpoints: list sessions, revoke session, revoke all
  - [x] Create Sessions management UI in admin panel
  - [x] Highlight current session, allow revoking others
  - [x] Add Sessions link to admin sidebar
- [x] Feature 3: Create additional admin/staff accounts from admin panel
  - [x] Add server endpoint to create new platform users with username/password
  - [x] Add server endpoint to edit existing user roles and reset passwords
  - [x] Add server endpoint to delete users
  - [x] Enhance Users admin page with create/edit/delete user forms
  - [x] Support admin, manager, staff role assignment
  - [x] Admin password reset with session revocation
- [x] Write comprehensive vitest tests for all three features (17 tests)
- [x] All 185 tests passing

## Advanced Security & Monitoring - Batch Implementation
- [x] Feature 1: Configure SMTP credentials for production email sending
  - [x] SMTP env vars requested (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL)
  - [x] Email service gracefully falls back to console logging when SMTP not configured
  - [x] User can configure SMTP from Settings panel anytime
- [x] Feature 2: TOTP-based Two-Factor Authentication (2FA)
  - [x] Add totp_secret, totp_enabled, totp_backup_codes columns to users table
  - [x] Install otplib and qrcode dependencies
  - [x] Create 2FA setup endpoint (generate secret + QR code)
  - [x] Create 2FA verify setup endpoint (validate TOTP code + generate backup codes)
  - [x] Create 2FA disable endpoint (requires password)
  - [x] Create backup codes regeneration endpoint
  - [x] Create 2FA status endpoint
  - [x] Modify login flow to require 2FA verification when enabled (two-step login)
  - [x] Create verify2FA endpoint for login flow
  - [x] Build 2FA setup/disable/backup UI in Profile page
  - [x] Build 2FA verification step in Login page
  - [x] Add verify2FA to CSRF bootstrap-safe mutations
- [x] Feature 3: User Activity Dashboard
  - [x] Add activity_logs table to schema
  - [x] Create logActivity helper for tracking all user actions
  - [x] Track login events, password changes, 2FA changes
  - [x] Create server endpoints: getAllActivity, getUserActivity, getUserActivitySummary, getUserLoginHistory
  - [x] Build full Activity Dashboard page with category filters and pagination
  - [x] Build per-user detail view with summary stats, category breakdown, login history
  - [x] Show login history with device/IP/timestamp
  - [x] Show recent actions performed by user
  - [x] Add activity link to admin sidebar
- [x] Write comprehensive vitest tests for all new features (21 tests)
- [x] All 206 tests passing

## World-Class Real Estate Features - Public Visitor Experience
- [x] Persistent favorites with localStorage + dedicated /favorites page
- [x] Property sharing (WhatsApp, Twitter/X, copy link, email) via ShareModal component
- [x] Property comparison tool (compare up to 4 properties side-by-side) with /compare page
- [x] Mortgage/financing calculator (SAR, Saudi bank rates) with MortgageCalculator component
- [x] Similar properties section on property detail page
- [x] Property print-friendly view (print button on PropertyDetail)
- [x] Newsletter subscription (footer form + subscribeNewsletter endpoint)
- [x] Enhanced property detail (share buttons, print, similar properties, mortgage calc)
- [x] Property views counter (trackPropertyView endpoint + viewCount display)
- [x] Favorites icon in Navbar + compare floating bar on Properties page
- [x] Compare button on property cards in Properties listing

## Fix Non-Functional Admin Features
- [x] Fix report export button (connected to exportReportCSV endpoint with CSV download)
- [x] Fix notification creation (sendCustomNotification endpoint + wired form)
- [x] Fix report period filter (backend now filters by week/month/quarter/year)
- [x] Wire logActivity into property/project/CMS/media CRUD operations
- [x] Implement email templates settings tab (functional editor UI)
- [x] All 230 tests passing

## CMS & Admin Backend Verification
- [x] Verify server is running with no errors
- [x] Test admin login flow
- [x] Test admin dashboard loads with real data
- [x] Fix dashboard SQL Date parameter bug (DATE_FORMAT queries)
- [x] Fix getReportData Date parameter issues
- [x] Fix audit log and session date filter issues
- [x] Test properties CRUD (list, create, edit, delete) - vitest admin tests
- [x] Test projects CRUD (list, create, edit, delete) - vitest admin tests
- [x] Test CMS pages (list, create, edit, publish) - vitest admin tests
- [x] Test media library (upload, list, delete) - vitest admin tests
- [x] Test inquiries management (list, status update, notes) - vitest admin tests
- [x] Test settings management (site config, homepage sections) - vitest admin tests
- [x] Test reports page with export and period filter - vitest admin tests
- [x] Test notifications page - vitest admin tests
- [x] Test users management - vitest admin tests
- [x] Test sessions management - vitest admin tests
- [x] Test activity dashboard - vitest admin tests

## Cities & Districts Management System
- [x] Add cities table (id, nameAr, nameEn, isActive, sortOrder, createdAt)
- [x] Add districts table (id, cityId FK, nameAr, nameEn, isActive, sortOrder, createdAt)
- [x] Push database migrations
- [x] Add admin CRUD endpoints: listCities, createCity, updateCity, toggleCityActive, deleteCity
- [x] Add admin CRUD endpoints: listDistricts, createDistrict, updateDistrict, toggleDistrictActive, deleteDistrict
- [x] Add public endpoint: getCitiesWithDistricts for frontend filters
- [x] Build Cities & Districts admin page with tabs, search, toggle switches
- [x] Add sidebar link in AdminLayout (المدن والأحياء)
- [x] Integrate with property creation/edit forms (dynamic city/district dropdowns)
- [x] Write vitest tests (15 tests)
- [x] All 245 tests passing

## Dashboard SQL Date Bug Fix
- [x] Fix Date object to ISO string conversion in dashboardStats query
- [x] Fix Date object in getReportData trend queries
- [x] Fix Date object in audit log date filters
- [x] Fix Date object in session login history query

## Seed Saudi Cities & Districts
- [x] Create seed script with 20 major Saudi cities
- [x] Add 141 districts/neighborhoods across all cities
- [x] Run seed script to populate database

## Interactive Google Maps on Properties Page
- [x] Add latitude/longitude fields to properties table
- [x] Add lat/lng fields to admin property create/edit forms
- [x] Add lat/lng to createProperty and updateProperty endpoints
- [x] Add map view toggle button on properties listing page (grid/list/map)
- [x] Build PropertyMapView component with Google Maps markers
- [x] Show property info windows on marker click with price, type, image
- [x] Sync map with search filters

## Automatic Email Notifications on New Inquiries
- [x] Send email to admin when new inquiry is submitted (styled HTML email)
- [x] Send email to admin when new property submission arrives
- [x] Send email to admin when new property request arrives
- [x] Include inquiry details in email body (Arabic)
- [x] Push notification to project owner via notifyOwner
- [x] All 245 tests passing

## Dynamic City-District Filter Linking
- [x] Link city filter to district filter on public Properties page
- [x] When a city is selected, show only its districts in the district dropdown
- [x] Reset district selection when city changes
- [x] Update HeroSection city dropdown with dynamic cities from database
- [x] Update AddProperty page city/district with dynamic linked dropdowns
- [x] Update RequestProperty page city/district with dynamic linked dropdowns
- [x] Add district filtering to searchProperties backend endpoint
- [x] All 245 tests passing

## Enhanced Wishlist / Favorites Feature
- [x] Create centralized useFavorites hook (single source of truth for all components)
- [x] Add favorites badge count in Navbar heart icon
- [x] Ensure heart toggle works consistently on: Properties page, PropertyDetail page, PropertiesSection (homepage), Favorites page
- [x] Add "Clear All" button on Favorites page
- [x] Add sort/filter options on Favorites page (by date added, price, type)
- [x] Add share wishlist functionality (copy link with property IDs)
- [x] Improve empty state with better CTA
- [x] Add animation on heart toggle (scale + color transition)
- [x] Write vitest tests for favorites functionality (27 tests)
- [x] Verify all existing tests still pass (272 total tests passing)

## User Audit Fixes (Feb 14, 2026)

### A) Critical Bugs
- [x] Fix /contact page timeout/crash (verified working - was CMS data loading delay)
- [x] Fix property detail pages timing out (30008 was deleted test data; /16, /14, /8 verified working)
- [x] Fix property detail page loading empty (/properties/10 verified working - property exists and loads)
- [x] Fix project detail pages timing out (/projects/6, /5 verified working)

### B) Partial/Incomplete Functions
- [x] Fix URL query param filtering (type=villa, type=apartment, listing=sale not applied on page load)
- [x] Remove test/CRUD data from production (عقار اختبار, عقار CRUD)
- [x] Unify homepage stats with actual DB counts (dynamic not hardcoded)
- [x] Fix project without images display (مجمع القاسم السكني - has fallback placeholder)
- [x] Ensure newsletter email field is visible/accessible in footer

### C) Form & UX Improvements
- [x] Verify contact form submission works end-to-end (added request number + phone validation)
- [x] Verify add-property and request-property forms complete flow (added request numbers + phone validation)

## External Audit Fixes - Batch Implementation (Feb 14, 2026)
- [x] Fix notifyAdmins "info" type → "system" (notification enum mismatch)
- [x] Delete test/CRUD properties from production DB (30007, 30008, 30013, 30014)
- [x] Make homepage stats dynamic from DB (getHomepageStats endpoint + HeroSection update)
- [x] Fix URL query param filtering on /properties page (type, listing params from URL)
- [x] Add privacy policy page (Arabic/English bilingual)
- [x] Add rate limiting on public form submissions (anti-spam honeypot)
- [x] Add SEO hreflang tags for bilingual support
- [x] Improve newsletter input field visibility in footer
- [x] Add error boundaries for property/project detail pages (enhanced ErrorBoundary with bilingual support)
- [x] Improve accessibility: ARIA labels, keyboard focus, color contrast (Navbar, Footer, skip-to-content, focus-visible)
- [x] Improve "أضف عقارك" form: validation, request number, confirmation
- [x] Improve "أطلب عقارك" form: validation, request number, confirmation

## PRD/SRS Document for Next-Phase Features
- [x] Write comprehensive PRD/SRS document covering all requested features (A-E categories)
- [x] Include prioritized service list with Impact/Effort/Dependencies
- [x] Include user stories, functional requirements, NFRs, acceptance criteria per service
- [x] Include high-level data model (entities + relationships)
- [x] Include API spec + events/notifications
- [x] Include UX wireframes (text-based)
- [x] Include 3-phase launch plan (MVP, Phase 2, Phase 3)
- [x] Include KPIs per phase
- [x] Include compliance/risk considerations

## Advanced Search & Filtering (Service 3)
- [x] Add bathrooms column to properties table
- [x] Add buildingAge column to properties table
- [x] Add floor column to properties table
- [x] Add direction (facing) column to properties table
- [x] Add furnishing status column to properties table
- [x] Create amenities table (id, nameAr, nameEn, icon, category)
- [x] Create property_amenities junction table (propertyId, amenityId)
- [x] Seed common Saudi amenities (pool, elevator, parking, garden, AC, maid room, driver room, majlis, etc.)
- [x] Push database migrations
- [x] Extend searchProperties backend with: bathrooms filter, area range (min/max), amenities filter, buildingAge, floor, direction, furnishing
- [x] Add result count preview before applying filters
- [x] Build collapsible "Advanced Filters" panel on Properties page
- [x] Add bathrooms filter (1-5+)
- [x] Add exact area range filter (min m² - max m²)
- [x] Add amenities checkbox grid filter
- [x] Add building age filter
- [x] Add floor filter
- [x] Add direction filter (N/S/E/W)
- [x] Add furnishing filter (furnished/semi/unfurnished)
- [x] Update admin property create/edit forms with new fields
- [x] Write vitest tests for new filters (13 tests passing)
- [x] Verify all 290 existing tests pass

## Production SMTP Configuration
- [x] Request SMTP credentials from user (host, port, user, pass, from email)
- [x] Configure email service with production SMTP (Gmail via App Password)
- [x] Write vitest test to validate SMTP connection (5 tests passing)
- [x] Verify forgot-password email sends correctly
- [x] Verify inquiry notification emails send correctly (confirmed in server logs)
- [x] Verify newsletter subscription notification sends correctly
- [x] All 290 tests passing

## Populate Amenities for Existing Properties
- [x] Create seed script mapping each property to relevant amenities
- [x] Assign amenities based on property type (villa, apartment, land, commercial)
- [x] Run seed script and verify data in DB (237 associations across 17 properties)

## Live Result Count Preview
- [x] Add searchPropertiesCount backend endpoint (returns count only, no data)
- [x] Show live count badge next to search button ("17 نتيجة")
- [x] Update count on every filter change (debounced)
- [x] Bilingual labels (AR/EN)

## Public User Accounts (Service 1)
- [x] Add customers table (id, phone, email, name, passwordHash, isVerified, avatar, createdAt)
- [x] Add otp_codes table (id, phone, code, expiresAt, used, createdAt)
- [x] Add customer_favorites table (customerId, propertyId, addedAt)
- [x] Push database migrations
- [x] Create OTP send endpoint (generate 6-digit code, store in DB, send via SMS/email)
- [x] Create OTP verify endpoint (validate code, create session, return JWT)
- [x] Create customer login endpoint (phone + password)
- [x] Create customer profile endpoints (getProfile, updateProfile)
- [x] Build public registration page (phone input → OTP → set password → done)
- [x] Build public login page (phone + password, with OTP fallback)
- [x] Build customer profile page (name, email, phone, favorites, inquiries)
- [x] Sync localStorage favorites to DB on login
- [x] Load DB favorites on login and merge with localStorage
- [x] Add customer auth state to frontend (useCustomerAuth hook)
- [x] Add customer avatar/login button to Navbar
- [x] Write vitest tests for customer auth and favorites sync (25 tests, all 315 passing)

## All Improvements Batch (Feb 14, 2026) - Summary
- [x] Enhanced ErrorBoundary component with bilingual AR/EN support, retry button, go-home fallback
- [x] Per-page ErrorBoundary wrapping for PropertyDetail, ProjectDetail, Contact pages
- [x] Request number generation for all 3 public forms (INQ-XXXXX, PROP-XXXXX, REQ-XXXXX)
- [x] Saudi phone number validation (05XXXXXXXX format) on all forms
- [x] Success confirmation with request number display after form submission
- [x] ARIA labels on all Navbar buttons (favorites, user, language, mobile menu, social icons)
- [x] ARIA labels on Footer social links
- [x] Skip-to-content link for keyboard navigation
- [x] Global focus-visible ring styles for keyboard accessibility
- [x] 70 admin panel vitest tests (sessions, activity, 2FA, password reset, cities, properties, projects, inquiries, CMS, media, settings, reports, procedure existence)
- [x] All 358 tests passing across 17 test files

## Standalone Admin Login for Railway (Feb 16, 2026)
- [ ] Add username/password fields to users table schema (if not already present)
- [ ] Create standalone login endpoint (username + password → JWT session) for Railway
- [ ] Build standalone admin login page (no Manus OAuth dependency)
- [ ] Insert Admin user (Khalid Abdullah / Hobart / 15001500 / hobarti@protonmail.com) into Railway MySQL
- [ ] Push changes to GitHub for Railway auto-deploy

## Agency & Agent System (Feb 15, 2026)
- [x] Add agencies table (nameAr, nameEn, slug, logo, phone, email, whatsapp, website, licenseNumber, description, city, district, address, social links, status, isFeatured, sortOrder)
- [x] Add agents table (agencyId FK, nameAr, nameEn, slug, photo, titleAr, titleEn, bioAr, bioEn, phone, email, whatsapp, yearsExperience, isActive, sortOrder)
- [x] Add agencyId and agentId columns to properties table
- [x] Push database migrations
- [x] Seed demo agency (شركة محمد بن عبد الرحمن القاسم العقارية) with 4 agents
- [x] Link all 17 properties to agency and agents
- [x] Public endpoints: getAgencies (search, city, featured filters), getAgencyProfile (slug), getAgentProfile (slug), getPropertyAgencyAgent
- [x] Admin endpoints: listAgencies, getAgency, createAgency, updateAgency, deleteAgency, listAgents, getAgent, createAgent, updateAgent, deleteAgent, getAgenciesDropdown, getAgentsByAgency
- [x] Agencies listing page (/agencies) with search and city filter
- [x] Agency profile page (/agency/:slug) with agents, properties, contact info
- [x] Agent profile page (/agent/:slug) with agency info and properties
- [x] Agency/agent info on property detail page
- [x] Admin agencies management page (CRUD)
- [x] Admin agents management page (CRUD)
- [x] Agency/agent selection in admin property create/edit forms
- [x] Remove seedDemo debug endpoint (production cleanup)
- [x] Write vitest tests for agency/agent endpoints (16 tests, all passing)

## Saudi Compliance, SEO & Enhancements (Feb 16, 2026)

### A) Saudi Privacy Policy Compliance
- [x] Update privacy policy page with full Saudi PDPL (نظام حماية البيانات الشخصية) compliance
- [x] Include all 8 Article 12 clauses (purpose, content, method, storage, processing, destruction, rights, exercise of rights)
- [x] Add cookie consent banner (bilingual AR/EN with accept/essential-only/privacy link)
- [x] Add data collection disclosure on all forms

### B) Editable FAL Number from CMS
- [x] Add FAL license number and CR number fields to site settings (CMS-editable)
- [x] Display FAL number in footer (license badge) and IqarLicense page from CMS settings
- [x] Make FAL/CR number editable from admin Settings > Company tab

### C) SEO Improvements
- [x] Add dynamic meta tags (title, description, og:image) per page via SEO component + react-helmet-async
- [x] Add structured data (JSON-LD) for RealEstateAgent with address, social, hours
- [x] Generate dynamic sitemap.xml (42 URLs including all properties, projects, agencies, CMS pages)
- [x] Add robots.txt (allow /, disallow /admin/ and /api/)
- [x] Add canonical URLs via SEO component
- [x] Add Arabic/English hreflang tags
- [x] Add Twitter Card meta tags
- [x] Add meta keywords for Saudi real estate terms (AR + EN)
- [x] Add geo meta tags (SA-01, Riyadh)
- [x] Add og:site_name and og:url

### D) SMTP Credential Update
- [ ] Update SMTP credentials from admin panel (Gmail App Password expired — user to update manually)

### E) Agent Photo Improvements
- [x] Add professional gradient placeholder avatars for agents without photos (dark navy gradient with initial letter)
- [x] Ensure agent photo upload works in admin panel
- [x] Write vitest tests for SEO & compliance (42 tests, all passing)
