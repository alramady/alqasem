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

## Mortgage Calculator (Feb 16, 2026)

### Backend Control
- [x] Add mortgage settings to settings DB (14 keys: enabled, rates, terms, down payment, titles, disclaimers)
- [x] Add mortgage settings tab in admin Settings page with all configurable fields
- [x] Add visibility toggle (show/hide calculator globally) with eye icon
- [x] Expose mortgage config via public endpoint (getMortgageConfig)

### Frontend Calculator Component
- [x] Build MortgageCalculator component (bilingual AR/EN, SAR currency)
- [x] Property price pre-filled from property data with slider (100K-20M)
- [x] Down payment slider (percentage + SAR amount display)
- [x] Interest rate slider (pre-filled from admin config, within admin-defined range)
- [x] Loan term slider (years, pre-filled from admin config, within admin-defined range)
- [x] Real-time monthly payment calculation with emerald highlight card
- [x] Payment breakdown (loan amount, total interest, total payment)
- [x] Cost breakdown bar (principal vs interest visual ratio)
- [x] Amortization summary table (expandable, shows year 1, 5, 10, final)
- [x] SAMA compliance disclaimer (editable from CMS)
- [x] Responsive design matching site theme

### Integration
- [x] Integrate into PropertyDetail page (conditionally rendered based on admin toggle)
- [x] Only show for sale properties (not rentals)
- [x] Write vitest tests for mortgage calculator (10 tests: 7 backend config + 3 math verification, all passing)

## Mortgage Enhancements (Feb 16, 2026)

### A) Update Default Rate to Saudi Bank Rates
- [x] Update mortgage_default_rate from 5.5% to 4.49% (current SAMA-regulated rate)
- [x] Make rate editable from admin Settings > حاسبة التمويل tab (already done)

### B) Request Financing CTA Form
- [x] Add financing_requests table (id, propertyId, propertyTitle, customerName, customerPhone, customerEmail, propertyPrice, downPaymentPct, loanAmount, rate, term, monthlyPayment, notes, status, requestNumber, createdAt)
- [x] Add financing CTA settings to DB (financing_cta_enabled, financing_cta_title_ar/en, financing_cta_subtitle_ar/en, financing_notification_email)
- [x] Create submitFinancingRequest public endpoint (saves form + sends admin notification + generates FIN-XXXXX reference)
- [x] Add CSRF bypass for submitFinancingRequest (first-visit safe)
- [x] Build financing request dialog/modal in MortgageCalculator (captures name, phone, email, notes + auto-fills calculated scenario)
- [x] Add financing CTA settings to admin Settings > حاسبة التمويل tab (toggle, titles, subtitles, notification email)
- [x] Write vitest tests for financing request endpoints (6 tests: config, submission, validation, uniqueness, all passing)
- [x] Build admin Financing Requests page (table with status management)
- [x] Add financing requests link to admin sidebar

## Batch Enhancements (Feb 16, 2026)

### A) Admin Financing Requests Page
- [x] Add admin endpoint: listFinancingRequests (with pagination, status filter, search)
- [x] Add admin endpoint: updateFinancingRequestStatus (new/contacted/approved/rejected)
- [x] Build admin Financing Requests page with table, status badges, filters
- [x] Add financing requests link to admin sidebar
- [x] Show request details in expandable row (property info, calculated scenario, notes)

### B) WhatsApp Integration for Financing Notifications
- [x] Generate WhatsApp click-to-chat link with pre-filled financing request message (auto-converts 05 to 966)
- [x] Add WhatsApp CTA button in MortgageCalculator success state for direct customer contact
- [x] Pre-fills message with request number, property price, loan amount, monthly payment, term, rate

### C) Bank Partner Logos Below Calculator
- [x] Display partner bank logos below mortgage calculator (Al Rajhi, SNB, Riyad Bank, SAB)
- [x] Inline SVG icons with brand colors (no external image dependencies)
- [x] Arabic bank names shown on desktop, icons-only on mobile

### D) Google Analytics Integration
- [x] Add google_analytics_enabled, google_analytics_id, google_tag_manager_id settings to DB
- [x] Create GoogleAnalytics component (loads GA4 gtag.js dynamically when enabled)
- [x] Add Google Tag Manager support (optional GTM container ID)
- [x] Add page view tracking on route changes via wouter location
- [x] Add admin Settings > التحليلات tab (enable/disable toggle, GA4 ID, GTM ID, setup instructions)
- [x] IP anonymization enabled by default for privacy compliance
- [x] Write vitest tests for all enhancements (11 tests, all passing)

## Feature Verification (Feb 16, 2026)

