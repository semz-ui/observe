import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error(
        'REDIS_URL is not set. Copy server/.env.example to server/.env and start Redis with `docker compose up -d`.',
      );
    }
    super(url, { maxRetriesPerRequest: 2 });
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
