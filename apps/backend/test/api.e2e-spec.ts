import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { TEST_TOKENS } from './test-env.js';

const edge = { Authorization: `Bearer ${TEST_TOKENS.edge}` };
const device = { Authorization: `Bearer ${TEST_TOKENS.device}` };
const newEvent = (overrides: Record<string, unknown> = {}) => ({
  eventId: randomUUID(),
  zoneId: 1,
  detectedAt: new Date().toISOString(),
  confidence: 0.8,
  ...overrides,
});

describe('API', () => {
  let app: INestApplication;
  let db: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    db = app.get(DataSource);
  });

  beforeEach(async () => {
    await db.query('TRUNCATE events, alert_attempts RESTART IDENTITY CASCADE');
    await db.query('UPDATE devices SET last_seen_at = NULL');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('health', () => {
    it('reports liveness and readiness', async () => {
      await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' });
      const ready = await request(app.getHttpServer()).get('/ready').expect(200);
      expect(ready.body.status).toBe('ok');
    });
  });

  describe('events', () => {
    it('rejects requests without the edge token', async () => {
      await request(app.getHttpServer()).post('/api/events').send(newEvent()).expect(401);
      await request(app.getHttpServer()).post('/api/events').set(device).send(newEvent()).expect(401);
    });

    it('stores an event once and treats a repeat as idempotent', async () => {
      const body = newEvent();
      const first = await request(app.getHttpServer()).post('/api/events').set(edge).send(body).expect(201);
      expect(first.body).toMatchObject({ eventId: body.eventId, zoneId: 1, alertAttempts: [] });
      await request(app.getHttpServer()).post('/api/events').set(edge).send(body).expect(200);
      const list = await request(app.getHttpServer()).get('/api/events').expect(200);
      expect(list.body.total).toBe(1);
    });

    it('stays idempotent under concurrent duplicates', async () => {
      const body = newEvent();
      const results = await Promise.all(
        Array.from({ length: 5 }, () => request(app.getHttpServer()).post('/api/events').set(edge).send(body)),
      );
      expect(results.every((r) => r.status === 200 || r.status === 201)).toBe(true);
      expect(results.filter((r) => r.status === 201)).toHaveLength(1);
      expect((await request(app.getHttpServer()).get('/api/events')).body.total).toBe(1);
    });

    it('validates the payload', async () => {
      const post = (b: unknown) => request(app.getHttpServer()).post('/api/events').set(edge).send(b as object);
      await post(newEvent({ eventId: 'not-a-uuid' })).expect(400);
      await post(newEvent({ confidence: 1.5 })).expect(400);
      await post(newEvent({ detectedAt: 'yesterday-ish' })).expect(400);
      await post(newEvent({ unexpected: true })).expect(400);
    });

    it('rejects an unknown zone', async () => {
      await request(app.getHttpServer()).post('/api/events').set(edge).send(newEvent({ zoneId: 999 })).expect(422);
    });

    it('lists newest first with pagination', async () => {
      for (const minutes of [3, 1, 2]) {
        await request(app.getHttpServer())
          .post('/api/events')
          .set(edge)
          .send(newEvent({ detectedAt: new Date(Date.UTC(2026, 9, 10, 12, minutes)).toISOString() }))
          .expect(201);
      }
      const page = await request(app.getHttpServer()).get('/api/events?limit=2&offset=0').expect(200);
      expect(page.body.total).toBe(3);
      expect(page.body.items.map((e: { detectedAt: string }) => new Date(e.detectedAt).getUTCMinutes())).toEqual([3, 2]);
      await request(app.getHttpServer()).get('/api/events?limit=0').expect(400);
    });
  });

  describe('zones', () => {
    const square = [
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.1 },
      { x: 0.5, y: 0.9 },
    ];

    it('returns the seeded zone and updates its polygon', async () => {
      const zone = await request(app.getHttpServer()).get('/api/zones/1').expect(200);
      expect(zone.body.points.length).toBeGreaterThanOrEqual(3);
      const updated = await request(app.getHttpServer()).put('/api/zones/1').send({ points: square }).expect(200);
      expect(updated.body.points).toEqual(square);
      await request(app.getHttpServer()).get('/api/zones/999').expect(404);
    });

    it('rejects invalid polygons', async () => {
      const put = (b: unknown) => request(app.getHttpServer()).put('/api/zones/1').send(b as object);
      await put({ points: square.slice(0, 2) }).expect(400);
      await put({ points: [...square, { x: 1.2, y: 0.5 }] }).expect(400);
      await put({ points: [...square, { x: 'a', y: 0.5 }] }).expect(400);
    });
  });

  describe('devices', () => {
    it('is offline until a heartbeat, then online', async () => {
      const before = await request(app.getHttpServer()).get('/api/devices').expect(200);
      expect(before.body[0]).toMatchObject({ name: 'esp32-1', status: 'offline', lastSeenAt: null });
      await request(app.getHttpServer()).post('/api/devices/1/heartbeat').expect(401);
      await request(app.getHttpServer()).post('/api/devices/1/heartbeat').set(edge).expect(401);
      await request(app.getHttpServer()).post('/api/devices/1/heartbeat').set(device).expect(201);
      const after = await request(app.getHttpServer()).get('/api/devices').expect(200);
      expect(after.body[0].status).toBe('online');
    });

    it('goes offline after missing heartbeats', async () => {
      await db.query(`UPDATE devices SET last_seen_at = now() - interval '5 minutes'`);
      const res = await request(app.getHttpServer()).get('/api/devices').expect(200);
      expect(res.body[0].status).toBe('offline');
    });
  });
});
