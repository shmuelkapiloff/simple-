import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import corsConfig from "./config/cors";
import { errorHandler } from "./middlewares/error.middleware";
import {
  requestIdMiddleware,
  requestLoggerMiddleware,
} from "./middlewares/logging.middleware";
import { logger } from "./utils/logger";

// Import routes
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import addressRoutes from "./routes/addresses.routes";
import adminRoutes from "./routes/admin.routes";
import paymentRoutes from "./routes/payment.routes";

const app: Application = express();

/**
 * Middleware - Security and Parsing
 */
app.use(helmet()); // Security headers
app.use(corsConfig); // CORS configuration for all clients
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies
app.use(requestIdMiddleware); // Assign X-Request-ID
app.use(requestLoggerMiddleware); // Structured request/response logging

/**
 * Health check for load balancers
 */
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes - Versioned for future compatibility
 */
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

/**
 * Root endpoint - API documentation
 */
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: "Simple Shop API",
      version: "1.0.0",
      status: "running",
      endpoints: {
        health: "/health or /api/health",
        auth: "/api/auth",
        products: "/api/products",
        cart: "/api/cart",
        orders: "/api/orders",
        addresses: "/api/addresses",
        admin: "/api/admin",
      },
      documentation: "/docs (coming soon)",
    },
    message: "Welcome to Simple Shop API",
  });
});

/**
 * 404 handler - Not Found
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "NOT_FOUND",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

/**
 * Global error handler (must be last)
 */
app.use(errorHandler);

export default app;
