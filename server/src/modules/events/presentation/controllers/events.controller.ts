import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { IngestEventsUseCase } from '../../application/use-cases/ingest-events.use-case';
import { InvalidApiKeyError } from '../../application/errors/invalid-api-key.error';
import { IngestEventsDto } from '../dtos/ingest-events.dto';

@Controller('v1/events')
export class EventsController {
  constructor(private readonly ingestEvents: IngestEventsUseCase) {}

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
}
