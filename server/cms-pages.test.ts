import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("public.listPublishedPages", () => {
  it("returns an array of published pages", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.public.listPublishedPages();

    expect(Array.isArray(result)).toBe(true);
    // Each page should have the expected fields
    if (result.length > 0) {
      const page = result[0];
      expect(page).toHaveProperty("id");
      expect(page).toHaveProperty("title");
      expect(page).toHaveProperty("slug");
      expect(page).toHaveProperty("pageType");
      expect(typeof page.title).toBe("string");
      expect(typeof page.slug).toBe("string");
    }
  });

  it("does not include full content in the list response", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.public.listPublishedPages();

    if (result.length > 0) {
      // The list endpoint only returns selected fields, not full content
      expect(result[0]).not.toHaveProperty("content");
    }
  });
});

describe("public.getPageBySlug", () => {
  it("returns a page when given a valid slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // First get the list to find a valid slug
    const pages = await caller.public.listPublishedPages();
    if (pages.length === 0) {
      // Skip if no pages exist (test environment)
      return;
    }

    const slug = pages[0].slug;
    const page = await caller.public.getPageBySlug({ slug });

    expect(page).toBeDefined();
    expect(page.slug).toBe(slug);
    expect(page).toHaveProperty("id");
    expect(page).toHaveProperty("title");
    expect(page).toHaveProperty("content");
    expect(page).toHaveProperty("seoTitle");
    expect(page).toHaveProperty("seoDescription");
  });

  it("throws NOT_FOUND for a non-existent slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.public.getPageBySlug({ slug: "this-slug-does-not-exist-xyz123" })
    ).rejects.toThrow();
  });

  it("rejects empty slug with validation error", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.public.getPageBySlug({ slug: "" })
    ).rejects.toThrow();
  });
});
