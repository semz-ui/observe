import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import type { ClickEvent } from '../../domain/entities/click-event.entity';
import type {
  EventFeedRepository,
  RecentEventsPage,
  RecentEventsQuery,
} from '../../domain/repositories/event-feed.repository';

type EventRow = {
  id: string;
  projectId: string;
  anonymousId: string;
  sessionId: string;
  url: string;
  pageTitle: string | null;
  elementTag: string;
  elementId: string | null;
  elementText: string | null;
  elementSelector: string;
  elementHref: string | null;
  timestamp: Date;
};

// Nullable columns become domain optionals — the inverse of `toRow` in
// prisma-click-event.repository.ts.
function toDomain(row: EventRow): ClickEvent {
  return {
    id: row.id,
    projectId: row.projectId,
    anonymousId: row.anonymousId,
    sessionId: row.sessionId,
    url: row.url,
    pageTitle: row.pageTitle ?? undefined,
    elementTag: row.elementTag,
    elementId: row.elementId ?? undefined,
    elementText: row.elementText ?? undefined,
    elementSelector: row.elementSelector,
    elementHref: row.elementHref ?? undefined,
    timestamp: row.timestamp,
  };
}

@Injectable()
export class PrismaEventFeedRepository implements EventFeedRepository {
  constructor(private readonly prisma: PrismaService) {}

  async recentEvents({
    projectId,
    limit,
    cursor,
  }: RecentEventsQuery): Promise<RecentEventsPage> {
    // Keyset pagination: `id < cursor` (uuid v7 is time-ordered) instead of
    // Prisma's skip/cursor, so pages stay stable as new events arrive. Fetch
    // one extra row to learn whether a further page exists without a COUNT.
    const rows = await this.prisma.event.findMany({
      where: { projectId, ...(cursor ? { id: { lt: cursor } } : {}) },
      orderBy: { id: 'desc' },
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      events: page.map(toDomain),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  }
}