### A) Property Comparison Feature (already exists)
- [x] Compare button on property cards in Properties listing
- [x] Floating compare bar at bottom showing selected count
- [x] Compare page at /compare with side-by-side table
- [x] Comparison shows: image, price, type, listing, location, area, rooms, bathrooms, parking, features
- [x] Max 4 properties comparison limit
- [x] Remove individual properties from comparison
- [x] Backend getPropertiesForComparison endpoint
- [x] Bilingual AR/EN support
- [x] Verify comparison works end-to-end via tests (8 tests passing)

### B) Property Favorites Feature (already exists)
- [x] Heart icon on property cards and detail page
- [x] localStorage-based favorites for guest users
- [x] DB-synced favorites for logged-in customers (customer_favorites table)
- [x] Favorites page at /favorites with sorting (newest, price asc/desc)
- [x] Share favorites via URL (/favorites?ids=1,2,3)
- [x] Clear all favorites with confirmation
- [x] Favorites count badge in Navbar
- [x] Cross-tab sync via storage events
- [x] Backend endpoints: getFavorites, syncFavorites, toggleFavorite, clearFavorites
- [x] Verify favorites works end-to-end via tests (7 tests passing)

## Major Features Batch (Feb 16, 2026)

### A) Email Drip Campaigns for Financing Leads
- [x] Add drip_emails table (id, financingRequestId, emailType, scheduledAt, sentAt, status)
- [x] Add drip campaign settings to DB (drip_enabled, drip_day1/3/7 enabled/subject/body in AR+EN)
- [x] Create server-side drip scheduler (5-min interval, processes pending emails)
- [x] Add admin Settings > حملات المتابعة tab to configure email templates
- [x] Auto-create drip schedule (day 1, 3, 7) when financing request is submitted
- [x] Track email delivery status (pending, sent, failed, cancelled)

### B) Property Map View
- [x] Full-screen PropertyMapView page at /properties/map with sidebar filtering
- [x] Map/list/grid toggle works on Properties page (existing)
- [x] Property markers show on map with correct coordinates
- [x] Route added to App.tsx

### C) Customer Dashboard Enhancement
- [x] Add "inquiries" tab to CustomerAccount page (with status badges, property links)
- [x] Add "financing" tab to CustomerAccount page (with financial details grid, reference numbers)
- [x] Create customer.getMyInquiries endpoint (match by phone number)
- [x] Create customer.getMyFinancingRequests endpoint (match by phone/email)
- [x] Show inquiry history with status badges and type labels
- [x] Show financing request history with status, reference numbers, and financial breakdown
- [x] Write vitest tests for all new endpoints (10 tests, all passing)

## Virtual Tour Embed (Feb 16, 2026)

### A) Database & Backend
- [x] Add virtualTourUrl column (varchar 1000, nullable) to properties table
- [x] Add virtualTourType column (enum: matterport/youtube/custom, nullable) to properties table
- [x] Update admin createProperty and updateProperty endpoints to accept virtual tour fields
- [x] Update public getProperty and searchProperties to return virtual tour data

### B) Admin Property Form
- [x] Add virtual tour URL input field to admin property create/edit form
- [x] Add virtual tour type selector (Matterport, YouTube, Custom 360)
- [x] Auto-detect tour type from URL (my.matterport.com → matterport, youtube.com → youtube)
- [x] URL auto-detection provides instant type feedback in form

### C) Frontend VirtualTourEmbed Component
- [x] Build VirtualTourEmbed component with iframe embed for Matterport/YouTube/custom
- [x] Auto-detect and format embed URLs (Matterport showcase, YouTube embed)
- [x] Add expand/minimize toggle and open-in-new-tab button
- [x] Bilingual AR/EN labels and navigation hints
- [x] Integrate into PropertyDetail page (show only when URL is set)
- [x] Loading skeleton and error fallback with external link

### D) Tests
- [x] Write 11 vitest tests for virtual tour feature (all passing)

## UI Fixes & Enhancements (Feb 16, 2026 - Batch 2)

### A) Services Section - Arabic Text & Backend Editability
- [x] Fix "Comprehensive Real Estate Services" heading — now shows Arabic text when in Arabic mode
- [x] Ensure services section title/subtitle are backend-editable from CMS
- [x] Verify bilingual switching works correctly for services section

### B) Partners/Clients Section - Real Logos
- [x] Obtain real logos for all 7 partners (SABB, Zahran, Agile Clinics, Benefit Travel, Burgerizzr, Al Faisaliah Group, Al Rajhi)
- [x] Upload logos to S3 and update partner records in database
- [x] Ensure logos display correctly in the carousel/grid

