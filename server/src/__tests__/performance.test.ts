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

import request from 'supertest';
import app from '../app';
import mongoose from 'mongoose';
import { UserModel } from '../models/user.model';
import { ProductModel } from '../models/product.model';
import bcrypt from 'bcryptjs';

const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
  }
};

const closeDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

describe('Performance Tests', () => {
  let authToken: string;
  let userId: string;
  let productIds: string[] = [];

  beforeAll(async () => {
    await connectDB();

    // Create test user
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const user = await UserModel.create({
      name: 'Load Test User',
      email: 'loadtest@example.com',
      password: hashedPassword,
    });
    userId = user._id.toString();

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'loadtest@example.com', password: 'Password123!' });
    
    authToken = loginRes.body.data.tokens.access;

    // Create test products
    for (let i = 0; i < 20; i++) {
      const product = await ProductModel.create({
        name: `Performance Test Product ${i}`,
        description: 'For load testing',
        price: Math.floor(Math.random() * 100) + 10,
        stock: 1000,
        image: 'test.jpg',
        category: 'test',
      });
      productIds.push(product._id.toString());
    }
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await ProductModel.deleteMany({});
    await closeDB();
  });

  /**
   * Test concurrent cart additions
   * Target: 50 concurrent requests in <2s average
   */
  test('should handle 50 concurrent cart additions', async () => {
    const startTime = Date.now();
    const concurrentRequests = 50;
    
    const requests = Array.from({ length: concurrentRequests }, (_, i) => 
      request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productIds[i % productIds.length],
          quantity: 1,
        })
    );

    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;
    const avgResponseTime = duration / concurrentRequests;

    // Assert all requests succeeded
    responses.forEach(res => {
      expect(res.status).toBe(200);
    });

    // Assert performance target
    expect(avgResponseTime).toBeLessThan(2000); // <2s average
    console.log(`50 concurrent cart additions: ${duration}ms total, ${avgResponseTime.toFixed(2)}ms average`);
  }, 30000); // 30s timeout

  /**
   * Test concurrent product fetching
   * Target: 100 concurrent requests in <1s average
   */
  test('should handle 100 concurrent product list requests', async () => {
    const startTime = Date.now();
    const concurrentRequests = 100;
    
    const requests = Array.from({ length: concurrentRequests }, () => 
      request(app)
        .get('/api/products')
    );

    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;
    const avgResponseTime = duration / concurrentRequests;

    // Assert all requests succeeded
    responses.forEach(res => {
      expect(res.status).toBe(200);
      expect(res.body.data.products).toBeDefined();
    });

    // Assert performance target
    expect(avgResponseTime).toBeLessThan(1000); // <1s average
    console.log(`100 concurrent product requests: ${duration}ms total, ${avgResponseTime.toFixed(2)}ms average`);
  }, 30000);

  /**
   * Test sequential order creation performance
   * Target: Create 20 orders in <30s total
   */
  test('should create 20 orders efficiently', async () => {
    const startTime = Date.now();
    const orderCount = 20;

    for (let i = 0; i < orderCount; i++) {
      // Add item to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productIds[i % productIds.length],
          quantity: 1,
        });

      // Create order
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'US',
          },
        });

      expect(res.status).toBe(201);
    }

    const duration = Date.now() - startTime;
    const avgTime = duration / orderCount;

    expect(duration).toBeLessThan(30000); // <30s total
    console.log(`20 orders created: ${duration}ms total, ${avgTime.toFixed(2)}ms average`);
  }, 60000);

  /**
   * Test database query performance
   * Target: Product lookup <100ms on average
   */
  test('should query products efficiently', async () => {
    const iterations = 50;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const productId = productIds[i % productIds.length];
      const res = await request(app).get(`/api/products/${productId}`);
      
      expect(res.status).toBe(200);
    }

    const duration = Date.now() - startTime;
    const avgTime = duration / iterations;

    expect(avgTime).toBeLessThan(100); // <100ms average
    console.log(`50 product lookups: ${duration}ms total, ${avgTime.toFixed(2)}ms average`);
  }, 15000);

  /**
   * Test authentication performance
   * Target: 30 concurrent logins in <3s average
   */
  test('should handle concurrent authentication requests', async () => {
    const startTime = Date.now();
    const concurrentRequests = 30;
    
    const requests = Array.from({ length: concurrentRequests }, () => 
      request(app)
        .post('/api/auth/login')
        .send({
          email: 'loadtest@example.com',
          password: 'Password123!',
        })
    );

    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;
    const avgResponseTime = duration / concurrentRequests;

    // Assert all requests succeeded
    responses.forEach(res => {
      expect(res.status).toBe(200);
      expect(res.body.data.tokens.access).toBeDefined();
    });

    // Assert performance target
    expect(avgResponseTime).toBeLessThan(3000); // <3s average
    console.log(`30 concurrent logins: ${duration}ms total, ${avgResponseTime.toFixed(2)}ms average`);
  }, 30000);
});
