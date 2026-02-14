import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { generateCsrfToken, csrfProtection, csrfTokenEndpoint, setCsrfCookies } from "./_core/csrf";

// Helper to create mock Express request/response objects
function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    method: "POST",
    protocol: "https",
    headers: {},
    originalUrl: "/api/trpc/admin.createProperty",
    url: "/api/trpc/admin.createProperty",
    ...overrides,
  } as unknown as Request;
}

function createMockRes(): Response & { _cookies: Record<string, { value: string; options: any }>; _status: number; _json: any } {
  const res: any = {
    _cookies: {},
    _status: 200,
    _json: null,
    cookie(name: string, value: string, options: any) {
      res._cookies[name] = { value, options };
      return res;
    },
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: any) {
      res._json = data;
      return res;
    },
  };
  return res;
}

describe("CSRF Token Generation", () => {
  it("generates a 64-character hex string", () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates unique tokens each time", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateCsrfToken()));
    expect(tokens.size).toBe(100);
  });
});

describe("setCsrfCookies", () => {
  it("sets both HttpOnly and readable cookies with correct options", () => {
    const req = createMockReq({ protocol: "https" });
    const res = createMockRes();
    const token = "test-token-abc123";

    setCsrfCookies(req, res, token);

    expect(res._cookies["__csrf_token"]).toBeDefined();
    expect(res._cookies["__csrf_token"].value).toBe(token);
    expect(res._cookies["__csrf_token"].options.httpOnly).toBe(true);
    expect(res._cookies["__csrf_token"].options.secure).toBe(true);
    expect(res._cookies["__csrf_token"].options.sameSite).toBe("lax");
    expect(res._cookies["__csrf_token"].options.path).toBe("/");

    expect(res._cookies["csrf_token"]).toBeDefined();
    expect(res._cookies["csrf_token"].value).toBe(token);
    expect(res._cookies["csrf_token"].options.httpOnly).toBe(false);
    expect(res._cookies["csrf_token"].options.secure).toBe(true);
  });

  it("sets secure=false for HTTP requests", () => {
    const req = createMockReq({ protocol: "http", headers: {} });
    const res = createMockRes();

    setCsrfCookies(req, res, "token");

    expect(res._cookies["__csrf_token"].options.secure).toBe(false);
    expect(res._cookies["csrf_token"].options.secure).toBe(false);
  });
});