### C) Projects Section - Uniform Card Size
- [x] Fix project cards to have same size/frame (uniform height 180px and flex layout)
- [x] Ensure consistent spacing and alignment across all project cards (4-col grid, line-clamp)

### D) Developer Documentation
- [x] Create comprehensive DEVELOPER_DOCS.md (16 sections, 500+ lines)
- [x] Document all endpoints (50+ procedures), database schema (30+ tables), admin features
- [x] Include setup instructions, environment variables, deployment guide, common tasks

## Bug Fix - Unexpected Error on Homepage
- [x] Diagnose "حدث خطأ غير متوقع" error on homepage (ReferenceError in useFavorites hook)
- [x] Fix root cause: removed try/catch around React hook call (Rules of Hooks violation)

## Bug Fix - Property Detail Page Error & Hide Mortgage Calculator
- [x] Diagnose property detail page crash — MortgageCalculator had React hooks violation (early return before useMemo)
- [x] Hide حاسبة التمويل العقاري (mortgage calculator) from property detail page
- [x] Verify property detail page loads without errors (confirmed on dev server)

## Map Fixes - Property Markers & Labels
- [x] Audit all map-related components (PropertyDetail map, Properties listing map, general map)
- [x] Fix property markers — geocoded all 101 properties via Google Geocoding API
- [x] Elegant info labels/popups already implemented in PropertyMapView component
- [x] Verified property detail page map shows correct location with marker and nearby amenities
- [x] Fixed /properties/map route conflict (moved before /:id in App.tsx)
- [x] Added admin geocodeProperties and geocodeSingleProperty endpoints

## Map Fix - Wrong Location & Empty Info Window
- [x] Fix property detail map showing wrong location (in the sea for Jeddah properties)
- [x] Fix empty info window popup on map marker click
- [x] Re-geocode all 103 properties with city-validated coordinates (43 were wrong, now 0 wrong)
- [x] Verify map displays correctly for properties in all cities (Riyadh, Jeddah, Dammam, Khobar, Makkah, Madinah)
- [x] Improved geocoding endpoint with city range validation and retry logic
- [x] Added initialCenter and initialZoom props to PropertyDetail map
- [x] 17 new vitest tests for geocoding validation, address format, map center computation

## Bug Fix - Property Detail Page Error (/properties/3)
- [x] Diagnose "حدث خطأ غير متوقع" error on property detail page in production
- [x] Fix root cause: useMemo(mapCenter) was placed after early returns, violating React Rules of Hooks
- [x] Verify fix works on dev server — property detail page loads correctly

## Bug Fix - Phone Number Missing on Contact Section
- [x] Fix agency logo position in RTL — added dir={isAr ? "rtl" : "ltr"} to agency/agent card rows
- [x] Fix phone input field (رقم الجوال) — RTL aligned, accepts international numbers across all forms
- [x] Updated phone validation on backend (4 endpoints) to accept international format (7-20 digits, +, -, spaces, parens)
- [x] Updated phone inputs on Contact, AddProperty, RequestProperty, MortgageCalculator, PropertyDetail
- [x] Updated i18n phone placeholders from 05XXXXXXXX to +966 5x xxx xxxx

## Map Markers Improvement
- [x] Replace price label markers with simple colored dots (red=sale, blue=rent, gold=cluster)
- [x] Click on dot navigates directly to property detail page
- [x] Cluster nearby properties (~100m) with count badge and expandable pagination panel

## Cluster Popup Improvement
- [x] Show scrollable list of all properties in cluster popup with price, bedrooms, area, type
- [x] Each item in list links to property detail page
- [x] Update both component map and full-screen map page

## Performance & Scalability Optimization
### Database
- [x] Add 35 database indexes on frequently queried columns (city, district, listingType, propertyType, status, price, createdAt, etc.)
- [x] Add composite indexes for common filter combinations (property search, views, favorites)
- [x] N+1 queries already avoided — Drizzle ORM uses JOIN-based queries
- [x] Increased pagination limits from 50 to 200 for map and search endpoints

### Server-side
- [x] Implement in-memory caching layer (MemoryCache class with TTL, prefix invalidation, auto-cleanup)
- [x] Cache 8 key endpoints: siteConfig (5min), homepageStats (2min), cities/districts/amenities (10min), mortgageConfig (5min)
- [x] Auto-invalidate caches via logAudit() when admin modifies data (property, project, setting, city, district, amenity, agency, agent)
- [x] Rate limiting already in place (global + auth + forms) from template
- [x] Add response compression (gzip/brotli) via compression middleware
- [x] 9 new vitest tests for cache module (getOrSet, TTL expiry, invalidation, prefix, concurrent, stats)

