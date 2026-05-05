import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { connectDB } from "./config/database";
import { createLogger } from "./config/logger";
import routes from "./routes";
import { AppError } from "./utils/AppError";
import { sendError } from "./utils/response";

const log = createLogger("Server");
const app = express();
const PORT = Number(process.env["PORT"] ?? 4000);
const API_PREFIX = process.env["API_PREFIX"] ?? "/api/v1";

// ── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (process.env["CORS_ORIGINS"] ?? "http://localhost:5173").split(","),
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────
app.use(API_PREFIX, routes);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
});

// ── Global error handler ──────────────────────────────────────
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError && err.isOperational) {
    return sendError(res, err.message, err.statusCode);
  }
  // Mongoose validation error
  if (err.name === "ValidationError") {
    return sendError(res, err.message, 400);
  }
  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue ?? {})[0];
    return sendError(res, `${field} already exists`, 409);
  }
  log.error("Unhandled error", { error: err.message, stack: err.stack });
  sendError(res, "Internal server error", 500);
});

// ── Start ─────────────────────────────────────────────────────
async function bootstrap() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      log.info(`NexusAI running on port ${PORT}`, { prefix: API_PREFIX });
    });
  } catch (err) {
    log.error("Failed to start", { error: err });
    process.exit(1);
  }
}

bootstrap();

export default app;
