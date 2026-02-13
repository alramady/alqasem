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
