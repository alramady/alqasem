/**
 * Booking.com Scraper — Extracts STR listing data from Booking.com search results.
 * Uses JSON-LD structured data and HTML parsing for reliable extraction.
 */
import { BaseScraper, ScrapedListing, ScrapeResult, sleep } from "./base";

const RIYADH_DEST_ID = "-3007"; // Booking.com destination ID for Riyadh

interface BookingSearchResult {
  hotel_id?: number;
  hotel_name?: string;
  url?: string;
  latitude?: number;
  longitude?: number;
  review_score?: number;
  review_nr?: number;
  accommodation_type_name?: string;
  max_photo_url?: string;
  unit_configuration_label?: string;
  min_total_price?: number;
  currency_code?: string;
  district?: string;
}

export class BookingScraper extends BaseScraper {
  private baseUrl = "https://www.booking.com";

  constructor(options?: {
    maxConcurrent?: number;
    delayMs?: number;
    timeout?: number;
    proxies?: Array<{ host: string; port: number; username?: string; password?: string }>;
  }) {
    super("booking", {
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
      // Generate check-in/check-out dates for search
      const checkin = new Date();
      checkin.setDate(checkin.getDate() + 14); // 2 weeks from now
      const checkout = new Date(checkin);
      checkout.setDate(checkout.getDate() + 2); // 2-night stay

      const checkinStr = checkin.toISOString().split("T")[0];
      const checkoutStr = checkout.toISOString().split("T")[0];

      let offset = 0;
      const maxPages = 5;
      const pageSize = 25;

      for (let page = 0; page < maxPages; page++) {
        try {
          const html = await this.searchListings(
            latitude,
            longitude,
            radiusKm,
            checkinStr,
            checkoutStr,
            offset
          );

          const parsed = this.parseSearchResults(html, neighborhoodName);
          if (parsed.length === 0) break;

          listings.push(...parsed);
          offset += pageSize;

          if (parsed.length < pageSize) break;
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
    radiusKm: number,
    checkin: string,
    checkout: string,
    offset: number = 0
  ): Promise<string> {
    const url = `${this.baseUrl}/searchresults.html`;

    return this.fetch(url, {
      params: {
        ss: "Riyadh, Saudi Arabia",
        dest_id: RIYADH_DEST_ID,
        dest_type: "city",
        checkin,
        checkout,
        group_adults: "2",
        no_rooms: "1",
        group_children: "0",
        nflt: "ht_id=220", // Apartments/vacation rentals
        latitude: String(latitude),
        longitude: String(longitude),
        radius: String(radiusKm),
        offset: String(offset),
        rows: "25",
        selected_currency: "SAR",
        lang: "en-us",
      },
      headers: {
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": `${this.baseUrl}/searchresults.html`,
      },
    });
  }

  private parseSearchResults(html: string, neighborhoodName: string): ScrapedListing[] {
    const results: ScrapedListing[] = [];

    // Extract JSON-LD structured data
    const jsonLdMatches = html.match(new RegExp('<script type="application/ld\\+json">(.*?)</script>', 'g'));
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonStr = match.replace(/<script[^>]*>/, "").replace(/<\/script>/, "");
          const data = JSON.parse(jsonStr);

          if (data["@type"] === "Hotel" || data["@type"] === "LodgingBusiness" || data["@type"] === "Apartment") {
            const listing = this.parseJsonLd(data, neighborhoodName);
            if (listing) results.push(listing);
          } else if (Array.isArray(data)) {
            for (const item of data) {
              if (item["@type"] === "Hotel" || item["@type"] === "LodgingBusiness" || item["@type"] === "Apartment") {
                const listing = this.parseJsonLd(item, neighborhoodName);
                if (listing) results.push(listing);
              }
            }
          }
        } catch {
          // JSON parse failed, skip
        }
      }
    }

    // Fallback: parse HTML data attributes
    if (results.length === 0) {
      const propertyCards = html.match(new RegExp('data-hotelid="(\\d+)"', 'g'));
      if (propertyCards) {
        for (const card of propertyCards) {
          const idMatch = card.match(/data-hotelid="(\d+)"/);
          if (idMatch) {
            const hotelId = idMatch[1];
            // Extract basic info from surrounding HTML context
            const listing = this.parseHtmlCard(html, hotelId, neighborhoodName);
            if (listing) results.push(listing);
          }
        }
      }
    }

    return results;
  }

  private parseJsonLd(data: any, neighborhoodName: string): ScrapedListing | null {
    const id = data.identifier || data.url?.match(/hotel\/(\d+)/)?.[1];
    if (!id) return null;

    const geo = data.geo || {};
    const rating = data.aggregateRating;
    const offers = data.offers;

    let nightlyRate: number | null = null;
    if (offers?.lowPrice) {
      nightlyRate = parseFloat(offers.lowPrice);
    } else if (offers?.price) {
      nightlyRate = parseFloat(offers.price);
    }

    return {
      externalId: String(id),
      otaSlug: "booking",
      title: data.name || `Booking ${id}`,
      url: data.url || `${this.baseUrl}/hotel/${id}`,
      propertyType: "1br", // Default, refined from detail page
      hostType: "property_manager", // Booking.com mostly has managed properties
      hostName: data.brand?.name || "Unknown",
      hostId: "",
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      latitude: parseFloat(geo.latitude) || 0,
      longitude: parseFloat(geo.longitude) || 0,
      rating: rating?.ratingValue ? parseFloat(rating.ratingValue) / 2 : 0, // Booking uses 10-point scale
      reviewCount: rating?.reviewCount ? parseInt(rating.reviewCount) : 0,
      photoCount: data.photo?.length || 0,
      amenities: data.amenityFeature?.map((a: any) => a.name || a.value) || [],
      isSuperhost: false,
      responseRate: null,
      instantBook: true, // Most Booking.com listings are instant book
      nightlyRate,
      weeklyRate: nightlyRate ? nightlyRate * 7 * 0.9 : null, // Estimate weekly discount
      monthlyRate: nightlyRate ? nightlyRate * 30 * 0.8 : null, // Estimate monthly discount
      cleaningFee: null,
      currency: offers?.priceCurrency || "SAR",
      availableDays: null,
      blockedDays: null,
      bookedDays: null,
    };
  }

  private parseHtmlCard(html: string, hotelId: string, neighborhoodName: string): ScrapedListing | null {
    // Basic extraction from HTML around the hotel ID
    const cardRegion = html.substring(
      Math.max(0, html.indexOf(`data-hotelid="${hotelId}"`) - 2000),
      html.indexOf(`data-hotelid="${hotelId}"`) + 5000
    );

    const nameMatch = cardRegion.match(/data-testid="title"[^>]*>([^<]+)/);
    const priceMatch = cardRegion.match(/data-testid="price-and-discounted-price"[^>]*>([^<]+)/);
    const scoreMatch = cardRegion.match(/data-testid="review-score\/score"[^>]*>([^<]+)/);
    const reviewMatch = cardRegion.match(/(\d[\d,]*)\s*reviews?/i);

    let nightlyRate: number | null = null;
    if (priceMatch) {
      nightlyRate = parseFloat(priceMatch[1].replace(/[^0-9.]/g, "")) || null;
    }

    return {
      externalId: hotelId,
      otaSlug: "booking",
      title: nameMatch?.[1]?.trim() || `Booking ${hotelId}`,
      url: `${this.baseUrl}/hotel/${hotelId}`,
      propertyType: "1br",
      hostType: "property_manager",
      hostName: "Unknown",
      hostId: "",
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      latitude: 0,
      longitude: 0,
      rating: scoreMatch ? parseFloat(scoreMatch[1]) / 2 : 0,
      reviewCount: reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, "")) : 0,
      photoCount: 0,
      amenities: [],
      isSuperhost: false,
      responseRate: null,
      instantBook: true,
      nightlyRate,
      weeklyRate: null,
      monthlyRate: null,
      cleaningFee: null,
      currency: "SAR",
      availableDays: null,
      blockedDays: null,
      bookedDays: null,
    };
  }
}
