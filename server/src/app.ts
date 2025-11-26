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
  console.log("🏗️ שמואל: מתחיל ליצור Express app...");
  const app = express();
  console.log("📦 שמואל: Express app נוצר! עכשיו מוסיף middlewares...");

  // Middlewares
  console.log("🌐 שמואל: מוסיף CORS...");
  app.use(cors()); // Allow cross-origin requests in dev; tighten later
  console.log("📦 שמואל: מוסיף compression...");
  app.use(compression()); // gzip responses
  console.log("📝 שמואל: מוסיף JSON parser...");
  app.use(express.json()); // parse JSON bodies
  console.log("🍪 שמואל: מוסיף Cookie parser...");
  app.use(cookieParser()); // parse cookies

  // Routes
  console.log("🛣️ שמואל: מוסיף routes...");
  app.use("/api/health", healthRouter);
  console.log("✅ שמואל: Health routes נוספו!");
  app.use("/api/products", productRouter);
  console.log("🛍️ שמואל: Product routes נוספו!");
  app.use("/api/cart", cartRoutes);
  console.log("🛒 שמואל: Cart routes נוספו!");
  app.use("/api/auth", authRoutes);
  console.log("🔐 שמואל: Auth routes נוספו!");
  app.use("/api/orders", orderRoutes);
  console.log("📋 שמואל: Order routes נוספו!");

  // שמואל: route מיוחד שלי!
  app.get("/api/shmuel", (req, res) => {
    res.json({
      message: "שלום שמואל! זה הroute שלך!",
      timestamp: new Date().toISOString(),
      success: true,
    });
  });
  console.log("🎯 שמואל: Route מיוחד נוסף!");

  // Error handler (keep last)
  console.log("🛡️ שמואל: מוסיף error handler...");
  app.use(errorHandler);
  console.log("🎯 שמואל: Express app מוכן לפעולה!");

  return app;
}
