import { Inject, Injectable } from '@nestjs/common';
import { EVENT_FEED_REPOSITORY } from '../../domain/repositories/event-feed.repository';
import type {
  EventFeedRepository,
  RecentEventsPage,
} from '../../domain/repositories/event-feed.repository';

// Presentation → application shape. `limit` and `cursor` are optional here; the
// DTO validates/clamps limit and this use case fills the default when omitted.
export interface GetRecentEventsInput {
  projectId: string;
  limit?: number;
  cursor?: string;
}

const DEFAULT_LIMIT = 50;

@Injectable()
export class GetRecentEventsUseCase {
  constructor(
    @Inject(EVENT_FEED_REPOSITORY)
    private readonly feed: EventFeedRepository,
  ) {}

  execute(input: GetRecentEventsInput): Promise<RecentEventsPage> {
    return this.feed.recentEvents({
      projectId: input.projectId,
      limit: input.limit ?? DEFAULT_LIMIT,
      cursor: input.cursor,
    });
  }
}
