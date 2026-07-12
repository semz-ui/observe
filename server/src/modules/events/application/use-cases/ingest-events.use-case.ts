import { Inject, Injectable } from '@nestjs/common';
import { PROJECT_LOOKUP } from '../../../projects';
import type { ProjectLookup } from '../../../projects';
import { CLICK_EVENT_REPOSITORY } from '../../domain/repositories/click-event.repository';
import type {
  ClickEventInput,
  ClickEventRepository,
} from '../../domain/repositories/click-event.repository';
import { InvalidApiKeyError } from '../errors/invalid-api-key.error';

// The DTO stays in presentation; this is the application layer's own view of
// the request. timestamp arrives as an ISO string and leaves as a Date.
export interface IngestEventsInput {
  apiKey: string;
  events: Array<
    Omit<ClickEventInput, 'projectId' | 'timestamp'> & { timestamp: string }
  >;
}

@Injectable()
export class IngestEventsUseCase {
  constructor(
    @Inject(PROJECT_LOOKUP)
    private readonly projectLookup: ProjectLookup,
    @Inject(CLICK_EVENT_REPOSITORY)
    private readonly clickEventRepository: ClickEventRepository,
  ) {}

  async execute(input: IngestEventsInput): Promise<void> {
    const projectId = await this.projectLookup.findProjectIdByApiKey(
      input.apiKey,
    );
    if (!projectId) {
      throw new InvalidApiKeyError();
    }

    // identity comes from the key — never from the payload
    const events: ClickEventInput[] = input.events.map((event) => ({
      ...event,
      projectId,
      timestamp: new Date(event.timestamp),
    }));

    await this.clickEventRepository.saveMany(events);
  }
}
