import { Module } from '@nestjs/common';
import { HealthController } from './presentation/controllers/health.controller';
import { CheckHealthUseCase } from './application/use-cases/check-health.use-case';

@Module({
  controllers: [HealthController],
  providers: [CheckHealthUseCase],
})
export class HealthModule {}
