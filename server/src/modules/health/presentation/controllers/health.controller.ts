import { Controller, Get } from '@nestjs/common';
import { CheckHealthUseCase } from '../../application/use-cases/check-health.use-case';

@Controller('health')
export class HealthController {
  constructor(private readonly checkHealth: CheckHealthUseCase) {}

  @Get()
  check() {
    return this.checkHealth.execute();
  }
}
