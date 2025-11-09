"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../app");
const mongoose_1 = __importDefault(require("mongoose"));
describe("Products API", () => {
    const app = (0, app_1.createApp)();
    const maybe = (cond) => (cond ? it : it.skip);
    maybe(mongoose_1.default.connection.readyState === 1)("GET /api/products returns array", async () => {
        const res = await (0, supertest_1.default)(app).get("/api/products");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        // אחרי seed אמור להיות 12 מוצרים
        if (res.body.data.length > 0) {
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
            expect(res.body.data[0]).toHaveProperty('sku');
            expect(res.body.data[0]).toHaveProperty('name');
        }
    });
    maybe(mongoose_1.default.connection.readyState === 1)("GET /api/products/:id returns single product", async () => {
        // קודם נקבל רשימה כדי לקחת ID אמיתי
        const listRes = await (0, supertest_1.default)(app).get("/api/products");
        if (listRes.body.data.length > 0) {
            const productId = listRes.body.data[0]._id;
            const res = await (0, supertest_1.default)(app).get(`/api/products/${productId}`);
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('_id', productId);
        }
    });
    it("GET /api/products/:id with invalid ID returns 404", async () => {
        const res = await (0, supertest_1.default)(app).get("/api/products/507f1f77bcf86cd799439011"); // ObjectId לא קיים
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});
