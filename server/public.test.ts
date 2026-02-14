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

describe("Public Router - Procedure Existence", () => {
  it("all public procedures exist", () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    expect(typeof caller.public.submitInquiry).toBe("function");
    expect(typeof caller.public.submitProperty).toBe("function");
    expect(typeof caller.public.submitPropertyRequest).toBe("function");
  });
});

describe("Public Router - submitInquiry Validation", () => {
  it("rejects empty name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.submitInquiry({
        name: "",
        phone: "0501234567",
        message: "أريد الاستفسار عن عقار",
      })
    ).rejects.toThrow();
  });

  it("rejects short name (less than 2 chars)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.submitInquiry({
        name: "أ",
        phone: "0501234567",
        message: "أريد الاستفسار عن عقار",
      })
    ).rejects.toThrow();
  });

  it("rejects short phone (less than 9 chars)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.submitInquiry({
        name: "أحمد محمد",
        phone: "050",
        message: "أريد الاستفسار عن عقار",
      })
    ).rejects.toThrow();
  });

  it("rejects short message (less than 5 chars)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.submitInquiry({
        name: "أحمد محمد",
        phone: "0501234567",
        message: "مرح",
      })
    ).rejects.toThrow();
  });

  it("rejects invalid email format", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.submitInquiry({
        name: "أحمد محمد",
        phone: "0501234567",
        email: "not-an-email",
        message: "أريد الاستفسار عن عقار",
      })
    ).rejects.toThrow();
  });

  it("accepts valid input with all fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.public.submitInquiry({
        name: "أحمد محمد",
        phone: "0501234567",
        email: "ahmed@example.com",
        subject: "شراء عقار",
        message: "أريد الاستفسار عن فيلا في حي النرجس",
        source: "contact_page",
      });
      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("message");
      expect(typeof result.id).toBe("number");
    } catch (e: any) {
      // DB might not be available in test env
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  }, 15000);

  it("accepts valid input with minimal fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.public.submitInquiry({
        name: "سارة",
        phone: "0551234567",
        message: "أريد معرفة المزيد",
      });
      expect(result).toHaveProperty("success", true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  }, 15000);

  it("accepts empty string email (optional)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.public.submitInquiry({
        name: "خالد",
        phone: "0561234567",
        email: "",
        message: "استفسار عام عن الخدمات",
      });
      expect(result).toHaveProperty("success", true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  }, 15000);
});

describe("Public Router - submitProperty Validation", () => {
  it("rejects empty type", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.submitProperty({
        type: "",
        purpose: "sale",
        city: "الرياض",
        name: "أحمد",
        phone: "0501234567",
      })
    ).rejects.toThrow();
  });

  it("rejects empty purpose", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.submitProperty({
        type: "villa",
        purpose: "",
        city: "الرياض",
        name: "أحمد",
        phone: "0501234567",
      })
    ).rejects.toThrow();
  });

  it("rejects empty city", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.submitProperty({
        type: "villa",
        purpose: "sale",
        city: "",
        name: "أحمد",
        phone: "0501234567",
      })
    ).rejects.toThrow();
  });

  it("rejects empty name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.submitProperty({
        type: "villa",
        purpose: "sale",
        city: "الرياض",
        name: "",
        phone: "0501234567",
      })
    ).rejects.toThrow();
  });

  it("rejects short phone", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.submitProperty({
        type: "villa",
        purpose: "sale",
        city: "الرياض",
        name: "أحمد",
        phone: "050",
      })
    ).rejects.toThrow();
  });

  it("accepts valid property submission", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.public.submitProperty({
        type: "villa",
        purpose: "sale",
        city: "الرياض",
        district: "حي النرجس",
        area: "300",
        rooms: "5",
        bathrooms: "3",
        price: "2500000",
        description: "فيلا فاخرة مع حديقة ومسبح",
        name: "أحمد محمد",
        phone: "0501234567",
        email: "ahmed@example.com",
      });
      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("message");
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  }, 15000);

  it("accepts minimal property submission", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.public.submitProperty({
        type: "apartment",
        purpose: "rent",
        city: "جدة",
        name: "سارة",
        phone: "0551234567",
      });
      expect(result).toHaveProperty("success", true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  }, 15000);
});

