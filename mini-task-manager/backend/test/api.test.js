const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '2h';

const { createApp } = require('../src/app');
const { FakeTaskRepository } = require('./helpers/fakeTaskRepository');

let app;
let tokenAdmin;
let tokenVecino;

before(async () => {
  const repo = new FakeTaskRepository();
  app = createApp({ taskRepository: repo });

  const loginAdmin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'Admin123!' });
  tokenAdmin = loginAdmin.body.token;

  const loginVecino = await request(app)
    .post('/api/auth/login')
    .send({ username: 'vecino', password: 'Vecino123!' });
  tokenVecino = loginVecino.body.token;
});

test('Caso 1: POST /api/auth/login con credenciales válidas responde 200 + JWT', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'Admin123!' });

  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.role, 'admin');
});

test('Caso 2: Login con credenciales inválidas responde 401', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'incorrecta' });

  assert.equal(res.status, 401);
  assert.match(res.body.error, /Credenciales inv/);
});

test('Caso 3: Login sin campo password responde 400 con field', async () => {
  const res = await request(app).post('/api/auth/login').send({ username: 'admin' });

  assert.equal(res.status, 400);
  assert.equal(res.body.field, 'password');
});

test('Caso 4: GET /api/tasks sin token responde 401', async () => {
  const res = await request(app).get('/api/tasks');
  assert.equal(res.status, 401);
  assert.match(res.body.error, /token de acceso/);
});

test('Caso 5: GET /api/tasks con token inválido responde 401', async () => {
  const res = await request(app).get('/api/tasks').set('Authorization', 'Bearer falso.token.123');
  assert.equal(res.status, 401);
  assert.match(res.body.error, /Token inv/);
});

test('Caso 6: GET /api/tasks con token válido responde 200 con lista vacía', async () => {
  const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${tokenAdmin}`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data, []);
});

test('Caso 7: POST /api/tasks crea tarea en estado pending', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ title: '   Comprar  pan    ' });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.status, 'pending');
  assert.equal(res.body.data.title, 'Comprar pan');
});

test('Caso 8: POST /api/tasks con título vacío responde 400', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ title: '' });

  assert.equal(res.status, 400);
  assert.equal(res.body.field, 'title');
});

test('Caso 9: POST /api/tasks con título corto (< 3) responde 422', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ title: 'ab' });

  assert.equal(res.status, 422);
  assert.equal(res.body.field, 'title');
});

test('Caso 10: POST /api/tasks con título > 255 responde 422', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ title: 'x'.repeat(256) });

  assert.equal(res.status, 422);
  assert.equal(res.body.field, 'title');
});

test('Caso 11: PATCH /api/tasks/:id/toggle cambia pending -> done', async () => {
  const created = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ title: 'Tarea para toggle' });

  const res = await request(app)
    .patch(`/api/tasks/${created.body.data.id}/toggle`)
    .set('Authorization', `Bearer ${tokenAdmin}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'done');
});

test('Caso 12: PATCH /api/tasks/:id/toggle vuelve done -> pending', async () => {
  const created = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ title: 'Tarea reabierta' });

  await request(app)
    .patch(`/api/tasks/${created.body.data.id}/toggle`)
    .set('Authorization', `Bearer ${tokenAdmin}`);

  const res = await request(app)
    .patch(`/api/tasks/${created.body.data.id}/toggle`)
    .set('Authorization', `Bearer ${tokenAdmin}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'pending');
});

test('Caso 13: PATCH /api/tasks/:id/toggle de tarea inexistente responde 404', async () => {
  const res = await request(app)
    .patch('/api/tasks/999999/toggle')
    .set('Authorization', `Bearer ${tokenAdmin}`);

  assert.equal(res.status, 404);
  assert.match(res.body.error, /No se encontr/);
});

test('Caso 14: PATCH /api/tasks/abc/toggle responde 400', async () => {
  const res = await request(app)
    .patch('/api/tasks/abc/toggle')
    .set('Authorization', `Bearer ${tokenAdmin}`);

  assert.equal(res.status, 400);
  assert.equal(res.body.field, 'id');
});

test('Caso 15: DELETE /api/tasks/:id como admin responde 200', async () => {
  const created = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ title: 'Tarea a eliminar' });

  const res = await request(app)
    .delete(`/api/tasks/${created.body.data.id}`)
    .set('Authorization', `Bearer ${tokenAdmin}`);

  assert.equal(res.status, 200);
  assert.match(res.body.message, /eliminada/);
});

test('Caso 16: DELETE /api/tasks/:id como vecino responde 403', async () => {
  const created = await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${tokenVecino}`)
    .send({ title: 'Tarea protegida' });

  const res = await request(app)
    .delete(`/api/tasks/${created.body.data.id}`)
    .set('Authorization', `Bearer ${tokenVecino}`);

  assert.equal(res.status, 403);
  assert.match(res.body.error, /Acceso denegado/);
});

test('Caso 17: GET /api/tasks/stats como admin responde 200 con resumen', async () => {
  const res = await request(app)
    .get('/api/tasks/stats')
    .set('Authorization', `Bearer ${tokenAdmin}`);

  assert.equal(res.status, 200);
  assert.ok(res.body.data.summary);
  assert.equal(typeof res.body.data.summary.total, 'number');
});

test('Caso 18: GET /api/tasks/stats como vecino responde 403', async () => {
  const res = await request(app)
    .get('/api/tasks/stats')
    .set('Authorization', `Bearer ${tokenVecino}`);

  assert.equal(res.status, 403);
});

test('Caso 19: GET a ruta inexistente responde 404', async () => {
  const res = await request(app).get('/api/no-existe');
  assert.equal(res.status, 404);
});

test('Caso 20: GET /api/health responde 200 (health check de Render)', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});