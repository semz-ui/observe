import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { IngestEventsUseCase } from '../../application/use-cases/ingest-events.use-case';
import { GetRecentEventsUseCase } from '../../application/use-cases/get-recent-events.use-case';
import { InvalidApiKeyError } from '../../application/errors/invalid-api-key.error';
import { IngestEventsDto } from '../dtos/ingest-events.dto';
import { GetRecentEventsDto } from '../dtos/get-recent-events.dto';
import type { RecentEventsPage } from '../../domain/repositories/event-feed.repository';

@Controller('v1/events')
export class EventsController {
  constructor(
    private readonly ingestEvents: IngestEventsUseCase,
    private readonly getRecentEvents: GetRecentEventsUseCase,
  ) {}

  // 202: accepted for processing — no body, the SDK fires and forgets
  @Post()
  @HttpCode(202)
  async ingest(@Body() dto: IngestEventsDto): Promise<void> {
    try {
      await this.ingestEvents.execute(dto);
    } catch (error) {
      if (error instanceof InvalidApiKeyError) {
        throw new UnauthorizedException('invalid API key');
      }
      throw error;
    }
  }

  // newest-first feed, keyset-paginated on the event id
  @Get('recent')
  recent(@Query() query: GetRecentEventsDto): Promise<RecentEventsPage> {
    return this.getRecentEvents.execute(query);
  }
}
