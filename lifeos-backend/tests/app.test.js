const request = require('supertest');
const app = require('../src/app');

describe('App API', () => {
  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body).toHaveProperty('message', 'LifeOS API is running');
  });

  it('GET /nonexistent should return 404', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.statusCode).toEqual(404);
  });
});
