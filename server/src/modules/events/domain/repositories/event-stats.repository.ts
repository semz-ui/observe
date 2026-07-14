export const EVENT_STATS_REPOSITORY = Symbol('EventStatsRepository');

// Every query is scoped to a project and a half-open [from, to) time range:
// inclusive start, exclusive end, so adjacent ranges (and day buckets) never
// double-count a boundary timestamp.
export interface StatsRange {
  projectId: string;
  from: Date;
  to: Date;
}

export interface TotalsStat {
  events: number;
  uniqueVisitors: number; // distinct anonymousId
  sessions: number; // distinct sessionId
}

// `day` is a UTC date-only string (YYYY-MM-DD) from date_trunc('day', ...).
export interface DailyCount {
  day: string;
  count: number;
}

export interface TopElement {
  selector: string;
  count: number;
}

export interface TopPage {
  url: string;
  count: number;
}

// Read-side port for analytics. Separate from ClickEventRepository (write side)
// so each interface stays honest about read vs. write concerns; the paginated
// recent-events feed lands here in its own milestone.
export interface EventStatsRepository {
  countTotals(range: StatsRange): Promise<TotalsStat>;
  eventsPerDay(range: StatsRange): Promise<DailyCount[]>;
  topElements(range: StatsRange, limit: number): Promise<TopElement[]>;
  topPages(range: StatsRange, limit: number): Promise<TopPage[]>;
}
