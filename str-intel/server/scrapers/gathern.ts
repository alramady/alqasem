/**
 * Gathern.com Scraper — Saudi Arabia's leading local STR platform.
 * Scrapes search results and listing details with Arabic content support.
 * Less aggressive anti-bot measures compared to international OTAs.
 */
import { BaseScraper, ScrapedListing, ScrapeResult, sleep } from "./base";

// Riyadh neighborhood search terms (Arabic + English)
const NEIGHBORHOOD_SEARCH_TERMS: Record<string, { ar: string; en: string }> = {
  "Al Olaya": { ar: "العليا", en: "Al Olaya" },
  "Al Wizarat": { ar: "الوزارات", en: "Al Wizarat" },
  "BLVD City": { ar: "بوليفارد سيتي", en: "Boulevard City" },
  "Al Malqa": { ar: "الملقا", en: "Al Malqa" },
  "Al Nakheel": { ar: "النخيل", en: "Al Nakheel" },
  "Hittin": { ar: "حطين", en: "Hittin" },
  "Al Sulaimaniyah": { ar: "السليمانية", en: "Al Sulaimaniyah" },
  "KAFD": { ar: "كافد", en: "KAFD" },
};

interface GathernSearchResponse {
  data?: {
    properties?: GathernProperty[];
    total?: number;
    current_page?: number;
    last_page?: number;
  };
  properties?: GathernProperty[];
}

interface GathernProperty {
  id: number | string;
  title?: string;
  title_ar?: string;
  slug?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  guests?: number;
  area?: number;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviews_count?: number;
  photos?: Array<{ url: string }>;
  photos_count?: number;
  price?: number;
  price_per_night?: number;
  weekly_price?: number;
  monthly_price?: number;
  currency?: string;
  host?: {
    id: number | string;
    name?: string;
    properties_count?: number;
    is_verified?: boolean;
    response_rate?: number;
    rating?: number;
  };
  amenities?: Array<{ name: string; name_ar?: string }>;
  is_instant_booking?: boolean;
  neighborhood?: string;
  city?: string;
  availability?: {
    available_dates?: string[];
    blocked_dates?: string[];
  };
}

export class GathernScraper extends BaseScraper {
  private baseUrl = "https://www.gathern.co";

  constructor(options?: {
    maxConcurrent?: number;
    delayMs?: number;
    timeout?: number;
    proxies?: Array<{ host: string; port: number; username?: string; password?: string }>;
  }) {
    super("gathern", {
      maxConcurrent: options?.maxConcurrent || 3,
      delayMs: options?.delayMs || 1500,
      timeout: options?.timeout || 30000,
      proxies: options?.proxies,
    });
  }

