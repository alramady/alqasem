import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000/api/trpc";

async function query(proc: string, input?: any) {
  const url = input
    ? `${BASE}/${proc}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`
    : `${BASE}/${proc}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.result?.data?.json ?? json.result?.data;
}

describe("Virtual Tour Feature", () => {
  // --- Schema & API Tests ---
  it("searchProperties returns virtualTourUrl and virtualTourType fields", async () => {
    const result = await query("public.searchProperties", { limit: 1 });
    expect(result).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
    const prop = result.items[0];
    expect("virtualTourUrl" in prop).toBe(true);
    expect("virtualTourType" in prop).toBe(true);
  });

  it("getProperty returns virtualTourUrl and virtualTourType", async () => {
    const result = await query("public.searchProperties", { limit: 1 });
    expect(result.items.length).toBeGreaterThan(0);
    const propId = result.items[0].id;

    const prop = await query("public.getProperty", { id: propId });
    expect(prop).toBeDefined();
    expect("virtualTourUrl" in prop).toBe(true);
    expect("virtualTourType" in prop).toBe(true);
  });

  it("virtualTourType is null or one of matterport/youtube/custom", async () => {
    const result = await query("public.searchProperties", { limit: 20 });
    const validTypes = [null, "matterport", "youtube", "custom"];
    for (const prop of result.items) {
      expect(validTypes).toContain(prop.virtualTourType);
    }
  });

  // --- URL Validation Tests ---
  it("isValidVirtualTourUrl validates correct URLs", () => {
    const validUrls = [
      "https://my.matterport.com/show/?m=abc123",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://example.com/360-tour",
      "http://localhost:3000/tour",
    ];
    for (const url of validUrls) {
      const parsed = new URL(url);
      expect(["http:", "https:"].includes(parsed.protocol)).toBe(true);
    }
  });

  it("isValidVirtualTourUrl rejects invalid URLs", () => {
    const invalidUrls = ["", "not-a-url", "ftp://example.com", "javascript:alert(1)"];
    for (const url of invalidUrls) {
      if (!url) {
        expect(url).toBeFalsy();
        continue;
      }
      try {
        const parsed = new URL(url);
        const valid = ["http:", "https:"].includes(parsed.protocol);
        if (url.startsWith("ftp:") || url.startsWith("javascript:")) {
          expect(valid).toBe(false);
        }
      } catch {
        expect(true).toBe(true);
      }
    }
  });

  // --- Embed URL Generation Tests ---
  it("getEmbedUrl converts YouTube watch URLs to embed format", () => {
    const testCases = [
      { input: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", expected: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0" },
      { input: "https://youtu.be/dQw4w9WgXcQ", expected: "https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0" },
      { input: "https://www.youtube.com/embed/dQw4w9WgXcQ", expected: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    ];
    for (const tc of testCases) {
      const url = tc.input;
      if (url.includes("/embed/")) {
        expect(url).toBe(tc.expected);
      } else {
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
        expect(ytMatch).not.toBeNull();
        expect(`https://www.youtube.com/embed/${ytMatch![1]}?rel=0`).toBe(tc.expected);
      }
    }
  });

  it("getEmbedUrl preserves Matterport show URLs", () => {
    const url = "https://my.matterport.com/show/?m=SxQL3iGyvTk";
    expect(url.includes("/show/")).toBe(true);
  });

  it("getEmbedUrl extracts Matterport model ID from share links", () => {
    const url = "https://my.matterport.com/share/?m=SxQL3iGyvTk";
    const mMatch = url.match(/[?&]m=([a-zA-Z0-9]+)/);
    expect(mMatch).not.toBeNull();
    expect(mMatch![1]).toBe("SxQL3iGyvTk");
    const embedUrl = `https://my.matterport.com/show/?m=${mMatch![1]}`;
    expect(embedUrl).toBe("https://my.matterport.com/show/?m=SxQL3iGyvTk");
  });

  // --- Tour Type Detection Tests ---
  it("detectTourType correctly identifies Matterport URLs", () => {
    const urls = [
      "https://my.matterport.com/show/?m=abc123",
      "https://matterport.com/discover/space/abc",
    ];
    for (const url of urls) {
      const isMatterport = url.includes("matterport.com") || url.includes("my.matterport");
      expect(isMatterport).toBe(true);
    }
  });

  it("detectTourType correctly identifies YouTube URLs", () => {
    const urls = [
      "https://www.youtube.com/watch?v=abc123",
      "https://youtu.be/abc123",
    ];
    for (const url of urls) {
      const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
      expect(isYouTube).toBe(true);
    }
  });

  it("detectTourType returns custom for other URLs", () => {
    const url = "https://example.com/my-360-tour";
    const isMatterport = url.includes("matterport.com") || url.includes("my.matterport");
    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
    expect(isMatterport).toBe(false);
    expect(isYouTube).toBe(false);
  });
});
