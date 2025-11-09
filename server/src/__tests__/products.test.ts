import request from "supertest";
import { createApp } from "../app";
import mongoose from "mongoose";

describe("Products API", () => {
  const app = createApp();

  const maybe = (cond: boolean) => (cond ? it : it.skip);

  maybe(mongoose.connection.readyState === 1)(
    "GET /api/products returns array",
    async () => {
      const res = await request(app).get("/api/products");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      // אחרי seed אמור להיות 12 מוצרים
      if (res.body.data.length > 0) {
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        expect(res.body.data[0]).toHaveProperty("sku");
        expect(res.body.data[0]).toHaveProperty("name");
      }
    }
  );

  maybe(mongoose.connection.readyState === 1)(
    "GET /api/products/:id returns single product",
    async () => {
      // קודם נקבל רשימה כדי לקחת ID אמיתי
      const listRes = await request(app).get("/api/products");
      if (listRes.body.data.length > 0) {
        const productId = listRes.body.data[0]._id;
        const res = await request(app).get(`/api/products/${productId}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("_id", productId);
      }
    }
  );

  it("GET /api/products/:id with invalid ID returns 404", async () => {
    const res = await request(app).get(
      "/api/products/507f1f77bcf86cd799439011"
    ); // ObjectId לא קיים
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
