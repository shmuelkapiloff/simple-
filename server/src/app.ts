import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware";
import { healthRouter } from "./routes/health.routes";
import { productRouter } from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import { authRoutes } from "./routes/auth.routes";
import orderRoutes from "./routes/order.routes";

export function createApp() {
  const app = express();

  // Middlewares
  app.use(cors()); // Allow cross-origin requests in dev; tighten later
  app.use(compression()); // gzip responses
  app.use(express.json()); // parse JSON bodies
  app.use(cookieParser()); // parse cookies

  // Routes
  app.use("/api/health", healthRouter);
  app.use("/api/products", productRouter);
  app.use("/api/cart", cartRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/orders", orderRoutes);

  // Error handler (keep last)
  app.use(errorHandler);

  return app;
}