describe("csrfProtection middleware", () => {
  const middleware = csrfProtection();

  // --- Safe methods always pass ---
  it("allows GET requests through without validation", () => {
    const req = createMockReq({ method: "GET" });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res._status).toBe(200);
  });

  it("allows HEAD requests through without validation", () => {
    const req = createMockReq({ method: "HEAD" });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows OPTIONS requests through without validation", () => {
    const req = createMockReq({ method: "OPTIONS" });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  // --- Non-tRPC POST requests pass ---
  it("allows non-tRPC POST requests through without validation", () => {
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/oauth/callback",
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  // --- Valid token matching ---
  it("allows tRPC mutation POST with valid matching CSRF token", () => {
    const token = generateCsrfToken();
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/admin.createProperty",
      headers: {
        cookie: `__csrf_token=${token}; other_cookie=value`,
        "x-csrf-token": token,
      },
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res._status).toBe(200);
  });

  // --- Missing header token on non-bootstrap mutation ---
  it("rejects tRPC mutation POST without CSRF header when cookie exists", () => {
    const token = generateCsrfToken();
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/admin.createProperty",
      headers: {
        cookie: `__csrf_token=${token}`,
      },
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
    expect(res._json.error.code).toBe("CSRF_TOKEN_MISSING");
  });

  // --- Mismatched tokens on non-bootstrap mutation ---
  it("rejects tRPC mutation POST with mismatched CSRF token", () => {
    const cookieToken = generateCsrfToken();
    const headerToken = generateCsrfToken();
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/admin.updateProperty",
      headers: {
        cookie: `__csrf_token=${cookieToken}`,
        "x-csrf-token": headerToken,
      },
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
    expect(res._json.error.code).toBe("CSRF_TOKEN_INVALID");
  });

  it("rejects tokens with different lengths", () => {
    const cookieToken = generateCsrfToken();
    const shortToken = cookieToken.slice(0, 32);
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/admin.deleteProperty",
      headers: {
        cookie: `__csrf_token=${cookieToken}`,
        "x-csrf-token": shortToken,
      },
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
    expect(res._json.error.code).toBe("CSRF_TOKEN_INVALID");
  });

  // --- Bootstrap-safe mutations: no cookie at all (first visit) ---
  it("allows admin.localLogin to bootstrap without existing CSRF cookie", () => {
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/admin.localLogin",
      headers: {},
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res._cookies["__csrf_token"]).toBeDefined();
    expect(res._cookies["csrf_token"]).toBeDefined();
  });

  it("allows admin.localRegister to bootstrap without existing CSRF cookie", () => {
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/admin.localRegister",
      headers: {},
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows auth.logout to bootstrap without existing CSRF cookie", () => {
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/auth.logout",
      headers: {},
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows public.submitInquiry to bootstrap without existing CSRF cookie", () => {
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/public.submitInquiry",
      headers: {},
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows public.submitProperty to bootstrap without existing CSRF cookie", () => {
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/public.submitProperty",
      headers: {},
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows public.submitPropertyRequest to bootstrap without existing CSRF cookie", () => {
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/public.submitPropertyRequest",
      headers: {},
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  // --- Bootstrap-safe mutations: cookie exists but header missing ---
  it("allows public.submitInquiry without header when cookie exists", () => {
    const token = generateCsrfToken();
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/public.submitInquiry",
      headers: {
        cookie: `__csrf_token=${token}`,
      },
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows public.submitProperty without header when cookie exists", () => {
    const token = generateCsrfToken();
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/public.submitProperty",
      headers: {
        cookie: `__csrf_token=${token}`,
      },
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows public.submitPropertyRequest without header when cookie exists", () => {
    const token = generateCsrfToken();
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/public.submitPropertyRequest",
      headers: {
        cookie: `__csrf_token=${token}`,
      },
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  // --- Bootstrap-safe mutations: cookie exists but token mismatches ---
  it("allows public.submitInquiry even with mismatched token (stale cache)", () => {
    const cookieToken = generateCsrfToken();
    const staleToken = generateCsrfToken();
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/public.submitInquiry",
      headers: {
        cookie: `__csrf_token=${cookieToken}`,
        "x-csrf-token": staleToken,
      },
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows admin.localLogin even with mismatched token (stale cache)", () => {
    const cookieToken = generateCsrfToken();
    const staleToken = generateCsrfToken();
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/admin.localLogin",
      headers: {
        cookie: `__csrf_token=${cookieToken}`,
        "x-csrf-token": staleToken,
      },
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  // --- Non-bootstrap mutations still rejected with mismatch ---
  it("rejects admin.createProperty with mismatched token even though cookie exists", () => {
    const cookieToken = generateCsrfToken();
    const wrongToken = generateCsrfToken();
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/admin.createProperty",
      headers: {
        cookie: `__csrf_token=${cookieToken}`,
        "x-csrf-token": wrongToken,
      },
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
  });

  // --- Non-bootstrap mutation rejected when no cookie exists ---
  it("rejects non-bootstrap mutation when no CSRF cookie exists", () => {
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/admin.deleteProperty",
      headers: {},
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
    expect(res._json.error.code).toBe("CSRF_TOKEN_MISSING");
  });

  // --- Bootstrap-safe mutations with valid matching token ---
  it("allows public.submitInquiry with valid matching token", () => {
    const token = generateCsrfToken();
    const req = createMockReq({
      method: "POST",
      originalUrl: "/api/trpc/public.submitInquiry",
      headers: {
        cookie: `__csrf_token=${token}`,
        "x-csrf-token": token,
      },
    });
    const res = createMockRes();
    const next = vi.fn();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe("csrfTokenEndpoint", () => {
  it("returns existing token from cookie", () => {
    const token = generateCsrfToken();
    const req = createMockReq({
      method: "GET",
      headers: {
        cookie: `__csrf_token=${token}`,
      },
    });
    const res = createMockRes();
    csrfTokenEndpoint(req, res);
    expect(res._json).toEqual({ csrfToken: token });
  });

  it("generates and sets new token when no cookie exists", () => {
    const req = createMockReq({
      method: "GET",
      headers: {},
    });
    const res = createMockRes();
    csrfTokenEndpoint(req, res);
    expect(res._json.csrfToken).toBeDefined();
    expect(res._json.csrfToken).toMatch(/^[a-f0-9]{64}$/);
    expect(res._cookies["__csrf_token"]).toBeDefined();
    expect(res._cookies["csrf_token"]).toBeDefined();
    expect(res._cookies["__csrf_token"].value).toBe(res._json.csrfToken);
  });
});
