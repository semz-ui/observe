import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { hashApiKey } from './../src/modules/projects/domain/services/api-key';
import { PrismaService } from './../src/shared/prisma/prisma.service';

interface CreateProjectResponse {
  id: string;
  name: string;
  apiKey: string;
  createdAt: string;
}

describe('ProjectsController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // mirror main.ts — test apps don't run bootstrap()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.project.deleteMany({ where: { id: { in: createdIds } } });
    await app.close();
  });

  it('POST /api/projects returns a plaintext key once and stores only its hash', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/projects')
      .send({ name: 'e2e project' })
      .expect(201);

    const body = res.body as CreateProjectResponse;
    createdIds.push(body.id);
    expect(body.apiKey).toMatch(/^obs_/);

    const row = await prisma.project.findUniqueOrThrow({
      where: { id: body.id },
    });
    expect(row.apiKey).toBe(hashApiKey(body.apiKey));
    expect(row.apiKey).not.toBe(body.apiKey);
  });

  it('POST /api/projects rejects an empty name', () => {
    return request(app.getHttpServer())
      .post('/api/projects')
      .send({ name: '' })
      .expect(400);
  });

  it('GET /api/projects lists projects without key material', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/projects')
      .send({ name: 'e2e list project' })
      .expect(201);
    createdIds.push((created.body as CreateProjectResponse).id);

    const res = await request(app.getHttpServer())
      .get('/api/projects')
      .expect(200);

    const projects = res.body as Record<string, unknown>[];
    const found = projects.find((p) => p.name === 'e2e list project');
    expect(found).toBeDefined();
    for (const project of projects) {
      expect(project).not.toHaveProperty('apiKey');
      expect(project).not.toHaveProperty('apiKeyHash');
    }
  });
});
