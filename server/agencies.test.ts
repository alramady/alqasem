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

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-admin",
      email: "admin@alqasem.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { "user-agent": "Mozilla/5.0 Test" },
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Public Agency Endpoints", () => {
  it("getAgencies returns an array of agencies", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.getAgencies({});
    expect(Array.isArray(result)).toBe(true);
    // We know there's at least 1 seeded agency
    expect(result.length).toBeGreaterThanOrEqual(1);
    const agency = result[0];
    expect(agency).toHaveProperty("nameAr");
    expect(agency).toHaveProperty("nameEn");
    expect(agency).toHaveProperty("slug");
    expect(agency).toHaveProperty("agentCount");
    expect(agency).toHaveProperty("propertyCount");
  });

  it("getAgencies supports search filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.getAgencies({ search: "القاسم" });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].nameAr).toContain("القاسم");
  });

  it("getAgencies supports city filter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.getAgencies({ city: "الرياض" });
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("getAgencies returns empty for non-existent search", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.getAgencies({ search: "شركة_غير_موجودة_xyz" });
    expect(result).toEqual([]);
  });

  it("getAgencyProfile returns agency with agents and properties", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.public.getAgencyProfile({ slug: "alqasem-real-estate" });
    expect(result.agency).toBeDefined();
    expect(result.agency.nameAr).toContain("القاسم");
    expect(result.agency.slug).toBe("alqasem-real-estate");
    expect(Array.isArray(result.agents)).toBe(true);
    expect(result.agents.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(result.properties)).toBe(true);
    expect(typeof result.totalProperties).toBe("number");
    expect(result.totalProperties).toBeGreaterThanOrEqual(1);
  });

  it("getAgencyProfile throws NOT_FOUND for invalid slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.getAgencyProfile({ slug: "non-existent-agency" })
    ).rejects.toThrow();
  });

  it("getAgentProfile returns agent with agency info and properties", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Use the first agent's slug from the seeded data
    const agenciesResult = await caller.public.getAgencyProfile({ slug: "alqasem-real-estate" });
    const firstAgent = agenciesResult.agents[0];
    expect(firstAgent).toBeDefined();

    const result = await caller.public.getAgentProfile({ slug: firstAgent.slug });
    expect(result.agent).toBeDefined();
    expect(result.agent.nameAr).toBeTruthy();
    expect(result.agency).toBeDefined();
    expect(result.agency.nameAr).toContain("القاسم");
    expect(Array.isArray(result.properties)).toBe(true);
    expect(typeof result.totalProperties).toBe("number");
  });

  it("getAgentProfile throws NOT_FOUND for invalid slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.getAgentProfile({ slug: "non-existent-agent" })
    ).rejects.toThrow();
  });

  it("getPropertyAgencyAgent returns agency and agent for linked property", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Property 1 should be linked to the agency
    const result = await caller.public.getPropertyAgencyAgent({ propertyId: 1 });
    expect(result).not.toBeNull();
    expect(result!.agency).toBeDefined();
    expect(result!.agency!.nameAr).toContain("القاسم");
    expect(result!.agent).toBeDefined();
  });

  it("getPropertyAgencyAgent returns null for unlinked property", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Property 99999 doesn't exist
    const result = await caller.public.getPropertyAgencyAgent({ propertyId: 99999 });
    expect(result).toBeNull();
  });
});

describe("Admin Agency Endpoints", () => {
  it("listAgencies returns an array of agencies", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listAgencies({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]).toHaveProperty("nameAr");
    expect(result[0]).toHaveProperty("agentCount");
    expect(result[0]).toHaveProperty("propertyCount");
  });

  it("getAgency returns a single agency by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getAgency({ id: 1 });
    expect(result).toBeDefined();
    expect(result!.nameAr).toContain("القاسم");
  });

  it("listAgents returns agents for a given agency", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.listAgents({ agencyId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]).toHaveProperty("nameAr");
    expect(result[0]).toHaveProperty("agencyNameAr");
    expect(result[0]).toHaveProperty("propertyCount");
  });

  it("getAgent returns a single agent by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getAgent({ id: 1 });
    expect(result).toBeDefined();
    expect(result!.nameAr).toBeTruthy();
  });

  it("getAgenciesDropdown returns a list for dropdown", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getAgenciesDropdown();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("nameAr");
  });

  it("getAgentsByAgency returns agents for dropdown", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getAgentsByAgency({ agencyId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});
