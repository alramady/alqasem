/**
 * Agoda Scraper — Extracts STR listing data from Agoda search results.
 * Lower priority due to smaller Saudi STR inventory, but captures hotel-apartment crossovers.
 */
import { BaseScraper, ScrapedListing, ScrapeResult, sleep } from "./base";

interface AgodaSearchResult {
  hotelId?: number;
  hotelName?: string;
  latitude?: number;
  longitude?: number;
  starRating?: number;
  reviewScore?: number;
  numberOfReviews?: number;
  dailyRate?: number;
  currency?: string;
  propertyTypeName?: string;
  accommodationType?: number;
  address?: string;
  imageUrl?: string;
}

export class AgodaScraper extends BaseScraper {
  private baseUrl = "https://www.agoda.com";

  constructor(options?: {
    maxConcurrent?: number;
    delayMs?: number;
    timeout?: number;
    proxies?: Array<{ host: string; port: number; username?: string; password?: string }>;
  }) {
    super("agoda", {
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
    radiusKm: number = 5
  ): Promise<ScrapeResult> {
    const startTime = Date.now();
    const listings: ScrapedListing[] = [];
    this.errors = [];

    try {
      const checkin = new Date();
      checkin.setDate(checkin.getDate() + 14);
      const checkout = new Date(checkin);
      checkout.setDate(checkout.getDate() + 2);

      const checkinStr = checkin.toISOString().split("T")[0];
      const checkoutStr = checkout.toISOString().split("T")[0];

      for (let page = 1; page <= 5; page++) {
        try {
          const html = await this.searchListings(latitude, longitude, checkinStr, checkoutStr, page);
          const parsed = this.parseSearchResults(html, neighborhoodName);

          if (parsed.length === 0) break;
          listings.push(...parsed);

          if (parsed.length < 20) break;
          await sleep(2000 + Math.random() * 2000);
        } catch (e) {
          this.logError(`Search page ${page} failed`, e);
          break;
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
    latitude: number,
    longitude: number,
    checkin: string,
    checkout: string,
    page: number = 1
  ): Promise<string> {
    const url = `${this.baseUrl}/search`;

    return this.fetch(url, {
      params: {
        city: "17067", // Agoda city ID for Riyadh
        checkIn: checkin,
        checkOut: checkout,
        rooms: "1",
        adults: "2",
        children: "0",
        priceCur: "SAR",
        los: "2",
        textToSearch: "Riyadh",
        latitude: String(latitude),
        longitude: String(longitude),
        page: String(page),
        sort: "priceLowToHigh",
        propertyType: "35,34,19,36", // Apartments, vacation rentals, homes
      },
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": `${this.baseUrl}/city/riyadh-sa.html`,
      },
    });
  }

  private parseSearchResults(html: string, neighborhoodName: string): ScrapedListing[] {
    const results: ScrapedListing[] = [];

    // Try to extract from embedded JSON data
    const dataMatch = html.match(new RegExp('window\\.\\$searchPageData\\s*=\\s*({.*?});', 's'));
    if (dataMatch) {
      try {
        const data = JSON.parse(dataMatch[1]);
        const hotels = data.searchResult?.results || [];
        for (const hotel of hotels) {
          const listing = this.parseAgodaResult(hotel, neighborhoodName);
          if (listing) results.push(listing);
        }
      } catch {
        // Parse failed
      }
    }

    // Fallback: extract from JSON-LD
    if (results.length === 0) {
      const jsonLdMatches = html.match(new RegExp('<script type="application/ld\\+json">(.*?)</script>', 'g'));
      if (jsonLdMatches) {
        for (const match of jsonLdMatches) {
          try {
            const jsonStr = match.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
            const data = JSON.parse(jsonStr);
            if (data["@type"] === "Hotel" || data["@type"] === "LodgingBusiness") {
              const listing = this.parseJsonLd(data, neighborhoodName);
              if (listing) results.push(listing);
            }
          } catch {
            // Skip
          }
        }
      }
    }

    return results;
  }

  private parseAgodaResult(hotel: any, neighborhoodName: string): ScrapedListing | null {
    const id = hotel.hotelId || hotel.id;
    if (!id) return null;

    return {
      externalId: String(id),
      otaSlug: "agoda",
      title: hotel.hotelName || hotel.propertyName || `Agoda ${id}`,
      url: `${this.baseUrl}/hotel/${id}`,
      propertyType: "1br",
      hostType: "property_manager",
      hostName: hotel.chainName || "Unknown",
      hostId: "",
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      latitude: hotel.latitude || 0,
      longitude: hotel.longitude || 0,
      rating: hotel.reviewScore ? hotel.reviewScore / 2 : 0,
      reviewCount: hotel.numberOfReviews || 0,
      photoCount: hotel.imageCount || 0,
      amenities: hotel.facilityHighlights?.map((f: any) => f.name) || [],
      isSuperhost: false,
      responseRate: null,
      instantBook: true,
      nightlyRate: hotel.dailyRate || hotel.displayPrice || null,
      weeklyRate: null,
      monthlyRate: null,
      cleaningFee: null,
      currency: hotel.currency || "SAR",
      availableDays: null,
      blockedDays: null,
      bookedDays: null,
    };
  }

  private parseJsonLd(data: any, neighborhoodName: string): ScrapedListing | null {
    const id = data.identifier || data.url?.match(/hotel\/(\d+)/)?.[1];
    if (!id) return null;

    const geo = data.geo || {};
    const rating = data.aggregateRating;
    const offers = data.offers;

    return {
      externalId: String(id),
      otaSlug: "agoda",
      title: data.name || `Agoda ${id}`,
      url: data.url || `${this.baseUrl}/hotel/${id}`,
      propertyType: "1br",
      hostType: "property_manager",
      hostName: "Unknown",
      hostId: "",
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      latitude: parseFloat(geo.latitude) || 0,
      longitude: parseFloat(geo.longitude) || 0,
      rating: rating?.ratingValue ? parseFloat(rating.ratingValue) / 2 : 0,
      reviewCount: rating?.reviewCount ? parseInt(rating.reviewCount) : 0,
      photoCount: 0,
      amenities: [],
      isSuperhost: false,
      responseRate: null,
      instantBook: true,
      nightlyRate: offers?.lowPrice ? parseFloat(offers.lowPrice) : null,
      weeklyRate: null,
      monthlyRate: null,
      cleaningFee: null,
      currency: offers?.priceCurrency || "SAR",
      availableDays: null,
      blockedDays: null,
      bookedDays: null,
    };
  }
}
