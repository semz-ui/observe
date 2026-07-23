import { Controller, Get, Query } from '@nestjs/common';
import { GetProjectStatsUseCase } from '../../application/use-cases/get-project-stats.use-case';
import type { ProjectStats } from '../../application/use-cases/get-project-stats.use-case';
import { GetStatsDto } from '../dtos/get-stats.dto';

@Controller('v1/stats')
export class StatsController {
  constructor(private readonly getProjectStats: GetProjectStatsUseCase) {}

  @Get()
  stats(@Query() query: GetStatsDto): Promise<ProjectStats> {
    return this.getProjectStats.execute(query);
  }
}