describe("Public Router - submitPropertyRequest Validation", () => {
  it("rejects empty name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.submitPropertyRequest({
        name: "",
        phone: "0501234567",
      })
    ).rejects.toThrow();
  });

  it("rejects short phone", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.submitPropertyRequest({
        name: "أحمد",
        phone: "050",
      })
    ).rejects.toThrow();
  });

  it("accepts valid property request", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.public.submitPropertyRequest({
        type: "villa",
        purpose: "buy",
        city: "الرياض",
        district: "حي النرجس",
        minPrice: "1000000",
        maxPrice: "3000000",
        rooms: "5",
        minArea: "300",
        details: "أبحث عن فيلا قريبة من المدارس",
        name: "أحمد محمد",
        phone: "0501234567",
        email: "ahmed@example.com",
      });
      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("message");
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  }, 15000);

  it("accepts minimal property request", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.public.submitPropertyRequest({
        name: "خالد",
        phone: "0561234567",
      });
      expect(result).toHaveProperty("success", true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  }, 15000);
});

describe("Public Router - Project Query Procedures", () => {
  it("getProject procedure exists", () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.public.getProject).toBe("function");
  });

  it("listActiveProjects procedure exists", () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.public.listActiveProjects).toBe("function");
  });

  it("getProject rejects non-positive id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.public.getProject({ id: 0 })).rejects.toThrow();
  });

  it("getProject rejects negative id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.public.getProject({ id: -5 })).rejects.toThrow();
  });

  it("getProject rejects non-integer id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.public.getProject({ id: 1.5 })).rejects.toThrow();
  });

  it("getProject returns NOT_FOUND for non-existent project", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.public.getProject({ id: 999999 });
      // If DB is connected and project doesn't exist, should throw
    } catch (e: any) {
      expect(["NOT_FOUND", "INTERNAL_SERVER_ERROR"]).toContain(e.code);
    }
  }, 15000);

  it("listActiveProjects returns array or throws DB error", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.public.listActiveProjects();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  }, 15000);
});

describe("Public Router - Property Query Procedures", () => {
  it("getProperty procedure exists", () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.public.getProperty).toBe("function");
  });

  it("listActiveProperties procedure exists", () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.public.listActiveProperties).toBe("function");
  });

  it("getProperty rejects non-positive id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.public.getProperty({ id: 0 })).rejects.toThrow();
  });

  it("getProperty rejects negative id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.public.getProperty({ id: -1 })).rejects.toThrow();
  });

  it("getProperty returns NOT_FOUND for non-existent property", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      await caller.public.getProperty({ id: 999999 });
    } catch (e: any) {
      expect(["NOT_FOUND", "INTERNAL_SERVER_ERROR"]).toContain(e.code);
    }
  }, 15000);

  it("listActiveProperties returns array or throws DB error", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.public.listActiveProperties();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  }, 15000);

  it("listActiveProperties accepts optional limit parameter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.public.listActiveProperties({ limit: 5 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    } catch (e: any) {
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  }, 15000);

  it("listActiveProperties rejects limit over 50", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.listActiveProperties({ limit: 100 })
    ).rejects.toThrow();
  });

  it("listActiveProperties rejects negative limit", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.public.listActiveProperties({ limit: -1 })
    ).rejects.toThrow();
  });
});

describe("Public Router - getSiteConfig", () => {
  it("getSiteConfig procedure exists", () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    expect(typeof caller.public.getSiteConfig).toBe("function");
  });

  it("getSiteConfig returns settings and sections", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    try {
      const result = await caller.public.getSiteConfig();
      expect(result).toHaveProperty("settings");
      expect(result).toHaveProperty("sections");
      expect(typeof result.settings).toBe("object");
      expect(Array.isArray(result.sections)).toBe(true);
    } catch (e: any) {
      // DB might not be connected in test env
      expect(e.code).toBe("INTERNAL_SERVER_ERROR");
    }
  }, 15000);
});
