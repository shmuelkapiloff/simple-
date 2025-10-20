import request from 'supertest';
import { createApp } from '../app';

describe('Health endpoint', () => {
  it('returns ok structure', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('status');
  });
});
