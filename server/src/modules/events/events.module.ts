import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects';
import { CLICK_EVENT_REPOSITORY } from './domain/repositories/click-event.repository';
import { EVENT_STATS_REPOSITORY } from './domain/repositories/event-stats.repository';
import { IngestEventsUseCase } from './application/use-cases/ingest-events.use-case';
import { GetProjectStatsUseCase } from './application/use-cases/get-project-stats.use-case';
import { PrismaClickEventRepository } from './infrastructure/persistence/prisma-click-event.repository';
import { PrismaEventStatsRepository } from './infrastructure/persistence/prisma-event-stats.repository';
import { EventsController } from './presentation/controllers/events.controller';
import { StatsController } from './presentation/controllers/stats.controller';

@Module({
  // brings the exported PROJECT_LOOKUP binding across the module boundary
  imports: [ProjectsModule],
  controllers: [EventsController, StatsController],
  providers: [
    { provide: CLICK_EVENT_REPOSITORY, useClass: PrismaClickEventRepository },
    { provide: EVENT_STATS_REPOSITORY, useClass: PrismaEventStatsRepository },
    IngestEventsUseCase,
    GetProjectStatsUseCase,
  ],
})
export class EventsModule {}