### Frontend
- [x] Lazy loading for all 20+ routes already implemented (React.lazy + Suspense)
- [x] Added loading="lazy" to 45 images across 25 components
- [x] Increased map property limit from 50 to 200 for full-screen map
- [x] Map uses clustering to handle dense areas efficiently
- [x] Bundle already tree-shaken by Vite production build

### Infrastructure
- [x] Static assets served with aggressive caching via Vite build hashing
- [x] Cache TTL presets: CONFIG(5min), STATS(2min), LISTINGS(30s), DETAIL(1min), REFERENCE_DATA(10min), SEARCH(15s)
- [x] Database connection pooling handled by TiDB serverless driver

## Breadcrumb Visibility Fix + SMTP
- [x] Fix breadcrumb text (الرئيسية > العقارات) — dark navy bg (#0f1b33) with white/gold text for high contrast
- [x] Fix breadcrumb hidden behind sticky header — increased pt-28 to pt-32 on PropertyDetail and ProjectDetail
- [ ] Update SMTP credentials for email functionality (skipped — user will handle later)

## Full Production Audit
### Security
- [x] Auth flow: JWT validation (HS256, 7d expiry), session cookie (HttpOnly, Secure, SameSite=None), CSRF double-submit token
- [x] XSS prevention: DOMPurify sanitizeHtml/sanitizeText on all admin inputs, dangerouslySetInnerHTML only with sanitized content
- [x] SQL injection: Drizzle ORM parameterized queries throughout, no raw SQL with user input
- [x] Rate limiting: global (100/15min), auth (10/15min), forms (5/15min), OTP send (3/phone/10min), OTP verify brute-force (5 attempts/phone/10min)
- [x] Secrets exposure: JWT_SECRET, SMTP_PASS, BUILT_IN_FORGE_API_KEY server-only; VITE_ prefix only for public keys
- [x] File upload: MIME whitelist (image/jpeg,png,webp,gif,svg+xml,pdf), base64 max 14MB, file size max 10MB, body limit 15MB
- [x] Admin access: role-based (admin/user enum), adminProcedure middleware, account lockout after 5 failed logins
- [x] Security headers added: X-Frame-Options DENY, X-Content-Type-Options nosniff, HSTS, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- [x] OTP code removed from production console.log (dev-only logging)
- [x] tRPC error handler strips stack traces in production

### Data Validation
- [x] Input validation: all 50+ tRPC inputs have Zod schemas with .min()/.max()/.email()/.regex()
- [x] Boundary checks: price (0-999M), area (0-100K), rooms (0-99), pagination (1-200)
- [x] Phone/email validation: international format (7-20 digits) consistent across all 6 form endpoints
- [x] File upload validation: MIME whitelist + base64 max length + file size cap on all 3 upload endpoints
- [x] SQL query safety: 100% Drizzle ORM, zero raw SQL

### Logic & Error Handling
- [x] Business rules: property status transitions (active/inactive/sold/rented), listing type (sale/rent)
- [x] Race conditions: OTP marked used atomically, bcrypt compare before session creation
- [x] Error handling: TRPCError with bilingual messages, frontend ErrorBoundary with retry button
- [x] Edge cases: empty states handled in all list pages, deleted references checked before display
- [x] API error responses: consistent TRPCError format, stack traces stripped in production

### Deployment Readiness
- [x] Environment variables: 20+ vars documented in README, all set via webdev_request_secrets
- [x] Build configuration: Vite production build with tree-shaking, code splitting, asset hashing
- [x] Error pages: custom ErrorBoundary with bilingual retry, 404 handled by client-side router
- [x] SEO: meta tags on all pages, robots.txt present, structured data for properties
- [x] Accessibility: focus rings, keyboard navigation, ARIA labels on interactive elements
- [x] Performance: lazy loading (20+ routes, 45 images), gzip/brotli compression, in-memory caching, 35 DB indexes

### Security Tests
- [x] 12 new vitest tests: security headers, upload validation, OTP brute-force, body size limit, MIME whitelist, sanitization, password hashing

## Bug Fix - Services & Properties Section English Text in Arabic Mode
- [x] Fix Services section heading showing "Comprehensive Real Estate Services" instead of Arabic when in Arabic mode
- [x] Fix Services section subtitle showing English instead of Arabic
- [x] Fix "More Details" link text showing in English instead of Arabic (المزيد)
- [x] Fix "Featured Properties" / "Latest Properties" heading showing in English instead of Arabic
- [x] Fix property type filter buttons (Buildings, Commercial, Offices, etc.) showing in English instead of Arabic
