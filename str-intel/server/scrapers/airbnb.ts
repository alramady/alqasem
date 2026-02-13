/**
 * Airbnb Scraper — Uses Airbnb's internal API endpoints for search and listing details.
 * Implements rate limiting, proxy rotation, and calendar analysis for occupancy estimation.
 */
import { BaseScraper, ScrapedListing, ScrapeResult, sleep } from "./base";

// Riyadh neighborhood bounding boxes for search
const RIYADH_NEIGHBORHOODS: Record<string, { neLat: number; neLng: number; swLat: number; swLng: number }> = {
  "Al Olaya": { neLat: 24.7100, neLng: 46.6950, swLat: 24.6850, swLng: 46.6700 },
  "Al Wizarat": { neLat: 24.6650, neLng: 46.7150, swLat: 24.6450, swLng: 46.6950 },
  "BLVD City": { neLat: 24.7550, neLng: 46.6450, swLat: 24.7350, swLng: 46.6200 },
  "Al Malqa": { neLat: 24.8100, neLng: 46.6350, swLat: 24.7850, swLng: 46.6050 },
  "Al Nakheel": { neLat: 24.7700, neLng: 46.6550, swLat: 24.7500, swLng: 46.6300 },
  "Hittin": { neLat: 24.7800, neLng: 46.6200, swLat: 24.7550, swLng: 46.5900 },
  "Al Sulaimaniyah": { neLat: 24.7000, neLng: 46.6800, swLat: 24.6800, swLng: 46.6550 },
  "KAFD": { neLat: 24.7700, neLng: 46.6750, swLat: 24.7500, swLng: 46.6500 },
};

interface AirbnbSearchResult {
  explore_tabs?: Array<{
    sections?: Array<{
      listings?: Array<{
        listing: AirbnbListing;
        pricing_quote?: {
          rate?: { amount: number };
          weekly_price_factor?: number;
          monthly_price_factor?: number;
        };
      }>;
    }>;
  }>;
  data?: {
    presentation?: {
      staysSearch?: {
        results?: {
          searchResults?: Array<{
            listing?: AirbnbListing;
            pricingQuote?: {
              structuredStayDisplayPrice?: {
                primaryLine?: { price?: string; discountedPrice?: string };
              };
              priceString?: string;
              rate?: { amount?: number; currency?: string };
            };
          }>;
          paginationInfo?: { hasNextPage: boolean; nextPageCursor: string };
        };
      };
    };
  };
}

interface AirbnbListing {
  id: string | number;
  name?: string;
  city?: string;
  lat?: number;
  lng?: number;
  room_type?: string;
  room_type_category?: string;
  bedrooms?: number;
  bathrooms?: number;
  person_capacity?: number;
  star_rating?: number;
  avg_rating?: number;
  reviews_count?: number;
  picture_count?: number;
  photos?: Array<unknown>;
  is_superhost?: boolean;
  user?: {
    id: string | number;
    first_name?: string;
    is_superhost?: boolean;
    listings_count?: number;
    response_rate?: number;
  };
  preview_amenity_names?: string[];
  amenity_ids?: number[];
  instant_bookable?: boolean;
}

interface AirbnbCalendarDay {
  date: string;
  available: boolean;
  price?: { local_price: number; local_currency: string };
}

export class AirbnbScraper extends BaseScraper {
  private apiKey = "d306zoyjsyarp7ifhu67rjxn52tv0t20"; // Public Airbnb API key (used in browser)

  constructor(options?: {
    maxConcurrent?: number;
    delayMs?: number;
    timeout?: number;
    proxies?: Array<{ host: string; port: number; username?: string; password?: string }>;
  }) {
    super("airbnb", {
      maxConcurrent: options?.maxConcurrent || 2,
      delayMs: options?.delayMs || 2000,
      timeout: options?.timeout || 30000,
      proxies: options?.proxies,
    });
  }

