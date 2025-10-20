import request from 'supertest';
import { createApp } from '../app';
import mongoose from 'mongoose';

describe('Products API', () => {
  const app = createApp();

  const maybe = (cond: boolean) => (cond ? it : it.skip);

  maybe(mongoose.connection.readyState === 1)('GET /api/products returns array', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
