const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');

const JWT_SECRET = 'development-secret-change-me';
const viewerToken = jwt.sign({ id: 'viewer-1', email: 'viewer@example.com', role: 'VIEWER' }, JWT_SECRET, { expiresIn: '7d' });
const adminToken = jwt.sign({ id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '7d' });

describe('authorization checks', () => {
  test('unauthenticated user cannot access protected routes', async () => {
    const res = await request(app).get('/api/content');
    expect(res.status).toBe(401);
  });

  test('viewer cannot access admin upload API', async () => {
    const res = await request(app)
      .post('/api/admin/content')
      .set('Cookie', [`jwt=${viewerToken}`])
      .attach('file', Buffer.from('fake'), { filename: 'test.mp4', contentType: 'video/mp4' });

    expect(res.status).toBe(403);
  });

  test('viewer cannot access admin edit API', async () => {
    const res = await request(app)
      .put('/api/admin/content/123')
      .set('Cookie', [`jwt=${viewerToken}`]);

    expect(res.status).toBe(403);
  });

  test('viewer cannot access admin delete API', async () => {
    const res = await request(app)
      .delete('/api/admin/content/123')
      .set('Cookie', [`jwt=${viewerToken}`]);

    expect(res.status).toBe(403);
  });

  test('admin can access admin APIs', async () => {
    const res = await request(app)
      .get('/api/admin/content')
      .set('Cookie', [`jwt=${adminToken}`]);

    expect([200, 404]).toContain(res.status);
  });

  test('invalid file type is rejected', async () => {
    const res = await request(app)
      .post('/api/admin/content')
      .set('Cookie', [`jwt=${adminToken}`])
      .field('title', 'Bad file')
      .field('description', 'desc')
      .field('category', 'Training')
      .attach('file', Buffer.from('oops'), { filename: 'note.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
  });

  test('oversized files are rejected', async () => {
    const bigData = Buffer.alloc(101 * 1024 * 1024, 'a');
    const res = await request(app)
      .post('/api/admin/content')
      .set('Cookie', [`jwt=${adminToken}`])
      .field('title', 'Big video')
      .field('description', 'desc')
      .field('category', 'Training')
      .attach('file', bigData, { filename: 'large.mp4', contentType: 'video/mp4' });

    expect(res.status).toBe(400);
  });
});