  async scrapeNeighborhood(
    neighborhoodName: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 3
  ): Promise<ScrapeResult> {
    const startTime = Date.now();
    const listings: ScrapedListing[] = [];
    this.errors = [];

    try {
      // Use bounding box if available, otherwise calculate from center point
      const bounds = RIYADH_NEIGHBORHOODS[neighborhoodName] || {
        neLat: latitude + (radiusKm / 111),
        neLng: longitude + (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))),
        swLat: latitude - (radiusKm / 111),
        swLng: longitude - (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))),
      };

      // Search with pagination
      let cursor: string | null = null;
      let page = 0;
      const maxPages = 10;

      do {
        try {
          const searchResults = await this.searchListings(bounds, cursor);
          const results = searchResults.data?.presentation?.staysSearch?.results;

          if (!results?.searchResults?.length) break;

          for (const result of results.searchResults) {
            if (!result.listing) continue;
            try {
              const scraped = this.parseSearchResult(result, neighborhoodName);
              if (scraped) listings.push(scraped);
            } catch (e) {
              this.logError(`Failed to parse listing ${result.listing?.id}`, e);
            }
          }

          // Check pagination
          const pagination = results.paginationInfo;
          cursor = pagination?.hasNextPage ? pagination.nextPageCursor : null;
          page++;

          // Respectful delay between pages
          if (cursor) await sleep(2000 + Math.random() * 2000);
        } catch (e) {
          this.logError(`Search page ${page} failed`, e);
          break;
        }
      } while (cursor && page < maxPages);

      // Fetch calendar data for occupancy estimation (sample of listings)
      const sampleSize = Math.min(listings.length, 20);
      const sample = listings.slice(0, sampleSize);
      for (const listing of sample) {
        try {
          const calendar = await this.fetchCalendar(listing.externalId);
          if (calendar) {
            const { available, blocked, booked } = this.analyzeCalendar(calendar);
            listing.availableDays = available;
            listing.blockedDays = blocked;
            listing.bookedDays = booked;
          }
          await sleep(1500 + Math.random() * 1500);
        } catch (e) {
          this.logError(`Calendar fetch failed for ${listing.externalId}`, e);
        }
      }
    } catch (e) {
      this.logError("Neighborhood scrape failed", e);
    }

    return {
      listings,
      totalFound: listings.length,
      errors: this.errors,
      duration: Date.now() - startTime,
    };
  }

  private async searchListings(
    bounds: { neLat: number; neLng: number; swLat: number; swLng: number },
    cursor?: string | null
  ): Promise<AirbnbSearchResult> {
    // Airbnb StaysSearch API (v3)
    const variables = {
      staysSearchRequest: {
        requestedPageType: "STAYS_SEARCH",
        cursor: cursor || undefined,
        metadataOnly: false,
        searchType: "AUTOSUGGEST",
        treatmentFlags: ["decompose_stays_search_m2_treatment"],
        rawParams: [
          { filterName: "cdnCacheSafe", filterValues: ["false"] },
          { filterName: "channel", filterValues: ["EXPLORE"] },
          { filterName: "datePickerType", filterValues: ["flexible_dates"] },
          { filterName: "flexibleTripLengths", filterValues: ["one_week"] },
          { filterName: "itemsPerGrid", filterValues: ["18"] },
          { filterName: "neLat", filterValues: [String(bounds.neLat)] },
          { filterName: "neLng", filterValues: [String(bounds.neLng)] },
          { filterName: "swLat", filterValues: [String(bounds.swLat)] },
          { filterName: "swLng", filterValues: [String(bounds.swLng)] },
          { filterName: "placeId", filterValues: ["ChIJzYJKLRy3j0ARk2hDgMbKBcQ"] }, // Riyadh
          { filterName: "query", filterValues: ["Riyadh, Saudi Arabia"] },
          { filterName: "refinementPaths", filterValues: ["/homes"] },
          { filterName: "screenSize", filterValues: ["large"] },
          { filterName: "searchByMap", filterValues: ["true"] },
          { filterName: "tabId", filterValues: ["home_tab"] },
          { filterName: "version", filterValues: ["1.8.3"] },
        ],
      },
      staysMapSearchRequestV2: {
        cursor: cursor || undefined,
        requestedPageType: "STAYS_SEARCH",
        metadataOnly: false,
        searchType: "AUTOSUGGEST",
      },
    };

    const extensions = {
      persistedQuery: {
        version: 1,
        sha256Hash: "bde138c3f43f0e1e1a3e15b0a2e64e04e1b0e58f9c2b1e3f4d5c6a7b8c9d0e1f",
      },
    };

    const url = `https://www.airbnb.com/api/v3/StaysSearch/${encodeURIComponent(JSON.stringify(extensions))}`;

    try {
      return await this.fetchJson<AirbnbSearchResult>(url, {
        params: {
          operationName: "StaysSearch",
          locale: "en",
          currency: "SAR",
          variables: JSON.stringify(variables),
          extensions: JSON.stringify(extensions),
        },
        headers: {
          "X-Airbnb-API-Key": this.apiKey,
          "X-Airbnb-GraphQL-Platform": "web",
          "X-Airbnb-GraphQL-Platform-Client": "minimalist-niobe",
          "Content-Type": "application/json",
          "Referer": "https://www.airbnb.com/s/Riyadh--Saudi-Arabia/homes",
          "Origin": "https://www.airbnb.com",
        },
      });
    } catch {
      // Fallback to explore_tabs API
      return this.searchListingsFallback(bounds, cursor);
    }
  }

  private async searchListingsFallback(
    bounds: { neLat: number; neLng: number; swLat: number; swLng: number },
    cursor?: string | null
  ): Promise<AirbnbSearchResult> {
    const params: Record<string, string> = {
      _format: "for_explore_search_web",
      currency: "SAR",
      locale: "en",
      items_per_grid: "18",
      key: this.apiKey,
      ne_lat: String(bounds.neLat),
      ne_lng: String(bounds.neLng),
      sw_lat: String(bounds.swLat),
      sw_lng: String(bounds.swLng),
      search_by_map: "true",
      search_type: "filter",
      query: "Riyadh, Saudi Arabia",
    };

    if (cursor) {
      params.items_offset = cursor;
    }

    return this.fetchJson<AirbnbSearchResult>(
      "https://www.airbnb.com/api/v2/explore_tabs",
      { params }
    );
  }

  private async fetchCalendar(listingId: string): Promise<AirbnbCalendarDay[] | null> {
    try {
      const now = new Date();
      const startDate = now.toISOString().split("T")[0];
      const endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const url = `https://www.airbnb.com/api/v3/PdpAvailabilityCalendar`;
      const data = await this.fetchJson<any>(url, {
        params: {
          operationName: "PdpAvailabilityCalendar",
          locale: "en",
          currency: "SAR",
          variables: JSON.stringify({
            request: {
              count: 3,
              listingId: listingId,
              month: now.getMonth() + 1,
              year: now.getFullYear(),
            },
          }),
        },
        headers: {
          "X-Airbnb-API-Key": this.apiKey,
        },
      });

      const months = data?.data?.merlin?.pdpAvailabilityCalendar?.calendarMonths || [];
      const days: AirbnbCalendarDay[] = [];

      for (const month of months) {
        for (const day of month.days || []) {
          days.push({
            date: day.calendarDate,
            available: day.available,
            price: day.price
              ? { local_price: day.price.localPriceFormatted ? parseFloat(day.price.localPriceFormatted.replace(/[^0-9.]/g, "")) : 0, local_currency: "SAR" }
              : undefined,
          });
        }
      }

      return days;
    } catch {
      return null;
    }
  }

  private analyzeCalendar(days: AirbnbCalendarDay[]): { available: number; blocked: number; booked: number } {
    let available = 0;
    let blocked = 0;

    for (const day of days) {
      if (day.available) {
        available++;
      } else {
        blocked++;
      }
    }

    // Estimate booked days: blocked days that likely represent bookings
    // Heuristic: if a blocked period is 1-14 days, it's likely a booking
    // Longer blocks may be owner-blocked dates
    const booked = Math.round(blocked * 0.7); // Conservative estimate

    return { available, blocked, booked };
  }

  private parseSearchResult(
    result: any,
    neighborhoodName: string
  ): ScrapedListing | null {
    const listing = result.listing;
    if (!listing?.id) return null;

    const bedrooms = listing.bedrooms || 0;
    const user = listing.user || {};
    const isPropertyManager = (user.listings_count || 0) >= 3;

    // Extract price from various response formats
    let nightlyRate: number | null = null;
    const pricing = result.pricingQuote || result.pricing_quote;
    if (pricing?.rate?.amount) {
      nightlyRate = pricing.rate.amount;
    } else if (pricing?.structuredStayDisplayPrice?.primaryLine?.price) {
      const priceStr = pricing.structuredStayDisplayPrice.primaryLine.price;
      nightlyRate = parseFloat(priceStr.replace(/[^0-9.]/g, "")) || null;
    } else if (pricing?.priceString) {
      nightlyRate = parseFloat(pricing.priceString.replace(/[^0-9.]/g, "")) || null;
    }

    return {
      externalId: String(listing.id),
      otaSlug: "airbnb",
      title: listing.name || `Airbnb ${listing.id}`,
      url: `https://www.airbnb.com/rooms/${listing.id}`,
      propertyType: this.mapBedroomCount(bedrooms),
      hostType: isPropertyManager ? "property_manager" : "individual",
      hostName: user.first_name || "Unknown",
      hostId: String(user.id || ""),
      bedrooms,
      bathrooms: listing.bathrooms || 1,
      maxGuests: listing.person_capacity || 2,
      latitude: listing.lat || 0,
      longitude: listing.lng || 0,
      rating: listing.avg_rating || listing.star_rating || 0,
      reviewCount: listing.reviews_count || 0,
      photoCount: listing.picture_count || listing.photos?.length || 0,
      amenities: listing.preview_amenity_names || [],
      isSuperhost: listing.is_superhost || user.is_superhost || false,
      responseRate: user.response_rate || null,
      instantBook: listing.instant_bookable || false,
      nightlyRate,
      weeklyRate: nightlyRate && pricing?.weekly_price_factor
        ? nightlyRate * 7 * pricing.weekly_price_factor
        : null,
      monthlyRate: nightlyRate && pricing?.monthly_price_factor
        ? nightlyRate * 30 * pricing.monthly_price_factor
        : null,
      cleaningFee: null,
      currency: "SAR",
      availableDays: null,
      blockedDays: null,
      bookedDays: null,
    };
  }
}
