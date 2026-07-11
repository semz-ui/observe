import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

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
    try {
      await this.quit();
    } catch (error) {
      // a connection already gone must not break the shutdown sequence
      this.logger.warn(`Redis quit failed during shutdown: ${String(error)}`);
    }
  }
}
