import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from './app.js';

test('admin booking API requires authentication and ADMIN role', async () => {
  const anonymous = await request(app).get('/api/admin/bookings');
  assert.equal(anonymous.status, 401);

  const userAgent = request.agent(app);
  const userLogin = await userAgent
    .post('/api/auth/login')
    .send({ email: 'user@machanix.demo', password: 'User@123' });
  assert.equal(userLogin.status, 200);

  const userList = await userAgent.get('/api/admin/bookings');
  assert.equal(userList.status, 403);
  const userStats = await userAgent.get('/api/admin/stats');
  assert.equal(userStats.status, 403);
});

test('admin can list and update booking status', async () => {
  const adminAgent = request.agent(app);
  const login = await adminAgent
    .post('/api/auth/login')
    .send({ email: 'admin@machanix.demo', password: 'Admin@123' });
  assert.equal(login.status, 200);

  const list = await adminAgent.get('/api/admin/bookings?page=1&limit=20');
  assert.equal(list.status, 200);
  assert.equal(typeof list.body.total, 'number');
  assert.equal(typeof list.body.page, 'number');
  assert.equal(typeof list.body.pages, 'number');
  assert.ok(Array.isArray(list.body.items));

  let bookingId = list.body.items[0]?.id;
  if (!bookingId) {
    const booking = await adminAgent.post('/api/bookings').send({
      name: 'Admin Test',
      phone: '9876543210',
      address: '123 Test Street, Bhubaneswar',
      city: 'Bhubaneswar',
      bookingDate: '2099-12-31',
      car: { make: 'Tata', model: 'Nexon', fuel: 'Petrol' },
      serviceName: 'Standard Service',
    });
    assert.equal(booking.status, 201);
    bookingId = booking.body.bookingId;
  }

  const update = await adminAgent
    .patch(`/api/admin/bookings/${bookingId}/status`)
    .send({ status: 'ACCEPTED' });
  assert.equal(update.status, 200);
  assert.equal(update.body.booking.status, 'ACCEPTED');

  await adminAgent
    .patch(`/api/admin/bookings/${bookingId}/status`)
    .send({ status: 'PENDING' });
});
