import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/shared/prisma/prisma.service';

type FeedResponse = {
  events: { id: string; elementSelector: string }[];
  nextCursor: string | null;
};

describe('recent-events feed (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let projectId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = app.get(PrismaService);
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/api/projects')
      .send({ name: 'e2e feed project' })
      .expect(201);
    projectId = (res.body as { id: string }).id;

    // seed 3 rows; ids are uuid v7 (time-ordered), so insertion order is the
    // feed order. sequential creates keep the ids strictly increasing.
    for (let i = 0; i < 3; i++) {
      await prisma.event.create({
        data: {
          projectId,
          anonymousId: 'feed-anon',
          sessionId: 'feed-sess',
          url: 'http://localhost/pricing',
          elementTag: 'button',
          elementSelector: `#feed-${i}`,
          timestamp: new Date('2026-07-12T12:00:00.000Z'),
        },
      });
    }
  });

  afterAll(async () => {
    if (projectId) {
      await prisma.event.deleteMany({ where: { projectId } });
      await prisma.project.delete({ where: { id: projectId } });
    }
    await app.close();
  });

  it('paginates newest-first via the cursor with no overlap', async () => {
    const page1 = await request(app.getHttpServer())
      .get('/v1/events/recent')
      .query({ projectId, limit: 2 })
      .expect(200);
    const body1 = page1.body as FeedResponse;

    expect(body1.events).toHaveLength(2);
    // newest-first: last-seeded (#feed-2) comes before #feed-1
    expect(body1.events.map((e) => e.elementSelector)).toEqual([
      '#feed-2',
      '#feed-1',
    ]);
    expect(body1.nextCursor).toBe(body1.events[1].id);

    const page2 = await request(app.getHttpServer())
      .get('/v1/events/recent')
      .query({ projectId, limit: 2, cursor: body1.nextCursor })
      .expect(200);
    const body2 = page2.body as FeedResponse;

    // last page: the single oldest row, then the cursor exhausts
    expect(body2.events.map((e) => e.elementSelector)).toEqual(['#feed-0']);
    expect(body2.nextCursor).toBeNull();

    // no id appears on both pages
    const ids1 = new Set(body1.events.map((e) => e.id));
    expect(body2.events.some((e) => ids1.has(e.id))).toBe(false);
  });

  it('rejects a malformed cursor with 400', async () => {
    await request(app.getHttpServer())
      .get('/v1/events/recent')
      .query({ projectId, cursor: 'not-a-uuid' })
      .expect(400);
  });
});
