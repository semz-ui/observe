import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  DEFAULT_RANGE,
  EventsOverTimeChart,
  KpiCards,
  RangePicker,
  TopTable,
  fillDays,
  isRangeValue,
  previousRange,
  projectStats,
  rangeLabel,
  resolveRange,
} from '@/modules/analytics';
import { findProject } from '@/modules/projects';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({
  params,
  searchParams,
}: PageProps<'/projects/[projectId]'>) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);

  // A hand-edited ?range= falls back to the default rather than erroring.
  const selected = isRangeValue(query.range) ? query.range : DEFAULT_RANGE;
  const range = resolveRange(selected, new Date());
  const earlier = previousRange(range);

  // Three independent reads. The second stats call is what turns a bare total
  // into "is that good" — it costs the API a second query, not the reader a
  // second wait.
  const [project, stats, before] = await Promise.all([
    findProject(projectId),
    projectStats({ projectId, from: range.from, to: range.to }),
    projectStats({ projectId, from: earlier.from, to: earlier.to }),
  ]);

  if (project === null) notFound();

  const previousLabel = `previous ${String(range.days)} days`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight">
            {project.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {rangeLabel(selected)}, bucketed by UTC day.{' '}
            <Link
              href={`/projects/${project.id}/events`}
              className="underline underline-offset-4"
            >
              Live feed
            </Link>
          </p>
        </div>
        <RangePicker />
      </div>

      <KpiCards
        previousLabel={previousLabel}
        kpis={[
          {
            label: 'Events',
            value: stats.totals.events,
            previous: before.totals.events,
          },
          {
            label: 'Unique visitors',
            value: stats.totals.uniqueVisitors,
            previous: before.totals.uniqueVisitors,
          },
          {
            label: 'Sessions',
            value: stats.totals.sessions,
            previous: before.totals.sessions,
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Events over time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/*
            Zero-event days are absent from the response, not zero. Filling them
            here is the difference between a chart that says "nothing happened"
            and one that draws a straight line across the gap and implies steady
            traffic.
          */}
          <EventsOverTimeChart days={fillDays(range, stats.eventsPerDay)} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopTable
          title="Elements"
          columnLabel="Selector"
          rows={stats.topElements.map((element) => ({
            key: element.selector,
            label: element.selector,
            count: element.count,
          }))}
        />
        <TopTable
          title="Pages"
          columnLabel="URL"
          rows={stats.topPages.map((page) => ({
            key: page.url,
            label: page.url,
            count: page.count,
          }))}
        />
      </div>
    </div>
  );
}
