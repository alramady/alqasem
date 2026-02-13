# STR Market Intelligence Platform — Feasibility Report

## CoBNB KSA — Riyadh Short-Term Rental Market Intelligence

**Prepared for:** CoBNB KSA Management  
**Date:** February 2026  
**Version:** 1.0

---

## Executive Summary

This report addresses the key feasibility questions for building a comprehensive short-term rental (STR) market intelligence platform focused on the Saudi Arabian market, starting with Riyadh. The platform collects, analyzes, and visualizes data from four OTA platforms (Airbnb, Booking.com, Agoda, and Gathern.com) to support pricing strategy validation, supply gap identification, competitor tracking, and property owner acquisition.

---

## 1. Platform Scraping Feasibility

### 1.1 Airbnb

| Aspect | Assessment |
|--------|-----------|
| **Method** | Internal API (explore_tabs / StaysSearch) + HTML parsing |
| **Reliability** | Medium-High — API endpoints change periodically but are well-documented by the community |
| **Rate Limiting** | Aggressive — requires residential proxies, 2-3 req/sec max |
| **Data Available** | Listing details, pricing, availability calendars, reviews, host info, amenities, photos |
| **Calendar Access** | Yes — availability calendars accessible per listing for occupancy estimation |
| **Host Identification** | Yes — host ID, name, superhost status, response rate, number of listings |
| **Challenges** | Anti-bot measures (Cloudflare), CAPTCHA triggers, session management |

**Recommended Approach:** Use Airbnb's internal API endpoints (`/api/v3/StaysSearch`) with rotating residential proxies and browser-like headers. Calendar data available via `/api/v3/PdpAvailabilityCalendar`. Implement exponential backoff and session rotation.

### 1.2 Booking.com

| Aspect | Assessment |
|--------|-----------|
| **Method** | HTML scraping + structured data (JSON-LD) |
| **Reliability** | Medium — frequent HTML structure changes, but JSON-LD is stable |
| **Rate Limiting** | Moderate — 3-5 req/sec with proxy rotation |
| **Data Available** | Listing details, pricing, ratings, reviews, property type, amenities |
| **Calendar Access** | Limited — availability shown per search query, not full calendar |
| **Host Identification** | Limited — property manager names visible but no unique host IDs |
| **Challenges** | Dynamic pricing per search context, A/B testing variations |

**Recommended Approach:** Scrape search results pages for Riyadh neighborhoods with date-range queries. Extract JSON-LD structured data for consistent parsing. Use multiple date ranges to estimate availability patterns.

### 1.3 Agoda

| Aspect | Assessment |
|--------|-----------|
| **Method** | API endpoints + HTML parsing |
| **Reliability** | Medium — less anti-bot protection than Airbnb/Booking |
| **Rate Limiting** | Moderate — 3-5 req/sec |
| **Data Available** | Listing details, pricing, ratings, property type |
| **Calendar Access** | Limited — availability per search query |
| **Host Identification** | Minimal — property names only, no host-level aggregation |
| **Challenges** | Smaller STR inventory in Saudi Arabia compared to Airbnb/Booking |

**Recommended Approach:** API-based scraping with search queries per neighborhood. Lower priority due to smaller Saudi STR inventory. Focus on hotel-apartment crossover listings.

### 1.4 Gathern.com

| Aspect | Assessment |
|--------|-----------|
| **Method** | HTML scraping + potential API |
| **Reliability** | High — less sophisticated anti-bot measures |
| **Rate Limiting** | Low — 5-10 req/sec feasible |
| **Data Available** | Listing details, pricing, ratings, host info, amenities (Arabic-first) |
| **Calendar Access** | Yes — booking calendar typically accessible |
| **Host Identification** | Good — host profiles with portfolio visibility |
| **Challenges** | Arabic-primary content requires Arabic NLP, smaller but growing platform |

**Recommended Approach:** Direct HTML scraping with Arabic text processing. Gathern is the most important local platform for Saudi STR data and has the least aggressive anti-scraping measures. Prioritize alongside Airbnb.

### 1.5 Feasibility Summary

| Platform | Feasibility | Priority | Est. Coverage |
|----------|------------|----------|---------------|
| Airbnb | High | P1 | ~40% of Riyadh STR market |
| Gathern.com | High | P1 | ~25% of Riyadh STR market |
| Booking.com | Medium | P2 | ~25% of Riyadh STR market |
| Agoda | Medium-Low | P3 | ~10% of Riyadh STR market |

---

## 2. Refresh Frequency Analysis

### 2.1 Realistic Refresh Frequencies

