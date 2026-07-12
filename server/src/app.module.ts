import { Module } from '@nestjs/common';
import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Module({
  imports: [PrismaModule, RedisModule, HealthModule, ProjectsModule],
})
export class AppModule {}
