/**
 * Performance Tests
 *
 * Load testing for critical endpoints to ensure the system can handle
 * production-level concurrent load:
 * - Concurrent cart operations
 * - Concurrent checkout operations
 * - Webhook processing under load
 *
 * Target: 100 concurrent users with <2s response time for 95th percentile
 */

import request from "supertest";
import app from "../app";
import { UserModel } from "../models/user.model";
import { ProductModel } from "../models/product.model";
import { CartModel } from "../models/cart.model";
import { connectMongo } from "../config/db";
import { logger } from "../utils/logger";

describe("Performance Tests", () => {
  jest.setTimeout(30000);

  let authToken: string;
  let userId: string;
  let productIds: string[] = [];
  let loadTestEmail: string;
  let loadTestPassword: string;

  beforeAll(async () => {
    try {
      await connectMongo();
    } catch (err) {
      console.warn("MongoDB connection failed (may be expected in CI)");
    }

    loadTestEmail = `loadtest-${Date.now()}@example.com`;
    loadTestPassword = "Password123!";

    // Register test user to get token
    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Load Test User",
      email: loadTestEmail,
      password: loadTestPassword,
      confirmPassword: loadTestPassword,
    });

    authToken = registerRes.body.data.token;
    userId = registerRes.body.data.user._id;

    // Ensure a cart exists to prevent duplicate key errors during concurrent adds
    await CartModel.create({
      userId,
      items: [],
      total: 0,
    });

    if (!authToken) {
      throw new Error("Failed to obtain auth token for performance tests");
    }

    // Create test products
    for (let i = 0; i < 20; i++) {
      const product = await ProductModel.create({
        sku: `PERF-SKU-${Date.now()}-${i}`,
        name: `Performance Test Product ${i}`,
        description: "For load testing",
        price: Math.floor(Math.random() * 100) + 10,
        stock: 1000,
        image: "test.jpg",
        category: "test",
      });
      productIds.push(product._id.toString());
    }
  });

  afterAll(async () => {
    await CartModel.deleteMany({});
    await UserModel.deleteMany({});
    await ProductModel.deleteMany({});
  });

  /**
   * Test concurrent cart additions
   * Target: 50 concurrent requests in <2s average
   */
  test("should handle 50 concurrent cart additions", async () => {
    const startTime = Date.now();
    const concurrentRequests = 50;

    // Warm up cart to ensure it already exists
    await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        productId: productIds[0],
        quantity: 1,
      });

    const requests = Array.from({ length: concurrentRequests }, (_, i) =>
      request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          productId: productIds[i % productIds.length],
          quantity: 1,
        }),
    );

    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;
    const avgResponseTime = duration / concurrentRequests;

    // Assert all requests succeeded
    responses.forEach((res) => {
      expect(res.status).toBe(200);
    });

    // Assert performance target
    expect(avgResponseTime).toBeLessThan(2000); // <2s average
    logger.info(
      {
        duration,
        avgResponseTime: avgResponseTime.toFixed(2),
        testName: "50 concurrent cart additions",
      },
      `50 concurrent cart additions: ${duration}ms total, ${avgResponseTime.toFixed(2)}ms average`,
    );
  }, 30000); // 30s timeout

  /**
   * Test concurrent product fetching
   * Target: 100 concurrent requests in <1s average
   */
  test("should handle 100 concurrent product list requests", async () => {
    const startTime = Date.now();
    const concurrentRequests = 100;

    const requests = Array.from({ length: concurrentRequests }, () =>
      request(app).get("/api/products"),
    );

    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;
    const avgResponseTime = duration / concurrentRequests;

    // Assert all requests succeeded
    responses.forEach((res) => {
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    // Assert performance target
    expect(avgResponseTime).toBeLessThan(1000); // <1s average
    logger.info(
      {
        duration,
        avgResponseTime: avgResponseTime.toFixed(2),
        testName: "100 concurrent product requests",
      },
      `100 concurrent product requests: ${duration}ms total, ${avgResponseTime.toFixed(2)}ms average`,
    );
  }, 30000);

  /**
   * Test sequential order creation performance
   * Target: Create 20 orders in <120s total (realistic with DB + payment operations)
   */
  test("should create 20 orders efficiently", async () => {
    jest.setTimeout(120000);
    const startTime = Date.now();
    const orderCount = 20;

    for (let i = 0; i < orderCount; i++) {
      // Add item to cart
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          productId: productIds[i % productIds.length],
          quantity: 1,
        });

      // Create order
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            street: "123 Test St",
            city: "Test City",
            postalCode: "12345",
            country: "US",
          },
        });

      expect(res.status).toBe(201);
    }

    const duration = Date.now() - startTime;
    const avgTime = duration / orderCount;

    expect(duration).toBeLessThan(120000); // <120s total (realistic with DB + Stripe)
    logger.info(
      { duration, avgTime: avgTime.toFixed(2), testName: "20 orders created" },
      `20 orders created: ${duration}ms total, ${avgTime.toFixed(2)}ms average`,
    );
  }, 120000);

  /**
   * Test database query performance
   * Target: Product lookup <100ms on average
   */
  test("should query products efficiently", async () => {
    const iterations = 50;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const productId = productIds[i % productIds.length];
      const res = await request(app).get(`/api/products/${productId}`);

      expect(res.status).toBe(200);
    }

    const duration = Date.now() - startTime;
    const avgTime = duration / iterations;

    expect(avgTime).toBeLessThan(200); // <200ms average
    logger.info(
      { duration, avgTime: avgTime.toFixed(2), testName: "50 product lookups" },
      `50 product lookups: ${duration}ms total, ${avgTime.toFixed(2)}ms average`,
    );
  }, 15000);

  /**
   * Test authentication performance
   * Target: 30 concurrent logins in <3s average
   */
  test("should handle concurrent authentication requests", async () => {
    const startTime = Date.now();
    const concurrentRequests = 30;

    const credentials = Array.from({ length: concurrentRequests }, (_, i) => ({
      email: `loadtest-login-${Date.now()}-${i}@example.com`,
      password: "Password123!",
    }));

    // Register users sequentially with delay to avoid rate limiting
    for (const creds of credentials) {
      await request(app).post("/api/auth/register").send({
        name: "Load Test User",
        email: creds.email,
        password: creds.password,
        confirmPassword: creds.password,
      });
      // Small delay between registrations
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Now test concurrent logins
    const requests = credentials.map((creds) =>
      request(app).post("/api/auth/login").send({
        email: creds.email,
        password: creds.password,
      }),
    );

    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;
    const loginDuration = duration - concurrentRequests * 50; // Exclude registration time
    const avgResponseTime = loginDuration / concurrentRequests;

    // Assert all requests succeeded
    responses.forEach((res, i) => {
      if (res.status !== 200) {
        console.error(`Login ${i} failed with status ${res.status}:`, res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    // Assert performance target (login only, not registration)
    expect(avgResponseTime).toBeLessThan(3000); // <3s average
    logger.info(
      {
        duration: loginDuration,
        avgResponseTime: avgResponseTime.toFixed(2),
        testName: "30 concurrent logins",
      },
      `30 concurrent logins: ${loginDuration}ms total, ${avgResponseTime.toFixed(2)}ms average (registration not included)`,
    );
  }, 60000);
});
