import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { openDb } from '../src/db.js';
import { createApp } from '../src/app.js';

let app;
const valid = { title: 'Printer on fire', description: 'It is smoking.', customer_email: 'a@b.com' };

// Fresh in-memory DB per test keeps tests independent.
beforeEach(() => { app = createApp(openDb(':memory:')); });

const make = (over = {}) => request(app).post('/api/tickets').send({ ...valid, ...over });

test('creates a ticket with defaults and generated timestamps', async () => {
  const res = await make();
  assert.equal(res.status, 201);
  assert.equal(res.body.status, 'Open');
  assert.equal(res.body.priority, 'Medium');
  assert.ok(res.body.created_at && res.body.updated_at);
});

test('rejects invalid input with field-level errors', async () => {
  const res = await make({ title: 'x'.repeat(121), customer_email: 'nope', description: '  ', priority: 'Urgent' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  for (const f of ['title', 'customer_email', 'description', 'priority']) assert.ok(res.body.error.details[f], f);
});

test('search, filters and sorting combine; pagination is 10 per page', async () => {
  for (let i = 0; i < 12; i++) await make({ title: `Billing issue ${i}`, priority: 'High', customer_email: `u${i}@x.com` });
  await make({ title: 'Login bug', priority: 'Low', status: 'Resolved', customer_email: 'zed@y.com' });

  const p1 = (await request(app).get('/api/tickets?search=billing&priority=High')).body;
  assert.equal(p1.total, 12);
  assert.equal(p1.items.length, 10);
  assert.equal(p1.totalPages, 2);
  const p2 = (await request(app).get('/api/tickets?search=billing&priority=High&page=2')).body;
  assert.equal(p2.items.length, 2);

  const byEmail = (await request(app).get('/api/tickets?search=zed@y&status=Resolved')).body;
  assert.equal(byEmail.total, 1);
  assert.equal((await request(app).get('/api/tickets?search=zed&status=Open')).body.total, 0);

  const newest = (await request(app).get('/api/tickets?sort=newest')).body.items;
  const oldest = (await request(app).get('/api/tickets?sort=oldest')).body.items;
  assert.equal(newest[0].title, 'Login bug');
  assert.equal(oldest[0].title, 'Billing issue 0');
});

test('updates status/priority, persists, and bumps updated_at', async () => {
  const { body: t } = await make();
  await new Promise((r) => setTimeout(r, 5));
  const res = await request(app).patch(`/api/tickets/${t.id}`).send({ status: 'Resolved', priority: 'High' });
  assert.equal(res.status, 200);
  const fetched = (await request(app).get(`/api/tickets/${t.id}`)).body;
  assert.equal(fetched.status, 'Resolved');
  assert.equal(fetched.priority, 'High');
  assert.ok(fetched.updated_at > t.updated_at);
  assert.equal(fetched.title, t.title);
});

test('patch cannot change other fields and rejects bad values', async () => {
  const { body: t } = await make();
  assert.equal((await request(app).patch(`/api/tickets/${t.id}`).send({ title: 'hack' })).status, 400);
  assert.equal((await request(app).patch(`/api/tickets/${t.id}`).send({ status: 'Closed' })).status, 400);
});

test('returns 404 for unknown ticket and 400 for malformed id', async () => {
  assert.equal((await request(app).get('/api/tickets/999')).status, 404);
  assert.equal((await request(app).patch('/api/tickets/999').send({ status: 'Open' })).status, 404);
  assert.equal((await request(app).get('/api/tickets/abc')).status, 400);
});

test('summary counts ignore filters and reflect the whole dataset', async () => {
  await make(); await make({ status: 'In Progress' }); await make({ status: 'Resolved' }); await make({ status: 'Resolved' });
  const res = await request(app).get('/api/tickets/summary?status=Open');
  assert.deepEqual(res.body, { total: 4, open: 1, inProgress: 1, resolved: 2 });
});

test('invalid JSON yields a consistent error body', async () => {
  const res = await request(app).post('/api/tickets').set('Content-Type', 'application/json').send('{bad');
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'INVALID_JSON');
});