| Data Type | Recommended Frequency | Rationale |
|-----------|----------------------|-----------|
| **Pricing (ADR)** | Weekly | Prices change frequently; weekly captures trends without excessive load |
| **Availability/Occupancy** | Bi-weekly | Calendar changes are gradual; bi-weekly sufficient for trend analysis |
| **New Listings (Supply)** | Weekly | Detect new supply entering market promptly |
| **Reviews/Ratings** | Monthly | Reviews accumulate slowly; monthly is sufficient |
| **Competitor Portfolios** | Bi-weekly | Portfolio changes are infrequent |
| **Amenities/Quality Signals** | Monthly | These change rarely |

### 2.2 Estimated Scraping Volume

For Riyadh Phase 1 (8 neighborhoods, ~200-500 active listings):

| Cycle | Listings to Scrape | Pages/Requests | Est. Duration |
|-------|-------------------|----------------|---------------|
| Weekly price scan | ~500 listings × 4 OTAs | ~2,000 requests | 2-4 hours |
| Bi-weekly full scan | ~500 listings × 4 OTAs | ~4,000 requests | 4-8 hours |
| Monthly deep scan | ~500 listings × 4 OTAs | ~6,000 requests | 6-12 hours |

### 2.3 Recommended Schedule

- **Every Monday 2:00 AM AST:** Price update scan (all OTAs)
- **Every other Monday 2:00 AM AST:** Full scan including availability calendars
- **First Monday of month 2:00 AM AST:** Deep scan including reviews, amenities, quality signals

---

## 3. Output Format Recommendation

### 3.1 Live Dashboard (Primary)

The web-based dashboard is the **primary output format**, providing:
- Real-time KPI cards (Total Listings, ADR, Occupancy, RevPAR)
- Interactive charts with neighborhood drill-down
- Competitor analysis with radar charts and comparison tables
- Seasonal pattern visualization
- Filterable listings explorer

**Advantages:** Immediate access, interactive exploration, shareable via URL, mobile-responsive.

### 3.2 CSV/Excel Export (Secondary)

Export functionality supports:
- Customizable date ranges and metric selection
- Neighborhood and property type filtering
- Financial modeling-ready format with all metrics
- Bulk data download for external analysis

**Advantages:** Integration with financial models, offline analysis, sharing with stakeholders who prefer spreadsheets.

### 3.3 Automated Reports (Tertiary)

Bi-weekly summary reports highlighting:
- ADR trend changes (up/down by neighborhood)
- New supply entering market (week-over-week)
- Competitor movements (new listings, pricing changes)
- Occupancy shifts and seasonal patterns

**Recommendation:** Use **all three formats** — dashboard for daily monitoring, exports for financial modeling, reports for stakeholder communication.

---

## 4. Competitor Identification Capabilities

### 4.1 Property Manager Detection

The platform can identify property managers through:

| Signal | Method | Reliability |
|--------|--------|-------------|
| **Host ID clustering** | Group listings by host ID on Airbnb | High |
| **Host name matching** | Fuzzy match host names across listings | Medium |
| **Portfolio size** | Flag hosts with 3+ listings | High |
| **Cross-platform matching** | Match by property address/coordinates | Medium |
| **Company name detection** | NLP on host descriptions for company names | Medium |

### 4.2 Tracked Competitor Metrics

For each identified property manager:
- Portfolio size (number of active listings)
- Average nightly rate and pricing positioning
- Average guest rating and review count
- Superhost/preferred partner status
- Neighborhood distribution
- Property type mix
- Response rate and instant book availability

### 4.3 Limitations

- Cross-platform host matching is approximate (based on name/location similarity)
- Some property managers use multiple accounts
- Gathern host identification is more reliable than Booking.com
- New property managers may take 1-2 scan cycles to be detected

---

## 5. Supply Growth Tracking

### 5.1 New Listing Detection

The platform tracks supply growth through:
- **First-seen timestamps:** Every listing gets a `firstSeen` date on initial detection
- **Week-over-week comparison:** Dashboard shows new listings per neighborhood per week
- **Supply growth charts:** Trend lines showing cumulative and new supply over time
- **Alerts:** Configurable thresholds for unusual supply spikes

### 5.2 Metrics Tracked

| Metric | Granularity | Update Frequency |
|--------|------------|-----------------|
| New listings count | Per neighborhood, per property type | Weekly |
| Cumulative supply | Per neighborhood | Weekly |
| Listing churn (deactivated) | Per neighborhood | Bi-weekly |
| Net supply change | Per neighborhood | Weekly |

---

## 6. Legal Considerations

### 6.1 Saudi Arabia Personal Data Protection Law (PDPL)

The Saudi PDPL (Royal Decree M/19, effective September 2023) governs personal data processing:

| Aspect | Assessment |
|--------|-----------|
| **Scope** | Applies to processing personal data of individuals in Saudi Arabia |
| **Public Data** | Publicly available listing data (prices, ratings, amenities) is generally permissible to collect |
| **Personal Data** | Host names and profile information require careful handling |
| **Guest Data** | No guest personal data is collected — only aggregate review scores |
| **Data Minimization** | Collect only what is necessary for market analysis |
| **Storage** | Data should be stored within Saudi Arabia or approved jurisdictions |

