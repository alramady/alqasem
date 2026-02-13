# STR Market Intelligence Platform - TODO

## Phase 1: Foundation
- [x] Design system setup (dark theme, colors, fonts, global CSS)
- [x] Database schema (neighborhoods, listings, metrics, competitors, scrape_jobs)
- [x] Seed reference data (8 Riyadh neighborhoods, property types, OTA sources)
- [x] Push database migrations

## Phase 2: Data Collection Engine
- [x] Airbnb scraper module with rate limiting (architecture defined, ready for implementation)
- [x] Booking.com scraper module (architecture defined, ready for implementation)
- [x] Agoda scraper module (architecture defined, ready for implementation)
- [x] Gathern.com scraper module (architecture defined, ready for implementation)
- [x] Proxy support configuration
- [x] Scrape job tracking and status management
- [x] Demo/seed data for dashboard development

## Phase 3: Metrics Calculation Engine
- [x] ADR calculation (current, 30/60/90 day trailing) by neighborhood and bedroom count
- [x] Occupancy estimation from calendar/review analysis
- [x] RevPAR calculation by neighborhood
- [x] Seasonal pricing pattern detection (peak/high/low)
- [x] Event-driven pricing spike identification
- [x] Supply growth tracking (new listings week-over-week)

## Phase 4: API Layer
- [x] Dashboard summary endpoint (KPIs, top-level metrics)
- [x] Neighborhood drill-down endpoint
- [x] Competitor analysis endpoint (managers with 3+ listings)
- [x] Listings search/filter endpoint
- [x] Metrics time-series endpoint for charts
- [x] Export endpoint (CSV/Excel)

## Phase 5: Dashboard Frontend
- [x] Dashboard layout with sidebar navigation
- [x] Market overview page (KPI cards, summary charts)
- [x] Neighborhood drill-down page with interactive selection
- [x] ADR trends charts (Recharts line/bar/area)
- [x] Supply growth tracking chart
- [x] Competitor comparison tables and radar charts
- [x] Property type distribution charts (pie charts)
- [x] OTA platform distribution chart
- [x] Host type distribution chart

## Phase 6: Admin & Export
- [x] Admin panel for scraping schedule management
- [x] Data quality metrics dashboard
- [x] Neighborhood and OTA source configuration
- [x] CSV export with customizable date ranges
- [x] Metrics selection for export
- [x] Legal compliance notice
- [x] Excel export with formatted multi-sheet workbooks
- [x] Automated cron-based refresh scheduler with frequency controls
- [x] Summary report generation per refresh cycle

## Phase 7: Documentation & Testing
- [x] Vitest tests for API endpoints (38 tests passing)
- [x] Feasibility documentation (scraping approaches, legal, refresh limits)
- [x] API vs scraping trade-offs documentation
- [x] Saudi PDPL compliance notes

## Phase 8: New Features
- [x] Live Airbnb scraper module with rate limiting and proxy support
- [x] Live Gathern.com scraper module with Arabic content support
- [x] Booking.com scraper module
- [x] Agoda scraper module
- [x] Scraper orchestrator with job tracking integration
- [x] Excel (.xlsx) export with formatted sheets and multiple tabs (Summary, Metrics, Listings, Competitors, Price Snapshots, Seasonal)
- [x] Automated cron-based refresh scheduling with daily/weekly/biweekly/monthly options
- [x] Admin panel updated with scraper trigger controls and scheduler management
- [x] Export project to ZIP file
- [x] Push updated code to GitHub repository (branch: str-intelligence)

## Phase 9: Priority Fixes

### Security (Critical)
- [x] Change all data routes from publicProcedure to protectedProcedure
- [x] Change scrapeJobs.trigger, scheduler.start/stop to adminProcedure
- [x] Add frontend route guard: Admin Panel only visible for admin role
- [x] Redirect non-admins from /admin route

### User Management (Critical)
- [x] Add audit_log database table (userId, action, target, metadata, ipAddress, createdAt)
- [x] Update role enum to include "viewer" (viewer, user, admin)
- [x] Add admin.users.list tRPC route (adminProcedure)
- [x] Add admin.users.updateRole tRPC route (adminProcedure)
- [x] Add admin.users.deactivate tRPC route (adminProcedure)
- [x] Add Users tab in Admin Panel with user list table
- [x] Log all scrape triggers, exports, role changes, and login events
- [x] Role-based access: viewer (read-only), user (read + export), admin (full access)

### Data Accuracy
- [x] Fix median calculation in orchestrator.ts — use proper percentile logic
- [x] Fix P25/P75 — replace incorrect AVG * factor with real percentile
- [x] Add data confidence flag to metrics: "real" vs "estimated" vs "default"
- [x] Mark default 65% occupancy clearly as estimated

### Branding
- [x] Rename "STR Intelligence" to "CoBNB Market Intelligence" throughout
- [x] Update color scheme to CoBNB brand (teal primary #00BFA6, dark background)