  async scrapeNeighborhood(
    neighborhoodName: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<ScrapeResult> {
    const startTime = Date.now();
    const listings: ScrapedListing[] = [];
    this.errors = [];

    const searchTerms = NEIGHBORHOOD_SEARCH_TERMS[neighborhoodName];
    const searchQuery = searchTerms?.ar || neighborhoodName;

    try {
      let page = 1;
      let hasMore = true;
      const maxPages = 10;

      while (hasMore && page <= maxPages) {
        try {
          const results = await this.searchProperties(searchQuery, latitude, longitude, page);
          const properties = results.data?.properties || results.properties || [];

          if (properties.length === 0) break;

          for (const property of properties) {
            try {
              const scraped = this.parseProperty(property, neighborhoodName);
              if (scraped) listings.push(scraped);
            } catch (e) {
              this.logError(`Failed to parse property ${property.id}`, e);
            }
          }

          // Check pagination
          const lastPage = results.data?.last_page || 1;
          hasMore = page < lastPage;
          page++;

          if (hasMore) await sleep(1500 + Math.random() * 1500);
        } catch (e) {
          this.logError(`Search page ${page} failed`, e);
          break;
        }
      }

      // Fetch detailed info for listings (calendar, amenities)
      const sampleSize = Math.min(listings.length, 15);
      for (let i = 0; i < sampleSize; i++) {
        try {
          const detail = await this.fetchPropertyDetail(listings[i].externalId);
          if (detail) {
            this.enrichListing(listings[i], detail);
          }
          await sleep(1000 + Math.random() * 1000);
        } catch (e) {
          this.logError(`Detail fetch failed for ${listings[i].externalId}`, e);
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

  private async searchProperties(
    query: string,
    latitude: number,
    longitude: number,
    page: number = 1
  ): Promise<GathernSearchResponse> {
    // Gathern search API
    const searchUrl = `${this.baseUrl}/api/v2/properties/search`;

    try {
      return await this.fetchJson<GathernSearchResponse>(searchUrl, {
        params: {
          city: "riyadh",
          q: query,
          lat: String(latitude),
          lng: String(longitude),
          page: String(page),
          per_page: "20",
          sort: "relevance",
          currency: "SAR",
          locale: "ar",
        },
        headers: {
          "Accept": "application/json",
          "Accept-Language": "ar,en;q=0.9",
          "Referer": `${this.baseUrl}/properties?city=riyadh`,
          "Origin": this.baseUrl,
          "X-Requested-With": "XMLHttpRequest",
        },
      });
    } catch {
      // Fallback: try HTML scraping
      return this.searchPropertiesHtml(query, page);
    }
  }

  private async searchPropertiesHtml(query: string, page: number): Promise<GathernSearchResponse> {
    try {
      const html = await this.fetch(
        `${this.baseUrl}/properties?city=riyadh&q=${encodeURIComponent(query)}&page=${page}`,
        {
          headers: {
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "ar,en;q=0.9",
          },
        }
      );

      // Extract JSON data from HTML (Gathern embeds data in script tags)
      const properties: GathernProperty[] = [];
      const jsonMatch = html.match(new RegExp('<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)</script>', 's'))
        || html.match(new RegExp('window\\.__INITIAL_STATE__\\s*=\\s*({.*?});', 's'))
        || html.match(new RegExp('"properties"\\s*:\\s*(\\[.*?\\])', 's'));

      if (jsonMatch?.[1]) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          const props = data.props?.pageProps?.properties
            || data.properties
            || (Array.isArray(data) ? data : []);
          properties.push(...props);
        } catch {
          // Parse failed, return empty
        }
      }

      return { properties };
    } catch {
      return { properties: [] };
    }
  }

  private async fetchPropertyDetail(propertyId: string): Promise<GathernProperty | null> {
    try {
      const url = `${this.baseUrl}/api/v2/properties/${propertyId}`;
      const response = await this.fetchJson<{ data?: GathernProperty }>(url, {
        headers: {
          "Accept": "application/json",
          "Accept-Language": "ar,en;q=0.9",
          "Referer": `${this.baseUrl}/properties/${propertyId}`,
        },
      });
      return response.data || null;
    } catch {
      return null;
    }
  }

  private parseProperty(property: GathernProperty, neighborhoodName: string): ScrapedListing | null {
    if (!property.id) return null;

    const bedrooms = property.bedrooms || 0;
    const host = property.host;
    const isPropertyManager = (host?.properties_count || 0) >= 3;

    return {
      externalId: String(property.id),
      otaSlug: "gathern",
      title: property.title || property.title_ar || `Gathern ${property.id}`,
      url: `${this.baseUrl}/properties/${property.slug || property.id}`,
      propertyType: this.mapBedroomCount(bedrooms),
      hostType: isPropertyManager ? "property_manager" : "individual",
      hostName: host?.name || "Unknown",
      hostId: String(host?.id || ""),
      bedrooms,
      bathrooms: property.bathrooms || 1,
      maxGuests: property.guests || 2,
      latitude: property.latitude || 0,
      longitude: property.longitude || 0,
      rating: property.rating || 0,
      reviewCount: property.reviews_count || 0,
      photoCount: property.photos_count || property.photos?.length || 0,
      amenities: property.amenities?.map((a) => a.name || a.name_ar || "") || [],
      isSuperhost: host?.is_verified || false,
      responseRate: host?.response_rate || null,
      instantBook: property.is_instant_booking || false,
      nightlyRate: property.price_per_night || property.price || null,
      weeklyRate: property.weekly_price || null,
      monthlyRate: property.monthly_price || null,
      cleaningFee: null,
      currency: property.currency || "SAR",
      availableDays: null,
      blockedDays: null,
      bookedDays: null,
    };
  }

  private enrichListing(listing: ScrapedListing, detail: GathernProperty): void {
    // Update with more detailed info
    if (detail.amenities?.length) {
      listing.amenities = detail.amenities.map((a) => a.name || a.name_ar || "");
    }
    if (detail.photos_count) {
      listing.photoCount = detail.photos_count;
    }
    if (detail.availability) {
      const available = detail.availability.available_dates?.length || 0;
      const blocked = detail.availability.blocked_dates?.length || 0;
      listing.availableDays = available;
      listing.blockedDays = blocked;
      listing.bookedDays = Math.round(blocked * 0.65); // Conservative estimate
    }
    if (detail.weekly_price) listing.weeklyRate = detail.weekly_price;
    if (detail.monthly_price) listing.monthlyRate = detail.monthly_price;
  }
}
