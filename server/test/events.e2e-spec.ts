import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/shared/prisma/prisma.service';

const baseEvent = {
  anonymousId: 'e2e-anon',
  sessionId: 'e2e-sess',
  url: 'http://localhost/pricing',
  elementTag: 'button',
  elementSelector: '#e2e-buy',
  timestamp: '2026-07-12T12:00:00.000Z',
};

describe('EventsController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKey: string;
  let projectId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // mirror main.ts — test apps don't run bootstrap()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = app.get(PrismaService);
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/api/projects')
      .send({ name: 'e2e ingestion project' })
      .expect(201);
    const body = res.body as { id: string; apiKey: string };
    apiKey = body.apiKey;
    projectId = body.id;
  });

  afterAll(async () => {
    // guard: if beforeAll failed, projectId is undefined — and Prisma treats
    // an undefined filter as "no filter", which would deleteMany EVERYTHING
    if (projectId) {
      await prisma.event.deleteMany({ where: { projectId } });
      await prisma.project.delete({ where: { id: projectId } });
    }
    await app.close();
  });

  it('accepts a valid batch with 202 and stores rows under the resolved project', async () => {
    await request(app.getHttpServer())
      .post('/v1/events')
      .send({ apiKey, events: [baseEvent, baseEvent] })
      .expect(202);

    const rows = await prisma.event.findMany({ where: { projectId } });
    expect(rows).toHaveLength(2);
    expect(rows[0].elementSelector).toBe('#e2e-buy');
  });

  it('rejects an invalid api key with 401 and stores nothing', async () => {
    const before = await prisma.event.count({ where: { projectId } });

    await request(app.getHttpServer())
      .post('/v1/events')
      .send({ apiKey: 'obs_not-a-real-key', events: [baseEvent] })
      .expect(401);

    await expect(prisma.event.count({ where: { projectId } })).resolves.toBe(
      before,
    );
  });

  it('rejects malformed events with 400', async () => {
    await request(app.getHttpServer())
      .post('/v1/events')
      .send({ apiKey, events: [] }) // ArrayMinSize
      .expect(400);

    await request(app.getHttpServer())
      .post('/v1/events')
      .send({
        apiKey,
        events: [{ ...baseEvent, elementTag: '', timestamp: 'not-a-date' }],
      })
      .expect(400);

    // oversized field — every string is MaxLength-capped
    await request(app.getHttpServer())
      .post('/v1/events')
      .send({
        apiKey,
        events: [{ ...baseEvent, url: `http://localhost/${'a'.repeat(3000)}` }],
      })
      .expect(400);
  });

  it('ignores a client-supplied projectId', async () => {
    await request(app.getHttpServer())
      .post('/v1/events')
      .send({
        apiKey,
        events: [
          {
            ...baseEvent,
            elementSelector: '#e2e-smuggle',
            projectId: 'someone-elses-project',
          },
        ],
      })
      .expect(202);

    const rows = await prisma.event.findMany({
      where: { elementSelector: '#e2e-smuggle' },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].projectId).toBe(projectId);
  });
});
