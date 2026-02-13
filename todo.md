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
