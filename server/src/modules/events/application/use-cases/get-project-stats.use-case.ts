import { Inject, Injectable } from '@nestjs/common';
import { EVENT_STATS_REPOSITORY } from '../../domain/repositories/event-stats.repository';
import type {
  DailyCount,
  EventStatsRepository,
  TopElement,
  TopPage,
  TotalsStat,
} from '../../domain/repositories/event-stats.repository';

// Application-layer view of the request: from/to arrive as ISO strings (query
// params) and are converted to Dates here, mirroring IngestEventsUseCase.
export interface GetProjectStatsInput {
  projectId: string;
  from: string;
  to: string;
  topLimit?: number;
}

export interface ProjectStats {
  totals: TotalsStat;
  eventsPerDay: DailyCount[];
  topElements: TopElement[];
  topPages: TopPage[];
}

const DEFAULT_TOP_LIMIT = 10;

@Injectable()
export class GetProjectStatsUseCase {
  constructor(
    @Inject(EVENT_STATS_REPOSITORY)
    private readonly stats: EventStatsRepository,
  ) {}

  async execute(input: GetProjectStatsInput): Promise<ProjectStats> {
    const range = {
      projectId: input.projectId,
      from: new Date(input.from),
      to: new Date(input.to),
    };
    const limit = input.topLimit ?? DEFAULT_TOP_LIMIT;

    // Four independent reads — fan them out concurrently.
    const [totals, eventsPerDay, topElements, topPages] = await Promise.all([
      this.stats.countTotals(range),
      this.stats.eventsPerDay(range),
      this.stats.topElements(range, limit),
      this.stats.topPages(range, limit),
    ]);

    return { totals, eventsPerDay, topElements, topPages };
  }
}
