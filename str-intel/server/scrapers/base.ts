/**
 * Base scraper module with rate limiting, proxy rotation, retry logic,
 * and user-agent rotation for OTA data collection.
 */
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

// ─── Rate Limiter ───
export class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;

  constructor(
    private maxConcurrent: number = 2,
    private delayMs: number = 1500
  ) {}

  async acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.running++;
        resolve();
      });
    });
  }

  release(): void {
    this.running--;
    setTimeout(() => {
      const next = this.queue.shift();
      if (next) next();
    }, this.delayMs);
  }

  async wrap<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// ─── User Agent Rotation ───
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
];

export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ─── Proxy Manager ───
export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol?: "http" | "https" | "socks5";
}

export class ProxyManager {
  private proxies: ProxyConfig[] = [];
  private currentIndex = 0;
  private failCounts = new Map<string, number>();

  addProxy(proxy: ProxyConfig): void {
    this.proxies.push(proxy);
  }

  addProxies(proxies: ProxyConfig[]): void {
    this.proxies.push(...proxies);
  }

  getNext(): ProxyConfig | null {
    if (this.proxies.length === 0) return null;
    const proxy = this.proxies[this.currentIndex % this.proxies.length];
    this.currentIndex++;
    return proxy;
  }

  markFailed(proxy: ProxyConfig): void {
    const key = `${proxy.host}:${proxy.port}`;
    const count = (this.failCounts.get(key) || 0) + 1;
    this.failCounts.set(key, count);
    // Remove proxy after 5 consecutive failures
    if (count >= 5) {
      this.proxies = this.proxies.filter(
        (p) => `${p.host}:${p.port}` !== key
      );
      this.failCounts.delete(key);
    }
  }

  markSuccess(proxy: ProxyConfig): void {
    const key = `${proxy.host}:${proxy.port}`;
    this.failCounts.delete(key);
  }

  get count(): number {
    return this.proxies.length;
  }

  toAxiosProxy(proxy: ProxyConfig): object {
    return {
      host: proxy.host,
      port: proxy.port,
      auth: proxy.username
        ? { username: proxy.username, password: proxy.password || "" }
        : undefined,
      protocol: proxy.protocol || "http",
    };
  }
}

// ─── Retry Logic ───
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Scraper Result Types ───
export interface ScrapedListing {
  externalId: string;
  otaSlug: string;
  title: string;
  url: string;
  propertyType: "studio" | "1br" | "2br" | "3br" | "4br_plus";
  hostType: "individual" | "property_manager";
  hostName: string;
  hostId: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  photoCount: number;
  amenities: string[];
  isSuperhost: boolean;
  responseRate: number | null;
  instantBook: boolean;
  nightlyRate: number | null;
  weeklyRate: number | null;
  monthlyRate: number | null;
  cleaningFee: number | null;
  currency: string;
  availableDays: number | null;
  blockedDays: number | null;
  bookedDays: number | null;
}

export interface ScrapeResult {
  listings: ScrapedListing[];
  totalFound: number;
  errors: string[];
  duration: number;
}

// ─── Base Scraper Class ───
export abstract class BaseScraper {
  protected rateLimiter: RateLimiter;
  protected proxyManager: ProxyManager;
  protected client: AxiosInstance;
  protected errors: string[] = [];

  constructor(
    protected otaSlug: string,
    protected options: {
      maxConcurrent?: number;
      delayMs?: number;
      timeout?: number;
      proxies?: ProxyConfig[];
    } = {}
  ) {
    this.rateLimiter = new RateLimiter(
      options.maxConcurrent || 2,
      options.delayMs || 1500
    );
    this.proxyManager = new ProxyManager();
    if (options.proxies) {
      this.proxyManager.addProxies(options.proxies);
    }

    this.client = axios.create({
      timeout: options.timeout || 30000,
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache",
      },
    });
  }

  protected getRequestConfig(): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
      headers: {
        "User-Agent": getRandomUserAgent(),
      },
    };

    const proxy = this.proxyManager.getNext();
    if (proxy) {
      config.proxy = this.proxyManager.toAxiosProxy(proxy) as any;
    }

    return config;
  }

  protected async fetch(url: string, extraConfig?: AxiosRequestConfig): Promise<string> {
    return this.rateLimiter.wrap(async () => {
      return withRetry(async () => {
        const config = { ...this.getRequestConfig(), ...extraConfig };
        const response = await this.client.get(url, config);
        return response.data;
      });
    });
  }

  protected async fetchJson<T>(url: string, extraConfig?: AxiosRequestConfig): Promise<T> {
    return this.rateLimiter.wrap(async () => {
      return withRetry(async () => {
        const config = {
          ...this.getRequestConfig(),
          ...extraConfig,
          headers: {
            ...this.getRequestConfig().headers,
            "Accept": "application/json",
            ...extraConfig?.headers,
          },
        };
        const response = await this.client.get<T>(url, config);
        return response.data;
      });
    });
  }

  protected logError(message: string, error?: unknown): void {
    const errMsg = error instanceof Error ? error.message : String(error || "");
    const full = `[${this.otaSlug}] ${message}${errMsg ? `: ${errMsg}` : ""}`;
    this.errors.push(full);
    console.error(full);
  }

  protected mapBedroomCount(bedrooms: number): ScrapedListing["propertyType"] {
    if (bedrooms === 0) return "studio";
    if (bedrooms === 1) return "1br";
    if (bedrooms === 2) return "2br";
    if (bedrooms === 3) return "3br";
    return "4br_plus";
  }

  abstract scrapeNeighborhood(
    neighborhoodName: string,
    latitude: number,
    longitude: number,
    radiusKm?: number
  ): Promise<ScrapeResult>;
}
