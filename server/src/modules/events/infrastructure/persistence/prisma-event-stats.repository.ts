import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import type {
  DailyCount,
  EventStatsRepository,
  StatsRange,
  TopElement,
  TopPage,
  TotalsStat,
} from '../../domain/repositories/event-stats.repository';

// Postgres COUNT()/date_trunc rows come back with bigint counts and snake_case
// column names; the mappers below normalise them to the domain shapes (plain
// numbers, camelCase) at the persistence boundary.
@Injectable()
export class PrismaEventStatsRepository implements EventStatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countTotals({ projectId, from, to }: StatsRange): Promise<TotalsStat> {
    const [row] = await this.prisma.$queryRaw<
      { events: bigint; unique_visitors: bigint; sessions: bigint }[]
    >`
      SELECT COUNT(*)                     AS events,
             COUNT(DISTINCT anonymous_id) AS unique_visitors,
             COUNT(DISTINCT session_id)   AS sessions
      FROM events
      WHERE project_id = ${projectId}
        AND timestamp >= ${from}
        AND timestamp < ${to}
    `;
    return {
      events: Number(row.events),
      uniqueVisitors: Number(row.unique_visitors),
      sessions: Number(row.sessions),
    };
  }

  async eventsPerDay({
    projectId,
    from,
    to,
  }: StatsRange): Promise<DailyCount[]> {
    // Bucket in UTC (decision C): timestamps are stored as timestamptz, so
    // date_trunc runs against UTC here. to_char yields a date-only string,
    // sidestepping any driver-side Date/timezone reinterpretation.
    const rows = await this.prisma.$queryRaw<{ day: string; count: bigint }[]>`
      SELECT to_char(date_trunc('day', timestamp AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
             COUNT(*) AS count
      FROM events
      WHERE project_id = ${projectId}
        AND timestamp >= ${from}
        AND timestamp < ${to}
      GROUP BY 1
      ORDER BY 1
    `;
    return rows.map((r) => ({ day: r.day, count: Number(r.count) }));
  }

  async topElements(
    { projectId, from, to }: StatsRange,
    limit: number,
  ): Promise<TopElement[]> {
    const rows = await this.prisma.event.groupBy({
      by: ['elementSelector'],
      where: { projectId, timestamp: { gte: from, lt: to } },
      _count: { _all: true },
      orderBy: { _count: { elementSelector: 'desc' } },
      take: limit,
    });
    return rows.map((r) => ({
      selector: r.elementSelector,
      count: r._count._all,
    }));
  }

  async topPages(
    { projectId, from, to }: StatsRange,
    limit: number,
  ): Promise<TopPage[]> {
    const rows = await this.prisma.event.groupBy({
      by: ['url'],
      where: { projectId, timestamp: { gte: from, lt: to } },
      _count: { _all: true },
      orderBy: { _count: { url: 'desc' } },
      take: limit,
    });
    return rows.map((r) => ({ url: r.url, count: r._count._all }));
  }
}
