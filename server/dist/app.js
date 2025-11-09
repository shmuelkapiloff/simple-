"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const error_middleware_1 = require("./middlewares/error.middleware");
const health_routes_1 = require("./routes/health.routes");
const product_routes_1 = require("./routes/product.routes");
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
function createApp() {
    console.log("🏗️ שמואל: מתחיל ליצור Express app...");
    const app = (0, express_1.default)();
    console.log("📦 שמואל: Express app נוצר! עכשיו מוסיף middlewares...");
    // Middlewares
    console.log("🌐 שמואל: מוסיף CORS...");
    app.use((0, cors_1.default)()); // Allow cross-origin requests in dev; tighten later
    console.log("📦 שמואל: מוסיף compression...");
    app.use((0, compression_1.default)()); // gzip responses
    console.log("📝 שמואל: מוסיף JSON parser...");
    app.use(express_1.default.json()); // parse JSON bodies
    // Routes
    console.log("🛣️ שמואל: מוסיף routes...");
    app.use("/api/health", health_routes_1.healthRouter);
    console.log("✅ שמואל: Health routes נוספו!");
    app.use("/api/products", product_routes_1.productRouter);
    console.log("🛍️ שמואל: Product routes נוספו!");
    app.use("/api/cart", cart_routes_1.default);
    console.log("🛒 שמואל: Cart routes נוספו!");
    // שמואל: route מיוחד שלי!
    app.get("/api/shmuel", (req, res) => {
        res.json({
            message: "שלום שמואל! זה הroute שלך!",
            timestamp: new Date().toISOString(),
            success: true
        });
    });
    console.log("🎯 שמואל: Route מיוחד נוסף!");
    // Error handler (keep last)
    console.log("🛡️ שמואל: מוסיף error handler...");
    app.use(error_middleware_1.errorHandler);
    console.log("🎯 שמואל: Express app מוכן לפעולה!");
    return app;
}
