import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects';
import { CLICK_EVENT_REPOSITORY } from './domain/repositories/click-event.repository';
import { IngestEventsUseCase } from './application/use-cases/ingest-events.use-case';
import { PrismaClickEventRepository } from './infrastructure/persistence/prisma-click-event.repository';
import { EventsController } from './presentation/controllers/events.controller';

@Module({
  // brings the exported PROJECT_LOOKUP binding across the module boundary
  imports: [ProjectsModule],
  controllers: [EventsController],
  providers: [
    { provide: CLICK_EVENT_REPOSITORY, useClass: PrismaClickEventRepository },
    IngestEventsUseCase,
  ],
})
export class EventsModule {}
