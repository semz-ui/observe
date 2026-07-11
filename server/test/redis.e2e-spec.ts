import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { RedisService } from './../src/shared/redis/redis.service';

describe('RedisService (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('round-trips a value through Redis', async () => {
    const redis = app.get(RedisService);

    await redis.set('e2e:probe', 'ok', 'EX', 10);
    expect(await redis.get('e2e:probe')).toBe('ok');

    await redis.del('e2e:probe');
    expect(await redis.get('e2e:probe')).toBeNull();
  });

  it('increments counters (rate-limit primitive)', async () => {
    const redis = app.get(RedisService);

    await redis.del('e2e:counter');
    expect(await redis.incr('e2e:counter')).toBe(1);
    expect(await redis.incr('e2e:counter')).toBe(2);

    await redis.del('e2e:counter');
  });
});
