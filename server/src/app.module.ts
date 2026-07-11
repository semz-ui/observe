import { Module } from '@nestjs/common';
import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [PrismaModule, RedisModule, HealthModule],
})
export class AppModule {}