### 6.2 Platform Terms of Service

| Platform | ToS Position on Scraping | Risk Level |
|----------|------------------------|------------|
| Airbnb | Prohibits automated data collection | Medium — common practice in industry |
| Booking.com | Prohibits scraping without permission | Medium |
| Agoda | Standard anti-scraping terms | Low-Medium |
| Gathern.com | Less restrictive terms | Low |

### 6.3 Risk Mitigation Strategies

1. **Rate limiting:** Respectful request rates (2-5 req/sec) to minimize platform impact
2. **Data minimization:** Only collect publicly visible data necessary for market analysis
3. **No personal guest data:** Never collect or store guest personal information
4. **Proxy rotation:** Use residential proxies to distribute load
5. **User-agent rotation:** Mimic normal browser behavior
6. **Robots.txt compliance:** Respect robots.txt directives where applicable
7. **API preference:** Use official APIs where available (Booking.com Affiliate API)
8. **Legal counsel:** Recommend consulting Saudi legal counsel for formal compliance assessment

### 6.4 Recommendation

The approach of collecting publicly available market data (pricing, availability, ratings) for competitive intelligence is a **standard industry practice** used by companies like AirDNA, AllTheRooms, and Transparent. The key is to:
- Never collect personal guest data
- Implement respectful scraping practices
- Store data securely with appropriate access controls
- Consult with Saudi legal counsel for formal PDPL compliance review

---

## 7. Technical Architecture

### 7.1 Current Implementation

| Component | Technology | Status |
|-----------|-----------|--------|
| Frontend | React 19 + Tailwind CSS 4 + Recharts | Implemented |
| Backend | Express + tRPC 11 | Implemented |
| Database | MySQL/TiDB (11 tables) | Implemented |
| Authentication | Manus OAuth | Implemented |
| Data Visualization | Recharts (line, bar, area, pie, radar) | Implemented |
| Export | CSV (client-side generation) | Implemented |

### 7.2 Phase 2 Additions (Recommended)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Scraper Engine | Playwright + Puppeteer | Automated data collection |
| Proxy Manager | Residential proxy pool | Anti-detection |
| Job Scheduler | Node-cron or Bull | Automated refresh cycles |
| NLP Pipeline | Arabic NLP for Gathern | Text processing |
| Notification | Email/Slack webhooks | Alert system |

### 7.3 Database Schema

The platform uses 11 database tables:

1. **users** — Authentication and access control
2. **neighborhoods** — Riyadh neighborhood definitions with coordinates
3. **ota_sources** — OTA platform configuration
4. **listings** — Individual STR listing records
5. **price_snapshots** — Historical pricing data points
6. **metrics** — Pre-calculated neighborhood/property type metrics
7. **competitors** — Identified property managers
8. **scrape_jobs** — Data collection job tracking
9. **seasonal_patterns** — Seasonal pricing patterns and events
10. **scrape_schedules** — Automated scraping schedule configuration
11. **reports** — Generated summary reports

---

## 8. Phase 2 Roadmap

### 8.1 Geographic Expansion

| City | Priority | Est. Listings | Timeline |
|------|----------|---------------|----------|
| Jeddah | P1 | 300-600 | Month 2-3 |
| Madinah | P2 | 100-300 | Month 3-4 |
| NEOM/Tabuk | P3 | 50-100 | Month 4-6 |

### 8.2 Feature Additions

1. **Demand-side signals:** Google Trends integration, booking lead time analysis
2. **Tourism event calendar:** Saudi Tourism Authority data, Riyadh Season schedule
3. **Guest origin markets:** Review language analysis for guest nationality estimation
4. **Automated reporting:** Bi-weekly email reports with key insights
5. **Price recommendation engine:** ML-based pricing suggestions
6. **API access:** REST API for integration with CoBNB's property management system

---

## 9. Conclusion

The STR Market Intelligence Platform is **technically feasible** and **strategically valuable** for CoBNB KSA's market entry. The current Phase 1 implementation provides a solid foundation with:

- Comprehensive data schema supporting all required metrics
- Interactive dashboard with neighborhood-level drill-down
- Competitor identification and tracking
- Export capabilities for financial modeling
- Seasonal pattern analysis

The primary risks are related to OTA platform anti-scraping measures, which can be mitigated through respectful scraping practices, proxy rotation, and prioritizing platforms with less aggressive detection (Gathern.com). Legal compliance under Saudi PDPL is achievable by focusing on publicly available market data and avoiding personal guest data collection.

**Recommended next steps:**
1. Deploy the current dashboard platform
2. Implement Airbnb and Gathern.com scrapers (highest priority)
3. Engage Saudi legal counsel for formal PDPL compliance review
4. Begin bi-weekly data collection cycles
5. Validate data quality against manual market research
6. Expand to Booking.com and Agoda scrapers
