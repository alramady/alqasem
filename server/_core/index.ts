import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import rateLimit from "express-rate-limit";
import compression from "compression";
import { csrfProtection, csrfTokenEndpoint } from "./csrf";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust proxy for rate limiting behind reverse proxy
  app.set("trust proxy", 1);

  // Gzip/Brotli compression for all responses
  app.use(compression({ level: 6, threshold: 1024 }));

  // CORS configuration — allowlist-based
  const allowedOrigins = new Set([
    // Production domains
    "https://alqasem.manus.space",
    "https://www.alqasem.com.sa",
    "https://alqasem.com.sa",
  ]);
  // In development, also allow the dev server origin
  if (process.env.NODE_ENV === "development") {
    allowedOrigins.add("http://localhost:3000");
    allowedOrigins.add("http://localhost:5173");
  }
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.has(origin) || origin.endsWith(".manus.computer") || origin.endsWith(".manus.space"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-csrf-token");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // Global rate limiter: 200 requests per minute per IP
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
  app.use(globalLimiter);

  // Strict rate limiter for auth endpoints: 10 attempts per 15 minutes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again in 15 minutes." },
  });
  app.use("/api/trpc/admin.localLogin", authLimiter);
  app.use("/api/trpc/admin.localRegister", authLimiter);

  // Form submission rate limiter: 5 submissions per 15 minutes
  const formLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many form submissions, please try again later." },
  });
  app.use("/api/trpc/public.submitInquiry", formLimiter);
  app.use("/api/trpc/public.submitProperty", formLimiter);
  app.use("/api/trpc/public.submitPropertyRequest", formLimiter);
  app.use("/api/trpc/admin.requestPasswordReset", authLimiter);
  app.use("/api/trpc/admin.resetPassword", authLimiter);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Dynamic sitemap.xml
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      const baseUrl = process.env.VITE_APP_URL || "https://alqasimreal-fcsdcqdh.manus.space";
      const now = new Date().toISOString().split("T")[0];
      let urls = [
        { loc: "/", priority: "1.0", changefreq: "daily" },
        { loc: "/properties", priority: "0.9", changefreq: "daily" },
        { loc: "/projects", priority: "0.8", changefreq: "weekly" },
        { loc: "/agencies", priority: "0.7", changefreq: "weekly" },
        { loc: "/about", priority: "0.6", changefreq: "monthly" },
        { loc: "/services", priority: "0.6", changefreq: "monthly" },
        { loc: "/contact", priority: "0.6", changefreq: "monthly" },
        { loc: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
        { loc: "/iqar-license", priority: "0.3", changefreq: "yearly" },
      ];
      // Add property pages
      if (db) {
        try {
          const { properties } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          const allProps = await db.select({ id: properties.id }).from(properties).where(eq(properties.status, "active"));
          allProps.forEach(p => urls.push({ loc: `/properties/${p.id}`, priority: "0.7", changefreq: "weekly" }));
          const { projects } = await import("../../drizzle/schema");
          const allProjects = await db.select({ id: projects.id }).from(projects);
          allProjects.forEach(p => urls.push({ loc: `/projects/${p.id}`, priority: "0.7", changefreq: "weekly" }));
          const { agencies } = await import("../../drizzle/schema");
          const allAgencies = await db.select({ slug: agencies.slug }).from(agencies);
          allAgencies.forEach(a => urls.push({ loc: `/agency/${a.slug}`, priority: "0.6", changefreq: "weekly" }));
          const { pages } = await import("../../drizzle/schema");
          const allPages = await db.select({ slug: pages.slug }).from(pages).where(eq(pages.status, "published"));
          allPages.forEach(p => urls.push({ loc: `/page/${p.slug}`, priority: "0.5", changefreq: "monthly" }));
        } catch { /* DB not available, serve static urls only */ }
      }
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url>\n    <loc>${baseUrl}${u.loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join("\n")}\n</urlset>`;
      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (err) {
      res.status(500).send("Error generating sitemap");
    }
  });

  // CSRF token endpoint — SPA fetches this on initialization
  app.get("/api/csrf-token", csrfTokenEndpoint);

  // CSRF protection middleware — validates token on all POST /api/trpc requests
  app.use(csrfProtection());

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start drip email processor
    import("../drip").then(({ startDripProcessor }) => {
      startDripProcessor();
      console.log("[Drip] Email processor started (5-min interval)");
    }).catch(err => console.error("[Drip] Failed to start processor:", err));
  });
}

startServer().catch(console.error);
