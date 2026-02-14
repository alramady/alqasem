import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import rateLimit from "express-rate-limit";
import { csrfProtection, csrfTokenEndpoint } from "./csrf";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust proxy for rate limiting behind reverse proxy (Railway uses proxies)
  app.set("trust proxy", 1);

  // CORS configuration — dynamic based on environment
  const allowedOrigins = new Set([
    "https://www.alqasem.com.sa",
    "https://alqasem.com.sa",
    "https://alqasem.manus.space",
  ]);
  
  // Add custom domain from env if set
  if (process.env.APP_URL) {
    allowedOrigins.add(process.env.APP_URL);
  }

  // In development, also allow the dev server origin
  if (process.env.NODE_ENV === "development") {
    allowedOrigins.add("http://localhost:3000");
    allowedOrigins.add("http://localhost:5173");
  }

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (
      allowedOrigins.has(origin) || 
      origin.endsWith(".railway.app") ||
      origin.endsWith(".up.railway.app") ||
      origin.endsWith(".manus.computer") ||
      origin.endsWith(".manus.space")
    )) {
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

  // Railway sets PORT env var
  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
