import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import type { ClickEventInput } from '../../domain/repositories/click-event.repository';
import type { ClickEventRepository } from '../../domain/repositories/click-event.repository';

// Domain optionals become explicit nulls at the column boundary.
function toRow(event: ClickEventInput) {
  return {
    projectId: event.projectId,
    anonymousId: event.anonymousId,
    sessionId: event.sessionId,
    url: event.url,
    pageTitle: event.pageTitle ?? null,
    elementTag: event.elementTag,
    elementId: event.elementId ?? null,
    elementText: event.elementText ?? null,
    elementSelector: event.elementSelector,
    elementHref: event.elementHref ?? null,
    timestamp: event.timestamp,
  };
}

@Injectable()
export class PrismaClickEventRepository implements ClickEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  // one round trip for the whole batch; created rows aren't needed back
  async saveMany(events: ClickEventInput[]): Promise<void> {
    await this.prisma.event.createMany({ data: events.map(toRow) });
  }
}
