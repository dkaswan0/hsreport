import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// ── Validate required environment variables on startup ────────────────────────
const requiredEnvVars = ["DATABASE_URL", "SESSION_SECRET"];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
if (!process.env.ADMIN_USERNAME) process.env.ADMIN_USERNAME = "hs";
if (!process.env.ADMIN_PASSWORD) process.env.ADMIN_PASSWORD = "hs";

const app = express();
const httpServer = createServer(app);
const PgSession = connectPgSimple(session);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    isAuthenticated?: boolean;
    username?: string;
  }
}

// Trust proxy for Replit (proxied environment)
app.set("trust proxy", 1);

// ── Security: Helmet headers ──────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,       // SPA uses inline scripts
    crossOriginEmbedderPolicy: false,   // Allow Clearbit logos and Google Fonts
  })
);

// ── Security: CORS ────────────────────────────────────────────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin as string | undefined;
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  const allowed =
    !origin ||
    process.env.NODE_ENV !== "production" ||
    (devDomain && origin === `https://${devDomain}`);

  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-API-Key");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "AI request limit reached, please wait before trying again." },
});

app.use("/api", generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/analyze-photo", aiLimiter);
app.use("/api/obd", aiLimiter);

// ── Session middleware ────────────────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      tableName: "user_sessions",
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax" as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// ── Body parsers (10 MB cap — images sent as base64) ─────────────────────────
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// ── Request logger ────────────────────────────────────────────────────────────
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson as Record<string, unknown>;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      // Log response body only for errors to avoid logging sensitive data
      if (res.statusCode >= 400 && capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// ── App startup ───────────────────────────────────────────────────────────────
(async () => {
  await registerRoutes(httpServer, app);

  // Global error handler — never expose stack traces
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message =
      process.env.NODE_ENV === "production" && status === 500
        ? "Internal Server Error"
        : err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });
})();
